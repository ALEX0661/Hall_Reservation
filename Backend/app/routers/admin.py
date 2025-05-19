from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from app.core.deps import get_current_admin_user
from app.db.session import get_db
from app.crud import crud_reservation, crud_feedback, crud_notification, crud_user
from app.models import User, Reservation, Hall, Resource
from app.schemas import (
    ReservationStatus, ReservationWithHallOut, 
    UserOut, FeedbackWithReservationOut,
    ResourceCreate, ResourceOut, HallCreate, HallOut
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# --- User Management ---
@router.get("/users", response_model=List[UserOut])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """List all users (admin only)."""
    return crud_user.get_users(db, skip=skip, limit=limit)

# --- Resource Management ---
@router.get("/resources", response_model=List[ResourceOut])
def list_resources(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """List all resources (admin only)."""
    return db.query(Resource).offset(skip).limit(limit).all()

@router.post("/resources", response_model=ResourceOut)
def create_resource(
    resource: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new resource (admin only)."""
    db_resource = Resource(name=resource.name)
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

@router.delete("/resources/{resource_id}", response_model=dict)
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a resource (admin only)."""
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    db.delete(resource)
    db.commit()
    return {"message": "Resource deleted successfully"}

# --- Hall Management ---
@router.get("/halls", response_model=List[HallOut])
def list_halls(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """List all halls (admin only)."""
    return db.query(Hall).offset(skip).limit(limit).all()

@router.post("/halls", response_model=HallOut)
def create_hall(
    hall: HallCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new hall (admin only)."""
    db_hall = Hall(name=hall.name, capacity=hall.capacity if hasattr(hall, 'capacity') else None)
    db.add(db_hall)
    db.commit()
    db.refresh(db_hall)
    return db_hall

# --- Reservation Management ---
@router.get("/reservations", response_model=List[dict])
def list_all_reservations(
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    hall_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """List all reservations with optional filters (admin only)."""
    from sqlalchemy import outerjoin
    
    query = db.query(Reservation).join(User, Reservation.user_id == User.id).outerjoin(Hall, Reservation.hall_id == Hall.id)
    
    if status:
        query = query.filter(Reservation.status == status)
    
    if hall_id:
        query = query.filter(Reservation.hall_id == hall_id)
    
    if start_date:
        query = query.filter(Reservation.start_datetime >= start_date)
    
    if end_date:
        end_date_adjusted = end_date + timedelta(days=1)
        query = query.filter(Reservation.start_datetime <= end_date_adjusted)
    
    reservations = query.offset(skip).limit(limit).all()
    
    result = []
    for res in reservations:
        user_data = {
            "id": res.user.id,
            "email": res.user.email,
            "full_name": res.user.full_name,
            "student_number": res.user.student_number,
            "is_admin": res.user.is_admin
        } if res.user else None
        
        hall_data = {
            "id": res.hall_id,
            "name": res.hall.name if res.hall else "Hall Unavailable",
            "capacity": res.hall.capacity if res.hall else None,
            "status": "active" if res.hall else "deleted"
        }
        
        result.append({
            "id": res.id,
            "user_id": res.user_id,
            "hall_id": res.hall_id,
            "start_datetime": res.start_datetime,
            "end_datetime": res.end_datetime,
            "status": res.status,
            "admin_message": res.admin_message,
            "user": user_data,
            "hall": hall_data
        })
        
        if not res.hall:
            logger.warning(f"Reservation {res.id} references missing hall_id {res.hall_id}")
    
    return result

@router.put("/reservations/{reservation_id}/approve", response_model=ReservationWithHallOut)
def approve_reservation(
    reservation_id: int,
    admin_message: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Approve a reservation (admin only)."""
    try:
        reservation = crud_reservation.approve_reservation(
            db=db, 
            reservation_id=reservation_id, 
            admin_id=current_user.id,
            admin_message=admin_message
        )
        
        if not reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found"
            )
            
        return reservation
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/reservations/{reservation_id}/deny", response_model=ReservationWithHallOut)
def deny_reservation(
    reservation_id: int,
    admin_message: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Deny a reservation (admin only)."""
    try:
        reservation = crud_reservation.deny_reservation(
            db=db, 
            reservation_id=reservation_id, 
            admin_id=current_user.id,
            admin_message=admin_message
        )
        
        if not reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found"
            )
            
        return reservation
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# --- Feedback Management ---
@router.get("/feedback", response_model=List[FeedbackWithReservationOut])
def list_all_feedback(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """List all user feedback (admin only)."""
    return crud_feedback.get_all_feedbacks(db, skip=skip, limit=limit)

# --- Calendar View ---
@router.get("/calendar", response_model=List[dict])
async def get_calendar_events(
    start_date: datetime = Query(..., description="Start date for calendar view"),
    end_date: datetime = Query(..., description="End date for calendar view"),
    hall_id: Optional[int] = Query(None, description="Filter by hall ID"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Get a list of approved reservations for calendar display"""
    
    APPROVED_STATUS = "APPROVED"
    
    query = db.query(Reservation).filter(
        Reservation.status == APPROVED_STATUS,
        Reservation.start_datetime >= start_date,
        Reservation.end_datetime <= end_date
    )
    
    if hall_id is not None:
        query = query.filter(Reservation.hall_id == hall_id)
    
    reservations = query.all()
    
    events = []
    for res in reservations:
        hall = db.query(Hall).filter(Hall.id == res.hall_id).first()
        hall_name = hall.name if hall else "Hall Unavailable"
        hall_status = "active" if hall else "deleted"
        
        if not hall:
            logger.warning(f"Calendar event for reservation {res.id} references missing hall_id {res.hall_id}")
        
        events.append({
            "id": res.id,
            "title": f"{res.description or 'Reservation'} - {hall_name}",
            "start": res.start_datetime.isoformat(),
            "end": res.end_datetime.isoformat(),
            "user_id": res.user_id,
            "hall_id": res.hall_id,
            "hall_status": hall_status
        })
    
    return events