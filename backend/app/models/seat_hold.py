from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.datetime_utils import get_utc_now

class SeatHold(Base):
    __tablename__ = "seat_holds"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="CASCADE"), nullable=False, index=True)
    seat_number = Column(String(10), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    hold_token = Column(String(100), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    show = relationship("Show", back_populates="holds")
    user = relationship("User", back_populates="holds")

    __table_args__ = (
        UniqueConstraint("show_id", "seat_number", name="uq_show_seat_hold"),
    )
