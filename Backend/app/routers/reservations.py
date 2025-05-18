from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.deps import get_current_active_user, get_current_admin_user
from app.db.session import get_db
from app.crud import crud_reservation, crud_feedback, crud_notification
from app.models import User, Reservation, Hall, Resource
from app.schemas import (
    ReservationCreate, ReservationUpdate, ReservationOut, 
    ReservationWithHallOut, FeedbackCreate, FeedbackOut, FeedbackWithReservationOut
)

router = APIRouter()

# --- Hall and Resource Endpoints ---
@router.get("/halls", response_model=List[dict])
def list_halls(db: Session = Depends(get_db)):
    halls = db.query(Hall).all()
    return [{"id": hall.id, "name": hall.name, "capacity": hall.capacity} for hall in halls]

@router.get("/resources", response_model=List[dict])
def list_resources(db: Session = Depends(get_db)):
    resources = db.query(Resource).all()
    return [{"id": resource.id, "name": resource.name} for resource in resources]

# --- Reservation Endpoints ---
@router.post("/reservations", response_model=ReservationOut)
def create_reservation(
    reservation: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        return crud_reservation.create_reservation(
            db=db, user_id=current_user.id, res_in=reservation
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/reservations", response_model=List[ReservationWithHallOut])
def list_my_reservations(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    reservations = crud_reservation.get_user_reservations(db, user_id=current_user.id)
    
    if status:
        reservations = [r for r in reservations if r.status.value == status]
        
    return reservations

@router.get("/reservations/past-approved", response_model=List[dict])
def list_past_approved_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get approved reservations for the current user that have ended (for feedback)"""
    from app.models import ReservationStatus
    
    # Query for all approved reservations for this user
    reservations = db.query(Reservation).filter(
        Reservation.user_id == current_user.id,
        Reservation.status == ReservationStatus.APPROVED
    ).all()
    
    # Filter to include only reservations that have ended
    current_time = datetime.now()
    past_reservations = []
    
    for res in reservations:
        hall = db.query(Hall).filter(Hall.id == res.hall_id).first()
        hall_name = hall.name if hall else "Unknown Hall"
        
        # Check if the reservation has ended
        if res.end_datetime <= current_time:
            # Check if feedback was already submitted
            feedback_exists = db.query(crud_feedback.Feedback).filter(
                crud_feedback.Feedback.reservation_id == res.id
            ).first() is not None
            
            past_reservations.append({
                "id": res.id,
                "hall_id": res.hall_id,
                "hall_name": hall_name,
                "start_datetime": res.start_datetime,
                "end_datetime": res.end_datetime,
                "description": res.description,
                "feedbackSubmitted": feedback_exists
            })
    
    return past_reservations

@router.get("/reservations/{reservation_id}", response_model=ReservationWithHallOut)
def get_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    reservation = crud_reservation.get_reservation(db, reservation_id=reservation_id)
    
    if not reservation or (not current_user.is_admin and reservation.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
        
    return reservation

@router.put("/reservations/{reservation_id}", response_model=ReservationOut)
def update_reservation(
    reservation_id: int,
    reservation: ReservationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        updated_reservation = crud_reservation.update_reservation(
            db=db, 
            reservation_id=reservation_id, 
            res_in=reservation, 
            user_id=current_user.id
        )
        
        if not updated_reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found or not owned by you"
            )
            
        return updated_reservation
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/reservations/{reservation_id}", response_model=ReservationOut)
def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        cancelled_reservation = crud_reservation.cancel_reservation(
            db=db, 
            reservation_id=reservation_id, 
            user_id=current_user.id
        )
        
        if not cancelled_reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found or not owned by you"
            )
            
        return cancelled_reservation
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/check-availability", response_model=bool)
def check_availability(
    hall_id: int,
    start_datetime: datetime,
    end_datetime: datetime,
    exclude_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Check if a time slot is available for reservation."""
    is_available = not crud_reservation.is_overlapping(
        db, 
        hall_id=hall_id, 
        start_dt=start_datetime, 
        end_dt=end_datetime,
        exclude_id=exclude_id
    )
    return is_available

# --- Feedback Endpoints ---
@router.post("/feedback", response_model=FeedbackOut)
def create_feedback(
    feedback: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_feedback = crud_feedback.create_feedback(
        db=db, 
        feedback_in=feedback, 
        user_id=current_user.id
    )
    
    if not db_feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found or not owned by you, or feedback already exists"
        )
        
    # Create notification for admin about new feedback
    admin_notification = crud_notification.create_notification(
        db=db,
        notification_in={
            "user_id": None,  # For all admins
            "message": f"New feedback received for reservation #{feedback.reservation_id}"
        }
    )
    
    return db_feedback

@router.get("/feedback/reservation/{reservation_id}", response_model=List[FeedbackWithReservationOut])
def get_feedback_by_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get feedback for a specific reservation. Only the reservation owner or an admin can access."""
    feedbacks = crud_feedback.get_feedbacks_by_reservation(db, reservation_id=reservation_id)
    
    if not feedbacks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No feedback found for this reservation"
        )
    
    # Verify user ownership or admin status
    reservation = feedbacks[0].reservation
    if reservation.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this feedback"
        )
    
    return feedbacks