import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.movie import Movie
from app.models.show import Show
from app.services.auth_service import hash_password
from app.services.booking_service import get_all_cinema_seats
from app.core.datetime_utils import get_utc_now

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test_cinema.db"

engine_test = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine_test)
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()

@pytest.fixture
def client():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def seeded_data(db_session):
    # 80 seats
    get_all_cinema_seats(db_session)

    # Admin user
    admin = db_session.query(User).filter(User.email == "admin@test.com").first()
    if not admin:
        admin = User(
            name="Admin User",
            email="admin@test.com",
            hashed_password=hash_password("AdminPass123"),
            role="admin"
        )
        db_session.add(admin)

    # Customer 1
    cust1 = db_session.query(User).filter(User.email == "user1@test.com").first()
    if not cust1:
        cust1 = User(
            name="Customer One",
            email="user1@test.com",
            hashed_password=hash_password("CustomerPass123"),
            role="customer"
        )
        db_session.add(cust1)

    # Customer 2
    cust2 = db_session.query(User).filter(User.email == "user2@test.com").first()
    if not cust2:
        cust2 = User(
            name="Customer Two",
            email="user2@test.com",
            hashed_password=hash_password("CustomerPass123"),
            role="customer"
        )
        db_session.add(cust2)

    # Movie
    movie = db_session.query(Movie).filter(Movie.title == "Test Movie").first()
    if not movie:
        movie = Movie(
            title="Test Movie",
            description="Testing movie description",
            language="English",
            duration_mins=120,
            certification="UA"
        )
        db_session.add(movie)
        db_session.flush()

    # Show (future show: tomorrow 6:00 PM)
    now = get_utc_now()
    show_time = now + timedelta(days=1, hours=4)
    show = db_session.query(Show).filter(Show.movie_id == movie.id).first()
    if not show:
        show = Show(
            movie_id=movie.id,
            screen_name="Screen 1",
            start_time=show_time,
            end_time=show_time + timedelta(minutes=120),
            ticket_price=250.0
        )
        db_session.add(show)

    db_session.commit()

    return {
        "admin": admin,
        "cust1": cust1,
        "cust2": cust2,
        "movie": movie,
        "show": show
    }
