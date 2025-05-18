from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_current_active_user
from app.db.session import get_db
from app.crud import crud_notification
from app.models import User, Notification
from app.schemas import NotificationOut

router = APIRouter()

@router.get("/notifications", response_model=List[NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all notifications for the current user."""
    return crud_notification.get_user_notifications(db, user_id=current_user.id)

@router.put("/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark a specific notification as read."""
    notification = crud_notification.mark_notification_as_read(
        db, 
        notification_id=notification_id, 
        user_id=current_user.id
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or not owned by you"
        )
        
    return notification

@router.put("/notifications/read-all", response_model=dict)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark all notifications for the current user as read."""
    count = crud_notification.mark_all_notifications_as_read(db, user_id=current_user.id)
    return {"message": f"Marked {count} notifications as read"}

@router.get("/notifications/count", response_model=dict)
def get_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get count of unread notifications for the current user."""
    notifications = crud_notification.get_user_notifications(db, user_id=current_user.id)
    unread_count = sum(1 for n in notifications if not n.is_read)
    return {"unread_count": unread_count}
