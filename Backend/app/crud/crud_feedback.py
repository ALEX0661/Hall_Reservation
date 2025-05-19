from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.models import Feedback, Reservation, Hall
from app.schemas import FeedbackCreate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_feedback(db: Session, feedback_in: FeedbackCreate, user_id: int) -> Optional[Feedback]:
    """Create feedback for a reservation after verifying user ownership and hall existence."""
    reservation = db.query(Reservation).filter(
        Reservation.id == feedback_in.reservation_id,
        Reservation.user_id == user_id
    ).first()
    
    if not reservation:
        logger.error(f"Reservation {feedback_in.reservation_id} not found or not owned by user {user_id}")
        return None
    
    # Validate hall existence
    hall = db.query(Hall).filter(Hall.id == reservation.hall_id).first()
    if not hall:
        logger.error(f"Reservation {reservation.id} references non-existent hall {reservation.hall_id}")
        return None
    
    # Check if feedback already exists
    existing_feedback = db.query(Feedback).filter(
        Feedback.reservation_id == feedback_in.reservation_id
    ).first()
    
    if existing_feedback:
        logger.warning(f"Feedback already exists for reservation {feedback_in.reservation_id}")
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
    """Retrieve all feedback with associated reservation and hall data."""
    from sqlalchemy import outerjoin
    
    feedbacks = (
        db.query(Feedback)
        .join(Reservation, Feedback.reservation_id == Reservation.id)
        .outerjoin(Hall, Reservation.hall_id == Hall.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # Post-process feedbacks to handle missing halls
    for feedback in feedbacks:
        if feedback.reservation and not feedback.reservation.hall:
            logger.warning(f"Feedback {feedback.id} references reservation {feedback.reservation_id} with missing hall {feedback.reservation.hall_id}")
            feedback.reservation.hall = {
                "id": feedback.reservation.hall_id,
                "name": "Hall Unavailable",
                "capacity": None,
                "status": "deleted"
            }
    
    return feedbacks

def get_user_feedbacks(db: Session, user_id: int) -> List[Feedback]:
    """Get all feedback for a user's reservations."""
    return db.query(Feedback).join(Reservation).filter(
        Reservation.user_id == user_id
    ).all()