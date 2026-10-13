# Database Design — Yozigo Cinema Application

This document outlines the database schema, relational structure, integrity constraints, and concurrency safeguards implemented for the Yozigo Cinema ticket booking system.

---

## 1. Entity Relationship Diagram (ERD)

```
+-----------------------------------+             +-----------------------------------+
|               USERS               |             |              MOVIES               |
+-----------------------------------+             +-----------------------------------+
| id: Integer (PK)                  |             | id: Integer (PK)                  |
| name: String                      |             | title: String                     |
| email: String (Unique, Indexed)   |             | description: Text                 |
| hashed_password: String           |             | poster_url: String                |
| role: String ('customer'|'admin') |             | language: String                  |
| created_at: DateTime              |             | duration_mins: Integer            |
+-----------------+-----------------+             | certification: String ('U'|'UA'|'A)|
                  |                               | genre: String                     |
                  | 1:N                           | release_date: String              |
                  |                               +-----------------+-----------------+
                  |                                                 | 1:N
                  |               +---------------------------------+
                  |               |
                  v               v
+-------------------------------------------------+
|                      SHOWS                      |
+-------------------------------------------------+
| id: Integer (PK)                                |
| movie_id: Integer (FK -> movies.id)             |
| screen_name: String (Default: 'Screen 1')       |
| start_time: DateTime                            |
| end_time: DateTime                              |
| ticket_price: Float                             |
| created_at: DateTime                            |
+------------------------+------------------------+
                         |
           +-------------+-------------+
     1:N   |                           | 1:N
           v                           v
+-------------------------------+   +------------------------------------+
|          SEAT_HOLDS           |   |              BOOKINGS              |
+-------------------------------+   +------------------------------------+
| id: Integer (PK)              |   | id: Integer (PK)                   |
| show_id: Integer (FK)         |   | booking_reference: String (Unique) |
| user_id: Integer (FK)         |   | user_id: Integer (FK)              |
| seat_number: String           |   | show_id: Integer (FK)              |
| hold_token: String            |   | total_amount: Float                |
| expires_at: DateTime          |   | seat_summary: String               |
| created_at: DateTime          |   | status: String ('CONFIRMED'|...)   |
+-------------------------------+   | payment_status: String             |
* Constraint:                       | created_at: DateTime               |
  UNIQUE (show_id, seat_number)     +-----------------+------------------+
                                                      | 1:N
                                                      v
                                    +------------------------------------+
                                    |           BOOKING_SEATS            |
                                    +------------------------------------+
                                    | id: Integer (PK)                   |
                                    | booking_id: Integer (FK)           |
                                    | show_id: Integer (FK)              |
                                    | seat_number: String                |
                                    +------------------------------------+
                                    * Constraint:
                                      UNIQUE (show_id, seat_number)
```

---

## 2. Table Specifications

### 2.1 `users` Table
Stores customer accounts and cinema administration credentials.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Autoincrement | Unique user identifier |
| `name` | String(100) | Not Null | User full name |
| `email` | String(255) | Not Null, Unique, Indexed | User email address (login username) |
| `hashed_password` | String(255) | Not Null | Bcrypt hashed password |
| `role` | String(20) | Not Null, Default: `'customer'` | Role: `'customer'` or `'admin'` |
| `created_at` | DateTime | Not Null, Default: UTC Now | Account creation timestamp |

### 2.2 `movies` Table
Stores movie metadata displayed in the catalog.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Autoincrement | Unique movie identifier |
| `title` | String(255) | Not Null, Indexed | Movie title |
| `description` | Text | Nullable | Plot synopsis or description |
| `poster_url` | String(500) | Nullable | Public URL or path to movie poster |
| `language` | String(50) | Not Null | Primary audio language (e.g., Hindi, English) |
| `duration_mins` | Integer | Not Null | Duration in minutes (used for show scheduling) |
| `certification` | String(10) | Not Null | Film certification: `'U'`, `'UA'`, or `'A'` |
| `genre` | String(100) | Nullable | Primary genres (e.g., Action, Thriller) |
| `release_date` | String(50) | Nullable | Theatrical release date |

### 2.3 `shows` Table
Schedules screenings of movies on Screen 1.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Autoincrement | Unique show identifier |
| `movie_id` | Integer | Not Null, Foreign Key (`movies.id`) | Reference to the movie being screened |
| `screen_name` | String(50) | Not Null, Default: `'Screen 1'` | Auditorium name |
| `start_time` | DateTime | Not Null, Indexed | Show start timestamp (UTC) |
| `end_time` | DateTime | Not Null | Show end timestamp (`start_time + duration_mins`) |
| `ticket_price` | Float | Not Null | Base ticket price in INR |
| `created_at` | DateTime | Not Null, Default: UTC Now | Record creation timestamp |

*Business Constraint:* Shows on the same screen cannot have overlapping time ranges `[start_time, end_time]`. Validated programmatically before insert/update.

