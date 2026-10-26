# --- API Router: Movies & Schedules (Flow 2) ---
# Purpose: Public endpoints to list movies, view synopsis, and retrieve upcoming shows grouped by date.

from datetime import datetime
from typing import List
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.movie import Movie
from app.models.show import Show
from app.models.booking import BookingSeat
from app.models.seat_hold import SeatHold
from app.core.datetime_utils import get_utc_now
from app.schemas.movie import MovieOut
from app.schemas.show import ShowOut, ShowsByDateGroup

router = APIRouter(prefix="/movies", tags=["Movies"])

# Endpoint: GET /api/v1/movies
# Retrieves all movies in the catalog, sorted alphabetically by title
@router.get("", response_model=List[MovieOut])
def list_movies(db: Session = Depends(get_db)):
    """
    Flow 2: List all movies.
    Every movie displays: Title, poster, language, duration, certification (U/UA/A).
    """
    return db.query(Movie).order_by(Movie.title).all()

@router.get("/{movie_id}", response_model=MovieOut)
def get_movie_detail(movie_id: int, db: Session = Depends(get_db)):
    """Flow 2: Retrieve movie details by ID."""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found."
        )
    return movie

@router.get("/{movie_id}/shows", response_model=List[ShowsByDateGroup])
def get_movie_upcoming_shows(movie_id: int, db: Session = Depends(get_db)):
    """
    Flow 2: Upcoming shows grouped by date.
    - Excludes shows that have already started.
    - Each show displays start time, ticket price, and available seats count.
    """
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found."
        )

    now = get_utc_now()
    upcoming_shows = (
        db.query(Show)
        .filter(Show.movie_id == movie_id, Show.start_time > now)
        .order_by(Show.start_time)
        .all()
    )

    # Group by date string (e.g., 'YYYY-MM-DD')
    grouped_dict = defaultdict(list)
    for show in upcoming_shows:
        # Calculate available seats (80 total - active bookings - active holds)
        booked_count = db.query(BookingSeat).filter(BookingSeat.show_id == show.id).count()
        held_count = db.query(SeatHold).filter(
            SeatHold.show_id == show.id,
            SeatHold.expires_at > now
        ).count()
        available_seats = max(0, 80 - booked_count - held_count)

        show_out = ShowOut(
            id=show.id,
            movie_id=show.movie_id,
            screen_name=show.screen_name,
            start_time=show.start_time,
            end_time=show.end_time,
            ticket_price=show.ticket_price,
            available_seats=available_seats,
            movie=MovieOut.model_validate(show.movie) if show.movie else None
        )
        date_key = show.start_time.strftime("%Y-%m-%d")
        grouped_dict[date_key].append(show_out)

    result = []
    for date_key in sorted(grouped_dict.keys()):
        # Format human-readable date, e.g., "Wed, Oct 14"
        sample_dt = datetime.strptime(date_key, "%Y-%m-%d")
        display_date = sample_dt.strftime("%a, %b %d")
        result.append(ShowsByDateGroup(
            date=date_key,
            display_date=display_date,
            shows=grouped_dict[date_key]
        ))

    return result
