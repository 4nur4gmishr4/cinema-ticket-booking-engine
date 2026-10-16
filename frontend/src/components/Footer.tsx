import React from 'react';
import { FilmReelLogo } from './FilmReelLogo';
import { MapPin, Film, Ticket, Shield, FileText, Lock, Cookie, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { LegalSection } from '../pages/LegalPage';

interface FooterProps {
  onNavigate: (view: 'movies' | 'my-bookings' | 'admin') => void;
  onNavigateLegal: (section: LegalSection) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onNavigateLegal }) => {
  const { user } = useAuth();

  return (
    <footer className="w-full bg-[#101110] text-[#B9B2A8] border-t border-[#34332F]/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pt-12 pb-28 sm:pb-12 flex flex-col gap-10">
        
        {/* Main Grid: Purely Functional Cinema Links Only */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 items-start">
          
          {/* Brand & Venue Identity */}
          <div className="flex flex-col gap-3.5 sm:col-span-2">
            <div 
              className="flex items-center gap-2.5 cursor-pointer group w-fit"
              onClick={() => onNavigate(user?.role === 'admin' ? 'admin' : 'movies')}
            >
              <div className="shrink-0 group-hover:scale-105 active:scale-95 transition-transform">
                <FilmReelLogo size={32} />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-[0.18em] text-[#F4EFE6] select-none group-hover:text-[#F0A451] transition-colors leading-none">
                  YOZIGO
                </span>
                <span className="text-[9px] font-extrabold tracking-[0.25em] text-[#89857D] uppercase mt-1">
                  CINEMA ENGINE
                </span>
              </div>
            </div>

            <p className="text-xs text-[#89857D] leading-relaxed max-w-sm">
              Curated theatrical releases with deterministic seat booking and real-time concurrency protection.
            </p>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191A18] border border-[#34332F] text-xs text-[#B9B2A8] w-fit">
              <MapPin className="w-3.5 h-3.5 text-[#F0A451] shrink-0" />
              <span className="font-semibold text-[#F4EFE6]">Bengaluru, India</span>
            </div>
          </div>

          {/* Column 1: Explore (Direct Navigation - Admin sees Admin Console, Customer sees Movies & My Bookings) */}
          <div className="flex flex-col gap-3">
            <span className="font-bold text-xs uppercase tracking-wider text-[#F4EFE6]">
              Explore
            </span>
            <ul className="flex flex-col gap-2.5 text-xs text-[#89857D]">
              {user?.role === 'admin' ? (
                <li>
                  <button
                    onClick={() => onNavigate('admin')}
                    className="flex items-center gap-2 hover:text-[#F0A451] transition-colors text-left cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span>Admin Console</span>
                  </button>
                </li>
              ) : (
                <>
                  <li>
                    <button
                      onClick={() => onNavigate('movies')}
                      className="flex items-center gap-2 hover:text-[#F0A451] transition-colors text-left cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5 shrink-0" />
                      <span>Now Showing</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onNavigate('my-bookings')}
                      className="flex items-center gap-2 hover:text-[#F0A451] transition-colors text-left cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5 shrink-0" />
                      <span>My Bookings</span>
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Column 2: Legal & Policies (Dedicated Full Pages) */}
          <div className="flex flex-col gap-3">
            <span className="font-bold text-xs uppercase tracking-wider text-[#F4EFE6]">
              Policies
            </span>
            <ul className="flex flex-col gap-2.5 text-xs text-[#89857D]">
              <li>
                <button
                  onClick={() => onNavigateLegal('terms')}
                  className="flex items-center gap-2 hover:text-[#F0A451] transition-colors text-left cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>Terms &amp; Conditions</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateLegal('privacy')}
                  className="flex items-center gap-2 hover:text-[#F0A451] transition-colors text-left cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateLegal('cookies')}
                  className="flex items-center gap-2 hover:text-[#F0A451] transition-colors text-left cursor-pointer"
                >
                  <Cookie className="w-3.5 h-3.5 shrink-0" />
                  <span>Cookie Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateLegal('guidelines')}
                  className="flex items-center gap-2 hover:text-[#F0A451] transition-colors text-left cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Content Guidelines</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Subtle Horizontal Divider */}
        <div className="w-full h-px bg-[#34332F]/50" />

        {/* Bottom Bar: Clean Copyright & Terms Acknowledgment */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#89857D]">
          <span>
            &copy; {new Date().getFullYear()} Yozigo Cinema. All rights reserved.
          </span>

          <p className="text-[11px] text-[#89857D]/70 max-w-xl text-left sm:text-right">
            Engineered for deterministic cinema seat reservations with real-time seat locks and verified ticket issuance.
          </p>
        </div>

      </div>
    </footer>
  );
};
