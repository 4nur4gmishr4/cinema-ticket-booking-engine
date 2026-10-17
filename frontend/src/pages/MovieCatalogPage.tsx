import React, { useState, useEffect, useRef } from 'react';
import type { Movie } from '../types';
import { api } from '../services/api';
import { Film, AlertCircle, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { SearchIcon, FilterSlidersIcon, PlayArrowIcon } from '../components/Icons';

interface MovieCatalogPageProps {
  onSelectMovie: (movieId: number) => void;
}

const INITIAL_CATALOG_FALLBACK: Movie[] = [
  {
    id: 1,
    title: "The Dark Knight",
    genre: "Action / Crime / Drama",
    language: "English",
    duration_mins: 152,
    certification: "UA",
    poster_url: "/posters/dark_knight.jpg",
    description: "When the menace known as the Joker wreaks havoc and chaos on Gotham City, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    release_date: "2008-07-18"
  },
  {
    id: 2,
    title: "Interstellar",
    genre: "Sci-Fi / Adventure / Drama",
    language: "English",
    duration_mins: 169,
    certification: "UA",
    poster_url: "/posters/interstellar.jpg",
    description: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
    release_date: "2014-11-07"
  },
  {
    id: 3,
    title: "Inception",
    genre: "Sci-Fi / Action / Thriller",
    language: "English",
    duration_mins: 148,
    certification: "UA",
    poster_url: "/posters/inception.jpg",
    description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project.",
    release_date: "2010-07-16"
  },
  {
    id: 4,
    title: "Oppenheimer",
    genre: "Biography / Drama / History",
    language: "English",
    duration_mins: 180,
    certification: "A",
    poster_url: "/posters/oppenheimer.jpg",
    description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during the Manhattan Project, exploring the moral and political aftermath.",
    release_date: "2023-07-21"
  },
  {
    id: 5,
    title: "Avengers: Endgame",
    genre: "Action / Sci-Fi / Adventure",
    language: "English",
    duration_mins: 181,
    certification: "UA",
    poster_url: "/posters/avengers_endgame.jpg",
    description: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance.",
    release_date: "2019-04-26"
  },
  {
    id: 6,
    title: "Gladiator",
    genre: "Action / Drama / Adventure",
    language: "English",
    duration_mins: 155,
    certification: "A",
    poster_url: "/posters/gladiator.jpg",
    description: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery, rising through the ranks of the Colosseum arena.",
    release_date: "2000-05-05"
  }
];

export const MovieCatalogPage: React.FC<MovieCatalogPageProps> = ({ onSelectMovie }) => {
  const [movies, setMovies] = useState<Movie[]>(() => {
    try {
      const cached = localStorage.getItem('yozigo_movies_cache') || sessionStorage.getItem('yozigo_movies');
      return cached ? JSON.parse(cached) : INITIAL_CATALOG_FALLBACK;
    } catch {
      return INITIAL_CATALOG_FALLBACK;
    }
  });
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState<string>('ALL');
  const [selectedLang, setSelectedLang] = useState<string>('ALL');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const data = await api.getMovies();
      if (Array.isArray(data) && data.length > 0) {
        setMovies(data);
        try {
          localStorage.setItem('yozigo_movies_cache', JSON.stringify(data));
          sessionStorage.setItem('yozigo_movies', JSON.stringify(data));
        } catch (_) {}
      }
    } catch (err: any) {
      if (movies.length === 0) {
        setError(err.message || 'Failed to load movie catalog.');
      }
    }
  };

  // Featured Top 5 movies with seamless infinite loop cloning
  const SLIDE_DURATION = 5000;
  const featuredMovies = movies.slice(0, 5);
  const slides = featuredMovies.length > 1
    ? [featuredMovies[featuredMovies.length - 1], ...featuredMovies, featuredMovies[0]]
    : featuredMovies;

  // slideIndex starts at 1 (which maps to featuredMovies[0])
  const [slideIndex, setSlideIndex] = useState(1);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [progressKey, setProgressKey] = useState(0);
  const isSlidingRef = useRef(false);

  // Auto-advance carousel: exactly SLIDE_DURATION ms per banner, resetting on any manual or automatic slide change
  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const timer = setTimeout(() => {
      advanceSlide(1);
    }, SLIDE_DURATION);
    return () => clearTimeout(timer);
  }, [currentMovieIndex, progressKey, featuredMovies.length]);

  const advanceSlide = (direction: 1 | -1) => {
    if (featuredMovies.length <= 1 || isSlidingRef.current) return;
    isSlidingRef.current = true;
    setIsTransitioning(true);

    if (direction === 1) {
      setSlideIndex((prev) => prev + 1);
      // Keep currentMovieIndex at featuredMovies.length - 1 while animating to clone,
      // so the last dot stays 100% complete and doesn't abruptly drop before banner finishes sliding!
      if (currentMovieIndex < featuredMovies.length - 1) {
        setCurrentMovieIndex((prev) => prev + 1);
        setProgressKey((k) => k + 1);
      }
    } else {
      setSlideIndex((prev) => Math.max(0, prev - 1));
      if (currentMovieIndex > 0) {
        setCurrentMovieIndex((prev) => prev - 1);
        setProgressKey((k) => k + 1);
      }
    }
  };

  const handlePrevSlide = () => {
    advanceSlide(-1);
  };

  const handleNextSlide = () => {
    advanceSlide(1);
  };

  const handleDotClick = (targetIdx: number) => {
    if (featuredMovies.length <= 1 || isSlidingRef.current || targetIdx === currentMovieIndex) return;
    isSlidingRef.current = true;
    setIsTransitioning(true);
    setSlideIndex(targetIdx + 1);
    setCurrentMovieIndex(targetIdx);
    setProgressKey((k) => k + 1);
  };

  // Seamless infinite jump when hitting clone slides
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    // CRITICAL: ONLY handle transitions on the track itself, NOT bubbling from children!
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'transform') return;

    if (slideIndex >= slides.length - 1) {
      // Reached cloned first slide (at end) -> silently snap to real first slide (index 1)
      setIsTransitioning(false);
      setSlideIndex(1);
      setCurrentMovieIndex(0);
      setProgressKey((k) => k + 1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
          isSlidingRef.current = false;
        });
      });
    } else if (slideIndex <= 0) {
      // Reached cloned last slide (at start) -> silently snap to real last slide
      setIsTransitioning(false);
      setSlideIndex(slides.length - 2);
      setCurrentMovieIndex(featuredMovies.length - 1);
      setProgressKey((k) => k + 1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
          isSlidingRef.current = false;
        });
      });
    } else {
      isSlidingRef.current = false;
    }
  };

  // Failsafe timer so isSlidingRef is NEVER permanently stuck even if browser drops transitionEnd
  useEffect(() => {
    if (isSlidingRef.current) {
      const safetyTimer = setTimeout(() => {
        isSlidingRef.current = false;
        if (slideIndex >= slides.length - 1) {
          setIsTransitioning(false);
          setSlideIndex(1);
          setCurrentMovieIndex(0);
          setProgressKey((k) => k + 1);
          setTimeout(() => setIsTransitioning(true), 30);
        } else if (slideIndex <= 0) {
          setIsTransitioning(false);
          setSlideIndex(slides.length - 2);
          setCurrentMovieIndex(featuredMovies.length - 1);
          setProgressKey((k) => k + 1);
          setTimeout(() => setIsTransitioning(true), 30);
        }
      }, 1350);
      return () => clearTimeout(safetyTimer);
    }
  }, [slideIndex, slides.length, featuredMovies.length]);

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch =
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (movie.genre && movie.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (movie.description && movie.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRating = selectedRating === 'ALL' || movie.certification === selectedRating;
    const matchesLang = selectedLang === 'ALL' || movie.language.toLowerCase() === selectedLang.toLowerCase();

    return matchesSearch && matchesRating && matchesLang;
  });

  const availableLanguages = ['ALL', ...Array.from(new Set(movies.map((m) => m.language)))];
  const activeCarouselMovie = (featuredMovies.length > 0 && featuredMovies[currentMovieIndex]) || featuredMovies[0] || movies[0] || INITIAL_CATALOG_FALLBACK[0];


  return (
    <div className="flex flex-col w-full animate-fadeIn pb-24 sm:pb-16 scroll-smooth">
      
      {/* 1. Cinematic Spotlight Carousel (Top 5 Blockbusters) */}
      {activeCarouselMovie ? (
        <section id="hero" className="hero-spotlight relative w-full overflow-hidden bg-[#101110] border-b border-[#34332F]/60 -mt-[60px] pt-[60px]">
          {/* Ambient Glowing Movie Poster Backdrop with smooth crossfade */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {featuredMovies.map((m, idx) => (
              <img
                key={m.id}
                src={m.poster_url}
                alt=""
                className={`absolute inset-0 w-full h-full object-cover object-center filter blur-3xl scale-125 transition-opacity duration-700 ease-out ${
                  idx === currentMovieIndex ? 'opacity-30 sm:opacity-45' : 'opacity-0'
                }`}

              />
            ))}
            <div className="hero-gradient-vertical absolute inset-0"></div>
            <div className="hero-gradient-horizontal absolute inset-0"></div>
          </div>

          {/* Navigation Arrows: Box-free, fully transparent chevron controls without background hover fill */}
          {featuredMovies.length > 1 && (
            <>
              <button
                onClick={handlePrevSlide}
                title="Previous Movie"
                className="hero-nav-arrow absolute left-0.5 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 p-1 sm:p-2 bg-transparent border-0 text-[#F4EFE6]/70 hover:text-[#F4EFE6] hover:scale-110 active:scale-90 transition-all flex items-center justify-center cursor-pointer select-none"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
              <button
                onClick={handleNextSlide}
                title="Next Movie"
                className="hero-nav-arrow absolute right-0.5 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 p-1 sm:p-2 bg-transparent border-0 text-[#F4EFE6]/70 hover:text-[#F4EFE6] hover:scale-110 active:scale-90 transition-all flex items-center justify-center cursor-pointer select-none"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            </>
          )}

          {/* Infinite Continuous Horizontal Sliding Track */}
          <div
            onTransitionEnd={handleTransitionEnd}
            className={`flex w-full ${isTransitioning ? 'transition-transform duration-[1100ms] ease-[cubic-bezier(0.25,1,0.5,1)]' : ''}`}
            style={{ transform: `translate3d(-${(featuredMovies.length > 1 ? Math.max(0, Math.min(slideIndex, slides.length - 1)) : 0) * 100}%, 0px, 0px)` }}
          >
            {slides.map((movie, idx) => (
              <div key={`${movie.id}-${idx}`} className="w-full shrink-0 flex justify-center">
                <div className="relative z-10 w-full px-4 sm:px-12 md:px-16 lg:px-20 max-w-7xl mx-auto py-4 sm:py-8 md:py-10 flex items-center justify-between gap-3 sm:gap-6 lg:gap-12 min-h-[250px] sm:min-h-[290px] md:min-h-[330px]">
                  
                  {/* Left Column: Exactly as in user reference */}
                  <div className="flex-1 flex flex-col justify-center min-w-0 pr-4 sm:pr-8 lg:pr-12 py-2">
                    {/* Title */}
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#F4EFE6] tracking-tight leading-tight mb-2">
                      {movie.title}
                    </h1>

                    {/* Subtitle: Certification & Genre (e.g., UA16+ | Action, Thriller) - Clean high contrast text */}
                    <p className="text-sm sm:text-base font-bold text-[#F4EFE6] mb-3 sm:mb-4">
                      {movie.certification} | {movie.genre || movie.language}
                    </p>

                    {/* Synopsis */}
                    <p className="text-xs sm:text-sm text-[#89857D] leading-relaxed max-w-xl mb-5 sm:mb-6 line-clamp-3">
                      {movie.description}
                    </p>

                    {/* Action Button: "Book now" */}
                    <div>
                      <button
                        onClick={() => onSelectMovie(movie.id)}
                        className="h-10 sm:h-11 px-6 sm:px-8 rounded-full pill-btn text-[#F4EFE6] font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer select-none inline-flex items-center gap-2 shadow-sm group"
                      >
                        <PlayArrowIcon className="w-3.5 h-3.5 text-[#F0A451] transition-transform group-hover:scale-110" />
                        <span>Book now</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Clean Movie Poster Card with rounded corners */}
                  <div
                    className="shrink-0 w-28 xs:w-32 sm:w-44 md:w-56 lg:w-64 aspect-[2/3] rounded-2xl overflow-hidden border border-[#34332F] shadow-xl cursor-pointer group hover:scale-[1.01] transition-transform duration-300 self-center"
                    onClick={() => onSelectMovie(movie.id)}
                  >
                    {movie.poster_url ? (
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-full h-full object-cover block"
                        loading="eager"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#191A18] flex flex-col items-center justify-center text-[#89857D]">
                        <Film className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic Morphing Bullet & Linear Progress Indicators */}
          {featuredMovies.length > 1 && (
            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 select-none">
              {featuredMovies.map((m, idx) => {
                const isActive = idx === currentMovieIndex;
                const isCompleted = idx < currentMovieIndex;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleDotClick(idx)}
                    title={`Slide ${idx + 1}: ${m.title}`}
                    className={`rounded-full overflow-hidden cursor-pointer relative hero-bar-track transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                      isActive ? 'w-8 sm:w-10 h-2' : 'w-2 h-2'
                    }`}
                  >
                    {/* Completed Slide: Solid Filled Amber Circle */}
                    {isCompleted && (
                      <span className="absolute inset-0 w-full h-full bg-[#F0A451] rounded-full" />
                    )}

                    {/* Active Slide: Smooth 0% to 100% Linear Fill across Expanding Pill */}
                    {isActive && (
                      <span
                        key={`hero-progress-${currentMovieIndex}-${progressKey}`}
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
          )}

        </section>
      ) : (
        <section className="hero-spotlight relative w-full overflow-hidden bg-[#101110] border-b border-[#34332F]/60">
          <div className="relative z-10 w-full px-8 sm:px-12 md:px-16 lg:px-20 max-w-7xl mx-auto py-6 sm:py-8 md:py-10 flex items-center justify-between gap-3 sm:gap-6 lg:gap-12 min-h-[250px] sm:min-h-[290px] md:min-h-[330px]">
            <div className="flex-1 flex flex-col justify-between h-[190px] sm:h-[220px] md:h-[240px] animate-pulse">
              <div className="w-36 h-6 rounded-md bg-[#22231F]"></div>
              <div className="w-72 h-10 rounded-lg bg-[#22231F]"></div>
              <div className="w-96 h-8 rounded-md bg-[#22231F] hidden sm:block"></div>
              <div className="w-36 h-10 rounded-xl bg-[#22231F]"></div>
            </div>
            <div className="shrink-0 w-24 xs:w-28 sm:w-36 md:w-52 lg:w-56 aspect-[2/3] rounded-xl sm:rounded-2xl bg-[#22231F] animate-pulse"></div>
          </div>
        </section>
      )}

      {/* 2. Section Heading: This Week's Releases */}
      <section id="releases" className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-7 pb-3 bg-[#101110]">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4EFE6] select-none">
            This Week's Releases
          </h2>
          <span className="text-xs text-[#89857D] font-medium hidden sm:inline">
            Bengaluru Theatrical Premiere
          </span>
        </div>
      </section>

      {/* 3. Section 1 Movie Cards Grid (Vertical Posters) */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-8 bg-[#101110]">
        <div className="w-full max-w-7xl mx-auto">
          {movies.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col bg-[#191A18] border border-[#34332F] rounded-2xl overflow-hidden animate-pulse">
                  <div className="w-full aspect-[2/3] bg-[#22231F]"></div>
                  <div className="p-3 flex flex-col gap-2">
                    <div className="w-3/4 h-3.5 bg-[#22231F] rounded"></div>
                    <div className="w-1/2 h-2.5 bg-[#22231F] rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <AlertCircle className="w-8 h-8 text-[#E47A75]" />
              <p className="text-sm text-[#E47A75]">{error}</p>
              <button
                onClick={fetchMovies}
                className="px-5 py-2 rounded-lg bg-[#22231F] border border-[#34332F] text-xs font-bold text-[#F4EFE6] hover:bg-[#2A2B27] hover:border-[#514B43] transition"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {movies.slice(0, 6).map((movie) => (
                <article
                  key={`featured-${movie.id}`}
                  onClick={() => onSelectMovie(movie.id)}
                  className="movie-card group flex flex-col bg-[#191A18] border border-[#34332F] rounded-2xl overflow-hidden cursor-pointer hover:border-[#514B43] hover:-translate-y-1.5 transition-all duration-300 shadow-md hover:shadow-2xl hover:shadow-black/40 active:scale-95"
                >
                  {/* Vertical Official Poster with Rounded Top - Exact 2:3 aspect ratio, edge-to-edge */}
                  <div className="relative w-full aspect-[2/3] overflow-hidden rounded-t-2xl">
                    {movie.poster_url ? (
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 block"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#191A18] flex flex-col items-center justify-center text-[#89857D]">
                        <Film className="w-8 h-8" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>


                  </div>

                  {/* Details Below Poster (Metadata) */}
                  <div className="p-3 flex flex-col justify-between flex-1 bg-[#191A18]">
                    <div className="flex flex-col">
                      <h3 className="font-extrabold text-xs sm:text-sm text-[#F4EFE6] group-hover:text-[#F0A451] transition-colors truncate">
                        {movie.title}
                      </h3>
                      <span className="text-[11px] text-[#B9B2A8] font-medium mt-0.5 truncate">
                        <strong className="text-[#F4EFE6] font-bold">{movie.certification}</strong> • {movie.language}
                      </span>
                    </div>

                    <div className="pt-2 mt-2 border-t border-[#34332F]/60 flex items-center justify-between text-[11px]">
                      <span className="text-[#89857D]">Screen 1</span>
                      <span className="text-[#F0A451] font-bold group-hover:underline flex items-center gap-0.5">
                        Book
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Section 2: Only in Theatres with Search & Filter Bar */}
      <section id="theatres" className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-8 pb-3 bg-[#101110] border-t border-[#34332F]/50">
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4EFE6] select-none">
              Only in Theatres
            </h2>
            <span className="text-xs text-[#89857D] font-medium">
              {filteredMovies.length} Title{filteredMovies.length !== 1 ? 's' : ''} Available
            </span>
          </div>

          {/* Search Box & Filters Bar */}
          <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="w-4 h-4 text-[#89857D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="movie-catalog-search"
                name="searchQuery"
                type="text"
                aria-label="Search movies, languages or genres"
                placeholder="Search for movies, languages or genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-full bg-[#191A18] border border-[#34332F] text-xs text-[#F4EFE6] placeholder-[#89857D] focus:outline-none focus:border-[#514B43] transition shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#22231F] flex items-center justify-center text-[#89857D] hover:text-[#F4EFE6] transition"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filters Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none no-scrollbar">
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#34332F] bg-[#191A18] text-xs font-semibold text-[#F4EFE6] shrink-0">
                <FilterSlidersIcon className="w-3.5 h-3.5 text-[#F0A451]" />
                <span>Filters</span>
              </div>

              {(['ALL', 'UA', 'A', 'U'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRating(r)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all active:scale-95 cursor-pointer ${
                    selectedRating === r
                      ? 'bg-[#F0A451] text-[#17120C] shadow-sm'
                      : 'bg-[#191A18] text-[#B9B2A8] border border-[#34332F] hover:text-[#F4EFE6] hover:bg-[#22231F] hover:border-[#514B43]'
                  }`}
                >
                  {r === 'ALL' ? 'All Ratings' : r}
                </button>
              ))}

              <div className="h-4 w-px bg-[#34332F] mx-1"></div>

              {availableLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all active:scale-95 cursor-pointer ${
                    selectedLang === lang
                      ? 'bg-[#F0A451] text-[#17120C] shadow-sm'
                      : 'bg-[#191A18] text-[#B9B2A8] border border-[#34332F] hover:text-[#F4EFE6] hover:bg-[#22231F] hover:border-[#514B43]'
                  }`}
                >
                  {lang === 'ALL' ? 'All Languages' : lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section 2 Movie Grid */}
      <section className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-12 bg-[#101110]">
        <div className="w-full max-w-7xl mx-auto">
          {filteredMovies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
              <Film className="w-10 h-10 text-[#89857D]" />
              <h3 className="text-base font-semibold text-[#F4EFE6]">No movies found</h3>
              <p className="text-xs text-[#89857D]">Try modifying your search or rating filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {filteredMovies.map((movie) => (
                <article
                  key={`all-${movie.id}`}
                  onClick={() => onSelectMovie(movie.id)}
                  className="movie-card group flex flex-col bg-[#191A18] border border-[#34332F] rounded-2xl overflow-hidden cursor-pointer hover:border-[#514B43] hover:-translate-y-1.5 transition-all duration-300 shadow-md hover:shadow-2xl hover:shadow-black/40 active:scale-95"
                >
                  {/* Vertical Official Poster with Rounded Top - Exact 2:3 aspect ratio, edge-to-edge */}
                  <div className="relative w-full aspect-[2/3] overflow-hidden rounded-t-2xl">
                    {movie.poster_url ? (
                      <img
                        src={movie.poster_url}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 block"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#191A18] flex flex-col items-center justify-center text-[#89857D]">
                        <Film className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>

                  </div>

                  <div className="p-3 flex flex-col justify-between flex-1 bg-[#191A18]">
                    <div className="flex flex-col">
                      <h3 className="font-extrabold text-xs sm:text-sm text-[#F4EFE6] group-hover:text-[#F0A451] transition-colors truncate">
                        {movie.title}
                      </h3>
                      <span className="text-[11px] text-[#B9B2A8] font-medium mt-0.5 truncate">
                        <strong className="text-[#F4EFE6] font-bold">{movie.certification}</strong> • {movie.language}
                      </span>
                    </div>

                    <div className="pt-2 mt-2 border-t border-[#34332F]/60 flex items-center justify-between text-[11px]">
                      <span className="text-[#89857D]">{Math.floor(movie.duration_mins / 60)}h {movie.duration_mins % 60}m</span>
                      <span className="text-[#F0A451] font-bold group-hover:underline flex items-center gap-0.5">
                        Book
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
