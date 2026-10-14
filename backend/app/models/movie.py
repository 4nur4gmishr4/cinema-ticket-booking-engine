from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.datetime_utils import get_utc_now

class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    poster_url = Column(String(500), nullable=True)
    language = Column(String(50), nullable=False)
    duration_mins = Column(Integer, nullable=False)  # in minutes
    certification = Column(String(10), nullable=False)  # 'U', 'UA', 'A'
    genre = Column(String(100), nullable=True)
    release_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    shows = relationship("Show", back_populates="movie", cascade="all, delete-orphan")
