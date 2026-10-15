from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.seat import SeatMapResponse, HoldSeatsRequest, HoldSeatsResponse
from app.api.deps import get_current_user, get_optional_current_user
from app.services.booking_service import get_show_seat_map, hold_seats_for_user
from app.models.seat_hold import SeatHold

router = APIRouter(prefix="/shows/{show_id}/seats", tags=["Seats"])

@router.get("", response_model=SeatMapResponse)
def get_seat_map(
    show_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user)
):
    """
    Flow 3: View the 80-seat map for a show.
    Distinguishes: AVAILABLE, HELD_BY_ME, HELD_BY_OTHER, BOOKED.
    """
    return get_show_seat_map(db, show_id, current_user)

@router.post("/hold", response_model=HoldSeatsResponse)
def hold_seats(
    show_id: int,
    payload: HoldSeatsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Flow 4: Select and hold 1-6 seats for 5 minutes.
    Protected endpoint: Customer must be logged in.
    """
    if payload.show_id != show_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Show ID mismatch between path and body."
        )
    return hold_seats_for_user(db, show_id, payload.seat_numbers, current_user)

@router.delete("/hold", status_code=status.HTTP_200_OK)
def release_user_hold(
    show_id: int,
    hold_token: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Releases active hold for the current user."""
    query = db.query(SeatHold).filter(
        SeatHold.show_id == show_id,
        SeatHold.user_id == current_user.id
    )
    if hold_token:
        query = query.filter(SeatHold.hold_token == hold_token)
    deleted = query.delete(synchronize_session=False)
    db.commit()
    return {"message": f"Released {deleted} held seats."}
