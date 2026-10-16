from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.seat import SeatOut

PaymentOutcomeType = Literal["SUCCESS", "FAILURE"]

class PaymentSimulateRequest(BaseModel):
    hold_token: str
    outcome: PaymentOutcomeType = Field(..., description="Exact test outcomes: SUCCESS or FAILURE")

class BookingOut(BaseModel):
    id: int
    booking_reference: str
    show_id: int
    movie_title: str
    movie_poster: Optional[str] = None
    language: str
    screen_name: str
    start_time: datetime
    seats: list[str]
    total_amount: float
    status: str  # "CONFIRMED" | "CANCELLED"
    created_at: datetime
    can_cancel: bool = False

    model_config = ConfigDict(from_attributes=True)

class CustomerBookingsResponse(BaseModel):
    upcoming: list[BookingOut]
    past: list[BookingOut]

class AdminBookingOut(BaseModel):
    booking_id: int
    booking_reference: str
    customer_name: str
    customer_email: str
    seats: list[str]
    total_amount: float
    status: str
    created_at: datetime

class AdminShowOccupancyResponse(BaseModel):
    show_id: int
    movie_id: int
    movie_title: str
    start_time: datetime
    ticket_price: float
    total_seats: int = 80
    booked_count: int
    occupancy_percentage: float
    total_revenue: float
    bookings: list[AdminBookingOut]
    seat_map: list[SeatOut]

class AdminGlobalBookingOut(BaseModel):
    booking_id: int
    booking_reference: str
    movie_id: int
    movie_title: str
    screen_name: str
    show_id: int
    show_time: datetime
    customer_name: str
    customer_email: str
    seats: list[str]
    total_amount: float
    status: str
    created_at: datetime

class AdminCinemaOverviewResponse(BaseModel):
    total_bookings_count: int
    confirmed_bookings_count: int
    cancelled_bookings_count: int
    total_booked_seats: int
    total_gross_revenue: float
    active_shows_count: int
    bookings: list[AdminGlobalBookingOut]

