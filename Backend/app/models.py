from datetime import datetime
import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Enum,
    Text,
    ForeignKey,
    Table,
)
from sqlalchemy.orm import relationship

from app.db.session import Base


# --- ENUMS ------------------------------------------------------------------

class HallName(str, enum.Enum):
    FUNCTION = "Function Hall"
    PE = "PE Hall"


class ReservationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DENIED = "DENIED"
    CANCELLED = "CANCELLED"


# --- ASSOCIATION TABLE -----------------------------------------------------

reservation_resources = Table(
    "reservation_resources",
    Base.metadata,
    Column(
        "reservation_id",
        Integer,
        ForeignKey(
            "reservations.id", ondelete="CASCADE"
        ),
        primary_key=True,
    ),
    Column(
        "resource_id",
        Integer,
        ForeignKey(
            "resources.id", ondelete="CASCADE"
        ),
        primary_key=True,
    ),
)


# --- MODELS -----------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    student_number = Column(String(50), nullable=True)
    full_name = Column(String(255), nullable=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    reservations = relationship(
        "Reservation",
        back_populates="user",
        passive_deletes=True,
    )
    notifications = relationship(
        "Notification",
        back_populates="user",
        passive_deletes=True,
    )


class Hall(Base):
    __tablename__ = "halls"

    id = Column(Integer, primary_key=True)
    name = Column(
        Enum(
            *[e.value for e in HallName],
            name="hallname",
            native_enum=False,         # use a simple VARCHAR + CHECK, not a native ENUM type
        ),
        nullable=False
    )
    capacity = Column(Integer, nullable=False)

    # Relations
    reservations = relationship(
        "Reservation",
        back_populates="hall",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)

    # relations via association table
    reservations = relationship(
        "Reservation",
        secondary=reservation_resources,
        back_populates="resources",
    )


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    hall_id = Column(
        Integer,
        ForeignKey("halls.id", ondelete="CASCADE"),
        nullable=False,
    )
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    status = Column(
        Enum(ReservationStatus),
        default=ReservationStatus.PENDING,
        nullable=False,
    )
    admin_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    description = Column(Text, nullable=True)

    # Relations
    user = relationship("User", back_populates="reservations")
    hall = relationship("Hall", back_populates="reservations")
    resources = relationship(
        "Resource",
        secondary=reservation_resources,
        back_populates="reservations",
    )
    feedback = relationship(
        "Feedback",
        back_populates="reservation",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True)
    reservation_id = Column(
        Integer,
        ForeignKey("reservations.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    rating = Column(Integer, nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    

    # Relation
    reservation = relationship("Reservation", back_populates="feedback")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relation
    user = relationship("User", back_populates="notifications")

