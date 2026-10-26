# --- Database Configuration & Engine ---
# Purpose: Sets up the SQLAlchemy database engine, session factory, and SQLite concurrency optimizations.

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Step 1: SQLite Connection Arguments
# check_same_thread: False allows multi-threaded requests in FastAPI
# timeout: 30 seconds wait before timing out on locks
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False, "timeout": 30}

# Step 2: Create the SQLAlchemy Engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

# Step 3: SQLite Concurrency Optimization (Crucial for preventing race conditions)
# - PRAGMA foreign_keys=ON: Enforces relational database integrity.
# - PRAGMA journal_mode=WAL: Write-Ahead Logging allows simultaneous reads and writes without blocking.
# - PRAGMA busy_timeout=30000: Waits up to 30 seconds if another thread is writing, eliminating "database is locked" errors.
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.close()

# Step 4: Sessionmaker for creating database sessions per request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all ORM models
Base = declarative_base()

# Step 5: FastAPI Dependency Injection for Database Sessions
# Yields an active database session to the API endpoint and guarantees it closes when request finishes.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
