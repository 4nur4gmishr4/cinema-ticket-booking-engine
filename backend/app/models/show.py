# --- Database Model: Show ---
# Purpose: Represents an individual movie screening in a specific screen (e.g. Screen 1).
# Stores start_time, calculated end_time (start_time + movie duration + 15m buffer), and ticket price.

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.datetime_utils import get_utc_now

class Show(Base):
    __tablename__ = "shows"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)
    screen_name = Column(String(50), default="Screen 1", nullable=False)
    start_time = Column(DateTime, nullable=False, index=True)       # Showtime start in UTC
    end_time = Column(DateTime, nullable=False, index=True)         # Calculated showtime end + 15m cleaning buffer
    ticket_price = Column(Float, nullable=False)                    # Base ticket price in INR (e.g. ₹250)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    # Relationships
    movie = relationship("Movie", back_populates="shows")
    holds = relationship("SeatHold", back_populates="show", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="show")
