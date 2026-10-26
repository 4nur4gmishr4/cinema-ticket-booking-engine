# --- Database Model: Seat ---
# Purpose: Master registry of the 80 physical auditorium seats.
# Layout: 8 Rows (A through H) x 10 Columns (1 through 10) = 80 total seats.

from sqlalchemy import Column, Integer, String
from app.database import Base

class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    seat_number = Column(String(10), unique=True, nullable=False, index=True)  # E.g. "A1", "H10"
    row = Column(String(5), nullable=False)                                     # Row letter: 'A' to 'H'
    col = Column(Integer, nullable=False)                                      # Column number: 1 to 10
    tier = Column(String(20), default="Standard", nullable=False)              # Tier classification
