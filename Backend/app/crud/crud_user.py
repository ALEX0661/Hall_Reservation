from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from app.models import User
from app.schemas import UserCreate
from app.core.security import hash_password, verify_password

def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user_in: UserCreate, is_admin: bool = False) -> User:
    user = User(
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        student_number=user_in.student_number,
        full_name=user_in.full_name,
        is_admin=is_admin
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
