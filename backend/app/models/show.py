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
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    ticket_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    movie = relationship("Movie", back_populates="shows")
    holds = relationship("SeatHold", back_populates="show", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="show")
