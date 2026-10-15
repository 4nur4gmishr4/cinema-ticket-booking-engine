from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

CertificationType = Literal["U", "UA", "A"]

class MovieBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    poster_url: Optional[str] = None
    language: str = Field(default="English", max_length=50)
    duration_mins: int = Field(..., gt=0, description="Duration in minutes")
    certification: CertificationType = "UA"
    genre: Optional[str] = None
    release_date: Optional[str] = None

class MovieCreate(MovieBase):
    pass

class MovieUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    poster_url: Optional[str] = None
    language: Optional[str] = None
    duration_mins: Optional[int] = Field(default=None, gt=0)
    certification: Optional[CertificationType] = None
    genre: Optional[str] = None
    release_date: Optional[str] = None

class MovieOut(MovieBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