### 2.4 `seat_holds` Table
Tracks short-lived (5-minute) seat reservations during the selection and checkout flow.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Autoincrement | Unique hold identifier |
| `show_id` | Integer | Not Null, Foreign Key (`shows.id`) | Target show |
| `user_id` | Integer | Not Null, Foreign Key (`users.id`) | User who reserved the seat |
| `seat_number` | String(10) | Not Null | Seat code (e.g., `'C4'`, `'D10'`) |
| `hold_token` | String(64) | Not Null, Indexed | Unique UUID session token for checkout |
| `expires_at` | DateTime | Not Null, Indexed | Timestamp when the hold expires (created_at + 300s) |
| `created_at` | DateTime | Not Null, Default: UTC Now | Timestamp when the hold was created |

*Integrity Safeguards:*
- `UniqueConstraint("show_id", "seat_number", name="uq_show_seat_hold")`: Guarantees a seat cannot be concurrently held by more than one user for the same show.
- Hold expiration queries filter out any records where `expires_at < utcnow()`.

### 2.5 `bookings` Table
Stores confirmed ticket orders.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Autoincrement | Unique booking identifier |
| `booking_reference` | String(32) | Not Null, Unique, Indexed | Human-readable voucher code (e.g., `'BK-7A9F21'`) |
| `user_id` | Integer | Not Null, Foreign Key (`users.id`) | Customer who made the booking |
| `show_id` | Integer | Not Null, Foreign Key (`shows.id`) | Associated show |
| `total_amount` | Float | Not Null | Total price paid |
| `seat_summary` | String(255) | Not Null | Comma-separated seat codes (e.g., `'C4, C5'`) |
| `status` | String(20) | Not Null, Default: `'CONFIRMED'` | Order status: `'CONFIRMED'` or `'CANCELLED'` |
| `payment_status` | String(20) | Not Null, Default: `'SUCCESS'` | Payment state: `'SUCCESS'` or `'FAILED'` |
| `created_at` | DateTime | Not Null, Default: UTC Now | Booking timestamp |

### 2.6 `booking_seats` Table
Normalizes seat allocations for confirmed bookings to guarantee strict per-seat uniqueness.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Autoincrement | Unique record identifier |
| `booking_id` | Integer | Not Null, Foreign Key (`bookings.id`) | Reference to parent booking |
| `show_id` | Integer | Not Null, Foreign Key (`shows.id`) | Target show |
| `seat_number` | String(10) | Not Null | Allocated seat code (e.g., `'C4'`) |

*Integrity Safeguards:*
- `UniqueConstraint("show_id", "seat_number", name="uq_show_seat_booking")`: Guarantees that a seat cannot be booked more than once for any given show.

---

## 3. Storage Engine & Concurrency Safeguards

### 3.1 SQLite WAL Mode & Relational Integrity
- **Database Engine:** Relational SQL (SQLite via SQLAlchemy ORM).
- **WAL Pragma:** `PRAGMA journal_mode=WAL;` enables Write-Ahead Logging, allowing readers to proceed concurrently without waiting for writers, and writers to complete without blocking readers.
- **Foreign Keys:** `PRAGMA foreign_keys=ON;` enforces relational integrity constraints across users, movies, shows, holds, and bookings.
- **Architecture Note:** Standalone SQL architecture with complete schema ownership, direct connection pooling, and deterministic transactions—avoiding vendor lock-in or client-side latency from BaaS wrappers (e.g. Supabase).

### 3.2 Concurrency Architecture & Double-Booking Prevention

Double-booking prevention is enforced deterministically at the database level:

1. **Transaction Isolation:**  
   Every seat hold and payment confirmation executes within an explicit database transaction (`db.begin()`).
2. **Atomic Hold Allocation:**  
   When a user submits seat selections:
   - Active holds for the show are cleaned of expired entries (`expires_at <= now`).
   - The query checks for existing confirmed seats in `booking_seats` or active unexpired holds in `seat_holds`.
   - If any seat is taken, the transaction aborts and returns an HTTP 409 Conflict detailing the specific conflicting seat.
   - If available, `seat_holds` records are inserted. The composite unique constraint `UNIQUE(show_id, seat_number)` acts as the final concurrency lock if two requests race past the availability check.
3. **Atomic Payment Confirmation:**  
   When payment succeeds:
   - The user's active `hold_token` is verified.
   - A `bookings` record is created.
   - For each held seat, a `booking_seats` record is inserted with `UNIQUE(show_id, seat_number)`. If a conflict occurs, the transaction rolls back.
   - The corresponding `seat_holds` records are deleted.
   - All operations commit atomically.
4. **Automated Concurrency Testing:**  
   Automated multi-threaded concurrency tests (`tests/test_double_booking.py`) simulate two simultaneous threads attempting to hold and book the same seat. Exactly one transaction succeeds (200 OK) while the other receives an HTTP 409 Conflict.
