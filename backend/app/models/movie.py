# --- Database Model: Movie ---
# Purpose: Master record of a movie title in the cinema system.
# Includes metadata: synopsis, poster image, language, runtime duration, certification (U, UA, A), and genre.

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
    language = Column(String(50), nullable=False)               # E.g. "English", "Hindi", "Telugu"
    duration_mins = Column(Integer, nullable=False)             # Runtime in minutes (e.g. 152)
    certification = Column(String(10), nullable=False)          # CBFC rating: 'U', 'UA', or 'A'
    genre = Column(String(100), nullable=True)                  # E.g. "Action / Drama"
    release_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    # Cascades deletion to scheduled shows if movie is removed
    shows = relationship("Show", back_populates="movie", cascade="all, delete-orphan")
