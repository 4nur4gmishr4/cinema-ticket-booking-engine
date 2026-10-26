# --- Service: Authentication & Cryptography ---
# Purpose: Handles secure password hashing (via bcrypt) and JWT access token creation/verification.

from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from app.config import settings

# Function: Hashes plain text password using bcrypt with random salt
def hash_password(password: str) -> str:
    """Hashes a plain password using bcrypt with salt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

# Function: Verifies whether the provided plain password matches the stored bcrypt hash
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

# Function: Generates a cryptographically signed JWT access token containing user claims (sub=email, role)
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Generates a signed JWT token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Function: Validates signature and decodes claims from a JWT token string
def decode_access_token(token: str) -> dict:
    """Decodes and validates a JWT token."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
