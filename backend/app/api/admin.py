# --- API Router: Cinema Administration (Flow 7 & 9) ---
# Purpose: Protected management endpoints for Cinema Administrators.
# Enforces: All routes require get_current_admin dependency (user.role == "admin").
# Features:
# 1. Movie CRUD (Create, Edit, Delete with active booking protection).
# 2. Show Scheduling with automated interval overlap detection:
#    (Show.start_time < new_end_time AND Show.end_time > new_start_time).
# 3. Real-Time Occupancy & Revenue Audit per show and across the entire cinema.

from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.movie import Movie
from app.models.show import Show
from app.models.booking import Booking, BookingSeat
from app.schemas.movie import MovieCreate, MovieUpdate, MovieOut
from app.schemas.show import ShowCreate, ShowOut
from app.schemas.booking import (
    AdminShowOccupancyResponse,
    AdminBookingOut,
    AdminCinemaOverviewResponse,
    AdminGlobalBookingOut,
)
from app.schemas.seat import SeatOut
from app.api.deps import get_current_admin
from app.services.booking_service import get_all_cinema_seats

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

# --- Movie Management (Flow 7) ---

# Endpoint: POST /api/v1/admin/movies
# Creates a new movie entry in the cinema database
@router.post("/movies", response_model=MovieOut, status_code=status.HTTP_201_CREATED)
def admin_create_movie(
    payload: MovieCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin: Add a new movie to catalog."""
    movie = Movie(
        title=payload.title.strip(),
        description=payload.description,
        poster_url=payload.poster_url,
        language=payload.language,
        duration_mins=payload.duration_mins,
        certification=payload.certification,
        genre=payload.genre,
        release_date=payload.release_date
    )
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie

@router.put("/movies/{movie_id}", response_model=MovieOut)
def admin_update_movie(
    movie_id: int,
    payload: MovieUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin: Edit movie details."""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(movie, field, val)

    db.commit()
    db.refresh(movie)
    return movie

@router.delete("/movies/{movie_id}", status_code=status.HTTP_200_OK)
def admin_delete_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Admin: Delete a movie (only if no shows have bookings)."""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found.")

    # Check if any show for this movie has bookings
    show_ids = [s.id for s in movie.shows]
    if show_ids:
        has_bookings = db.query(Booking).filter(Booking.show_id.in_(show_ids)).first()
        if has_bookings:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete movie because one or more of its shows have existing customer bookings."
            )

    db.delete(movie)
    db.commit()
    return {"message": f"Movie '{movie.title}' deleted successfully."}

# --- Show Management (Flow 7) ---

@router.post("/shows", response_model=ShowOut, status_code=status.HTTP_201_CREATED)
def admin_create_show(
    payload: ShowCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin: Add a show for a movie.
    - Prevents overlapping shows on the same screen.
    - End time calculated as start_time + movie.duration_mins.
    """
    movie = db.query(Movie).filter(Movie.id == payload.movie_id).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found.")

    start_time = payload.start_time
    end_time = start_time + timedelta(minutes=movie.duration_mins)

    # Check for schedule overlap on the same screen:
    # Overlap occurs when (start_time < existing.end_time) and (end_time > existing.start_time)
    overlapping_show = db.query(Show).filter(
        Show.screen_name == payload.screen_name,
        Show.start_time < end_time,
        Show.end_time > start_time
    ).first()

    if overlapping_show:
        conflict_movie = overlapping_show.movie.title if overlapping_show.movie else "Another movie"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Schedule conflict: '{conflict_movie}' is already scheduled on {payload.screen_name} "
                f"from {overlapping_show.start_time.strftime('%H:%M')} to {overlapping_show.end_time.strftime('%H:%M')}."
            )
        )

    show = Show(
        movie_id=payload.movie_id,
        screen_name=payload.screen_name,
        start_time=start_time,
        end_time=end_time,
        ticket_price=payload.ticket_price
    )
    db.add(show)
    db.commit()
    db.refresh(show)

    return ShowOut(
        id=show.id,
        movie_id=show.movie_id,
        screen_name=show.screen_name,
        start_time=show.start_time,
        end_time=show.end_time,
        ticket_price=show.ticket_price,
        available_seats=80,
        movie=MovieOut.model_validate(movie)
    )

