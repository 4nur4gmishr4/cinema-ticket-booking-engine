import React, { useState, useEffect } from 'react';
import type { Movie, ShowsByDateGroup } from '../types';
import { api } from '../services/api';
import { ArrowLeft, Clock, Globe, Calendar, Users, Film, Ticket, AlertCircle, ChevronRight } from 'lucide-react';
import { MovieReelIcon } from '../components/Icons';

interface MovieDetailPageProps {
  movieId: number;
  onBack: () => void;
  onSelectShow: (showId: number) => void;
}

export const MovieDetailPage: React.FC<MovieDetailPageProps> = ({ movieId, onBack, onSelectShow }) => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [dateGroups, setDateGroups] = useState<ShowsByDateGroup[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
    loadMovieDetails();
  }, [movieId]);

  const loadMovieDetails = async () => {
    setLoading(true);
    try {
      const [movieData, showsData] = await Promise.all([
        api.getMovie(movieId),
        api.getMovieShows(movieId),
      ]);
      setMovie(movieData);
      setDateGroups(showsData);
      if (showsData.length > 0) {
        setSelectedDate(showsData[0].date);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load movie details.');
    } finally {
      setLoading(false);
    }
  };

  const activeGroup = dateGroups.find((g) => g.date === selectedDate);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-10 h-10 border-2 border-[#F0A451] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[#89857D] mt-3">Loading movie showtimes...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <AlertCircle className="w-10 h-10 text-[#E47A75]" />
        <h2 className="text-lg font-bold text-[#F4EFE6]">{error || 'Movie not found.'}</h2>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 h-9 px-5 rounded-full pill-btn text-xs font-bold transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalog</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col animate-fadeIn pb-24 sm:pb-12">
      {/* 2. Immersive Movie Hero Banner */}
      <section className="relative w-full overflow-hidden bg-[#101110] border-b border-[#34332F] -mt-[60px] pt-[60px]">
        <div className="relative w-full pt-4 pb-8 sm:pb-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 flex flex-col gap-5 sm:gap-6">
          
          {/* Top Clean Inline Navigation & Status */}
          <div className="relative z-20 w-full flex items-center justify-between">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full pill-btn text-xs font-bold transition-all active:scale-95 cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Back to Movies</span>
            </button>

            <div className="flex items-center gap-2 h-8 px-3.5 rounded-full pill-btn text-xs font-medium cursor-default">
              <MovieReelIcon className="w-3.5 h-3.5 text-[#F0A451] shrink-0" />
              <span className="text-[#F4EFE6] font-semibold">Screen 1 Live Schedule</span>
            </div>
          </div>
          {/* Faded Poster Background */}
          {movie.poster_url && (
            <img
              src={movie.poster_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xl scale-110 pointer-events-none"
            />
          )}
          <div className="detail-hero-gradient absolute inset-0 pointer-events-none"></div>

          {/* Main Content Grid */}
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Movie Profile & Editorial */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {/* Poster - Exact ratio, zero outer container gap */}
                <div className="w-44 sm:w-52 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden border border-[#514B43]/50 shadow-2xl">
                  {movie.poster_url ? (
                    <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover block" />
                  ) : (
                    <div className="w-full h-full bg-[#191A18] flex flex-col items-center justify-center text-[#89857D]">
                      <Film className="w-10 h-10" />
                      <span className="text-xs mt-2">No Poster</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-col gap-2.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#191A18] border border-[#34332F] text-[#F4EFE6]">
                      {movie.certification}
                    </span>
                    {movie.genre && (
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#191A18] border border-[#34332F] text-[#B9B2A8]">
                        {movie.genre}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black text-[#F4EFE6] tracking-tight">
                    {movie.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#B9B2A8]">
                    <span className="px-2.5 py-1 rounded-md bg-[#191A18] border border-[#34332F] flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-[#F0A451]" />
                      {movie.language}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-[#191A18] border border-[#34332F] flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#F0A451]" />
                      {Math.floor(movie.duration_mins / 60)}h {movie.duration_mins % 60}m
                    </span>
                  </div>

                  {movie.genre && (
                    <div className="text-xs text-[#89857D] font-medium mt-0.5">
                      Genre: <span className="text-[#F4EFE6]">{movie.genre}</span>
                    </div>
                  )}

                  {movie.description && (
                    <p className="text-xs text-[#B9B2A8] leading-relaxed mt-1 line-clamp-4">
                      {movie.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Theatrical Auditorium Specifications */}
              <div className="w-full rounded-2xl bg-[#191A18] border border-[#34332F] p-3 sm:p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-[#89857D] uppercase tracking-wider">
                    Auditorium Specifications
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#22231F] text-[#B9B2A8] border border-[#34332F]/60">
                    Screen 1
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col justify-between p-2.5 rounded-xl bg-[#22231F] border border-[#34332F]/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-[#89857D] uppercase tracking-wider">Hall</span>
                      <Film className="w-3.5 h-3.5 text-[#F0A451] shrink-0" />
                    </div>
                    <span className="text-xs font-bold text-[#F4EFE6] leading-tight">
                      Auditorium A-01
                    </span>
                  </div>

                  <div className="flex flex-col justify-between p-2.5 rounded-xl bg-[#22231F] border border-[#34332F]/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-[#89857D] uppercase tracking-wider">Capacity</span>
                      <Users className="w-3.5 h-3.5 text-[#F0A451] shrink-0" />
                    </div>
                    <span className="text-xs font-bold text-[#F4EFE6] leading-tight">
                      80 Seats (A–H)
                    </span>
                  </div>

                  <div className="flex flex-col justify-between p-2.5 rounded-xl bg-[#22231F] border border-[#34332F]/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-[#89857D] uppercase tracking-wider">Format</span>
                      <Ticket className="w-3.5 h-3.5 text-[#F0A451] shrink-0" />
                    </div>
                    <span className="text-xs font-bold text-[#F4EFE6] leading-tight">
                      4K Laser Atmos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Showtimes & Schedule Hub */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="border-b border-[#34332F] pb-3">
                <span className="text-[10px] font-bold text-[#F0A451] uppercase tracking-wider">
                  Live Showtimes &amp; Screenings
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#F4EFE6] mt-0.5">
                  Select Show Date &amp; Timing
                </h2>
                <p className="text-xs text-[#B9B2A8] mt-1">
                  Choose a showtime below to open the interactive 80-seat auditorium map.
                </p>
              </div>

              {dateGroups.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#191A18] border border-[#34332F] text-center">
                  <Calendar className="w-10 h-10 text-[#89857D] mx-auto mb-2" />
                  <p className="text-sm text-[#F4EFE6] font-bold">No upcoming shows scheduled</p>
                  <p className="text-xs text-[#89857D] mt-1">
                    All scheduled screenings for this title have concluded or haven't opened yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Date Strip (Pebble Capsule Shape - Zero Glow) */}
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
                    {dateGroups.map((group) => {
                      const isSelected = group.date === selectedDate;
                      const dateObj = new Date(group.date + 'T00:00:00');
                      const dayName = dateObj.toLocaleDateString([], { weekday: 'short' }).toUpperCase();
                      const dayNum = dateObj.getDate();
                      const monthName = dateObj.toLocaleDateString([], { month: 'short' }).toUpperCase();

                      return (
                        <button
                          key={group.date}
                          type="button"
                          onClick={() => setSelectedDate(group.date)}
                          className={`flex flex-col items-center justify-center w-[66px] sm:w-[70px] h-[88px] rounded-[22px] transition-colors duration-150 select-none shadow-none cursor-pointer ${
                            isSelected
                              ? 'bg-[#F0A451] text-[#17120C] border-2 border-[#F0A451] font-black'
                              : 'bg-[#191A18] text-[#89857D] border-2 border-[#34332F] hover:text-[#F4EFE6] hover:bg-[#22231F] hover:border-[#514B43] font-medium'
                          }`}
                        >
                          <span className="text-[10px] font-bold tracking-wider leading-none">{dayName}</span>
                          <span className="text-xl sm:text-2xl font-black my-1.5 leading-none">{dayNum}</span>
                          <span className="text-[10px] font-bold tracking-wider leading-none">{monthName}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Showtimes for selected date in pebblish-rectangular cards */}
                  {activeGroup && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between text-xs text-[#89857D]">
                        <span>Showing on Screen 1</span>
                        <span>{activeGroup.shows.length} Available Shows</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {activeGroup.shows.map((show) => {
                          const dt = new Date(show.start_time);
                          const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                          return (
                            <div
                              key={show.id}
                              onClick={() => onSelectShow(show.id)}
                              className="showtime-chip p-4 sm:p-5 rounded-[22px] bg-[#191A18] border border-[#34332F] hover:border-[#514B43] hover:bg-[#20211F] cursor-pointer transition-all flex flex-col justify-between gap-3 group shadow-none active:scale-[0.99]"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex flex-col">
                                  <div className="flex items-baseline gap-2.5">
                                    <span className="text-2xl sm:text-3xl font-black text-[#F4EFE6] group-hover:text-[#F0A451] transition-colors leading-none">
                                      {timeStr}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full bg-[#101110] border border-[#34332F] text-[10px] font-bold text-[#F0A451] uppercase tracking-wider">
                                      4K Laser Atmos
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-[#89857D] font-medium mt-1">
                                    Screen 1 Auditorium • English / Subtitles
                                  </span>
                                </div>

                                <div className="text-right">
                                  <div className="text-lg font-black text-[#F0A451] leading-none">
                                    ₹{show.ticket_price.toFixed(0)}
                                  </div>
                                  <span className="text-[10px] text-[#89857D] mt-0.5 block">per seat</span>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-[#34332F]/60 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs text-[#6FA987] font-semibold">
                                  <Ticket className="w-3.5 h-3.5 text-[#6FA987] shrink-0" />
                                  <span>{show.available_seats} / 80 Seats Available</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectShow(show.id);
                                  }}
                                  className="px-4 py-1.5 rounded-full bg-[#F0A451] group-hover:bg-[#FFB96B] text-[#17120C] font-black text-xs transition shadow-none flex items-center gap-1"
                                >
                                  <span>Select</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
