from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.booking import Booking, BookingSeat
from app.schemas.booking import (
    PaymentSimulateRequest,
    BookingOut,
    CustomerBookingsResponse,
)
from app.api.deps import get_current_user
from app.core.datetime_utils import get_utc_now
from app.services.booking_service import process_simulated_payment, cancel_customer_booking

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("/pay", response_model=BookingOut)
def pay_and_confirm_booking(
    payload: PaymentSimulateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Flow 5: Simulated Payment and Booking Confirmation.
    Outcomes: SUCCESS (confirms booking) or FAILURE (preserves hold for remaining time).
    """
    return process_simulated_payment(db, payload.hold_token, payload.outcome, current_user)

@router.get("/my", response_model=CustomerBookingsResponse)
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Flow 6: My Bookings.
    - Lists upcoming bookings first, then past bookings.
    - Strictly scoped to the authenticated customer.
    """
    user_bookings = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )

    now = get_utc_now()
    upcoming_list: List[BookingOut] = []
    past_list: List[BookingOut] = []

    for b in user_bookings:
        show = b.show
        seat_list = [s.strip() for s in b.seat_summary.split(",") if s.strip()]
        can_cancel = False

        if show and show.start_time > now and b.status == "CONFIRMED":
            can_cancel = (show.start_time - now) >= timedelta(hours=2)

        booking_out = BookingOut(
            id=b.id,
            booking_reference=b.booking_reference,
            show_id=b.show_id,
            movie_title=show.movie.title if show and show.movie else "Unknown Movie",
            movie_poster=show.movie.poster_url if show and show.movie else None,
            language=show.movie.language if show and show.movie else "English",
            screen_name=show.screen_name if show else "Screen 1",
            start_time=show.start_time if show else b.created_at,
            seats=seat_list,
            total_amount=b.total_amount,
            status=b.status,
            created_at=b.created_at,
            can_cancel=can_cancel
        )

        if show and show.start_time > now and b.status == "CONFIRMED":
            upcoming_list.append(booking_out)
        else:
            past_list.append(booking_out)


    # Sort upcoming by show start time ascending, past by show start time descending
    upcoming_list.sort(key=lambda x: x.start_time)
    past_list.sort(key=lambda x: x.start_time, reverse=True)

    return CustomerBookingsResponse(upcoming=upcoming_list, past=past_list)

@router.get("/{booking_id}", response_model=BookingOut)
def get_booking_by_id(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Flow 6 Acceptance Check:
    Verifies that changing booking ID in URL/API independently denies access to other users.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found."
        )

    # Strictly disallow seeing another customer's booking unless admin
    if booking.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this booking."
        )

    now = get_utc_now()
    show = booking.show
    seat_list = [s.strip() for s in booking.seat_summary.split(",") if s.strip()]
    can_cancel = False
    if show and show.start_time > now and booking.status == "CONFIRMED":
        can_cancel = (show.start_time - now) >= timedelta(hours=2)

    return BookingOut(
        id=booking.id,
        booking_reference=booking.booking_reference,
        show_id=booking.show_id,
        movie_title=show.movie.title if show and show.movie else "Unknown Movie",
        movie_poster=show.movie.poster_url if show and show.movie else None,
        language=show.movie.language if show and show.movie else "English",
        screen_name=show.screen_name if show else "Screen 1",
        start_time=show.start_time if show else booking.created_at,
        seats=seat_list,
        total_amount=booking.total_amount,
        status=booking.status,
        created_at=booking.created_at,
        can_cancel=can_cancel
    )

@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Flow 8 (Bonus): Cancel an eligible booking.
    Must be >= 2 hours before showtime.
    """
    return cancel_customer_booking(db, booking_id, current_user)
