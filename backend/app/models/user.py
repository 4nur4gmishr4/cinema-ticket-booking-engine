from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.datetime_utils import get_utc_now

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="customer", nullable=False)  # "customer" | "admin"
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    holds = relationship("SeatHold", back_populates="user", cascade="all, delete-orphan")
