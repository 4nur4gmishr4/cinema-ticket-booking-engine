from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.show import Show
from app.models.booking import BookingSeat
from app.models.seat_hold import SeatHold
from app.core.datetime_utils import get_utc_now
from app.schemas.show import ShowOut
from app.schemas.movie import MovieOut

router = APIRouter(prefix="/shows", tags=["Shows"])

@router.get("", response_model=List[ShowOut])
def list_upcoming_shows(db: Session = Depends(get_db)):
    """Lists all upcoming shows across movies with available seat counts."""
    now = get_utc_now()
    shows = db.query(Show).filter(Show.start_time > now).order_by(Show.start_time).all()

    result = []
    for show in shows:
        booked_count = db.query(BookingSeat).filter(BookingSeat.show_id == show.id).count()
        held_count = db.query(SeatHold).filter(
            SeatHold.show_id == show.id,
            SeatHold.expires_at > now
        ).count()
        available_seats = max(0, 80 - booked_count - held_count)

        result.append(ShowOut(
            id=show.id,
            movie_id=show.movie_id,
            screen_name=show.screen_name,
            start_time=show.start_time,
            end_time=show.end_time,
            ticket_price=show.ticket_price,
            available_seats=available_seats,
            movie=MovieOut.model_validate(show.movie) if show.movie else None
        ))
    return result

@router.get("/{show_id}", response_model=ShowOut)
def get_show_detail(show_id: int, db: Session = Depends(get_db)):
    """Retrieves a single show's details with current available seat count."""
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Show not found."
        )

    now = get_utc_now()
    booked_count = db.query(BookingSeat).filter(BookingSeat.show_id == show.id).count()
    held_count = db.query(SeatHold).filter(
        SeatHold.show_id == show.id,
        SeatHold.expires_at > now
    ).count()
    available_seats = max(0, 80 - booked_count - held_count)

    return ShowOut(
        id=show.id,
        movie_id=show.movie_id,
        screen_name=show.screen_name,
        start_time=show.start_time,
        end_time=show.end_time,
        ticket_price=show.ticket_price,
        available_seats=available_seats,
        movie=MovieOut.model_validate(show.movie) if show.movie else None
    )
