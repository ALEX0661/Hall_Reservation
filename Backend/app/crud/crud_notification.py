from sqlalchemy.orm import Session
from typing import List, Optional, Union, Dict

from app.models import Notification, User
from app.schemas import NotificationCreate

def create_notification(db: Session, notification_in: Union[NotificationCreate, Dict]) -> Notification:
    """Create a notification for a specific user or all users."""
    # Handle case where a dictionary is passed instead of NotificationCreate
    if isinstance(notification_in, dict):
        user_id = notification_in.get("user_id")
        message = notification_in.get("message")
    else:
        user_id = notification_in.user_id
        message = notification_in.message
        
    notification = Notification(
        user_id=user_id,
        message=message
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

def create_admin_notification(db: Session, message: str) -> List[Notification]:
    """Create notifications for all admin users."""
    admin_users = db.query(User).filter(User.is_admin == True).all()
    notifications = []
    
    for admin in admin_users:
        notification = Notification(
            user_id=admin.id,
            message=message
        )
        db.add(notification)
        notifications.append(notification)
    
    db.commit()
    return notifications

def get_user_notifications(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Notification]:
    """Get all notifications for a specific user."""
    return db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

def mark_notification_as_read(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
    """Mark a notification as read if it belongs to the user."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    
    if not notification:
        return None
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

def mark_all_notifications_as_read(db: Session, user_id: int) -> int:
    """Mark all notifications for a user as read."""
    result = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({Notification.is_read: True})
    
    db.commit()
    return result