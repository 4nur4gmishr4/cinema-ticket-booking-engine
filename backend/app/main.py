# --- Main Application Entry Point: FastAPI ---
# Purpose: Initializes the backend web server, database tables, background workers, and API routes.

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
import app.models  # Registers all SQLAlchemy database tables
from app.api import auth, movies, shows, seats, bookings, admin

# Step 1: Ensure all database tables are created on startup if they don't already exist
Base.metadata.create_all(bind=engine)

# Step 2: Lifespan Manager
# Runs a non-blocking background task that wakes up every 30 seconds
# to delete any seat holds that have passed their 5-minute expiration time.
@asynccontextmanager
async def lifespan(app: FastAPI):
    stop_event = asyncio.Event()

    async def cleanup_worker():
        while not stop_event.is_set():
            try:
                with SessionLocal() as db:
                    from app.services.booking_service import cleanup_expired_holds
                    cleanup_expired_holds(db)
            except Exception:
                pass
            try:
                # Wait for 30 seconds before running next cleanup cycle
                await asyncio.wait_for(stop_event.wait(), timeout=30.0)
            except (asyncio.TimeoutError, TimeoutError):
                pass

    # Start the worker task in the background
    worker_task = asyncio.create_task(cleanup_worker())
    try:
        yield
    finally:
        # Gracefully shut down background task when server stops
        stop_event.set()
        await worker_task

# Step 3: Instantiate FastAPI Application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-stack Cinema Movie Ticket Booking API (Yozigo Full-Stack Intern Assignment)",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS setup - support all origins and browser extension preflights with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*$",
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.options("/{full_path:path}")
async def options_preflight(full_path: str):
    return {"status": "ok"}


import os
from fastapi.staticfiles import StaticFiles

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(movies.router, prefix=settings.API_V1_STR)
app.include_router(shows.router, prefix=settings.API_V1_STR)
app.include_router(seats.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

# Mount local high-definition poster directory
posters_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "posters"))
if os.path.isdir(posters_path):
    app.mount("/posters", StaticFiles(directory=posters_path), name="posters")

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "online"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
