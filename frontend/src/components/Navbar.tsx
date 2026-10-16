import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LogOut, 
  FileText, 
  Lock,
  Cookie,
  AlertCircle 
} from 'lucide-react';
import { FilmReelLogo } from './FilmReelLogo';
import { 
  SunIcon, 
  MoonIcon, 
  LocationPinIcon, 
  UserAvatarIcon, 
  MovieReelIcon, 
  TicketStubIcon, 
  SecurityShieldIcon 
} from './Icons';
import type { LegalSection } from '../pages/LegalPage';

interface NavbarProps {
  currentView: 'movies' | 'my-bookings' | 'admin' | 'booking';
  onNavigate: (view: 'movies' | 'my-bookings' | 'admin') => void;
  onOpenAuth: () => void;
  onNavigateLegal?: (section: LegalSection) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentView, 
  onNavigate, 
  onOpenAuth, 
  onNavigateLegal 
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);

  const displayName = user
    ? (user.role === 'admin' || user.name === 'Cinema Administrator' ? 'Cinema Admin' : user.name)
    : '';

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inDesktop = profileMenuRef.current?.contains(target);
      const inMobile = mobileSheetRef.current?.contains(target);
      if (!inDesktop && !inMobile) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const handleAction = (callback: () => void) => {
    setIsProfileOpen(false);
    callback();
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="app-header sticky top-0 z-40 w-full px-4 sm:px-6 md:px-8 lg:px-12 py-3 transition-all duration-300">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Left: Brand & Venue */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div
              className="flex items-center gap-2.5 cursor-pointer group shrink-0"
              onClick={() => onNavigate(user?.role === 'admin' ? 'admin' : 'movies')}
            >
              <div className="shrink-0 group-hover:scale-105 active:scale-95 transition-transform">
                <FilmReelLogo size={30} />
              </div>
              <span className="font-extrabold text-base sm:text-lg tracking-[0.2em] text-[#F4EFE6] select-none group-hover:text-[#F0A451] transition-colors">
                YOZIGO
              </span>
            </div>

            {/* Cinema Venue Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-full pill-btn text-xs select-none cursor-default">
              <LocationPinIcon className="w-3.5 h-3.5 text-[#F0A451] shrink-0" />
              <span className="font-semibold text-[#F4EFE6]">Bengaluru</span>
            </div>
          </div>

          {/* Center Category Navigation (Desktop): Admin sees Admin Console, Customer sees Movies & My Bookings */}
          <nav className="hidden sm:flex items-center gap-1 bg-[#191A18] p-1 rounded-full border border-[#34332F] shadow-sm">
            {user?.role === 'admin' ? (
              <button
                onClick={() => onNavigate('admin')}
                className="flex items-center gap-2 h-8 px-4 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer bg-[#F0A451] text-[#17120C] shadow-sm"
              >
                <SecurityShieldIcon className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('movies')}
                  className={`flex items-center gap-2 h-8 px-4 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    currentView === 'movies'
                      ? 'bg-[#F0A451] text-[#17120C] shadow-sm'
                      : 'text-[#B9B2A8] hover:text-[#F4EFE6] hover:bg-[#22231F]'
                  }`}
                >
                  <MovieReelIcon className="w-3.5 h-3.5" />
                  <span>Movies</span>
                </button>

                <button
                  onClick={() => onNavigate('my-bookings')}
                  className={`flex items-center gap-2 h-8 px-4 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    currentView === 'my-bookings'
                      ? 'bg-[#F0A451] text-[#17120C] shadow-sm'
                      : 'text-[#B9B2A8] hover:text-[#F4EFE6] hover:bg-[#22231F]'
                  }`}
                >
                  <TicketStubIcon className="w-3.5 h-3.5" />
                  <span>My Bookings</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Controls: Theme Toggle + Profile / Auth */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 relative" ref={profileMenuRef}>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-full pill-btn flex items-center justify-center text-[#B9B2A8] hover:text-[#F4EFE6] transition-all active:scale-90 cursor-pointer shadow-sm"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-4 h-4 text-[#F0A451] transition-transform hover:rotate-45" />
              ) : (
                <MoonIcon className="w-4 h-4 text-[#89857D] hover:text-[#171513] transition-transform hover:-rotate-12" />
              )}
            </button>

            {user ? (
              <div className="relative">
                {/* Profile Trigger Button */}
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  title={`${displayName} - Account`}
                  className={`flex items-center gap-2 h-9 pl-2.5 pr-3.5 rounded-full border transition-all active:scale-95 cursor-pointer ${
                    isProfileOpen 
                      ? 'bg-[#22231F] border-[#514B43]' 
                      : 'pill-btn'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-[#F0A451]/15 text-[#F0A451] flex items-center justify-center shrink-0">
                    <UserAvatarIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="hidden sm:inline text-xs font-bold text-[#F4EFE6] max-w-[120px] truncate">
                    {displayName}
                  </span>
                </button>

                {/* User Profile Dropdown Menu (Desktop) */}
                {isProfileOpen && (
                  <div className="hidden sm:flex profile-dropdown-menu absolute right-0 mt-2 w-56 sm:w-60 rounded-2xl backdrop-blur-2xl border shadow-xl p-1.5 z-50 flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150 select-none">
                    
                    {/* User Info Header */}
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8E8E93] truncate border-b border-black/5 dark:border-white/10">
                      {user.email || user.name}
                    </div>

                    {/* Menu Items: All 4 Cinema Legal & Policy Sections */}
                    <div className="py-0.5 flex flex-col gap-0.5">
                      <button
                        onClick={() => handleAction(() => onNavigateLegal?.('terms'))}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium profile-menu-item hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer group"
                      >
                        <span>Terms &amp; Conditions</span>
                        <FileText className="w-3.5 h-3.5 text-[#8E8E93] group-hover:text-[#F0A451] transition-colors" />
                      </button>

                      <button
                        onClick={() => handleAction(() => onNavigateLegal?.('privacy'))}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium profile-menu-item hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer group"
                      >
                        <span>Privacy Policy</span>
                        <Lock className="w-3.5 h-3.5 text-[#8E8E93] group-hover:text-[#F0A451] transition-colors" />
                      </button>

                      <button
                        onClick={() => handleAction(() => onNavigateLegal?.('cookies'))}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium profile-menu-item hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer group"
                      >
                        <span>Cookie Policy</span>
                        <Cookie className="w-3.5 h-3.5 text-[#8E8E93] group-hover:text-[#F0A451] transition-colors" />
                      </button>

                      <button
                        onClick={() => handleAction(() => onNavigateLegal?.('guidelines'))}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium profile-menu-item hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer group"
                      >
                        <span>Content Guidelines</span>
                        <AlertCircle className="w-3.5 h-3.5 text-[#8E8E93] group-hover:text-[#F0A451] transition-colors" />
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="h-[0.5px] bg-black/10 dark:bg-white/10 mx-2 my-0.5" />

                    {/* Log Out */}
                    <button
                      onClick={() => handleAction(logout)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold text-[#FF453A] hover:bg-[#FF453A]/10 active:bg-[#FF453A]/20 transition-colors cursor-pointer"
                    >
                      <span>Log Out</span>
                      <LogOut className="w-3.5 h-3.5 text-[#FF453A]" />
                    </button>

                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 h-9 px-4 rounded-full pill-btn font-bold text-xs transition-all active:scale-95 shadow-sm cursor-pointer group"
              >
                <UserAvatarIcon className="w-4 h-4 text-[#B9B2A8] group-hover:text-[#F0A451] transition-colors shrink-0" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Action Sheet when Profile is Open */}
      {isProfileOpen && user && (
        <div
          onClick={() => setIsProfileOpen(false)}
          className="sm:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end p-3 animate-fadeIn"
        >
          <div
            ref={mobileSheetRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-[#191A18] border border-[#34332F] rounded-2xl p-2 flex flex-col gap-1 shadow-2xl animate-in slide-in-from-bottom duration-200 select-none"
          >
            <div className="px-4 py-2.5 text-center border-b border-[#34332F]">
              <p className="text-xs font-bold text-[#F4EFE6]">{displayName}</p>
              <p className="text-[11px] text-[#89857D] truncate mt-0.5">{user.email}</p>
            </div>

            <button
              type="button"
              onClick={() => handleAction(() => onNavigateLegal?.('terms'))}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-semibold text-[#F4EFE6] hover:bg-white/5 active:bg-white/10 transition cursor-pointer"
            >
              <span>Terms &amp; Conditions</span>
              <FileText className="w-4 h-4 text-[#8E8E93]" />
            </button>

            <button
              type="button"
              onClick={() => handleAction(() => onNavigateLegal?.('privacy'))}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-semibold text-[#F4EFE6] hover:bg-white/5 active:bg-white/10 transition cursor-pointer"
            >
              <span>Privacy Policy</span>
              <Lock className="w-4 h-4 text-[#8E8E93]" />
            </button>

            <button
              type="button"
              onClick={() => handleAction(() => onNavigateLegal?.('cookies'))}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-semibold text-[#F4EFE6] hover:bg-white/5 active:bg-white/10 transition cursor-pointer"
            >
              <span>Cookie Policy</span>
              <Cookie className="w-4 h-4 text-[#8E8E93]" />
            </button>

            <button
              type="button"
              onClick={() => handleAction(() => onNavigateLegal?.('guidelines'))}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-semibold text-[#F4EFE6] hover:bg-white/5 active:bg-white/10 transition cursor-pointer"
            >
              <span>Content Guidelines</span>
              <AlertCircle className="w-4 h-4 text-[#8E8E93]" />
            </button>

            <div className="h-px bg-[#34332F] mx-2 my-1" />

            <button
              onClick={() => handleAction(logout)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-bold text-[#FF453A] hover:bg-[#FF453A]/10 active:bg-[#FF453A]/20 transition cursor-pointer"
            >
              <span>Log Out</span>
              <LogOut className="w-4 h-4 text-[#FF453A]" />
            </button>
          </div>

          <button
            onClick={() => setIsProfileOpen(false)}
            className="mt-2 w-full py-3 rounded-2xl bg-[#101110] border border-[#34332F] text-xs font-black text-[#F4EFE6] active:scale-98 transition shadow-lg cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Mobile Sticky Bottom Navigation Dock: Admin sees Admin Console, Customer sees Movies & Bookings */}
      {currentView !== 'booking' && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#101110] border-t border-[#34332F] py-2 px-4 flex items-center justify-around shadow-2xl safe-area-bottom">
          {user?.role === 'admin' ? (
            <button
              onClick={() => onNavigate('admin')}
              className="flex flex-col items-center gap-1 py-1 px-4 rounded-full text-[#F0A451] font-bold transition active:scale-90"
            >
              <SecurityShieldIcon className="w-5 h-5" />
              <span className="text-[10px]">Admin Console</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => onNavigate('movies')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-full transition active:scale-90 ${
                  currentView === 'movies' ? 'text-[#F0A451] font-bold' : 'text-[#89857D]'
                }`}
              >
                <MovieReelIcon className="w-5 h-5" />
                <span className="text-[10px]">Movies</span>
              </button>

              <button
                onClick={() => onNavigate('my-bookings')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-full transition active:scale-90 ${
                  currentView === 'my-bookings' ? 'text-[#F0A451] font-bold' : 'text-[#89857D]'
                }`}
              >
                <TicketStubIcon className="w-5 h-5" />
                <span className="text-[10px]">Bookings</span>
              </button>
            </>
          )}

          <button
            onClick={user ? () => setIsProfileOpen(!isProfileOpen) : onOpenAuth}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-full text-[#89857D] transition active:scale-90 cursor-pointer"
          >
            <UserAvatarIcon className="w-5 h-5" />
            <span className="text-[10px]">{user ? 'Account' : 'Sign In'}</span>
          </button>
        </nav>
      )}
    </>
  );
};
