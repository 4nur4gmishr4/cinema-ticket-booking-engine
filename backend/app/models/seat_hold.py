# --- Database Model: SeatHold ---
# Purpose: Represents a temporary 5-minute seat reservation.
# Concurrency Guard: UniqueConstraint("show_id", "seat_number") ensures that the database engine
# immediately rejects any simultaneous hold attempt on the same seat for the same show.

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.datetime_utils import get_utc_now

class SeatHold(Base):
    __tablename__ = "seat_holds"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="CASCADE"), nullable=False, index=True)
    seat_number = Column(String(10), nullable=False, index=True)        # E.g. "A1", "C5"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    hold_token = Column(String(100), nullable=False, index=True)        # Shared UUID token across all seats in this hold session
    expires_at = Column(DateTime, nullable=False, index=True)           # Exact UTC timestamp when hold expires (now + 300s)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    # Relationships
    show = relationship("Show", back_populates="holds")
    user = relationship("User", back_populates="holds")

    # Composite Unique Constraint: Guarantees zero duplicate holds at the SQLite storage level
    __table_args__ = (
        UniqueConstraint("show_id", "seat_number", name="uq_show_seat_hold"),
    )
