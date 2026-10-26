// --- TypeScript Definitions ---
// Purpose: Shared data types matching FastAPI backend Pydantic schemas.

// User profile interface
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';     // Access control: customer or cinema admin
  created_at: string;
}

// Authentication response returned upon login
export interface AuthResponse {
  access_token: string;           // JWT bearer token string
  token_type: string;             // Always "bearer"
  user: User;                     // Authenticated user profile
}

// Movie record
export interface Movie {
  id: number;
  title: string;
  description?: string;
  poster_url?: string;
  language: string;
  duration_mins: number;
  certification: 'U' | 'UA' | 'A';
  genre?: string;
  release_date?: string;
  created_at?: string;
}

// Show screening schedule
export interface Show {
  id: number;
  movie_id: number;
  screen_name: string;            // E.g. "Screen 1"
  start_time: string;             // ISO-8601 UTC timestamp
  end_time: string;               // ISO-8601 UTC timestamp (start_time + duration + 15m buffer)
  ticket_price: number;           // Price in INR (₹)
  available_seats: number;        // Total free seats out of 80
  movie?: Movie;
}

// Grouped showtimes for a specific date
export interface ShowsByDateGroup {
  date: string;                   // E.g. "2026-10-26"
  display_date: string;           // E.g. "Mon, Oct 26"
  shows: Show[];
}

// Seat reservation status in auditorium map
export type SeatStatus = 'AVAILABLE' | 'HELD_BY_ME' | 'HELD_BY_OTHER' | 'BOOKED';

// Individual seat details in the 80-seat grid
export interface SeatOut {
  seat_number: string;            // E.g. "A1", "H10"
  row: string;                    // "A" through "H"
  col: number;                    // 1 through 10
  status: SeatStatus;             // Current availability
  price: number;                  // Ticket price in INR
}

export interface SeatMapResponse {
  show_id: number;
  movie_id: number;
  movie_title: string;
  screen_name: string;
  start_time: string;
  ticket_price: number;
  total_seats: number;
  available_count: number;
  held_count: number;
  booked_count: number;
  seats: SeatOut[];
  current_hold_token?: string | null;
  hold_remaining_seconds?: number | null;
}

export interface HoldSeatsResponse {
  hold_token: string;
  show_id: number;
  seat_numbers: string[];
  expires_at: string;
  remaining_seconds: number;
  total_amount: number;
  message: string;
}

export interface BookingOut {
  id: number;
  booking_reference: string;
  show_id: number;
  movie_title: string;
  movie_poster?: string;
  language: string;
  screen_name: string;
  start_time: string;
  seats: string[];
  total_amount: number;
  status: 'CONFIRMED' | 'CANCELLED';
  created_at: string;
  can_cancel: boolean;
}

export interface CustomerBookingsResponse {
  upcoming: BookingOut[];
  past: BookingOut[];
}

export interface AdminBookingOut {
  booking_id: number;
  booking_reference: string;
  show_time?: string;
  customer_name: string;
  customer_email: string;
  seats: string[];
  total_amount: number;
  status: string;
  created_at: string;
}

export interface AdminOccupancyResponse {
  show_id: number;
  movie_id: number;
  movie_title: string;
  start_time: string;
  ticket_price: number;
  total_seats: number;
  booked_count: number;
  occupancy_percentage: number;
  total_revenue: number;
  bookings: AdminBookingOut[];
  seat_map: SeatOut[];
}

export interface AdminGlobalBookingOut {
  booking_id: number;
  booking_reference: string;
  movie_id: number;
  movie_title: string;
  screen_name: string;
  show_id: number;
  show_time: string;
  customer_name: string;
  customer_email: string;
  seats: string[];
  total_amount: number;
  status: string;
  created_at: string;
}

export interface AdminCinemaOverviewResponse {
  total_bookings_count: number;
  confirmed_bookings_count: number;
  cancelled_bookings_count: number;
  total_booked_seats: number;
  total_gross_revenue: number;
  active_shows_count: number;
  bookings: AdminGlobalBookingOut[];
}

