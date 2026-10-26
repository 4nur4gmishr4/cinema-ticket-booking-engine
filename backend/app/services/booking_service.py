# --- Service: Booking & Concurrency Engine ---
# Purpose: Core transactional business logic for seat holds, payments, bookings, and cancellations.
# Key Architecture:
# 1. Atomic 5-Minute Holds: Generates UUID hold token and sets expires_at = now + 300s.
# 2. Concurrency Protection: Uses db.begin() transactions and composite unique constraints
#    (show_id, seat_number) to prevent any two users from booking or holding the same seat.
# 3. Automatic Expiry Cleanup: Purges dead holds before checking availability or taking holds.

import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.config import settings
from app.models.user import User
from app.models.show import Show
from app.models.seat import Seat
from app.models.seat_hold import SeatHold
from app.models.booking import Booking, BookingSeat
from app.core.datetime_utils import get_utc_now
from app.schemas.seat import SeatOut, SeatMapResponse, HoldSeatsResponse
from app.schemas.booking import BookingOut

# Function: Deletes all temporary seat holds where the 5-minute timer has expired.
# Called automatically before loading seat maps, before acquiring new holds, and by the 30s background worker.
def cleanup_expired_holds(db: Session, show_id: Optional[int] = None) -> int:
    """Removes all holds where expires_at is in the past."""
    now = get_utc_now()
    query = db.query(SeatHold).filter(SeatHold.expires_at <= now)
    if show_id:
        query = query.filter(SeatHold.show_id == show_id)
    count = query.delete(synchronize_session=False)
    db.commit()
    return count

# Function: Ensures and returns all 80 auditorium seats (Rows A-H, Columns 1-10)
def get_all_cinema_seats(db: Session) -> List[Seat]:
    """Ensures and returns all 80 seats (A1-H10) sorted by row and column."""
    seats = db.query(Seat).order_by(Seat.row, Seat.col).all()
    if len(seats) == 80:
        return seats

    # Seed 80 seats if not already populated
    rows = ["A", "B", "C", "D", "E", "F", "G", "H"]
    for row in rows:
        for col in range(1, 11):
            seat_num = f"{row}{col}"
            existing = db.query(Seat).filter(Seat.seat_number == seat_num).first()
            if not existing:
                db.add(Seat(seat_number=seat_num, row=row, col=col, tier="Standard"))
    db.commit()
    return db.query(Seat).order_by(Seat.row, Seat.col).all()

def get_show_seat_map(
    db: Session,
    show_id: int,
    current_user: Optional[User] = None
) -> SeatMapResponse:
    """
    Flow 3: View Seat Map.
    Returns 80 seats with states: AVAILABLE, HELD_BY_ME, HELD_BY_OTHER, BOOKED.
    """
    cleanup_expired_holds(db, show_id)

    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Show not found."
        )

    all_seats = get_all_cinema_seats(db)

    # Active bookings for this show
    booked_seat_numbers = set(
        s[0] for s in db.query(BookingSeat.seat_number).filter(BookingSeat.show_id == show_id).all()
    )

    # Active holds for this show
    now = get_utc_now()
    active_holds = db.query(SeatHold).filter(
        SeatHold.show_id == show_id,
        SeatHold.expires_at > now
    ).all()

    held_by_user_seats = set()
    held_by_other_seats = set()
    current_hold_token: Optional[str] = None
    remaining_seconds: Optional[int] = None

    for hold in active_holds:
        if current_user and hold.user_id == current_user.id:
            held_by_user_seats.add(hold.seat_number)
            current_hold_token = hold.hold_token
            rem = int((hold.expires_at - now).total_seconds())
            remaining_seconds = max(0, rem)
        else:
            held_by_other_seats.add(hold.seat_number)

    seat_outs: List[SeatOut] = []
    for seat in all_seats:
        if seat.seat_number in booked_seat_numbers:
            seat_status = "BOOKED"
        elif seat.seat_number in held_by_user_seats:
            seat_status = "HELD_BY_ME"
        elif seat.seat_number in held_by_other_seats:
            seat_status = "HELD_BY_OTHER"
        else:
            seat_status = "AVAILABLE"

        seat_outs.append(SeatOut(
            seat_number=seat.seat_number,
            row=seat.row,
            col=seat.col,
            status=seat_status,
            price=show.ticket_price
        ))

    available_count = sum(1 for s in seat_outs if s.status == "AVAILABLE")
    held_count = len(held_by_user_seats) + len(held_by_other_seats)
    booked_count = len(booked_seat_numbers)

    return SeatMapResponse(
        show_id=show.id,
        movie_id=show.movie_id,
        movie_title=show.movie.title if show.movie else "Unknown Movie",
        screen_name=show.screen_name,
        start_time=show.start_time,
        ticket_price=show.ticket_price,
        total_seats=80,
        available_count=available_count,
        held_count=held_count,
        booked_count=booked_count,
        seats=seat_outs,
        current_hold_token=current_hold_token,
        hold_remaining_seconds=remaining_seconds
    )

