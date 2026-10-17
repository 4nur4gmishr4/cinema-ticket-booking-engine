export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

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

export interface Show {
  id: number;
  movie_id: number;
  screen_name: string;
  start_time: string;
  end_time: string;
  ticket_price: number;
  available_seats: number;
  movie?: Movie;
}

export interface ShowsByDateGroup {
  date: string;
  display_date: string;
  shows: Show[];
}

export type SeatStatus = 'AVAILABLE' | 'HELD_BY_ME' | 'HELD_BY_OTHER' | 'BOOKED';

export interface SeatOut {
  seat_number: string;
  row: string;
  col: number;
  status: SeatStatus;
  price: number;
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

