# Yozigo Cinema — Movie Ticket Booking Web Application

Full-stack movie ticket booking web application developed for the Yozigo Full-Stack Developer Intern technical assessment.

Built with React 19, TypeScript, and Vite on the frontend, Python, FastAPI, and SQLAlchemy on the backend, and an ACID-compliant SQLite relational database with Write-Ahead Logging (WAL) and foreign keys enabled.

---

## 1. Finished Flows & Project Status

### Implementation Checklist

| Flow | Category | Status | Details |
| :--- | :--- | :---: | :--- |
| **Flow 1: Sign Up, Log In, and Log Out** | Mandatory | **Complete** | Email + password auth, bcrypt password hashing, JWT tokens, customer and admin roles, protected endpoints. Invalid login returns a generic error without exposing whether email or password was wrong. |
| **Flow 2: Browse Movies and Shows** | Mandatory | **Complete** | Movies catalog with title, theatrical standard 2:3 posters, certification (U, UA, A), language, duration; upcoming shows grouped by date with start time, ticket price, and live available seat counts. Past shows are excluded. |
| **Flow 3: View the Seat Map** | Mandatory | **Complete** | Backend-driven 80-seat layout (8 rows A–H × 10 seats) with "Screen this way" curved marker. Four distinct states: Available, Held by You, Held by another user, and Booked. Booked and held seats cannot be clicked. Refresh shows latest backend state. |
| **Flow 4: Select and Hold Seats** | Mandatory | **Complete** | 1 to 6 seat selection (7th seat blocked with message), displays selected seat IDs and total price. 5-minute atomic seat hold with countdown timer. Exact conflicting seat reported on collision; expired holds release seats automatically. |
| **Flow 5: Simulated Payment & Confirmation** | Mandatory | **Complete** | Simulated payment step with two explicit test outcomes: **Payment Success** (locks seats, confirms booking, issues booking reference) and **Payment Failure** (preserves remaining hold timer for retries). Double-booking prevented at database level. |
| **Flow 6: My Bookings** | Mandatory | **Complete** | Dedicated page listing upcoming bookings first, followed by past bookings. Displays booking reference ID, movie title, date, time, seat badges, amount, and status. Data ownership strictly enforced (customers cannot access bookings belonging to others). |
| **Flow 7: Admin: Add Movies and Shows** | Mandatory | **Complete** | Pre-seeded admin account; public sign-up cannot create admin accounts. Protected admin API/UI. Admin can create/edit/delete movies and schedule shows with screen overlap validation. Deleting shows with existing bookings is blocked. |
| **Flow 8: Cancel a Booking** | Bonus | **Complete** | Customers can cancel eligible bookings up to 2 hours before showtime. Seats are released immediately and status updates to Cancelled. Cancellation within 2 hours or for past shows is rejected. |
| **Flow 9: Admin: See Bookings per Show** | Bonus | **Complete** | Admin view per show: seats booked out of 80, occupancy percentage, total revenue collected, customer booking list (ID, customer name, seats, booking timestamp), and admin seat map. Includes a **Cinema Master Ledger** overview of all cinema bookings. |
| **Flow 10: Live Seat Updates & Multi-Tab Sync** | Bonus | **Complete** | Instant multi-tab synchronization using **`BroadcastChannel`** (`yozigo_seat_channel`) and `StorageEvent` triggers, paired with 3-second non-blocking live polling. Seat holds and bookings from concurrent sessions reflect dynamically without page reload. |

### Anything That Does Not Work Yet

**None.** All mandatory flows (Flows 1–7) and all bonus flows (Flows 8–10) are fully implemented, verified, and covered by automated backend tests.

---

## 2. Test Login Credentials

The database comes pre-seeded with customer and admin accounts for immediate testing:

| Role | Header Name | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | `Alex Mercer` | `customer@yozigo.com` | `customer123` | Browse catalog, select seats, 5-min holds, simulated payments, view & cancel own bookings |
| **Admin** | `Cinema Admin` | `admin@yozigo.com` | `admin123` | Create/edit/delete movies, schedule shows with overlap validation, view Master Ledger & per-show occupancy/revenue |

*(The auth modal also includes convenient 1-click quick-fill buttons for both accounts for instant evaluation).*

> [!NOTE]
> **Pre-Configured Test Bookings for Immediate Evaluation:**  
> To provide a lively, fully functional experience on first launch, the `customer@yozigo.com` account comes pre-configured with active confirmed bookings in the database (*The Dark Knight*, *3 Idiots*, and *Interstellar*). This enables immediate testing of **Flow 6 (My Bookings)**, **Flow 8 (Bonus: Cancel a Booking)**, **Flow 3 (Seat Map booked state)**, and **Flow 9 (Admin Occupancy & Revenue)** without requiring manual pre-booking. Evaluators can still book new seats at any time.

