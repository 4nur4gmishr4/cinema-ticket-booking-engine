import React, { useState, useEffect } from 'react';
import type { BookingOut } from '../types';
import { api } from '../services/api';
import { CheckCircle2, XCircle, AlertCircle, X, Clock } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  holdToken: string;
  showId?: number;
  movieTitle: string;
  selectedSeats: string[];
  totalAmount: number;
  remainingSeconds: number;
  onClose: () => void;
  onBookingSuccess: (booking: BookingOut) => void;
  onPaymentFailed: (message: string) => void;
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
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<'SUCCESS' | 'FAILURE' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lock body and html scroll, handle Escape key while modal is open
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSimulatePayment = async (outcome: 'SUCCESS' | 'FAILURE') => {
    setLoading(true);
    setErrorMessage(null);

    try {
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

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-fadeIn"
    >
      <div className="min-h-full flex items-center justify-center py-2 sm:py-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-[#101110] border border-[#34332F] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-hidden"
        >
          {/* Header - Fixed & Always Visible */}
          <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[#34332F]/60 bg-[#101110] rounded-t-2xl sm:rounded-t-3xl shrink-0 relative pr-12">
            {/* Close Button */}
            <button
              onClick={onClose}
              title="Close payment window"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-lg bg-[#191A18] border border-[#34332F] flex items-center justify-center text-[#89857D] hover:text-[#F4EFE6] transition cursor-pointer"
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
          <div className="p-4 sm:p-6 pt-3 sm:pt-4 overflow-y-auto overscroll-contain flex flex-col gap-3.5 sm:gap-4 custom-modal-scrollbar">
            {/* Order Summary */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#191A18] border border-[#34332F] flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between text-xs text-[#B9B2A8]">
                <span>Movie</span>
                <span className="font-semibold text-[#F4EFE6] truncate max-w-[200px] text-right">{movieTitle}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#B9B2A8]">
                <span>Reserved Seats ({selectedSeats.length})</span>
                <span className="font-bold text-[#F0A451]">{selectedSeats.join(', ')}</span>
              </div>
              <div className="pt-2 border-t border-[#34332F] flex items-center justify-between text-xs sm:text-sm">
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
            <div className="flex flex-col gap-2.5 shrink-0 pt-1">
              <span className="text-[10px] font-bold text-[#89857D] uppercase tracking-wider">
                Select Test Outcome:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Outcome 1: Payment Success */}
                <button
                  type="button"
                  onClick={() => handleSimulatePayment('SUCCESS')}
                  disabled={loading || remainingSeconds <= 0}
                  className="py-3 px-4 rounded-xl bg-[#345447] hover:bg-[#345447]/80 active:scale-95 border border-[#345447] text-[#F4EFE6] font-bold text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-40 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#6FA987]" />
                  <span>Simulate Success</span>
                </button>

                {/* Outcome 2: Payment Failure */}
                <button
                  type="button"
                  onClick={() => handleSimulatePayment('FAILURE')}
                  disabled={loading || remainingSeconds <= 0}
                  className="py-3 px-4 rounded-xl bg-[#823E46]/30 hover:bg-[#823E46]/50 active:scale-95 border border-[#823E46] text-[#E47A75] font-bold text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-40 cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-[#E47A75]" />
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
};