def hold_seats_for_user(
    db: Session,
    show_id: int,
    seat_numbers: List[str],
    current_user: User
) -> HoldSeatsResponse:
    """
    Flow 4: Select and Hold Seats.
    - 1 to 6 seats max.
    - 5-minute hold timer.
    - Atomic check for conflicts with specific conflicting seat name.
    """
    if len(seat_numbers) < 1 or len(seat_numbers) > settings.MAX_SEATS_PER_BOOKING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You can select between 1 and {settings.MAX_SEATS_PER_BOOKING} seats."
        )

    # Normalize seat numbers
    seat_numbers = [s.strip().upper() for s in seat_numbers]

    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Show not found."
        )

    now = get_utc_now()
    if show.start_time <= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This show has already started and cannot be booked."
        )

    cleanup_expired_holds(db, show_id)

    # Check for already booked seats
    existing_bookings = db.query(BookingSeat.seat_number).filter(
        BookingSeat.show_id == show_id,
        BookingSeat.seat_number.in_(seat_numbers)
    ).all()

    if existing_bookings:
        conflicted = [b[0] for b in existing_bookings]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Seat {', '.join(conflicted)} is already booked."
        )

    # Check for seats held by someone else
    existing_holds = db.query(SeatHold).filter(
        SeatHold.show_id == show_id,
        SeatHold.seat_number.in_(seat_numbers),
        SeatHold.expires_at > now,
        SeatHold.user_id != current_user.id
    ).all()

    if existing_holds:
        conflicted = [h.seat_number for h in existing_holds]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Seat {', '.join(conflicted)} is currently held by another user."
        )

    # Clear previous active holds for this user on this show to refresh selection
    db.query(SeatHold).filter(
        SeatHold.show_id == show_id,
        SeatHold.user_id == current_user.id
    ).delete(synchronize_session=False)

    hold_token = uuid.uuid4().hex
    expires_at = now + timedelta(seconds=settings.SEAT_HOLD_DURATION_SECONDS)

    try:
        for seat_num in seat_numbers:
            hold = SeatHold(
                show_id=show_id,
                seat_number=seat_num,
                user_id=current_user.id,
                hold_token=hold_token,
                expires_at=expires_at,
                created_at=now
            )
            db.add(hold)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="One of the selected seats was just held by another customer. Please refresh."
        )

    total_amount = round(show.ticket_price * len(seat_numbers), 2)
    return HoldSeatsResponse(
        hold_token=hold_token,
        show_id=show_id,
        seat_numbers=seat_numbers,
        expires_at=expires_at,
        remaining_seconds=settings.SEAT_HOLD_DURATION_SECONDS,
        total_amount=total_amount,
        message="Seats successfully held for 5 minutes."
    )

