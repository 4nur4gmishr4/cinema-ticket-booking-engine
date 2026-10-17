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
  sectionId?: string | null;
}

/**
 * Universal scroll controller:
 * - If targetSectionId is provided, smoothly scrolls to that element with navbar offset
 * - If targetSectionId is omitted or null, ALWAYS opens the page cleanly at the very top (0, 0)
 */
export const scrollToTopOrSection = (targetSectionId?: string | null) => {
  if (typeof window === 'undefined') return;

  if (targetSectionId) {
    let attempts = 0;
    const maxAttempts = 15;
    const checkAndScroll = () => {
      const element = document.getElementById(targetSectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkAndScroll, 60);
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    };
    requestAnimationFrame(checkAndScroll);
  } else {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
};

const parseHash = (): RouteState => {
  if (typeof window === 'undefined') {
    return { view: 'movies', movieId: null, showId: null, sectionId: null };
  }
  const rawHash = window.location.hash.replace(/^#\/?/, '');
  if (!rawHash) {
    return { view: 'movies', movieId: null, showId: null, sectionId: null };
  }

  let path = rawHash;
  let sectionId: string | null = null;

  // Extract secondary anchor e.g. "movie/1#showtimes" or "movies#theatres"
  if (path.includes('#')) {
    const parts = path.split('#');
    path = parts[0];
    sectionId = parts[1] || null;
  }

  let queryParams: URLSearchParams | null = null;
  if (path.includes('?')) {
    const parts = path.split('?');
    path = parts[0];
    queryParams = new URLSearchParams(parts[1]);
    if (!sectionId && queryParams.get('section')) {
      sectionId = queryParams.get('section');
    }
  }

  // Section aliases pointing to home sections
  if (['theatres', 'now-showing', 'catalog', 'all-movies'].includes(path)) {
    return { view: 'movies', movieId: null, showId: null, sectionId: 'theatres' };
  }
  if (['releases', 'this-weeks-releases', 'featured'].includes(path)) {
    return { view: 'movies', movieId: null, showId: null, sectionId: 'releases' };
  }
  if (['hero', 'spotlight', 'top'].includes(path)) {
    return { view: 'movies', movieId: null, showId: null, sectionId: 'hero' };
  }
  if (['search'].includes(path)) {
    return { view: 'movies', movieId: null, showId: null, sectionId: 'theatres' };
  }

  if (!path || path === 'movies') {
    return { view: 'movies', movieId: null, showId: null, sectionId };
  }

  if (path.startsWith('movie/')) {
    const id = parseInt(path.replace('movie/', ''), 10);
    return { view: 'movie-detail', movieId: isNaN(id) ? null : id, showId: null, sectionId };
  }

  if (path.startsWith('booking/')) {
    const showId = parseInt(path.replace('booking/', ''), 10);
    let movieId: number | null = null;
    if (queryParams && queryParams.get('movie')) {
      const mId = parseInt(queryParams.get('movie')!, 10);
      if (!isNaN(mId)) movieId = mId;
    }
    return { view: 'booking', movieId, showId: isNaN(showId) ? null : showId, sectionId };
  }

  if (path === 'my-bookings') {
    return { view: 'my-bookings', movieId: null, showId: null, sectionId };
  }

  if (path === 'admin') {
    return { view: 'admin', movieId: null, showId: null, sectionId };
  }

  if (path.startsWith('legal/')) {
    const sec = path.replace('legal/', '') as LegalSection;
    if (['terms', 'privacy', 'cookies', 'guidelines'].includes(sec)) {
      return { view: sec, movieId: null, showId: null, sectionId };
    }
  }

  if (['terms', 'privacy', 'cookies', 'guidelines'].includes(path)) {
    return { view: path as LegalSection, movieId: null, showId: null, sectionId };
  }

  return { view: 'movies', movieId: null, showId: null, sectionId };
};

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('movies');
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingNavView, setPendingNavView] = useState<ViewMode | null>(null);

  // Synchronize URL hash with history entries and handle page scroll
  const navigateTo = useCallback(
    (
      view: ViewMode,
      movieId?: number | null,
      showId?: number | null,
      replace: boolean = false,
      sectionId?: string | null
    ) => {
      let targetHash = '#/';
      if (view === 'movies') {
        targetHash = sectionId ? `#/${sectionId}` : '#/';
      } else if (view === 'movie-detail' && movieId) {
        targetHash = sectionId ? `#/movie/${movieId}#${sectionId}` : `#/movie/${movieId}`;
      } else if (view === 'booking' && showId) {
        const base = movieId ? `#/booking/${showId}?movie=${movieId}` : `#/booking/${showId}`;
        targetHash = sectionId ? `${base}#${sectionId}` : base;
      } else if (view === 'my-bookings') {
        targetHash = sectionId ? `#/my-bookings#${sectionId}` : '#/my-bookings';
      } else if (view === 'admin') {
        targetHash = sectionId ? `#/admin#${sectionId}` : '#/admin';
      } else if (['terms', 'privacy', 'cookies', 'guidelines'].includes(view)) {
        targetHash = `#/legal/${view}`;
      }

      const state: RouteState = {
        view,
        movieId: movieId !== undefined ? movieId : null,
        showId: showId !== undefined ? showId : null,
        sectionId: sectionId || null,
      };

      if (replace) {
        window.history.replaceState(state, '', targetHash);
      } else if (window.location.hash !== targetHash) {
        window.history.pushState(state, '', targetHash);
      }

      setCurrentView(view);
      if (movieId !== undefined) setSelectedMovieId(movieId);
      if (showId !== undefined) setSelectedShowId(showId);

      // Scroll cleanly to top (or to specific target section if requested)
      scrollToTopOrSection(sectionId);
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

  // Listen for browser Back/Forward (popstate) & Hash Change
  useEffect(() => {
    const handleUrlChange = () => {
      const route = parseHash();
      setCurrentView(route.view);
      setSelectedMovieId(route.movieId);
      setSelectedShowId(route.showId);
      setIsAuthModalOpen(false);
      scrollToTopOrSection(route.sectionId);
    };

    // On initial mount, sync from hash or set base #/
    if (window.location.hash) {
      const initial = parseHash();
      setCurrentView(initial.view);
      setSelectedMovieId(initial.movieId);
      setSelectedShowId(initial.showId);
      scrollToTopOrSection(initial.sectionId);
    } else {
      window.history.replaceState(
        { view: 'movies', movieId: null, showId: null, sectionId: null },
        '',
        '#/'
      );
      scrollToTopOrSection(null);
    }

    // Intercept clicks on anchor tags pointing to sections or hash routes
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      const section = href.replace(/^#\/?/, '');
      if (section) {
        const el = document.getElementById(section);
        if (el) {
          e.preventDefault();
          scrollToTopOrSection(section);
          window.history.replaceState(null, '', href);
        }
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    document.addEventListener('click', handleAnchorClick);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      document.removeEventListener('click', handleAnchorClick);
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

  const handleNavClick = (view: 'movies' | 'my-bookings' | 'admin', sectionId?: string) => {
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
    navigateTo(view, null, null, false, sectionId);
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
