import pytest

def test_user_registration_success(client):
    """Flow 1: Customer can register with valid details."""
    response = client.post("/api/v1/auth/register", json={
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "Password123"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "jane@example.com"
    assert data["role"] == "customer"
    assert "password" not in data
    assert "hashed_password" not in data

def test_registration_duplicate_email_rejected(client):
    """Flow 1: Registering with existing email produces clear error."""
    client.post("/api/v1/auth/register", json={
        "name": "Jane",
        "email": "duplicate@example.com",
        "password": "Password123"
    })
    response = client.post("/api/v1/auth/register", json={
        "name": "Jane 2",
        "email": "duplicate@example.com",
        "password": "Password123"
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()

def test_registration_short_password_rejected(client):
    """Flow 1: Password shorter than 8 characters is rejected."""
    response = client.post("/api/v1/auth/register", json={
        "name": "Short",
        "email": "short@example.com",
        "password": "12345"
    })
    assert response.status_code in [400, 422]

def test_login_success(client, seeded_data):
    """Flow 1: User can log in with valid credentials and receive JWT."""
    response = client.post("/api/v1/auth/login", json={
        "email": "user1@test.com",
        "password": "CustomerPass123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "user1@test.com"

def test_login_invalid_credentials_generic_error(client):
    """Flow 1: Error does not reveal whether email or password was wrong."""
    response = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@test.com",
        "password": "WrongPassword123"
    })
    assert response.status_code == 401
    detail = response.json()["detail"]
    assert "invalid email or password" in detail.lower()

def test_protected_routes_reject_unauthenticated_calls(client):
    """Flow 1: Protected booking & my bookings APIs independently reject requests without auth."""
    res_my_bookings = client.get("/api/v1/bookings/my")
    assert res_my_bookings.status_code == 401

    res_hold = client.post("/api/v1/shows/1/seats/hold", json={"show_id": 1, "seat_numbers": ["A1"]})
    assert res_hold.status_code == 401

def test_admin_api_rejects_customer(client, seeded_data):
    """Flow 7: Normal customers cannot call admin endpoints."""
    # Log in as customer
    login_res = client.post("/api/v1/auth/login", json={
        "email": "user1@test.com",
        "password": "CustomerPass123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to call admin movie creation
    admin_res = client.post("/api/v1/admin/movies", json={
        "title": "Hacker Movie",
        "language": "English",
        "duration_mins": 90,
        "certification": "U"
    }, headers=headers)
    assert admin_res.status_code == 403
    assert "admin" in admin_res.json()["detail"].lower()
