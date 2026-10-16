import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { MovieCatalogPage } from './pages/MovieCatalogPage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { SeatBookingPage } from './pages/SeatBookingPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { AdminPage } from './pages/AdminPage';
import { LegalPage, type LegalSection } from './pages/LegalPage';

type ViewMode = 'movies' | 'movie-detail' | 'booking' | 'my-bookings' | 'admin' | LegalSection;

interface RouteState {
  view: ViewMode;
  movieId: number | null;
  showId: number | null;
}

const parseHash = (): RouteState => {
  if (typeof window === 'undefined') {
    return { view: 'movies', movieId: null, showId: null };
  }
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash || hash === 'movies') {
    return { view: 'movies', movieId: null, showId: null };
  }
  if (hash.startsWith('movie/')) {
    const id = parseInt(hash.replace('movie/', ''), 10);
    return { view: 'movie-detail', movieId: isNaN(id) ? null : id, showId: null };
  }
  if (hash.startsWith('booking/')) {
    const parts = hash.replace('booking/', '').split('?');
    const showId = parseInt(parts[0], 10);
    let movieId: number | null = null;
    if (parts[1]) {
      const params = new URLSearchParams(parts[1]);
      const mId = params.get('movie');
      if (mId) movieId = parseInt(mId, 10);
    }
    return { view: 'booking', movieId, showId: isNaN(showId) ? null : showId };
  }
  if (hash === 'my-bookings') {
    return { view: 'my-bookings', movieId: null, showId: null };
  }
  if (hash === 'admin') {
    return { view: 'admin', movieId: null, showId: null };
  }
  if (hash.startsWith('legal/')) {
    const sec = hash.replace('legal/', '') as LegalSection;
    if (['terms', 'privacy', 'cookies', 'guidelines'].includes(sec)) {
      return { view: sec, movieId: null, showId: null };
    }
  }
  if (['terms', 'privacy', 'cookies', 'guidelines'].includes(hash)) {
    return { view: hash as LegalSection, movieId: null, showId: null };
  }
  return { view: 'movies', movieId: null, showId: null };
};

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('movies');
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingNavView, setPendingNavView] = useState<ViewMode | null>(null);

  // Synchronize URL hash with history entries
  const navigateTo = useCallback(
    (view: ViewMode, movieId?: number | null, showId?: number | null, replace: boolean = false) => {
      let targetHash = '#/';
      if (view === 'movies') {
        targetHash = '#/';
      } else if (view === 'movie-detail' && movieId) {
        targetHash = `#/movie/${movieId}`;
      } else if (view === 'booking' && showId) {
        targetHash = movieId ? `#/booking/${showId}?movie=${movieId}` : `#/booking/${showId}`;
      } else if (view === 'my-bookings') {
        targetHash = '#/my-bookings';
      } else if (view === 'admin') {
        targetHash = '#/admin';
      } else if (['terms', 'privacy', 'cookies', 'guidelines'].includes(view)) {
        targetHash = `#/legal/${view}`;
      }

      const state: RouteState = {
        view,
        movieId: movieId !== undefined ? movieId : null,
        showId: showId !== undefined ? showId : null,
      };

      if (replace) {
        window.history.replaceState(state, '', targetHash);
      } else if (window.location.hash !== targetHash) {
        window.history.pushState(state, '', targetHash);
      }

      setCurrentView(view);
      if (movieId !== undefined) setSelectedMovieId(movieId);
      if (showId !== undefined) setSelectedShowId(showId);
    },
    []
  );

  // Handle in-page Back action with seamless browser history pop fallback
  const handleGoBack = useCallback(
    (fallbackView: ViewMode = 'movies', fallbackMovieId: number | null = null) => {
      if (window.history.state !== null && window.history.length > 1) {
        window.history.back();
      } else {
        navigateTo(fallbackView, fallbackMovieId, null, true);
      }
    },
    [navigateTo]
  );

  // Listen for browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseHash();
      setCurrentView(route.view);
      setSelectedMovieId(route.movieId);
      setSelectedShowId(route.showId);
      setIsAuthModalOpen(false);
    };

    // On initial mount, sync from hash or set base #/
    if (window.location.hash) {
      const initial = parseHash();
      setCurrentView(initial.view);
      setSelectedMovieId(initial.movieId);
      setSelectedShowId(initial.showId);
    } else {
      window.history.replaceState(
        { view: 'movies', movieId: null, showId: null },
        '',
        '#/'
      );
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // When admin logs in, switch immediately to Admin Console (unless viewing legal pages); on logout return to movies
  useEffect(() => {
    const isLegal = ['terms', 'privacy', 'cookies', 'guidelines'].includes(currentView);
    if (user?.role === 'admin' && currentView !== 'admin' && !isLegal) {
      navigateTo('admin');
    } else if (!user && currentView === 'admin') {
      navigateTo('movies');
    }
  }, [user, currentView, navigateTo]);

  const handleSelectMovie = (movieId: number) => {
    navigateTo('movie-detail', movieId);
  };

  const handleSelectShow = (showId: number) => {
    navigateTo('booking', selectedMovieId, showId);
  };

  const handleNavClick = (view: 'movies' | 'my-bookings' | 'admin') => {
    if (view === 'my-bookings' && !user) {
      setPendingNavView('my-bookings');
      setIsAuthModalOpen(true);
      return;
    }
    if (view === 'admin' && user?.role !== 'admin') {
      setPendingNavView('admin');
      setIsAuthModalOpen(true);
      return;
    }
    navigateTo(view);
  };

  const handleOpenLegal = (section: LegalSection) => {
    setIsAuthModalOpen(false);
    navigateTo(section);
  };

  const isLegalView =
    currentView === 'terms' ||
    currentView === 'privacy' ||
    currentView === 'cookies' ||
    currentView === 'guidelines';

  return (
    <div className="min-h-screen w-full bg-[#101110] text-[#F4EFE6] flex flex-col selection:bg-[#F0A451] selection:text-[#17120C] transition-colors">
      {/* Navigation Bar with Theme Switcher & User Profile Menu */}
      <Navbar
        currentView={currentView === 'movie-detail' || currentView === 'booking' || isLegalView ? 'movies' : currentView}
        onNavigate={handleNavClick}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onNavigateLegal={handleOpenLegal}
      />

      {/* View Router */}
      <main className="flex-1 w-full pb-16">
        {currentView === 'movies' && (
          <MovieCatalogPage onSelectMovie={handleSelectMovie} />
        )}

        {currentView === 'movie-detail' && selectedMovieId && (
          <MovieDetailPage
            movieId={selectedMovieId}
            onBack={() => handleGoBack('movies')}
            onSelectShow={handleSelectShow}
          />
        )}

        {currentView === 'booking' && selectedShowId && (
          <SeatBookingPage
            showId={selectedShowId}
            onBack={() => {
              if (selectedMovieId) {
                handleGoBack('movie-detail', selectedMovieId);
              } else {
                handleGoBack('movies');
              }
            }}
            onViewMyBookings={() => navigateTo('my-bookings')}
            onRequireAuth={() => {
              setPendingNavView('booking');
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {currentView === 'my-bookings' && (
          <MyBookingsPage
            onRequireAuth={() => {
              setPendingNavView('my-bookings');
              setIsAuthModalOpen(true);
            }}
            onBrowseMovies={() => navigateTo('movies')}
          />
        )}

        {currentView === 'admin' && <AdminPage />}

        {/* Dedicated Separate Full Page for Legal Policies (NOT a popup modal) */}
        {isLegalView && (
          <LegalPage
            activeSection={currentView as LegalSection}
            onBack={() => handleGoBack('movies')}
            onSelectSection={(sec) => navigateTo(sec)}
          />
        )}
      </main>

      {/* Theatrical Cinema Footer */}
      <Footer
        onNavigate={handleNavClick}
        onNavigateLegal={handleOpenLegal}
      />

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingNavView(null);
        }}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          if (pendingNavView) {
            const target = pendingNavView;
            setPendingNavView(null);
            navigateTo(target, selectedMovieId, selectedShowId);
          }
        }}
        onOpenLegal={handleOpenLegal}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
