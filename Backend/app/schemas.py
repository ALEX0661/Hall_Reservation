from pydantic import BaseModel, EmailStr, validator, Field
from datetime import datetime
from typing import List, Optional

from app.models import ReservationStatus

# --- Auth and Users ---
class UserBase(BaseModel):
    email: EmailStr
    student_number: Optional[str] = None
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserCreateAdmin(UserCreate):
    is_admin: bool = False

class UserOut(UserBase):
    id: int
    is_admin: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None
    is_admin: bool = False

# --- Resources ---
class ResourceBase(BaseModel):
    name: str

class ResourceCreate(ResourceBase):
    pass

class ResourceOut(ResourceBase):
    id: int
    
    class Config:
        orm_mode = True

# --- Halls ---
class HallBase(BaseModel):
    name: str
    capacity: int

class HallCreate(HallBase):
    pass

class HallOut(HallBase):
    id: int
    
    class Config:
        orm_mode = True

# --- Reservations ---
class ReservationBase(BaseModel):
    hall_id: int
    start_datetime: datetime
    end_datetime: datetime
    description: Optional[str] = None
    
    @validator('end_datetime')
    def end_must_after_start(cls, v, values):
        if 'start_datetime' in values and v <= values['start_datetime']:
            raise ValueError('End time must be after start time')
        return v

class ReservationCreate(ReservationBase):
    resource_ids: List[int] = []

class ReservationUpdate(ReservationBase):
    resource_ids: List[int] = []

class ReservationOut(ReservationBase):
    id: int
    user_id: int
    status: ReservationStatus
    admin_message: Optional[str] = None
    created_at: datetime
    resources: List[ResourceOut] = []
    
    class Config:
        orm_mode = True

class ReservationWithHallOut(ReservationOut):
    hall: HallOut
    
    class Config:
        orm_mode = True

class ReservationStatus(BaseModel):
    status: ReservationStatus
    admin_message: Optional[str] = None

# --- Feedback ---
class FeedbackBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None
    
    @validator('rating')
    def rating_range(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Rating must be between 1 and 5')
        return v

class FeedbackCreate(FeedbackBase):
    reservation_id: int

class FeedbackOut(FeedbackBase):
    id: int
    reservation_id: int
    created_at: datetime
    
    class Config:
        orm_mode = True

class FeedbackWithReservationOut(FeedbackOut):
    reservation: ReservationOut
    
    class Config:
        orm_mode = True

# --- Notifications ---
class NotificationBase(BaseModel):
    message: str

class NotificationCreate(NotificationBase):
    user_id: Optional[int] = None  # None means send to all admins

class NotificationOut(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    
    class Config:
        orm_mode = True