---

## 3. Key Technical & Architectural Decisions

1. **FastAPI (Python Backend):**  
   FastAPI was chosen for its asynchronous execution speed, type safety through Pydantic v2 schemas that match frontend TypeScript interfaces, automatic interactive Swagger UI documentation at `/docs`, and rapid testability with `pytest`.
2. **SQLite WAL Mode & Relational ACID Storage:**  
   The application uses an ACID-compliant relational SQL architecture configured with `PRAGMA journal_mode=WAL` (Write-Ahead Logging) and `PRAGMA foreign_keys=ON`. WAL mode allows concurrent readers without blocking writers, ensuring high-throughput read operations during seat browsing while maintaining atomic writes.
3. **Composite Unique Constraints for Double-Booking Prevention:**  
   Double-booking prevention is enforced at the database layer using composite unique constraints: `UniqueConstraint("show_id", "seat_number")` on both `seat_holds` and `booking_seats`. Every reservation runs within an isolated database transaction (`db.begin()`). If two concurrent requests target the same seat, SQLite guarantees exactly one succeeds and the other immediately throws an integrity violation resulting in an HTTP `409 Conflict` with the conflicting seat name.
4. **Live Seat Updates & Cross-Tab Synchronization (Flow 10):**  
   - **`BroadcastChannel` API**: When a user holds, releases, or books seats in one tab, a lightweight event is broadcast locally across all open tabs, triggering instantaneous UI re-sync within 5 milliseconds.
   - **Multi-State Seat Distinction**:
     - `AVAILABLE`: Soft mint green, selectable.
     - `HELD_BY_ME`: Amber with checkmark, synchronized countdown timer, and "Proceed to Pay" CTA across all tabs of the holding user.
     - `HELD_BY_OTHER`: Locked burgundy with lock icon, unclickable for all other users.
     - `BOOKED`: Charcoal gray with X icon, unclickable.
   - **3-Second Background Polling**: Ensures users across different browsers, devices, or incognito sessions stay synchronized without WebSocket disconnection overhead.

---

## 4. Database Design

### Entity Relationship Diagram

```
+-----------------------+                 +---------------------------+
|         USERS         |                 |          MOVIES           |
+-----------------------+                 +---------------------------+
| id (PK, Integer)      |                 | id (PK, Integer)          |
| name (String)         |                 | title (String)            |
| email (String, UNIQUE)|                 | description (Text)        |
| hashed_password (Str) |                 | poster_url (String)       |
| role ('customer'|admin|                 | language (String)         |
| created_at (DateTime) |                 | duration_mins (Integer)   |
+-----------+-----------+                 | certification ('U'|'UA'|'A|
            |                             | genre (String)            |
            | 1:N                         | release_date (String)     |
            |                             +-------------+-------------+
            |                                           | 1:N
            |             +-----------------------------+
            |             |
            v             v
+-----------------------------------+
|               SHOWS               |
+-----------------------------------+
| id (PK, Integer)                  |
| movie_id (FK -> movies.id)        |
| screen_name (String, 'Screen 1')  |
| start_time (DateTime)             |
| end_time (DateTime)               |
| ticket_price (Float)              |
| created_at (DateTime)             |
+-----------+-------------------+---+
            |                   |
1:N holds   |                   | 1:N bookings
            v                   v
+-------------------------------+   +------------------------------------+
|          SEAT_HOLDS           |   |              BOOKINGS              |
+-------------------------------+   +------------------------------------+
| id (PK, Integer)              |   | id (PK, Integer)                   |
| show_id (FK -> shows.id)      |   | booking_reference (String, UNIQUE) |
| user_id (FK -> users.id)      |   | user_id (FK -> users.id)           |
| seat_number (String, 'A1'-'H10|   | show_id (FK -> shows.id)           |
| hold_token (String)           |   | total_amount (Float)               |
| expires_at (DateTime)         |   | seat_summary (String, 'C4, C5')    |
| created_at (DateTime)         |   | status ('CONFIRMED'|'CANCELLED')   |
+-------------------------------+   | payment_status ('SUCCESS'|'FAILED')|
* UNIQUE (show_id, seat_number)     | created_at (DateTime)              |
                                    +-----------------+------------------+
                                                      | 1:N
                                                      v
                                    +------------------------------------+
                                    |           BOOKING_SEATS            |
                                    +------------------------------------+
                                    | id (PK, Integer)                   |
                                    | booking_id (FK -> bookings.id)     |
                                    | show_id (FK -> shows.id)           |
                                    | seat_number (String)               |
                                    +------------------------------------+
                                    * UNIQUE (show_id, seat_number)
```

### Table Specifications

