import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { BookingOut } from '../types';
import { CheckCircle2, Calendar, Clock, X, ArrowRight } from 'lucide-react';

interface BookingConfirmationModalProps {
  booking: BookingOut | null;
  onClose: () => void;
  onViewMyBookings: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  booking,
  onClose,
  onViewMyBookings,
}) => {
  // Lock body and html scroll while modal is mounted
  useEffect(() => {
    if (!booking) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [booking, onClose]);

  if (!booking) return null;

  const dt = new Date(booking.start_time);
  const dateStr = dt.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const modalJSX = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-fadeIn"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="min-h-full flex items-center justify-center py-2 sm:py-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-[#101110] border border-[#34332F] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-hidden"
        >
          {/* Header - Fixed & Always Visible */}
          <div className="p-4 sm:p-6 pb-2.5 sm:pb-3 border-b border-[#34332F]/60 bg-[#101110] rounded-t-2xl sm:rounded-t-3xl shrink-0 relative text-center flex flex-col items-center">
            <button
              onClick={onClose}
              title="Close confirmation"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-lg bg-[#191A18] border border-[#34332F] flex items-center justify-center text-[#89857D] hover:text-[#F4EFE6] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-[#345447]/30 border border-[#345447] flex items-center justify-center text-[#6FA987] mb-1.5 sm:mb-2">
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#F0A451] uppercase tracking-widest">
              Confirmed Reservation
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#F4EFE6] mt-0.5">Booking Confirmed!</h2>
            <p className="text-xs text-[#B9B2A8] mt-0.5">
              Your movie tickets have been issued and seats permanently booked.
            </p>
          </div>

          {/* Ticket Voucher Card - Scrollable Body */}
          <div className="p-4 sm:p-6 pt-3 sm:pt-4 overflow-y-auto overscroll-contain flex flex-col gap-3.5 sm:gap-4 custom-modal-scrollbar">
            <div className="rounded-xl bg-[#191A18] border border-[#34332F] overflow-hidden flex flex-col shrink-0">
              {/* Top Ticket Header */}
              <div className="p-3.5 sm:p-4 bg-[#22231F] border-b border-[#34332F] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#89857D] uppercase font-bold">Booking ID</span>
                  <div className="font-mono text-sm sm:text-base font-extrabold text-[#F0A451] tracking-wide">
                    {booking.booking_reference}
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-md bg-[#345447]/30 border border-[#345447] text-[10px] font-bold text-[#6FA987]">
                  {booking.status}
                </div>
              </div>

              {/* Ticket Details Body */}
              <div className="p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-[#89857D] uppercase">Feature Film</span>
                    <h3 className="text-base sm:text-lg font-bold text-[#F4EFE6]">{booking.movie_title}</h3>
                    <span className="text-xs text-[#89857D]">{booking.screen_name} • {booking.language}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#34332F]/60">
                  <div className="flex items-center gap-2 text-xs text-[#B9B2A8]">
                    <Calendar className="w-4 h-4 text-[#F0A451] shrink-0" />
                    <span className="truncate">{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#B9B2A8]">
                    <Clock className="w-4 h-4 text-[#F0A451] shrink-0" />
                    <span>{timeStr}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#34332F]/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#89857D] uppercase">Booked Seats</span>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      {booking.seats.map((seat) => (
                        <span
                          key={seat}
                          className="px-2 py-0.5 rounded-md bg-[#F0A451] text-[#17120C] text-xs font-bold"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#89857D] uppercase">Amount Paid</span>
                    <div className="text-sm sm:text-base font-extrabold text-[#F4EFE6]">
                      ₹{booking.total_amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Fixed & Always Visible at Bottom */}
          <div className="p-4 sm:p-6 pt-3 border-t border-[#34332F]/60 bg-[#101110] rounded-b-2xl sm:rounded-b-3xl shrink-0 flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={onViewMyBookings}
              className="flex-1 py-3 rounded-xl bg-[#F0A451] hover:bg-[#FFB96B] active:scale-95 text-[#17120C] font-black text-xs sm:text-sm transition-all shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View in My Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-[#191A18] hover:bg-[#22231F] active:scale-95 border border-[#34332F] text-xs sm:text-sm font-bold text-[#F4EFE6] transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null;
};
