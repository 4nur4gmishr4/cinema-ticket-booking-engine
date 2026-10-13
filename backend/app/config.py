import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Yozigo Cinema API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cinema.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cinema-super-secret-jwt-key-2026-intern-assign")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Business Rules
    SEAT_HOLD_DURATION_SECONDS: int = 300  # 5 minutes
    MAX_SEATS_PER_BOOKING: int = 6
    TOTAL_ROWS: int = 8
    SEATS_PER_ROW: int = 10
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
