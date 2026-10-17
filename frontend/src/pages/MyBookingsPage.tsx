import React, { useState, useEffect } from 'react';
import type { CustomerBookingsResponse, BookingOut } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Ticket, Calendar, Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface MyBookingsPageProps {
  onRequireAuth: () => void;
  onBrowseMovies: () => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ onRequireAuth, onBrowseMovies }) => {
  const { user } = useAuth();
  const [bookingsData, setBookingsData] = useState<CustomerBookingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyBookings();
      setBookingsData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking? This will immediately free your seats.')) {
      return;
    }

    setCancellingId(bookingId);
    setActionMessage(null);
    try {
      await api.cancelBooking(bookingId);
      setActionMessage({
        text: 'Booking successfully cancelled. Seats have been released.',
        type: 'success',
      });
      await loadBookings();
    } catch (err: any) {
      setActionMessage({
        text: err.message || 'Failed to cancel booking.',
        type: 'error',
      });
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <Ticket className="w-12 h-12 text-[#89857D] mb-3" />
        <h2 className="text-xl font-bold text-[#F4EFE6]">Authentication Required</h2>
        <p className="text-xs text-[#B9B2A8] mt-1">
          Please log in to view your tickets and booking history.
        </p>
        <button
          onClick={onRequireAuth}
          className="mt-4 px-5 py-2.5 rounded-xl bg-[#F0A451] text-[#17120C] font-bold text-xs"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  return (
    <div id="my-bookings" className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 flex flex-col gap-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#34332F] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-[#F0A451] uppercase tracking-wider">Customer Portal</span>
          <h1 className="text-3xl font-extrabold text-[#F4EFE6] mt-1">My Bookings</h1>
          <p className="text-xs text-[#B9B2A8] mt-1">
            Track upcoming cinema reservations and past ticket history for {user.name}.
          </p>
        </div>

        <button
          onClick={onBrowseMovies}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#F0A451] hover:bg-[#FFB96B] active:scale-95 text-[#17120C] text-xs font-black transition shadow-sm"
        >
          <span>Browse More Movies</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium animate-fadeIn ${
            actionMessage.type === 'success'
              ? 'bg-[#345447]/20 border border-[#345447] text-[#6FA987]'
              : 'bg-[#823E46]/20 border border-[#823E46] text-[#E47A75]'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-10 h-10 border-2 border-[#F0A451] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-[#89857D] mt-3">Fetching your bookings...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-[#191A18] border border-[#34332F] text-center">
          <AlertCircle className="w-8 h-8 text-[#E47A75] mx-auto mb-2" />
          <p className="text-sm text-[#E47A75]">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* SECTION 1: UPCOMING BOOKINGS */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#6FA987] shrink-0" />
              <h2 className="text-lg font-bold text-[#F4EFE6]">
                Upcoming Shows ({bookingsData?.upcoming.length || 0})
              </h2>
            </div>

            {bookingsData?.upcoming.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#191A18] border border-[#34332F] text-center">
                <Ticket className="w-8 h-8 text-[#89857D] mx-auto mb-2" />
                <p className="text-xs text-[#B9B2A8]">You have no upcoming movie bookings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookingsData?.upcoming.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onCancel={() => handleCancelBooking(booking.id)}
                    isCancelling={cancellingId === booking.id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* SECTION 2: PAST BOOKINGS */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#89857D] shrink-0" />
              <h2 className="text-lg font-bold text-[#89857D]">
                Past / Concluded Shows ({bookingsData?.past.length || 0})
              </h2>
            </div>

            {bookingsData?.past.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#191A18] border border-[#34332F] text-center">
                <p className="text-xs text-[#89857D]">No past bookings recorded.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75 hover:opacity-100 transition-opacity">
                {bookingsData?.past.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

interface BookingCardProps {
  booking: BookingOut;
  onCancel?: () => void;
  isCancelling?: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onCancel, isCancelling }) => {
  const dt = new Date(booking.start_time);
  const dateStr = dt.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isConfirmed = booking.status === 'CONFIRMED';

  return (
    <div className="booking-card p-5 rounded-2xl bg-[#191A18] border border-[#34332F] hover:border-[#514B43] flex flex-col justify-between gap-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-[11px] font-bold text-[#F0A451] uppercase tracking-wider">
            {booking.booking_reference}
          </span>
          <h3 className="text-lg font-extrabold text-[#F4EFE6] mt-0.5">{booking.movie_title}</h3>
          <span className="text-xs text-[#89857D]">{booking.screen_name} • {booking.language}</span>
        </div>

        <span
          className={`booking-confirmed-badge px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
            isConfirmed
              ? 'bg-[#345447]/30 border border-[#345447] text-[#6FA987]'
              : 'bg-[#823E46]/30 border border-[#823E46] text-[#E47A75]'
          }`}
        >
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-[#B9B2A8] py-2 border-y border-[#34332F]/50">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#F0A451]" />
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#F0A451]" />
          <span>{timeStr}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#89857D] uppercase block">Seats</span>
          <div className="flex items-center gap-1 flex-wrap mt-0.5">
            {booking.seats.map((seat) => (
              <span
                key={seat}
                className="booking-seat-badge px-2 py-0.5 rounded-md bg-[#22231F] border border-[#34332F] text-[#F4EFE6] font-mono text-xs font-bold"
              >
                {seat}
              </span>
            ))}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-[#89857D] uppercase block">Total</span>
          <span className="text-base font-bold text-[#F0A451]">₹{booking.total_amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Flow 8 (Bonus): Cancellation Button */}
      {isConfirmed && onCancel && (
        <div className="pt-2 border-t border-[#34332F]/50 flex items-center justify-between">
          {booking.can_cancel ? (
            <button
              disabled={isCancelling}
              onClick={onCancel}
              className="booking-cancel-btn px-3.5 py-1.5 rounded-lg bg-[#823E46]/20 hover:bg-[#823E46]/40 active:scale-95 border border-[#823E46] text-[#E47A75] text-xs font-bold transition shadow-sm"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Booking (Release Seats)'}
            </button>
          ) : (
            <span className="text-[10px] text-[#89857D] font-medium">
              Cancellation closed (&lt; 2 hrs before showtime)
            </span>
          )}
        </div>
      )}
    </div>
  );
};
