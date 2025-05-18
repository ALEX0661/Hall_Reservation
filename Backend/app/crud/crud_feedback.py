from sqlalchemy.orm import Session
from typing import List, Optional

from app.models import Feedback, Reservation
from app.schemas import FeedbackCreate

def create_feedback(db: Session, feedback_in: FeedbackCreate, user_id: int) -> Optional[Feedback]:
    """Create feedback for a reservation after verifying user ownership."""
    reservation = db.query(Reservation).filter(
        Reservation.id == feedback_in.reservation_id,
        Reservation.user_id == user_id
    ).first()
    
    if not reservation:
        return None
    
    # Check if feedback already exists
    existing_feedback = db.query(Feedback).filter(
        Feedback.reservation_id == feedback_in.reservation_id
    ).first()
    
    if existing_feedback:
        return None
    
    feedback = Feedback(
        reservation_id=feedback_in.reservation_id,
        rating=feedback_in.rating,
        comments=feedback_in.comments
    )
    
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback

def get_feedback(db: Session, feedback_id: int) -> Optional[Feedback]:
    return db.query(Feedback).filter(Feedback.id == feedback_id).first()

def get_feedbacks_by_reservation(db: Session, reservation_id: int) -> List[Feedback]:
    return db.query(Feedback).filter(Feedback.reservation_id == reservation_id).all()

def get_all_feedbacks(db: Session, skip: int = 0, limit: int = 100) -> List[Feedback]:
    return db.query(Feedback).offset(skip).limit(limit).all()

def get_user_feedbacks(db: Session, user_id: int) -> List[Feedback]:
    """Get all feedback for a user's reservations."""
    return db.query(Feedback).join(Reservation).filter(
        Reservation.user_id == user_id
    ).all()
