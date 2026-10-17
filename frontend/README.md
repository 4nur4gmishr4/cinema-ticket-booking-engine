# Yozigo Cinema — Frontend Web Application

The frontend client for the Yozigo Cinema movie ticket booking system, built with React, TypeScript, and Vite.

---

## 1. Architecture & Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Vanilla CSS design system tokens combined with utility classes
- **Icons**: Lucide React + custom Google Material / Netflix / District inspired SVG vectors
- **Theme**: Instant toggle between Dark Mode and Light Mode with persistent local storage
- **State Management & Synchronization**:
  - React Hooks (`useState`, `useEffect`, `useRef`, `useCallback`)
  - Cross-Tab Live Synchronization via **`BroadcastChannel`** (`yozigo_seat_channel`) and `StorageEvent` triggers
  - Non-blocking 3-second live polling fallback for seat availability across concurrent sessions

---

## 2. Key Pages & Components

1. **`Navbar.tsx`**:
   - Google pill-shaped responsive navigation buttons
   - Dynamic user badge displaying **Cinema Admin** for administrators and customer full name for regular users
   - Quick-access links: Movies Catalog, My Bookings, Admin Panel (role-gated), and Theme Toggle
   - Profile action sheet with Cinema Legal & Policy modals (Terms, Privacy, Refund, About)

2. **`Catalog.tsx`**:
   - Netflix/District inspired movie billboard hero carousel with 5000ms duration progress bar indicators
   - Theatrical standard (2:3 aspect ratio, 780×1170) official movie posters
   - Movie detail modal with metadata badges (Certification, Language, Duration, 4K Laser Atmos, 80 Seats)
   - Date tabs and showtime selection with live seat availability counters

3. **`SeatBookingPage.tsx`**:
   - 80-seat auditorium layout structured into 3 Indian Theater Standard tiers:
     - **RECLINER** (Row A — Luxury Plush, ₹220)
     - **PRIME** (Rows B–D — Optimal Eye-Level, ₹220)
     - **CLASSIC** (Rows E–H — Standard View, ₹220)
   - Center aisle walkway dividing seats 1–5 and 6–10
   - Multi-state seat renderer:
     - `AVAILABLE`: Soft mint green with hover scale
     - `HELD_BY_ME`: Amber selection with checkmark, hold countdown timer, and "Proceed to Pay" button
     - `HELD_BY_OTHER`: Locked burgundy with lock icon and disabled cursor
     - `BOOKED`: Charcoal gray with X icon and disabled cursor
   - Immediate cross-tab synchronization: holding a seat in one tab updates all other tabs instantaneously without page refresh

4. **`PaymentModal.tsx`**:
   - Simulated checkout modal displaying active hold countdown timer, seat tags, and price breakdown
   - Two explicit outcome buttons: **Simulate Payment Success** (confirms booking) and **Simulate Payment Failure** (preserves hold timer for retry)

5. **`MyBookingsPage.tsx`**:
   - Displays confirmed ticket vouchers with barcode simulation, booking reference IDs (`BK-...`), showtime, and seat badges
   - Segregates **Upcoming Confirmed Reservations** from **Past / Concluded / Cancelled Bookings**
   - Actionable 1-click **Cancel Booking** button (available up to 2 hours before showtime)

6. **`AdminPage.tsx`**:
   - Movie management: add new movies, edit metadata, delete movies (blocked if active bookings exist)
   - Show management: schedule shows with screen overlap conflict detection
   - **Show Occupancy & Cinema Master Ledger**:
     - Global Cinema Overview displaying cinema-wide statistics (total bookings, confirmed, cancelled, gross revenue)
     - Per-show occupancy inspection with seat map and customer ledger

---

## 3. Development & Build Commands

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Type-check and production build
npm run build

# Preview production build locally
npm run preview
```
