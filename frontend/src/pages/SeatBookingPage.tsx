import React, { useState, useEffect, useRef } from 'react';
import type { SeatMapResponse, SeatOut, BookingOut } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PaymentModal } from '../components/PaymentModal';
import { BookingConfirmationModal } from '../components/BookingConfirmationModal';
import { ArrowLeft, Clock, RefreshCw, AlertCircle, X, Check, Lock, ShieldCheck, ArrowRight, Armchair } from 'lucide-react';

interface SeatBookingPageProps {
  showId: number;
  onBack: () => void;
  onViewMyBookings: () => void;
  onRequireAuth: () => void;
}

export const SeatBookingPage: React.FC<SeatBookingPageProps> = ({
  showId,
  onBack,
  onViewMyBookings,
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const [seatMap, setSeatMap] = useState<SeatMapResponse | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Hold state
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingOut | null>(null);

  const countdownTimerRef = useRef<any>(null);

  // Broadcast seat changes across tabs using BroadcastChannel and localStorage
  const broadcastSeatUpdate = (targetShowId: number, eventType: string) => {
    try {
      if (typeof window !== 'undefined') {
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('yozigo_seat_channel');
          channel.postMessage({ showId: targetShowId, eventType, timestamp: Date.now() });
          channel.close();
        }
        localStorage.setItem(
          'yozigo_seat_sync_trigger',
          JSON.stringify({ showId: targetShowId, eventType, timestamp: Date.now() })
        );
      }
    } catch (_) {}
  };

  const applySeatMapData = (data: SeatMapResponse) => {
    setSeatMap(data);

    // Synchronize active database hold for the logged-in user across all tabs/windows
    if (data.current_hold_token && (data.hold_remaining_seconds || 0) > 0) {
      setHoldToken(data.current_hold_token);
      setRemainingSeconds(data.hold_remaining_seconds || 0);

      const heldByMeSeats = data.seats
        .filter((s) => s.status === 'HELD_BY_ME')
        .map((s) => s.seat_number);

      if (heldByMeSeats.length > 0) {
        setSelectedSeatIds((prev) => {
          const merged = Array.from(new Set([...prev, ...heldByMeSeats]));
          return merged;
        });
      }
    } else if (!data.current_hold_token) {
      // If server reports no active hold, clear local hold state
      setHoldToken((prev) => {
        if (prev) {
          setRemainingSeconds(0);
        }
        return null;
      });
    }
  };

  // 1. Initial Load, Polling & Multi-Tab Synchronization
  useEffect(() => {
    loadSeatMap();

    // Fast 3s polling for real-time live availability from other users/devices
    const pollInterval = setInterval(() => {
      refreshSeatMapSilently();
    }, 3000);

    // Instant cross-tab sync via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('yozigo_seat_channel');
        channel.onmessage = (event) => {
          if (event.data?.showId === showId) {
            refreshSeatMapSilently();
          }
        };
      }
    } catch (_) {}

    // Cross-tab storage event fallback
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'yozigo_seat_sync_trigger' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed.showId === showId) {
            refreshSeatMapSilently();
          }
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      clearInterval(pollInterval);
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [showId]);

  // 2. Countdown Timer
  useEffect(() => {
    if (remainingSeconds > 0) {
      countdownTimerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            setHoldToken(null);
            setError('Your 5-minute seat hold has expired. Please select seats again.');
            loadSeatMap();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [remainingSeconds]);

  const loadSeatMap = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSeatMap(showId);
      applySeatMapData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load auditorium seat map.');
    } finally {
      setLoading(false);
    }
  };

  const refreshSeatMapSilently = async () => {
    try {
      const data = await api.getSeatMap(showId);
      applySeatMapData(data);
    } catch {
      // Silently ignore background polling glitches
    }
  };

  const releaseCurrentHold = async (token?: string | null) => {
    const t = token !== undefined ? token : holdToken;
    if (t) {
      try {
        await api.releaseHold(showId, t);
      } catch (_) {}
    }
    setHoldToken(null);
    setRemainingSeconds(0);
    broadcastSeatUpdate(showId, 'HOLD_RELEASED');
  };

  const handleSeatClick = async (seat: SeatOut) => {
    setError(null);
    setInfoMessage(null);

    if (seat.status === 'BOOKED') {
      setError(`Seat ${seat.seat_number} is already booked.`);
      return;
    }
    if (seat.status === 'HELD_BY_OTHER') {
      setError(`Seat ${seat.seat_number} is currently held by another customer.`);
      return;
    }

    // If hold was active, modifying selection releases the active hold so backend & frontend remain 100% in sync
    const hadActiveHold = Boolean(holdToken && remainingSeconds > 0);
    if (hadActiveHold) {
      await releaseCurrentHold();
      setInfoMessage('Hold updated. Click "Hold Seats & Pay" when ready to lock in your seats.');
    }

    // Toggle selection
    if (selectedSeatIds.includes(seat.seat_number)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.seat_number));
      if (hadActiveHold) {
        await loadSeatMap();
      }
      return;
    }

    // Haptic feedback for tactile physical click on mobile devices
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch (_) {}
    }

    // Flow 4: Rule: 1 to 6 seats max
    if (selectedSeatIds.length >= 6) {
      setError('You can select a maximum of 6 seats per booking.');
      return;
    }

    setSelectedSeatIds((prev) => [...prev, seat.seat_number]);
    if (hadActiveHold) {
      await loadSeatMap();
    }
  };

  const handleRemoveSeat = async (seatId: string) => {
    setError(null);
    if (holdToken && remainingSeconds > 0) {
      await releaseCurrentHold();
      setInfoMessage('Hold released as seat selection was modified.');
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId));
      await loadSeatMap();
      return;
    }
    setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId));
  };

  const handleCancelHold = async () => {
    if (holdToken) {
      await releaseCurrentHold();
      setInfoMessage('Seat hold cancelled. Your seat selections are retained.');
      await loadSeatMap();
    }
  };

  const handleHoldSeats = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }

    if (selectedSeatIds.length === 0) {
      setError('Please select at least 1 seat to hold.');
      return;
    }

    setHolding(true);
    setError(null);

    try {
      const res = await api.holdSeats(showId, selectedSeatIds);
      setHoldToken(res.hold_token);
      setRemainingSeconds(res.remaining_seconds);
      broadcastSeatUpdate(showId, 'HOLD_PLACED');
      await loadSeatMap();
    } catch (err: any) {
      setError(err.message || 'Failed to hold seats.');
      await loadSeatMap();
    } finally {
      setHolding(false);
    }
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getSeatsForRow = (rowLetter: string) => {
    if (!seatMap) return [];
    return seatMap.seats
      .filter((s) => s.row === rowLetter)
      .sort((a, b) => a.col - b.col);
  };

  const totalAmount = seatMap ? selectedSeatIds.length * seatMap.ticket_price : 0;

  if (loading && !seatMap) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-10 h-10 border-2 border-[#F0A451] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[#89857D] mt-3">Loading interactive 80-seat map...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col animate-fadeIn select-none pb-36">
      {/* 1. Top Sub-Header Bar (Clean rounded-lg controls) */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-3.5 bg-[#191A18] border-b border-[#34332F] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#101110] border border-[#34332F] text-xs font-bold text-[#B9B2A8] hover:text-[#F4EFE6] hover:bg-[#191A18] hover:border-[#514B43] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Movie</span>
          </button>

          <div className="flex flex-col">
            <h1 className="text-sm sm:text-base font-black text-[#F4EFE6] leading-tight line-clamp-1">
              {seatMap?.movie_title}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-[#89857D]">
              <span>{seatMap?.screen_name}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#F0A451]">
                <Clock className="w-3 h-3" />
                {seatMap &&
                  new Date(seatMap.start_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
              </span>
            </div>
          </div>
        </div>

        {/* Live Controls: Refresh & Active Countdown (No pulsating dots) */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadSeatMap}
            title="Refresh seat availability"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#101110] border border-[#34332F] text-xs font-semibold text-[#B9B2A8] hover:text-[#F4EFE6] hover:border-[#89857D] transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Refresh Map</span>
          </button>

          {remainingSeconds > 0 && (
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black shadow-sm transition-all ${
                remainingSeconds <= 30
                  ? 'bg-[#823E46]/30 border border-[#E47A75] text-[#E47A75]'
                  : 'bg-[#191A18] border border-[#514B43] text-[#F0A451]'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 shrink-0 ${remainingSeconds <= 30 ? 'text-[#E47A75]' : 'text-[#F0A451]'}`} />
              <span>{remainingSeconds <= 30 ? 'Hurry! Expires:' : 'Hold Expires:'} {formatCountdown(remainingSeconds)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error & Info Alerts */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-4 max-w-4xl mx-auto w-full">
        {error && (
          <div className="p-3 rounded-xl bg-[#823E46]/20 border border-[#823E46] text-[#E47A75] text-xs flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-[#E47A75] hover:text-white p-1 rounded-md transition" title="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {infoMessage && (
          <div className="p-3 rounded-xl bg-[#345447]/20 border border-[#345447] text-[#6FA987] text-xs flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{infoMessage}</span>
            </div>
            <button onClick={() => setInfoMessage(null)} className="text-[#6FA987] hover:text-white p-1 rounded-md transition" title="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Auditorium Seat Map: Indian Theater Standard Tiers (RECLINER, PRIME, CLASSIC) */}
      <div id="seat-map" className="w-full px-2 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 flex flex-col items-center">
        <div className="w-full max-w-4xl bg-[#191A18] border border-[#34332F] rounded-2xl p-4 sm:p-8 shadow-2xl flex flex-col items-center">

          {/* Seat Map Matrix with Center Aisle Walkway */}
          <div className="w-full overflow-x-auto pb-4 flex justify-start sm:justify-center no-scrollbar px-1">
            <div className="inline-flex flex-col gap-2 sm:gap-3 min-w-max mx-auto px-2">

              {/* TIER 1: RECLINER (Row A - Top/Back Row) */}
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider px-2 pt-2 pb-1.5 border-b border-[#34332F] bg-[#101110]/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Armchair className="w-3.5 h-3.5 text-[#F0A451]" />
                  <span className="text-[#F0A451]">RECLINER</span>
                  <span className="text-[10px] font-normal text-[#89857D] lowercase">(row a • luxury plush)</span>
                </div>
                <span className="text-[#F0A451] font-bold">₹{seatMap?.ticket_price.toFixed(2)}</span>
              </div>

              {/* Row A */}
              {renderRow('A')}

              {/* TIER 2: PRIME (Rows B, C, D - Middle Optimal Sweet Spot) */}
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider px-2 pt-3.5 pb-1.5 border-b border-[#34332F] bg-[#101110]/50 rounded-lg mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#F4EFE6]">PRIME</span>
                  <span className="text-[10px] font-normal text-[#89857D] lowercase">(rows b–d • optimal eye-level)</span>
                </div>
                <span className="text-[#F0A451] font-bold">₹{seatMap?.ticket_price.toFixed(2)}</span>
              </div>

              {/* Rows B, C, D */}
              {renderRow('B')}
              {renderRow('C')}
              {renderRow('D')}

              {/* TIER 3: CLASSIC (Rows E, F, G, H - Front / Standard View) */}
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider px-2 pt-3.5 pb-1.5 border-b border-[#34332F] bg-[#101110]/50 rounded-lg mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#B9B2A8]">CLASSIC</span>
                  <span className="text-[10px] font-normal text-[#89857D] lowercase">(rows e–h • standard view)</span>
                </div>
                <span className="text-[#F0A451] font-bold">₹{seatMap?.ticket_price.toFixed(2)}</span>
              </div>

              {/* Rows E, F, G, H */}
              {renderRow('E')}
              {renderRow('F')}
              {renderRow('G')}
              {renderRow('H')}

            </div>
          </div>

          {/* Curved Screen Arch at the Bottom (All Eyes Towards Screen) */}
          <div className="w-full max-w-xl mt-8 sm:mt-10 flex flex-col items-center">
            <div className="screen-arch w-full py-2 sm:py-2.5 text-center text-[10px] sm:text-xs font-black tracking-[0.25em] sm:tracking-[0.3em] text-[#F0A451] uppercase shadow-sm">
              SCREEN THIS WAY
            </div>
            <span className="text-[9px] sm:text-[10px] text-[#89857D] font-medium tracking-widest uppercase mt-2">
              All Eyes Towards Screen
            </span>
          </div>

          {/* Seat Color Legend */}
          <div className="mt-8 pt-5 border-t border-[#34332F] w-full flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs select-none">
            <div className="flex items-center gap-2 text-[#F4EFE6]">
              <div className="w-6 h-6 rounded-lg bg-[#345447]/40 border-2 border-[#345447] flex items-center justify-center"></div>
              <span className="text-xs font-semibold">Available</span>
            </div>
            <div className="flex items-center gap-2 text-[#F4EFE6]">
              <div className="w-6 h-6 rounded-lg bg-[#F0A451] text-[#17120C] font-bold flex items-center justify-center shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className="text-xs font-semibold">Selected</span>
            </div>
            <div className="flex items-center gap-2 text-[#E47A75]">
              <div className="w-6 h-6 rounded-lg bg-[#823E46]/30 border-2 border-[#823E46] flex items-center justify-center">
                <Lock className="w-3 h-3 text-[#E47A75]" />
              </div>
              <span className="text-xs font-semibold">Held</span>
            </div>
            <div className="flex items-center gap-2 text-[#89857D]">
              <div className="w-6 h-6 rounded-lg bg-[#292D32]/80 border-2 border-[#34332F] flex items-center justify-center">
                <X className="w-3.5 h-3.5 text-[#89857D]" />
              </div>
              <span className="text-xs font-semibold">Booked</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sticky Bottom Checkout Dock */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#101110]/95 backdrop-blur-xl border-t border-[#34332F] py-3.5 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 shadow-2xl safe-area-bottom transition-all duration-300 ease-out">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
          {/* Left: Selected Seats Tags & Count */}
          <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[#89857D] tracking-wider">
                {selectedSeatIds.length === 0
                  ? 'Select Up to 6 Seats'
                  : `${selectedSeatIds.length} Seat${selectedSeatIds.length > 1 ? 's' : ''} Selected`}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                {selectedSeatIds.length === 0 ? (
                  <span className="text-xs text-[#89857D] italic">Tap seats on map</span>
                ) : (
                  selectedSeatIds.map((seatId) => (
                    <span
                      key={seatId}
                      onClick={() => handleRemoveSeat(seatId)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#F0A451] text-[#17120C] text-xs font-black cursor-pointer hover:bg-[#FFB96B] transition shadow-sm"
                    >
                      {seatId}
                      <X className="w-3 h-3 stroke-[3]" />
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Price Total */}
            <div className="text-right sm:text-left sm:ml-4 sm:pl-4 sm:border-l sm:border-[#34332F]">
              <span className="text-[10px] text-[#89857D] uppercase font-bold">Total Amount</span>
              <div className="text-xl sm:text-2xl font-black text-[#F0A451] leading-tight">
                ₹{totalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Right: Crisp Rounded-XL CTA Button & Cancel Hold Option */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {remainingSeconds > 0 && holdToken ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCancelHold}
                  className="px-3.5 py-3 rounded-xl bg-[#191A18] hover:bg-[#823E46]/20 border border-[#34332F] hover:border-[#823E46] text-[#B9B2A8] hover:text-[#E47A75] font-bold text-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                  title="Cancel hold on these seats"
                >
                  Cancel Hold
                </button>
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex-1 sm:flex-initial px-6 sm:px-7 py-3 rounded-xl bg-[#F0A451] hover:bg-[#FFB96B] active:scale-95 text-[#17120C] font-black text-sm transition-all shadow-md hover:shadow-lg shadow-black/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Pay ₹{totalAmount.toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                disabled={selectedSeatIds.length === 0 || holding}
                onClick={handleHoldSeats}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#F0A451] hover:bg-[#FFB96B] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-[#17120C] font-black text-sm transition-all shadow-md hover:shadow-lg shadow-black/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{holding ? 'Securing 5m Hold...' : `Hold Seats & Pay (5m)`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Simulated Payment Modal */}
      {isPaymentModalOpen && holdToken && seatMap && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          holdToken={holdToken}
          showId={showId}
          movieTitle={seatMap.movie_title}
          selectedSeats={selectedSeatIds}
          totalAmount={totalAmount}
          remainingSeconds={remainingSeconds}
          onClose={() => setIsPaymentModalOpen(false)}
          onBookingSuccess={(booking) => {
            setIsPaymentModalOpen(false);
            setConfirmedBooking(booking);
            broadcastSeatUpdate(showId, 'BOOKING_CONFIRMED');
            loadSeatMap();
          }}
          onPaymentFailed={(msg) => {
            setError(msg);
          }}
        />
      )}

      {/* Confirmed Booking Modal */}
      {confirmedBooking && (
        <BookingConfirmationModal
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
          onViewMyBookings={onViewMyBookings}
        />
      )}
    </div>
  );

  function renderRow(rowLetter: string) {
    const rowSeats = getSeatsForRow(rowLetter);
    const leftSeats = rowSeats.slice(0, 5); // seats 1 to 5
    const rightSeats = rowSeats.slice(5, 10); // seats 6 to 10

    return (
      <div key={rowLetter} className="flex items-center justify-center gap-1.5 sm:gap-3">
        {/* Left Row Label */}
        <span className="w-4 sm:w-5 text-[11px] sm:text-xs font-black text-[#89857D] text-center select-none">
          {rowLetter}
        </span>

        {/* Left Block (Seats 1-5) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {leftSeats.map((seat) => renderSeatButton(seat))}
        </div>

        {/* Center Aisle Walkway Gap */}
        <div className="w-3 sm:w-8 flex items-center justify-center">
          <span className="text-[9px] text-[#34332F] font-black select-none">|</span>
        </div>

        {/* Right Block (Seats 6-10) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {rightSeats.map((seat) => renderSeatButton(seat))}
        </div>

        {/* Right Row Label */}
        <span className="w-4 sm:w-5 text-[11px] sm:text-xs font-black text-[#89857D] text-center select-none">
          {rowLetter}
        </span>
      </div>
    );
  }

  function renderSeatButton(seat: SeatOut) {
    const isHeldByMe = seat.status === 'HELD_BY_ME';
    const isSelected = selectedSeatIds.includes(seat.seat_number) || isHeldByMe;
    const isHeldByOther = seat.status === 'HELD_BY_OTHER';
    const isBooked = seat.status === 'BOOKED';
    const isRecliner = seat.row === 'A';

    let seatClasses = isRecliner
      ? 'seat-btn w-7 h-6 sm:w-10 sm:h-9 rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center transition-all select-none cursor-pointer'
      : 'seat-btn w-6 h-6 sm:w-9 sm:h-9 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center transition-all select-none cursor-pointer';

    if (isBooked) {
      seatClasses +=
        ' bg-[#292D32]/80 text-[#89857D] cursor-not-allowed border-2 border-[#34332F] opacity-40';
    } else if (isHeldByOther) {
      seatClasses +=
        ' bg-[#823E46]/30 text-[#E47A75] border-2 border-[#823E46] cursor-not-allowed';
    } else if (isSelected || isHeldByMe) {
      seatClasses +=
        ' bg-[#F0A451] text-[#17120C] font-black border-2 border-transparent shadow-sm scale-105';
    } else {
      // Available
      seatClasses += isRecliner
        ? ' bg-[#345447]/50 text-[#6FA987] border-2 border-[#345447] hover:bg-[#345447] hover:text-[#F4EFE6] hover:scale-105 active:scale-95 shadow-sm'
        : ' bg-[#345447]/40 text-[#6FA987] border-2 border-[#345447] hover:bg-[#345447] hover:text-[#F4EFE6] hover:scale-105 active:scale-95';
    }

    const titleText = isBooked
      ? `Seat ${seat.seat_number} • BOOKED`
      : isHeldByOther
      ? `Seat ${seat.seat_number} • Currently held by another customer`
      : isHeldByMe
      ? `Seat ${seat.seat_number} • Held by you (5m lock)`
      : `Seat ${seat.seat_number} • ${isRecliner ? 'RECLINER' : seat.row >= 'B' && seat.row <= 'D' ? 'PRIME' : 'CLASSIC'} • Available`;

    return (
      <button
        key={seat.seat_number}
        disabled={isBooked || isHeldByOther}
        onClick={() => handleSeatClick(seat)}
        title={titleText}
        className={seatClasses}
      >
        {isHeldByOther ? (
          <Lock className="w-3 h-3 text-[#E47A75]" />
        ) : isSelected || isHeldByMe ? (
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        ) : (
          seat.col
        )}
      </button>
    );
  }
};
