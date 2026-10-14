from sqlalchemy import Column, Integer, String
from app.database import Base

class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    seat_number = Column(String(10), unique=True, nullable=False, index=True)  # e.g., "A1", "H10"
    row = Column(String(5), nullable=False)  # 'A' - 'H'
    col = Column(Integer, nullable=False)  # 1 - 10
    tier = Column(String(20), default="Standard", nullable=False)
