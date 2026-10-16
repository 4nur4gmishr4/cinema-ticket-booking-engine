import React, { useEffect, useId } from 'react';

interface FilmReelLogoProps {
  className?: string;
  size?: number;
}

// Global Master Synchronizer:
// Drives all instances of FilmReelLogo across the entire document
// with 100% mathematical synchronization down to the millisecond.
let subscriberCount = 0;
let rafId: number | null = null;

function startReelSync() {
  if (typeof window === 'undefined') return;

  const loop = () => {
    // Exact 4000ms loop: 1000ms spin with smooth ease-out, 3000ms pause
    const elapsed = Date.now() % 4000;
    let deg = 0;
    if (elapsed < 1000) {
      const p = elapsed / 1000;
      // Cubic ease-out matching cubic-bezier(0.25, 1, 0.5, 1)
      const ease = 1 - Math.pow(1 - p, 3.2);
      deg = ease * 360;
    } else {
      deg = 0;
    }

    document.documentElement.style.setProperty('--film-reel-deg', `${deg.toFixed(2)}deg`);
    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);
}

function stopReelSync() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

export const FilmReelLogo: React.FC<FilmReelLogoProps> = ({ className = 'w-8 h-8', size = 32 }) => {
  const maskId = useId();

  useEffect(() => {
    subscriberCount++;
    if (subscriberCount === 1) {
      startReelSync();
    }
    return () => {
      subscriberCount--;
      if (subscriberCount === 0) {
        stopReelSync();
      }
    };
  }, []);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 150 150"
        width={size}
        height={size}
        className="w-full h-full overflow-visible select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id={maskId}>
            {/* White canvas - allows everything to show */}
            <rect x="0" y="0" width="150" height="150" fill="#FFFFFF" />
            {/* Center axle hole */}
            <circle cx="73.56" cy="74.68" r="7" fill="#000000" />
            {/* 5 Spool cutout circular holes */}
            <circle cx="59.98" cy="43.68" r="15.2" fill="#000000" />
            <circle cx="98.81" cy="52.76" r="15.2" fill="#000000" />
            <circle cx="101.63" cy="92.63" r="15.2" fill="#000000" />
            <circle cx="65.55" cy="107.52" r="15.2" fill="#000000" />
            <circle cx="39.54" cy="77.19" r="15.2" fill="#000000" />
          </mask>
        </defs>

        {/* Master Synchronized Spool: Controlled via CSS custom property --film-reel-deg */}
        <g
          className="film-reel-wheel"
          style={{
            transformOrigin: '73.56px 74.68px',
            transform: 'rotate(var(--film-reel-deg, 0deg))',
          }}
        >
          {/* Main Reel Circle */}
          <circle
            cx="73.56"
            cy="74.68"
            r="59"
            fill="#F0A451"
            mask={`url(#${maskId})`}
          />
          {/* Bottom trailing film strip that spins with the reel */}
          <path
            d="M 73.56 127.5 L 135 127.5 C 136.5 127.5 137.5 129 137.5 130.75 C 137.5 132.5 136.5 134 135 134 L 73.56 134 Z"
            fill="#F0A451"
          />
        </g>
      </svg>
    </div>
  );
};
