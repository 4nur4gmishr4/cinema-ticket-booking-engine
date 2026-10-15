import concurrent.futures
from fastapi.testclient import TestClient
from app.main import app

def test_concurrent_hold_same_seat_prevents_double_booking(client, seeded_data):
    """
    CRITICAL ACCEPTANCE TEST:
    Proves that when two users try to hold the same seat at the same moment,
    exactly ONE succeeds and the other receives a 409 Conflict error.
    """
    # 1. Login user 1
    res1 = client.post("/api/v1/auth/login", json={
        "email": "user1@test.com",
        "password": "CustomerPass123"
    })
    token1 = res1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # 2. Login user 2
    res2 = client.post("/api/v1/auth/login", json={
        "email": "user2@test.com",
        "password": "CustomerPass123"
    })
    token2 = res2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    show_id = seeded_data["show"].id
    target_seat = "C7"

    # Define hold attempt worker using separate client requests
    def attempt_hold(headers):
        with TestClient(app) as local_client:
            return local_client.post(
                f"/api/v1/shows/{show_id}/seats/hold",
                json={"show_id": show_id, "seat_numbers": [target_seat]},
                headers=headers
            )

    # Fire concurrent requests simultaneously
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        future1 = executor.submit(attempt_hold, headers1)
        future2 = executor.submit(attempt_hold, headers2)

        resp1 = future1.result()
        resp2 = future2.result()

    status_codes = [resp1.status_code, resp2.status_code]

    # Exactly one must succeed (200) and one must be rejected with Conflict (409)
    assert 200 in status_codes, f"Expected one 200 OK, got {status_codes}"
    assert 409 in status_codes, f"Expected one 409 Conflict, got {status_codes}"
    assert status_codes.count(200) == 1, "Only one user may hold the seat"
    assert status_codes.count(409) == 1, "The competing user must receive conflict error"

def test_payment_simulation_success_confirms_booking(client, seeded_data):
    """Flow 5: Payment success confirms booking and books seats."""
    # Login user 1
    res1 = client.post("/api/v1/auth/login", json={
        "email": "user1@test.com",
        "password": "CustomerPass123"
    })
    token1 = res1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    show_id = seeded_data["show"].id
    seat = "B3"

    # Hold seat
    hold_res = client.post(
        f"/api/v1/shows/{show_id}/seats/hold",
        json={"show_id": show_id, "seat_numbers": [seat]},
        headers=headers1
    )
    assert hold_res.status_code == 200
    hold_token = hold_res.json()["hold_token"]

    # Complete payment with outcome SUCCESS
    pay_res = client.post(
        "/api/v1/bookings/pay",
        json={"hold_token": hold_token, "outcome": "SUCCESS"},
        headers=headers1
    )
    assert pay_res.status_code == 200
    booking = pay_res.json()
    assert booking["status"] == "CONFIRMED"
    assert seat in booking["seats"]

    # Verify seat map now reflects BOOKED state
    seat_map_res = client.get(f"/api/v1/shows/{show_id}/seats", headers=headers1)
    seat_data = next(s for s in seat_map_res.json()["seats"] if s["seat_number"] == seat)
    assert seat_data["status"] == "BOOKED"

def test_payment_simulation_failure_preserves_hold(client, seeded_data):
    """Flow 5: Payment failure does not create booking and preserves hold."""
    res1 = client.post("/api/v1/auth/login", json={
        "email": "user1@test.com",
        "password": "CustomerPass123"
    })
    token1 = res1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    show_id = seeded_data["show"].id
    seat = "B4"

    # Hold seat
    hold_res = client.post(
        f"/api/v1/shows/{show_id}/seats/hold",
        json={"show_id": show_id, "seat_numbers": [seat]},
        headers=headers1
    )
    assert hold_res.status_code == 200
    hold_token = hold_res.json()["hold_token"]

    # Simulate payment failure
    fail_res = client.post(
        "/api/v1/bookings/pay",
        json={"hold_token": hold_token, "outcome": "FAILURE"},
        headers=headers1
    )
    assert fail_res.status_code == 402  # Payment required/failed
    assert "payment failed" in fail_res.json()["detail"].lower()

    # Retry with SUCCESS using the same hold token succeeds
    retry_res = client.post(
        "/api/v1/bookings/pay",
        json={"hold_token": hold_token, "outcome": "SUCCESS"},
        headers=headers1
    )
    assert retry_res.status_code == 200
    assert retry_res.json()["status"] == "CONFIRMED"