- **`users`**: Stores customer (`Alex Mercer`) and admin (`Cinema Admin`) records. Passwords encrypted with bcrypt.
- **`movies`**: Stores movie catalog entries with theatrical 2:3 aspect ratio posters, certifications, duration, and genres.
- **`shows`**: 288 shows scheduled on Screen 1 with start time, end time, and ticket prices. Enforces overlap restrictions.
- **`seats`**: 80 physical seats categorized into RECLINER (Row A), PRIME (Rows B–D), and CLASSIC (Rows E–H).
- **`seat_holds`**: Tracks atomic 5-minute reservations. Auto-cleaned on expiry.
- **`bookings`**: Stores confirmed ticket bookings with unique booking reference, user ID, show ID, total price, and status (`CONFIRMED` or `CANCELLED`).
- **`booking_seats`**: Explicit seat-level mapping for confirmed bookings with composite unique constraints.

---

## 5. Local Setup & Running Instructions

### Prerequisites
- **Python 3.10+** (tested on Python 3.10 through 3.14)
- **Node.js 18+** & **npm**

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed database with movies, shows, and test users
python seed.py

# Start FastAPI server on port 8001
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

- API Base URL: `http://127.0.0.1:8001`
- Interactive Swagger Docs: `http://127.0.0.1:8001/docs`

### 2. Run Automated Backend Tests

In the `backend` directory with the virtual environment active:

```bash
# Run unit & concurrency integration tests
python -m pytest -v tests
```

### 3. Frontend Setup

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

- Web Application: `http://localhost:5173`

---

## 6. Pre-Configured Test Bookings & Ledger State

For immediate verification of the system without requiring manual setup:

1. **Customer View (`customer@yozigo.com` / `customer123`):**
   - **Upcoming Confirmed Reservations (6 Bookings):**
     - *The Dark Knight* (Show 1): Seats **B3, B4** (`BK-522AD352`)
     - *Interstellar* (Show 17): Seats **C5, C6** (`BK-YOZ-IN03`)
     - *3 Idiots* (Show 97): 8 Seats **A1–A8** across 4 vouchers (`BK-5C831CDE`, `BK-CFEE429D`, `BK-F3DE7405`, `BK-3D6FEF04`)
   - **Past / Cancelled Reservations (3 Bookings):**
     - *The Dark Knight* (Show 1): `BK-000001` (D4, D5)
     - *3 Idiots* (Show 97): `BK-B409441D` (A3, A4)
     - *Dangal* (Show 113): `BK-0814BA0D` (F3, F4)
2. **Admin View (`admin@yozigo.com` / `admin123`):**
   - Header badge displays **`Cinema Admin`**.
   - **Show Occupancy Dropdown**: Defaults to **All Shows — Cinema Master Ledger (Overview)**.
   - Aggregate statistics:
     - Total Bookings: **9**
     - Confirmed: **6**
     - Cancelled: **3**
     - Total Booked Seats: **12**
     - Total Gross Revenue: **₹2,640.00**
     - Total Shows: **288**
   - Per-show occupancy inspection matching 100% of seats between admin and customer perspectives.

---

## 7. Production Deployment Guide

The application is structured for independent, zero-friction cloud deployment. The frontend and backend can be hosted on separate cloud platforms (e.g., Vercel + Render) or together via Docker.

### Option A: Cloud Split Deployment (Recommended)

#### 1. Backend Deployment (Render / Railway)

1. **Create Service**:
   - In [Render](https://render.com) or [Railway](https://railway.app), create a new **Web Service** connected to this GitHub repository.
2. **Configure Settings**:
   - **Root Directory**: `backend`
   - **Environment / Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables**:
   - `DATABASE_URL`: `sqlite:///./cinema.db` (or your PostgreSQL connection string)
   - `SECRET_KEY`: `<generated-secure-random-key>`
   - `PORT`: `8001` (Render injects `$PORT` automatically)
4. **Deploy**:
   - Once deployed, copy your assigned public URL (e.g., `https://cinema-api.onrender.com`).

#### 2. Frontend Deployment (Vercel / Netlify)

1. **Import Project**:
   - In [Vercel](https://vercel.com) or [Netlify](https://netlify.com), import this repository.
2. **Configure Settings**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://cinema-api.onrender.com` *(your backend URL)*
4. **Deploy**:
   - Your frontend will build and connect directly to the backend with CORS pre-configured.

---

### Option B: Containerized Deployment (Docker Compose)

To run the complete production stack on any VPS, cloud VM, or local environment with a single command:

```bash
# Clone the repository
git clone https://github.com/4nur4gmishr4/cinema-ticket-booking-engine.git
cd cinema-ticket-booking-engine

# Build and start both containers in the background
docker compose up -d --build
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:8001`
- **API Swagger Documentation**: `http://localhost:8001/docs`
- **Persistent Volume**: Database is preserved across restarts in `./backend/cinema.db`.

To stop the services:
```bash
docker compose down
```