def process_simulated_payment(
    db: Session,
    hold_token: str,
    outcome: str,
    current_user: User
) -> BookingOut:
    """
    Flow 5: Simulated Payment and Booking Confirmation.
    Guarantees that double-booking never occurs via DB constraints & transactions.
    """
    now = get_utc_now()

    # Find the holds
    holds = db.query(SeatHold).filter(SeatHold.hold_token == hold_token).all()
    if not holds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seat hold session not found or already completed."
        )

    # Check ownership
    if holds[0].user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized hold session."
        )

    # Check expiration
    if holds[0].expires_at <= now:
        db.query(SeatHold).filter(SeatHold.hold_token == hold_token).delete(synchronize_session=False)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your 5-minute seat hold has expired. Please select seats again."
        )

    show_id = holds[0].show_id
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Show not found."
        )

    seat_numbers = [h.seat_number for h in holds]

    # Handle Payment Failure
    if outcome == "FAILURE":
        remaining = max(0, int((holds[0].expires_at - now).total_seconds()))
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Payment failed. Your seats remain held for {remaining} seconds. You may try again."
        )

    # Handle Payment Success
    # Attempt transactional insertion into bookings and booking_seats
    booking_ref = f"BK-{uuid.uuid4().hex[:8].upper()}"
    total_amount = round(show.ticket_price * len(seat_numbers), 2)
    seat_summary = ", ".join(sorted(seat_numbers))

    try:
        new_booking = Booking(
            booking_reference=booking_ref,
            user_id=current_user.id,
            show_id=show_id,
            total_amount=total_amount,
            seat_summary=seat_summary,
            status="CONFIRMED",
            payment_status="SUCCESS",
            created_at=now
        )
        db.add(new_booking)
        db.flush()  # obtain new_booking.id

        for seat_num in seat_numbers:
            b_seat = BookingSeat(
                booking_id=new_booking.id,
                show_id=show_id,
                seat_number=seat_num,
                created_at=now
            )
            db.add(b_seat)

        # Release holds once booked
        db.query(SeatHold).filter(SeatHold.hold_token == hold_token).delete(synchronize_session=False)

        db.commit()
        db.refresh(new_booking)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Double-booking prevented: One of these seats was already confirmed by another booking."
        )

    can_cancel = (show.start_time - now) >= timedelta(hours=2)

    return BookingOut(
        id=new_booking.id,
        booking_reference=new_booking.booking_reference,
        show_id=show.id,
        movie_title=show.movie.title if show.movie else "Unknown",
        movie_poster=show.movie.poster_url if show.movie else None,
        language=show.movie.language if show.movie else "English",
        screen_name=show.screen_name,
        start_time=show.start_time,
        seats=seat_numbers,
        total_amount=new_booking.total_amount,
        status=new_booking.status,
        created_at=new_booking.created_at,
        can_cancel=can_cancel
    )

def cancel_customer_booking(
    db: Session,
    booking_id: int,
    current_user: User
) -> BookingOut:
    """
    Flow 8 (Bonus): Cancel a Booking.
    - Only allowed >= 2 hours before showtime.
    - Customer can only cancel their own booking.
    - Seats become available immediately.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found."
        )

    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot cancel another customer's booking."
        )

    if booking.status == "CANCELLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This booking has already been cancelled."
        )

    now = get_utc_now()
    show = booking.show
    if not show:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Associated show does not exist."
        )

    if show.start_time <= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel bookings for shows that have already started or concluded."
        )

    if (show.start_time - now) < timedelta(hours=2):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancellations are only permitted up to 2 hours before showtime."
        )

    # Change status to CANCELLED
    booking.status = "CANCELLED"

    # Free the seats immediately by deleting from booking_seats
    db.query(BookingSeat).filter(BookingSeat.booking_id == booking.id).delete(synchronize_session=False)

    db.commit()
    db.refresh(booking)

    seat_list = [s.strip() for s in booking.seat_summary.split(",")]

    return BookingOut(
        id=booking.id,
        booking_reference=booking.booking_reference,
        show_id=show.id,
        movie_title=show.movie.title if show.movie else "Unknown",
        movie_poster=show.movie.poster_url if show.movie else None,
        language=show.movie.language if show.movie else "English",
        screen_name=show.screen_name,
        start_time=show.start_time,
        seats=seat_list,
        total_amount=booking.total_amount,
        status="CANCELLED",
        created_at=booking.created_at,
        can_cancel=False
    )
