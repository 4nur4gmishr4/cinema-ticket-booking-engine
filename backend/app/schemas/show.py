from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.movie import MovieOut

class ShowBase(BaseModel):
    movie_id: int
    screen_name: str = Field(default="Screen 1", max_length=50)
    start_time: datetime
    ticket_price: float = Field(..., gt=0)

class ShowCreate(ShowBase):
    pass

class ShowOut(BaseModel):
    id: int
    movie_id: int
    screen_name: str
    start_time: datetime
    end_time: datetime
    ticket_price: float
    available_seats: int = 80
    movie: Optional[MovieOut] = None

    model_config = ConfigDict(from_attributes=True)

class ShowsByDateGroup(BaseModel):
    date: str  # e.g., "2026-10-15"
    display_date: str  # e.g., "Wed, 15 Oct"
    shows: list[ShowOut]
