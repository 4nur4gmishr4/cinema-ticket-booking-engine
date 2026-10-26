# --- API Dependencies: Authentication & Authorization ---
# Purpose: Reusable FastAPI dependencies for injecting authenticated users, optional guests, and admin guards.

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from app.database import get_db
from app.models.user import User
from app.services.auth_service import decode_access_token

# Extracts Bearer token from the incoming "Authorization: Bearer <token>" HTTP header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

# Dependency: Requires a valid logged-in user. Raises HTTP 401 if missing or invalid.
def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = decode_access_token(token)
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except (jwt.PyJWTError, Exception):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# Dependency: Optional authentication for public endpoints (like Seat Map).
# If a token is provided, returns the User object so they can see "HELD_BY_ME".
# If unauthenticated, returns None without raising an error so guests can still browse.
def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id: int = payload.get("user_id")
        if user_id is None:
            return None
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None

# Dependency: Role Guard for Cinema Administrator.
# Verifies that current_user.role is 'admin'. If not, raises HTTP 403 Forbidden.
def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required. Access denied."
        )
    return current_user
