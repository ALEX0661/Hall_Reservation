from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.models import Reservation, ReservationStatus, reservation_resources as ReservationResource, Resource, Notification, User
from app.schemas import ReservationCreate, ReservationUpdate

def is_overlapping(db: Session, hall_id: int, start_dt: datetime, end_dt: datetime, exclude_id: Optional[int] = None) -> bool:
    """Check if there's an existing approved reservation that overlaps with the given time period."""
    query = db.query(Reservation).filter(
        Reservation.hall_id == hall_id,
        Reservation.status == ReservationStatus.APPROVED,
        Reservation.start_datetime < end_dt,
        Reservation.end_datetime > start_dt
    )
    if exclude_id:
        query = query.filter(Reservation.id != exclude_id)
    return query.first() is not None

def get_reservations(db: Session, skip: int = 0, limit: int = 100) -> List[Reservation]:
    return db.query(Reservation).offset(skip).limit(limit).all()

def get_user_reservations(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Reservation]:
    return db.query(Reservation).filter(Reservation.user_id == user_id).offset(skip).limit(limit).all()

def get_reservation(db: Session, reservation_id: int) -> Optional[Reservation]:
    return db.query(Reservation).filter(Reservation.id == reservation_id).first()

def create_reservation(db: Session, user_id: int, res_in: ReservationCreate) -> Reservation:
    """Create a new reservation after checking for time conflicts."""
    if is_overlapping(db, res_in.hall_id, res_in.start_datetime, res_in.end_datetime):
        raise ValueError("Time slot overlaps an existing approved reservation")

    res = Reservation(
        user_id=user_id,
        hall_id=res_in.hall_id,
        start_datetime=res_in.start_datetime,
        end_datetime=res_in.end_datetime,
        description=res_in.description,
        status=ReservationStatus.PENDING
    )

    db.add(res)
    db.commit()
    db.refresh(res)

    # Attach resources via the association table insert()
    for resource_id in res_in.resource_ids:
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if resource:
            db.execute(
                ReservationResource.insert().values(
                    reservation_id=res.id,
                    resource_id=resource_id
                )
            )

    # Notify admins
    admin_notification = Notification(
        user_id=None,
        message=f"New reservation request for {res.hall.name}",
    )
    db.add(admin_notification)

    db.commit()
    return res

def update_reservation(db: Session, reservation_id: int, res_in: ReservationUpdate, user_id: Optional[int] = None) -> Optional[Reservation]:
    """Update an existing reservation if it belongs to the user and is PENDING."""
    res = get_reservation(db, reservation_id)
    if not res or (user_id is not None and res.user_id != user_id):
        return None
    if res.status != ReservationStatus.PENDING:
        raise ValueError("Cannot modify a reservation that is not in PENDING status")

    # If timing or hall changed, re-check overlap
    if (res_in.hall_id != res.hall_id or
        res_in.start_datetime != res.start_datetime or
        res_in.end_datetime != res.end_datetime):
        if is_overlapping(db, res_in.hall_id, res_in.start_datetime, res_in.end_datetime, exclude_id=reservation_id):
            raise ValueError("Time slot overlaps an existing approved reservation")

    # Update core fields
    res.hall_id = res_in.hall_id
    res.start_datetime = res_in.start_datetime
    res.end_datetime = res_in.end_datetime
    res.description = res_in.description

    # Remove old resources
    db.execute(
        ReservationResource.delete().where(
            ReservationResource.c.reservation_id == res.id
        )
    )

    # Insert new resources
    for resource_id in res_in.resource_ids:
        db.execute(
            ReservationResource.insert().values(
                reservation_id=res.id,
                resource_id=resource_id
            )
        )

    db.commit()
    db.refresh(res)
    return res

def cancel_reservation(db: Session, reservation_id: int, user_id: int) -> Optional[Reservation]:
    """Cancel a reservation if it belongs to the user."""
    res = get_reservation(db, reservation_id)
    if not res or res.user_id != user_id:
        return None
    
    if res.status not in (ReservationStatus.PENDING, ReservationStatus.APPROVED):
        raise ValueError("Cannot cancel a reservation that is not PENDING or APPROVED")

    # Store the previous status to check if it was approved
    was_approved = res.status == ReservationStatus.APPROVED
    
    # Update the status to CANCELLED
    res.status = ReservationStatus.CANCELLED
    
    # Create appropriate notification based on previous status
    notification_message = ""
    if was_approved:
        notification_message = f"ALERT: Reservation #{res.id} for {res.hall.name} was CANCELLED after being APPROVED"
    else:
        notification_message = f"Reservation #{res.id} for {res.hall.name} has been cancelled by the user"
    
    # Create notification for all admins
    admin_users = db.query(User).filter(User.is_admin == True).all()
    for admin in admin_users:
        admin_notification = Notification(
            user_id=admin.id,
            message=notification_message,
            is_read=False
        )
        db.add(admin_notification)

    db.commit()
    db.refresh(res)
    return res

def approve_reservation(db: Session, reservation_id: int, admin_id: int, admin_message: Optional[str] = None) -> Optional[Reservation]:
    """Approve a reservation by an admin."""
    res = get_reservation(db, reservation_id)
    if not res or res.status != ReservationStatus.PENDING:
        return None
    if is_overlapping(db, res.hall_id, res.start_datetime, res.end_datetime, exclude_id=res.id):
        raise ValueError("Time slot now overlaps with another approved reservation")

    res.status = ReservationStatus.APPROVED
    res.admin_message = admin_message

    user_notification = Notification(
        user_id=res.user_id,
        message=f"Your reservation for {res.hall.name} has been approved.",
    )
    db.add(user_notification)

    db.commit()
    db.refresh(res)
    return res

def deny_reservation(db: Session, reservation_id: int, admin_id: int, admin_message: Optional[str] = None) -> Optional[Reservation]:
    """Deny a reservation by an admin."""
    res = get_reservation(db, reservation_id)
    if not res or res.status != ReservationStatus.PENDING:
        return None

    res.status = ReservationStatus.DENIED
    res.admin_message = admin_message

    user_notification = Notification(
        user_id=res.user_id,
        message=f"Your reservation for {res.hall.name} has been denied. Reason: {admin_message or 'No reason provided'}",
    )
    db.add(user_notification)

    db.commit()
    db.refresh(res)
    return res

def get_overlapping_reservations(db: Session, hall_id: int, start_dt: datetime, end_dt: datetime) -> List[Reservation]:
    """Get list of approved reservations overlapping a given period."""
    return db.query(Reservation).filter(
        Reservation.hall_id == hall_id,
        Reservation.status == ReservationStatus.APPROVED,
        Reservation.start_datetime < end_dt,
        Reservation.end_datetime > start_dt
    ).all()
