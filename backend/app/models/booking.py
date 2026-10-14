from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.datetime_utils import get_utc_now

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="RESTRICT"), nullable=False, index=True)
    total_amount = Column(Float, nullable=False)
    seat_summary = Column(String(100), nullable=False)  # e.g., "C4, C5"
    status = Column(String(20), default="CONFIRMED", nullable=False)  # "CONFIRMED" | "CANCELLED"
    payment_status = Column(String(20), default="SUCCESS", nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    user = relationship("User", back_populates="bookings")
    show = relationship("Show", back_populates="bookings")
    seats = relationship("BookingSeat", back_populates="booking", cascade="all, delete-orphan")

class BookingSeat(Base):
    __tablename__ = "booking_seats"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="RESTRICT"), nullable=False, index=True)
    seat_number = Column(String(10), nullable=False, index=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    booking = relationship("Booking", back_populates="seats")

    __table_args__ = (
        UniqueConstraint("show_id", "seat_number", name="uq_show_seat_booking"),
    )
