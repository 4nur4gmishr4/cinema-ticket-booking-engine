from datetime import datetime, timezone

def get_utc_now() -> datetime:
    """Return the current UTC timestamp (naive format for consistent DB comparison)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