@router.delete("/shows/{show_id}", status_code=status.HTTP_200_OK)
def admin_delete_show(
    show_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Admin: Delete a show.
    Acceptance rule: A show that already has bookings CANNOT be deleted.
    """
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Show not found.")

    has_bookings = db.query(Booking).filter(
        Booking.show_id == show_id,
        Booking.status == "CONFIRMED"
    ).first()

    if has_bookings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A show that already has confirmed customer bookings cannot be deleted."
        )

    db.delete(show)
    db.commit()
    return {"message": "Show deleted successfully."}

# --- Show Occupancy & Stats (Flow 9 Bonus) ---

@router.get("/shows/{show_id}/occupancy", response_model=AdminShowOccupancyResponse)
def admin_get_show_occupancy(
    show_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Flow 9 (Bonus): See Bookings per Show.
    - Seats booked out of 80.
    - Percentage occupied.
    - Total revenue collected.
    - Booking list with Customer Name, Seats, Time.
    - Admin seat map.
    """
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Show not found.")

    confirmed_bookings = (
        db.query(Booking)
        .filter(Booking.show_id == show_id, Booking.status == "CONFIRMED")
        .order_by(Booking.created_at.desc())
        .all()
    )

    # Collect all confirmed seat codes for this show (single source of truth)
    confirmed_seat_set = set()
    for b in confirmed_bookings:
        for s in b.seat_summary.split(","):
            code = s.strip()
            if code:
                confirmed_seat_set.add(code)

    # Also check booking_seats table and merge
    db_seats = set(
        s[0] for s in db.query(BookingSeat.seat_number).filter(BookingSeat.show_id == show_id).all()
    )
    booked_set = confirmed_seat_set.union(db_seats)
    booked_seats_count = len(booked_set)
    occupancy_pct = round((booked_seats_count / 80.0) * 100, 1)
    total_revenue = sum(b.total_amount for b in confirmed_bookings)

    booking_list: List[AdminBookingOut] = []
    for b in confirmed_bookings:
        seats = [s.strip() for s in b.seat_summary.split(",") if s.strip()]
        booking_list.append(AdminBookingOut(
            booking_id=b.id,
            booking_reference=b.booking_reference,
            show_time=show.start_time,
            customer_name=b.user.name if b.user else "Unknown Customer",
            customer_email=b.user.email if b.user else "",
            seats=seats,
            total_amount=b.total_amount,
            status=b.status,
            created_at=b.created_at
        ))

    # Generate admin seat map
    all_seats = get_all_cinema_seats(db)

    seat_map_outs: List[SeatOut] = []
    for s in all_seats:
        status_str = "BOOKED" if s.seat_number in booked_set else "AVAILABLE"
        seat_map_outs.append(SeatOut(
            seat_number=s.seat_number,
            row=s.row,
            col=s.col,
            status=status_str,
            price=show.ticket_price
        ))

    return AdminShowOccupancyResponse(
        show_id=show.id,
        movie_id=show.movie_id,
        movie_title=show.movie.title if show.movie else "Unknown Movie",
        start_time=show.start_time,
        ticket_price=show.ticket_price,
        total_seats=80,
        booked_count=booked_seats_count,
        occupancy_percentage=occupancy_pct,
        total_revenue=round(total_revenue, 2),
        bookings=booking_list,
        seat_map=seat_map_outs
    )


@router.get("/overview", response_model=AdminCinemaOverviewResponse)
def admin_get_cinema_overview(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """
    Cinema Master Overview & Global Booking Ledger.
    Returns:
    - Aggregate cinema metrics: total bookings, confirmed, cancelled, total booked seats, gross revenue, active shows count.
    - Full list of all bookings across all movies and showtimes with customer, show, and seat details.
    """
    all_bookings = (
        db.query(Booking)
        .order_by(Booking.created_at.desc())
        .all()
    )

    confirmed_bookings = [b for b in all_bookings if b.status == "CONFIRMED"]
    cancelled_bookings = [b for b in all_bookings if b.status == "CANCELLED"]

    # Derive total booked seats directly from CONFIRMED bookings so cards and ledger match 100%
    total_booked_seats = sum(
        len([s for s in b.seat_summary.split(",") if s.strip()])
        for b in confirmed_bookings
    )
    total_gross_revenue = sum(b.total_amount for b in confirmed_bookings)
    active_shows_count = db.query(Show).filter(Show.start_time >= datetime.utcnow() - timedelta(hours=4)).count()
    if active_shows_count == 0:
        active_shows_count = db.query(Show).count()

    booking_list: List[AdminGlobalBookingOut] = []
    for b in all_bookings:
        seats = [s.strip() for s in b.seat_summary.split(",") if s.strip()]
        movie_title = b.show.movie.title if (b.show and b.show.movie) else "Unknown Movie"
        movie_id = b.show.movie_id if b.show else 0
        screen_name = b.show.screen_name if b.show else "Screen 1"
        show_time = b.show.start_time if b.show else b.created_at

        booking_list.append(AdminGlobalBookingOut(
            booking_id=b.id,
            booking_reference=b.booking_reference,
            movie_id=movie_id,
            movie_title=movie_title,
            screen_name=screen_name,
            show_id=b.show_id,
            show_time=show_time,
            customer_name=b.user.name if b.user else "Unknown Customer",
            customer_email=b.user.email if b.user else "",
            seats=seats,
            total_amount=b.total_amount,
            status=b.status,
            created_at=b.created_at
        ))

    return AdminCinemaOverviewResponse(
        total_bookings_count=len(all_bookings),
        confirmed_bookings_count=len(confirmed_bookings),
        cancelled_bookings_count=len(cancelled_bookings),
        total_booked_seats=total_booked_seats,
        total_gross_revenue=round(total_gross_revenue, 2),
        active_shows_count=active_shows_count,
        bookings=booking_list
    )

