from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

SeatStatus = Literal["AVAILABLE", "HELD_BY_ME", "HELD_BY_OTHER", "BOOKED"]

class SeatOut(BaseModel):
    seat_number: str
    row: str
    col: int
    status: SeatStatus
    price: float

class SeatMapResponse(BaseModel):
    show_id: int
    movie_id: int
    movie_title: str
    screen_name: str
    start_time: datetime
    ticket_price: float
    total_seats: int = 80
    available_count: int
    held_count: int
    booked_count: int
    seats: list[SeatOut]
    current_hold_token: str | None = None
    hold_remaining_seconds: int | None = None

class HoldSeatsRequest(BaseModel):
    show_id: int
    seat_numbers: list[str] = Field(..., min_length=1, max_length=6, description="Select between 1 and 6 seats")

class HoldSeatsResponse(BaseModel):
    hold_token: str
    show_id: int
    seat_numbers: list[str]
    expires_at: datetime
    remaining_seconds: int
    total_amount: float
    message: str
