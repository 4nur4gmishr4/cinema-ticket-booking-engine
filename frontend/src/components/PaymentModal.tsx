import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { BookingOut } from '../types';
import { api } from '../services/api';
import { CheckCircle2, XCircle, AlertCircle, X, Clock } from 'lucide-react';

// --- Component: PaymentModal ---
// Purpose: This modal simulates a real-world checkout/payment gateway.
// It allows users to test two outcomes: Payment Success or Payment Failure.
// If Success: It finalizes the booking in the database.
// If Failure: It shows an error message, but leaves seats held until the 5-min timer expires.

interface PaymentModalProps {
  isOpen: boolean;               // Whether this modal is currently visible on screen
  holdToken: string;             // The unique 5-minute hold token received from the backend
  showId?: number;               // ID of the selected show
  movieTitle: string;            // Name of the movie being booked
  selectedSeats: string[];       // List of seat codes (e.g., ['A1', 'A2'])
  totalAmount: number;           // Total price in INR (seats count * ticket price)
  remainingSeconds: number;      // Seconds left before the 5-minute seat hold expires
  onClose: () => void;           // Callback function when user closes the modal
  onBookingSuccess: (booking: BookingOut) => void; // Callback when booking is successfully confirmed
  onPaymentFailed: (message: string) => void;      // Callback when payment simulation fails
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  holdToken,
  movieTitle,
  selectedSeats,
  totalAmount,
  remainingSeconds,
  onClose,
  onBookingSuccess,
  onPaymentFailed,
}) => {
  // Local state:
  // loading: true while waiting for the backend API response
  const [loading, setLoading] = useState(false);
  // paymentResult: tracks whether the latest attempt was SUCCESS or FAILURE
  const [paymentResult, setPaymentResult] = useState<'SUCCESS' | 'FAILURE' | null>(null);
  // errorMessage: stores any error message returned from the backend
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hook: Prevents the background page from scrolling when modal is open,
  // and allows user to close the modal by pressing the 'Escape' key.
  useEffect(() => {
    if (!isOpen) return;
    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup: restore scroll and remove event listener when modal unmounts
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // If modal is closed, render nothing
  if (!isOpen) return null;

  // Function: Calls the backend to simulate payment
  // If outcome is 'SUCCESS', the backend converts the temporary hold into a confirmed booking.
  // If outcome is 'FAILURE', the backend records failure and rejects the transaction.
  const handleSimulatePayment = async (outcome: 'SUCCESS' | 'FAILURE') => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // Call backend API /api/bookings/simulate-payment
      const booking = await api.simulatePayment(holdToken, outcome);
      setPaymentResult('SUCCESS');
      onBookingSuccess(booking);
    } catch (err: any) {
      if (outcome === 'FAILURE') {
        setPaymentResult('FAILURE');
        setErrorMessage(err.message || 'Payment simulation failed.');
        onPaymentFailed(err.message || 'Payment simulation failed.');
      } else {
        setErrorMessage(err.message || 'Transaction failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper: Formats remaining seconds into MM:SS format (e.g. 295 secs -> "04:55")
  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // The Modal UI JSX
  const modalJSX = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-black/75 dark:bg-black/85 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="min-h-full flex items-center justify-center py-2 sm:py-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md sm:max-w-lg my-auto payment-modal-card border rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] overflow-hidden"
        >
          {/* Header - Fixed & Always Visible */}
          <div className="payment-modal-header p-4 sm:p-6 pb-3 sm:pb-4 border-b rounded-t-2xl sm:rounded-t-3xl shrink-0 relative pr-12">
            {/* Close Button */}
            <button
              onClick={onClose}
              title="Close payment window"
              className="payment-close-btn absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-lg border flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pr-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#F0A451] uppercase tracking-wider">
                Simulated Payment Gateway
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F0A451]/15 text-[#F0A451] text-xs font-semibold">
                <Clock className="w-3 h-3 text-[#F0A451] shrink-0" />
                <span>Hold: {formatCountdown(remainingSeconds)}</span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#F4EFE6] mt-1">Complete Your Booking</h2>
            <p className="text-xs text-[#B9B2A8] mt-1 leading-relaxed">
              Test both mandatory payment outcomes below to verify transactional booking logic.
            </p>
          </div>

          {/* Scrollable Body - Contains Order Details & Test Buttons */}
          <div className="p-4 sm:p-6 pt-3 sm:pt-4 overflow-y-auto overscroll-contain flex flex-col gap-3.5 sm:gap-4 custom-modal-scrollbar flex-1">
            {/* Order Summary */}
            <div className="payment-summary-box p-3.5 sm:p-4 rounded-xl border flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between text-xs text-[#B9B2A8]">
                <span>Movie</span>
                <span className="font-semibold text-[#F4EFE6] truncate max-w-[200px] text-right">{movieTitle}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#B9B2A8]">
                <span>Reserved Seats ({selectedSeats.length})</span>
                <span className="font-bold text-[#F0A451]">{selectedSeats.join(', ')}</span>
              </div>
              <div className="pt-2 border-t border-[#34332F]/50 flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium text-[#F4EFE6]">Total Payable</span>
                <span className="font-extrabold text-[#F0A451] text-base sm:text-lg">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Failure Feedback Alert */}
            {paymentResult === 'FAILURE' && (
              <div className="p-3.5 rounded-xl bg-[#823E46]/20 border border-[#823E46] flex flex-col gap-1.5 animate-fadeIn shrink-0">
                <div className="flex items-center gap-2 text-[#E47A75] text-xs font-bold">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Payment Failed</span>
                </div>
                <p className="text-xs text-[#E47A75] leading-relaxed">
                  {errorMessage || 'Simulated card transaction declined.'}
                </p>
                <p className="text-[11px] text-[#B9B2A8]">
                  Your seats remain safely held for the remainder of the 5-minute timer. You can try again below!
                </p>
              </div>
            )}

            {errorMessage && paymentResult !== 'FAILURE' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#823E46]/20 border border-[#823E46] text-[#E47A75] text-xs shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* The Two Mandatory Test Outcomes */}
            <div className="flex flex-col gap-2.5 shrink-0 pt-1 pb-1">
              <span className="text-[10px] font-bold text-[#89857D] uppercase tracking-wider">
                Select Test Outcome:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Outcome 1: Payment Success */}
                <button
                  type="button"
                  onClick={() => handleSimulatePayment('SUCCESS')}
                  disabled={loading || remainingSeconds <= 0}
                  className="btn-simulate-success py-3 sm:py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Simulate Success</span>
                </button>

                {/* Outcome 2: Payment Failure */}
                <button
                  type="button"
                  onClick={() => handleSimulatePayment('FAILURE')}
                  disabled={loading || remainingSeconds <= 0}
                  className="btn-simulate-failure py-3 sm:py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md active:scale-95 disabled:opacity-40 cursor-pointer"
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>Simulate Failure</span>
                </button>
              </div>
            </div>

            {remainingSeconds <= 0 && (
              <p className="text-xs text-center text-[#E47A75] font-semibold shrink-0">
                Hold timer expired. Please return to seat map to reselect seats.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null;
};
