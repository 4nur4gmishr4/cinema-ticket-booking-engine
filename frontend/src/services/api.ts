import type {
  AuthResponse,
  User,
  Movie,
  ShowsByDateGroup,
  Show,
  SeatMapResponse,
  HoldSeatsResponse,
  BookingOut,
  CustomerBookingsResponse,
  AdminOccupancyResponse,
  AdminCinemaOverviewResponse
} from '../types';


// --- API Service Layer ---
// Purpose: Centralized HTTP client using browser native fetch.
// It connects the React frontend to the FastAPI backend at /api/v1.

// Determine API base URL: Uses environment variable VITE_API_BASE_URL if set,
// otherwise defaults to '/api/v1' (proxied by Vite in local development).
const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

// Helper: Attaches the JWT Bearer token from localStorage to the request headers.
// If user is not logged in, it sends standard JSON Content-Type headers without Authorization.
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('cinema_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Helper: Processes HTTP responses from backend.
// - If 401 Unauthorized: Clears stale tokens from localStorage.
// - If error (non-2xx): Extracts detail error message and throws an Error.
// - If success (2xx): Parses and returns JSON body.
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('cinema_token');
      localStorage.removeItem('cinema_user');
    }
    let errorDetail = 'An unexpected error occurred.';
    try {
      const data = await res.json();
      errorDetail = data.detail || errorDetail;
    } catch {
      errorDetail = res.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // --- Authentication APIs (Flow 1) ---
  // Registers a new user account with name, email, and password
  register: async (name: string, email: string, password: string): Promise<User> => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse<User>(res);
  },

  // Logs in the user, saves JWT token and user info into localStorage
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse<AuthResponse>(res);
    localStorage.setItem('cinema_token', data.access_token);
    localStorage.setItem('cinema_user', JSON.stringify(data.user));
    return data;
  },

  // Fetches current authenticated user profile using stored JWT token
  getProfile: async (): Promise<User> => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(res);
  },

  // Logs out user by wiping credentials from browser localStorage
  logout: () => {
    localStorage.removeItem('cinema_token');
    localStorage.removeItem('cinema_user');
  },

  // --- Movies & Shows APIs (Flow 2) ---
  // Retrieves the full catalog of active movies
  getMovies: async (): Promise<Movie[]> => {
    const res = await fetch(`${BASE_URL}/movies`);
    return handleResponse<Movie[]>(res);
  },

  // Retrieves details for a specific movie by ID
  getMovie: async (movieId: number): Promise<Movie> => {
    const res = await fetch(`${BASE_URL}/movies/${movieId}`);
    return handleResponse<Movie>(res);
  },

  // Retrieves upcoming showtimes for a movie, grouped by calendar date
  getMovieShows: async (movieId: number): Promise<ShowsByDateGroup[]> => {
    const res = await fetch(`${BASE_URL}/movies/${movieId}/shows`);
    return handleResponse<ShowsByDateGroup[]>(res);
  },

  // Retrieves all shows across all movies
  getShows: async (): Promise<Show[]> => {
    const res = await fetch(`${BASE_URL}/shows`);
    return handleResponse<Show[]>(res);
  },

  // Retrieves metadata for a single show by its ID
  getShow: async (showId: number): Promise<Show> => {
    const res = await fetch(`${BASE_URL}/shows/${showId}`);
    return handleResponse<Show>(res);
  },

  // --- Seats & Holds APIs (Flow 3, 4 & Concurrency) ---
  // Fetches the 80-seat map with live status (AVAILABLE, BOOKED, HELD_BY_ME, HELD_BY_OTHER)
  getSeatMap: async (showId: number): Promise<SeatMapResponse> => {
    const res = await fetch(`${BASE_URL}/shows/${showId}/seats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<SeatMapResponse>(res);
  },

  // Places an atomic 5-minute hold on selected seats (returns hold_token and timer)
  holdSeats: async (showId: number, seatNumbers: string[]): Promise<HoldSeatsResponse> => {
    const res = await fetch(`${BASE_URL}/shows/${showId}/seats/hold`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ show_id: showId, seat_numbers: seatNumbers }),
    });
    return handleResponse<HoldSeatsResponse>(res);
  },

  // Releases an active hold so other customers can book those seats immediately
  releaseHold: async (showId: number, holdToken?: string): Promise<{ message: string }> => {
    const url = holdToken
      ? `${BASE_URL}/shows/${showId}/seats/hold?hold_token=${encodeURIComponent(holdToken)}`
      : `${BASE_URL}/shows/${showId}/seats/hold`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // --- Bookings & Payments APIs (Flow 5, 6 & 8) ---
  // Simulates payment transaction: SUCCESS commits booking; FAILURE cancels and retains hold
  simulatePayment: async (holdToken: string, outcome: 'SUCCESS' | 'FAILURE'): Promise<BookingOut> => {
    const res = await fetch(`${BASE_URL}/bookings/pay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ hold_token: holdToken, outcome }),
    });
    return handleResponse<BookingOut>(res);
  },

  // Retrieves all confirmed, cancelled, and past bookings for the logged-in customer
  getMyBookings: async (): Promise<CustomerBookingsResponse> => {
    const res = await fetch(`${BASE_URL}/bookings/my`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<CustomerBookingsResponse>(res);
  },

  // Retrieves a single booking receipt by its booking ID
  getBookingById: async (bookingId: number): Promise<BookingOut> => {
    const res = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<BookingOut>(res);
  },

  // Cancels a booking, releases seats back to auditorium, and issues simulated refund
  cancelBooking: async (bookingId: number): Promise<BookingOut> => {
    const res = await fetch(`${BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<BookingOut>(res);
  },

  // --- Admin Operations APIs (Flow 7 & 9) ---
  // Admin: Adds a new movie to cinema roster
  adminCreateMovie: async (movie: Partial<Movie>): Promise<Movie> => {
    const res = await fetch(`${BASE_URL}/admin/movies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(movie),
    });
    return handleResponse<Movie>(res);
  },

  // Admin: Updates existing movie details (title, genre, poster, duration)
  adminUpdateMovie: async (movieId: number, movie: Partial<Movie>): Promise<Movie> => {
    const res = await fetch(`${BASE_URL}/admin/movies/${movieId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(movie),
    });
    return handleResponse<Movie>(res);
  },

  // Admin: Removes a movie and associated shows
  adminDeleteMovie: async (movieId: number): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/admin/movies/${movieId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Admin: Schedules a new showtime for a movie
  adminCreateShow: async (payload: { movie_id: number; screen_name?: string; start_time: string; ticket_price: number }): Promise<Show> => {
    const res = await fetch(`${BASE_URL}/admin/shows`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Show>(res);
  },

  // Admin: Cancels / deletes a scheduled show
  adminDeleteShow: async (showId: number): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/admin/shows/${showId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Admin: Audits real-time occupancy and revenue for a specific show
  adminGetShowOccupancy: async (showId: number): Promise<AdminOccupancyResponse> => {
    const res = await fetch(`${BASE_URL}/admin/shows/${showId}/occupancy`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AdminOccupancyResponse>(res);
  },

  // Admin: Audits cinema-wide ledger (total shows, total revenue, occupancy rate)
  adminGetCinemaOverview: async (): Promise<AdminCinemaOverviewResponse> => {
    const res = await fetch(`${BASE_URL}/admin/overview`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AdminCinemaOverviewResponse>(res);
  },
};

