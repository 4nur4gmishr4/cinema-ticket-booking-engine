# --- Database Model: User ---
# Purpose: Stores registered customer and administrator accounts.
# Roles: "customer" (standard moviegoer) and "admin" (cinema administrator).

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.datetime_utils import get_utc_now

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)    # Login identifier
    hashed_password = Column(String(255), nullable=False)                   # Secure bcrypt hash
    role = Column(String(20), default="customer", nullable=False)           # 'customer' or 'admin'
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    # Relationships
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    holds = relationship("SeatHold", back_populates="user", cascade="all, delete-orphan")
