from datetime import datetime, timedelta

def test_browse_movies_and_shows(client, seeded_data):
    """Flow 2: Browse movies and upcoming shows grouped by date."""
    # List movies
    res = client.get("/api/v1/movies")
    assert res.status_code == 200
    movies = res.json()
    assert len(movies) >= 1
    movie = movies[0]
    assert "title" in movie
    assert "language" in movie
    assert "duration_mins" in movie
    assert "certification" in movie

    # Movie shows grouped by date
    show_res = client.get(f"/api/v1/movies/{movie['id']}/shows")
    assert show_res.status_code == 200
    groups = show_res.json()
    assert len(groups) >= 1
    first_group = groups[0]
    assert "date" in first_group
    assert "shows" in first_group
    assert len(first_group["shows"]) >= 1
    show = first_group["shows"][0]
    assert "available_seats" in show
    assert show["available_seats"] <= 80

def test_admin_schedule_overlap_rejection(client, seeded_data):
    """Flow 7: Shows cannot overlap on the same screen."""
    # Admin login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@test.com",
        "password": "AdminPass123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    movie_id = seeded_data["movie"].id
    existing_show = seeded_data["show"]

    # Try creating an overlapping show (starting 30 mins after existing show starts)
    overlap_start = existing_show.start_time + timedelta(minutes=30)
    overlap_res = client.post("/api/v1/admin/shows", json={
        "movie_id": movie_id,
        "screen_name": "Screen 1",
        "start_time": overlap_start.isoformat(),
        "ticket_price": 200.0
    }, headers=headers)

    assert overlap_res.status_code == 400
    assert "conflict" in overlap_res.json()["detail"].lower() or "overlap" in overlap_res.json()["detail"].lower()
