import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
import app.models  # ensure models are registered
from app.api import auth, movies, shows, seats, bookings, admin

# Create tables
Base.metadata.create_all(bind=engine)

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
                await asyncio.wait_for(stop_event.wait(), timeout=30.0)
            except (asyncio.TimeoutError, TimeoutError):
                pass
    worker_task = asyncio.create_task(cleanup_worker())
    try:
        yield
    finally:
        stop_event.set()
        await worker_task

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
