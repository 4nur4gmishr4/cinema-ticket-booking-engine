import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { X, Eye, EyeOff, AlertCircle, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserAvatarIcon, SecurityShieldIcon } from './Icons';

// --- Component: AuthModal ---
// Purpose: Multi-purpose modal for user authentication.
// Features:
// 1. Tab toggle between "Create Account" (Register) and "Welcome Back" (Sign In).
// 2. Client-side validation: Password >= 8 characters, Terms agreement.
// 3. One-click quick login buttons for test evaluation:
//    - Customer: customer@yozigo.com / customer123 (pre-seeded with bookings)
//    - Admin: admin@yozigo.com / admin123 (full access to admin dashboard)
// 4. Visual cinematic rotating poster carousel on the left side.

interface AuthModalProps {
  isOpen: boolean;                          // Visibility of the modal
  onClose: () => void;                      // Close callback
  onSuccess?: () => void;                   // Optional callback fired after successful login/registration
  onOpenLegal?: (tab: 'terms' | 'privacy') => void; // Link to view legal terms
}

// Carousel poster data shown in the left column
const ROTATING_MOVIE_SLIDES = [
  {
    title: 'The Dark Knight',
    tagline: "The Legend of Gotham,\nBatman's Ultimate Psychological Test",
    image: '/posters/dark_knight.jpg',
  },
  {
    title: 'Interstellar',
    tagline: 'Mankind Was Born On Earth,\nIt Was Never Meant To Die Here',
    image: '/posters/interstellar.jpg',
  },
  {
    title: 'Inception',
    tagline: 'Your Mind Is The Scene Of The Crime,\nArchitect The Dream',
    image: '/posters/inception.jpg',
  },
  {
    title: '3 Idiots',
    tagline: 'Chase Excellence,\nAnd Success Will Follow',
    image: '/posters/3_idiots.jpg',
  },
  {
    title: 'RRR',
    tagline: 'Rise, Roar, Revolt,\nPure Epic Cinematic Spectacle',
    image: '/posters/rrr.jpg',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, onOpenLegal }) => {
  const { login, register } = useAuth();
  // isRegister: true = Create Account form; false = Sign In form
  const [isRegister, setIsRegister] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Rotating slide index for left visual showcase
  const SLIDE_DURATION = 4500;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);

  // Lock body and html scroll while AuthModal is open
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

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % ROTATING_MOVIE_SLIDES.length);
      setProgressKey((k) => k + 1);
    }, SLIDE_DURATION);
    return () => clearTimeout(timer);
  }, [isOpen, currentSlideIndex, progressKey]);

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? ROTATING_MOVIE_SLIDES.length - 1 : prev - 1));
    setProgressKey((k) => k + 1);
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % ROTATING_MOVIE_SLIDES.length);
    setProgressKey((k) => k + 1);
  };


  if (!isOpen) return null;

  const currentSlide = ROTATING_MOVIE_SLIDES[currentSlideIndex];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (!agreeTerms) {
        setError('Please agree to the Terms & Conditions to proceed.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || firstName.trim() || 'Cinema Guest';
        await register(fullName, email, password);
      } else {
        await login(email, password);
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (type: 'customer' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      if (type === 'customer') {
        await login('customer@yozigo.com', 'customer123');
      } else {
        await login('admin@yozigo.com', 'admin123');
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const modalJSX = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-black/75 backdrop-blur-md animate-fadeIn p-3 sm:p-6"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="min-h-full flex items-center justify-center py-2 sm:py-4">
        {/* Outer Card with Dynamic Ambient Backdrop */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="auth-modal-outer relative w-full max-w-4xl border border-white/15 rounded-3xl p-3 sm:p-5 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-stretch bg-[#101110] my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain custom-modal-scrollbar"
        >
        
        {/* Dynamic ambient backdrop that shifts rich colors with active rotating movie poster */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {ROTATING_MOVIE_SLIDES.map((slide, idx) => (
            <div
              key={`modal-ambient-${slide.title}`}
              className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
                idx === currentSlideIndex ? 'opacity-40 sm:opacity-50' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt=""
                className="w-full h-full object-cover filter blur-3xl scale-125 transition-opacity duration-700"
              />
            </div>
          ))}
          {/* Dual-directional organic vignette gradients matching main hero banner */}
          <div className="auth-modal-vignette-v absolute inset-0 bg-gradient-to-t from-[#101110] via-[#101110]/50 to-[#101110]/80"></div>
          <div className="auth-modal-vignette-h absolute inset-0 bg-gradient-to-r from-[#101110]/85 via-transparent to-[#101110]/85"></div>
        </div>

        {/* Absolute Close Icon (Top Right of Outer Card) */}
        <button
          onClick={onClose}
          className="auth-modal-close absolute top-3 right-3 sm:top-4 sm:right-4 z-40 w-8 h-8 rounded-xl bg-black/50 border border-white/20 flex items-center justify-center text-[#B9B2A8] hover:text-[#F4EFE6] hover:bg-black/70 transition shadow-md cursor-pointer"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT COLUMN: Cinematic Showcase with Dynamic Poster Gradients and 100% Uncropped Artwork */}
        <div className="auth-modal-left md:col-span-6 relative rounded-2xl overflow-hidden min-h-[240px] sm:min-h-[300px] md:min-h-[520px] flex flex-col justify-between p-3.5 sm:p-6 select-none shadow-xl backdrop-blur-md transition-colors">
          
          {/* Ambient Glowing Poster Backdrop with Crossfade */}
          {ROTATING_MOVIE_SLIDES.map((slide, idx) => (
            <div
              key={slide.title}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none ${
                idx === currentSlideIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt=""
                className="w-full h-full object-cover object-center filter blur-3xl opacity-50 scale-125"
              />
              <div className="auth-modal-backdrop-v absolute inset-0 pointer-events-none"></div>
              <div className="auth-modal-backdrop-h absolute inset-0 pointer-events-none"></div>
            </div>
          ))}

          {/* Left & Right Transparent Chevron Arrows */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevSlide();
            }}
            title="Previous Movie"
            className="auth-modal-arrow absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30 p-1 sm:p-2 bg-transparent border-0 text-white/70 hover:text-white hover:scale-110 active:scale-90 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextSlide();
            }}
            title="Next Movie"
            className="auth-modal-arrow absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30 p-1 sm:p-2 bg-transparent border-0 text-white/70 hover:text-white hover:scale-110 active:scale-90 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md" />
          </button>

          {/* Top Bar of Left Card: Clean Brand Header */}
          <div className="relative z-10 flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="auth-modal-brand font-extrabold text-sm sm:text-base tracking-[0.25em] text-[#F4EFE6] drop-shadow-md transition-colors">
                YOZIGO
              </span>
            </div>
          </div>

          {/* Center: Complete 100% Poster Showcase (Exact ratio, zero padding gap) */}
          <div className="relative z-10 flex-1 flex items-center justify-center my-2 sm:my-3 max-h-[160px] xs:max-h-[200px] sm:max-h-[280px] md:max-h-[340px] w-full">
            <div className="auth-modal-poster h-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border shrink-0 transition-colors">
              <img
                key={currentSlide.title}
                src={currentSlide.image}
                alt={currentSlide.title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105 block"
              />
            </div>
          </div>

          {/* Bottom Section of Left Card: Tagline & Progressive Carousel Indicator Bars */}
          <div className="relative z-10 flex flex-col gap-2.5 sm:gap-3.5 mt-auto">
            {/* Tagline Headline */}
            <h3 className="auth-modal-tagline text-xs sm:text-sm md:text-base font-bold text-white leading-snug tracking-tight drop-shadow-lg text-center max-w-xs mx-auto px-3 transition-colors">
              {currentSlide.tagline}
            </h3>

            {/* Morphing Slide Indicators with Linear Progress */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full select-none">
              {ROTATING_MOVIE_SLIDES.map((slide, idx) => {
                const isActive = idx === currentSlideIndex;
                const isCompleted = idx < currentSlideIndex;
                return (
                  <button
                    key={slide.title}
                    type="button"
                    onClick={() => {
                      setCurrentSlideIndex(idx);
                      setProgressKey((k) => k + 1);
                    }}
                    title={`View Slide ${idx + 1}: ${slide.title}`}
                    className={`auth-modal-bar rounded-full overflow-hidden cursor-pointer relative transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                      isActive ? 'w-8 sm:w-10 h-2' : 'w-2 h-2'
                    }`}
                  >
                    {/* Completed Slide: Marked in Accent Amber */}
                    {isCompleted && (
                      <span className="absolute inset-0 w-full h-full bg-[#F0A451] rounded-full" />
                    )}

                    {/* Active Slide: Smooth 0% to 100% Linear Fill across Expanding Pill */}
                    {isActive && (
                      <span
                        key={`auth-progress-${currentSlideIndex}-${progressKey}`}
                        className="absolute inset-y-0 left-0 bg-[#F0A451] rounded-full animate-slideProgress"
                        style={{
                          animationDuration: `${SLIDE_DURATION}ms`,
                          animationTimingFunction: 'linear',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Auth Form with Ambient Translucency */}
        <div className="md:col-span-6 flex flex-col justify-center px-1 sm:px-6 py-2 sm:py-4 relative z-10">
          <div className="flex flex-col gap-4 max-w-sm w-full mx-auto">
            
            {/* Title & Subtitle */}
            <div className="flex flex-col gap-1.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F4EFE6] tracking-tight">
                {isRegister ? 'Create an account' : 'Welcome back'}
              </h2>
              <p className="text-xs text-[#89857D]">
                {isRegister ? (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(false);
                        setError(null);
                      }}
                      className="text-[#F0A451] hover:underline font-semibold"
                    >
                      Log in
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(true);
                        setError(null);
                      }}
                      className="text-[#F0A451] hover:underline font-semibold"
                    >
                      Register
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#823E46]/20 border border-[#823E46] text-[#E47A75] text-xs animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              
              {/* If Register: First Name & Last Name Side-by-Side */}
              {isRegister && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    id="auth-first-name"
                    name="firstName"
                    type="text"
                    required
                    placeholder="First name"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="auth-modal-input w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-[#F4EFE6] placeholder-[#89857D] focus:outline-none focus:border-[#F0A451] transition"
                  />
                  <input
                    id="auth-last-name"
                    name="lastName"
                    type="text"
                    placeholder="Last name"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="auth-modal-input w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-[#F4EFE6] placeholder-[#89857D] focus:outline-none focus:border-[#F0A451] transition"
                  />
                </div>
              )}

              {/* Email Input */}
              <div>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-modal-input w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-[#F4EFE6] placeholder-[#89857D] focus:outline-none focus:border-[#F0A451] transition"
                />
              </div>

              {/* Password Input with Show/Hide Eye Toggle */}
              <div className="relative">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-modal-input w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/15 text-xs text-[#F4EFE6] placeholder-[#89857D] focus:outline-none focus:border-[#F0A451] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#89857D] hover:text-[#F4EFE6] transition p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Checkbox: Terms & Conditions */}
              {isRegister && (
                <div className="flex items-center gap-2.5 pt-1">
                  <div
                    onClick={() => setAgreeTerms(!agreeTerms)}
                    className={`w-4 h-4 rounded-md flex items-center justify-center cursor-pointer border transition ${
                      agreeTerms
                        ? 'bg-[#F0A451] border-[#F0A451] text-[#17120C]'
                        : 'bg-black/40 border-white/20'
                    }`}
                  >
                    {agreeTerms && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-[11px] text-[#89857D]">
                    I agree to the{' '}
                    <span
                      onClick={() => onOpenLegal && onOpenLegal('terms')}
                      className="text-[#B9B2A8] underline hover:text-[#F0A451] cursor-pointer transition-colors"
                    >
                      Terms &amp; Conditions
                    </span>
                  </span>
                </div>
              )}

              {/* Primary Action Button (Create account / Sign in) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#F0A451] hover:bg-[#FFB96B] active:scale-95 disabled:opacity-40 text-[#17120C] font-black text-xs sm:text-sm transition-all shadow-sm mt-2"
              >
                {loading
                  ? 'Processing...'
                  : isRegister
                  ? 'Create account'
                  : 'Sign in to account'}
              </button>
            </form>

            {/* Quick 1-Click Test Reviewer Accounts */}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <span className="text-[10px] text-[#89857D] uppercase font-bold tracking-wider text-center">
                Reviewer Quick 1-Click Access
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('customer')}
                  className="auth-modal-quick-btn py-2 px-2.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/15 text-left transition flex items-center gap-2 group cursor-pointer"
                >
                  <UserAvatarIcon className="w-3.5 h-3.5 text-[#B9B2A8] group-hover:text-[#F0A451]" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#F4EFE6]">Customer</span>
                    <span className="text-[9px] text-[#89857D]">Alex Mercer</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  className="auth-modal-quick-btn py-2 px-2.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/15 text-left transition flex items-center gap-2 group cursor-pointer"
                >
                  <SecurityShieldIcon className="w-3.5 h-3.5 text-[#F0A451]" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#F0A451]">Admin Staff</span>
                    <span className="text-[9px] text-[#89857D]">Administrator</span>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>

        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null;
};
