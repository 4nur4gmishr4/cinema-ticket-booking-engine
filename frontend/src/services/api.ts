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


const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

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
  // --- Auth (Flow 1) ---
  register: async (name: string, email: string, password: string): Promise<User> => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse<User>(res);
  },

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

  getProfile: async (): Promise<User> => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(res);
  },

  logout: () => {
    localStorage.removeItem('cinema_token');
    localStorage.removeItem('cinema_user');
  },

  // --- Movies & Shows (Flow 2) ---
  getMovies: async (): Promise<Movie[]> => {
    const res = await fetch(`${BASE_URL}/movies`);
    return handleResponse<Movie[]>(res);
  },

  getMovie: async (movieId: number): Promise<Movie> => {
    const res = await fetch(`${BASE_URL}/movies/${movieId}`);
    return handleResponse<Movie>(res);
  },

  getMovieShows: async (movieId: number): Promise<ShowsByDateGroup[]> => {
    const res = await fetch(`${BASE_URL}/movies/${movieId}/shows`);
    return handleResponse<ShowsByDateGroup[]>(res);
  },

  getShows: async (): Promise<Show[]> => {
    const res = await fetch(`${BASE_URL}/shows`);
    return handleResponse<Show[]>(res);
  },

  getShow: async (showId: number): Promise<Show> => {
    const res = await fetch(`${BASE_URL}/shows/${showId}`);
    return handleResponse<Show>(res);
  },

  // --- Seats & Holds (Flow 3 & 4) ---
  getSeatMap: async (showId: number): Promise<SeatMapResponse> => {
    const res = await fetch(`${BASE_URL}/shows/${showId}/seats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<SeatMapResponse>(res);
  },

  holdSeats: async (showId: number, seatNumbers: string[]): Promise<HoldSeatsResponse> => {
    const res = await fetch(`${BASE_URL}/shows/${showId}/seats/hold`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ show_id: showId, seat_numbers: seatNumbers }),
    });
    return handleResponse<HoldSeatsResponse>(res);
  },

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

  // --- Bookings & Payments (Flow 5, 6, 8) ---
  simulatePayment: async (holdToken: string, outcome: 'SUCCESS' | 'FAILURE'): Promise<BookingOut> => {
    const res = await fetch(`${BASE_URL}/bookings/pay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ hold_token: holdToken, outcome }),
    });
    return handleResponse<BookingOut>(res);
  },

  getMyBookings: async (): Promise<CustomerBookingsResponse> => {
    const res = await fetch(`${BASE_URL}/bookings/my`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<CustomerBookingsResponse>(res);
  },

  getBookingById: async (bookingId: number): Promise<BookingOut> => {
    const res = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<BookingOut>(res);
  },

  cancelBooking: async (bookingId: number): Promise<BookingOut> => {
    const res = await fetch(`${BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<BookingOut>(res);
  },

  // --- Admin Operations (Flow 7 & 9) ---
  adminCreateMovie: async (movie: Partial<Movie>): Promise<Movie> => {
    const res = await fetch(`${BASE_URL}/admin/movies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(movie),
    });
    return handleResponse<Movie>(res);
  },

  adminUpdateMovie: async (movieId: number, movie: Partial<Movie>): Promise<Movie> => {
    const res = await fetch(`${BASE_URL}/admin/movies/${movieId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(movie),
    });
    return handleResponse<Movie>(res);
  },

  adminDeleteMovie: async (movieId: number): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/admin/movies/${movieId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  adminCreateShow: async (payload: { movie_id: number; screen_name?: string; start_time: string; ticket_price: number }): Promise<Show> => {
    const res = await fetch(`${BASE_URL}/admin/shows`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Show>(res);
  },

  adminDeleteShow: async (showId: number): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/admin/shows/${showId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  adminGetShowOccupancy: async (showId: number): Promise<AdminOccupancyResponse> => {
    const res = await fetch(`${BASE_URL}/admin/shows/${showId}/occupancy`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AdminOccupancyResponse>(res);
  },

  adminGetCinemaOverview: async (): Promise<AdminCinemaOverviewResponse> => {
    const res = await fetch(`${BASE_URL}/admin/overview`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AdminCinemaOverviewResponse>(res);
  },
};

