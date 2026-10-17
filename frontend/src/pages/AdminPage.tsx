import React, { useState, useEffect } from 'react';
import type { Movie, Show, AdminOccupancyResponse, AdminCinemaOverviewResponse } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trash2, AlertCircle, CheckCircle2, BarChart3, Calendar, Clapperboard, Layers, Search, RefreshCw } from 'lucide-react';
import { SecurityShieldIcon } from '../components/Icons';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'occupancy' | 'shows' | 'movies'>(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash.toLowerCase();
      if (h.includes('schedule') || h.includes('shows')) return 'shows';
      if (h.includes('movies') || h.includes('movie')) return 'movies';
    }
    return 'occupancy';
  });

  const [movies, setMovies] = useState<Movie[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Movie Form State
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    poster_url: '',
    language: 'English',
    duration_mins: 120,
    certification: 'UA' as 'U' | 'UA' | 'A',
    genre: '',
  });

  // New Show Form State
  const [showForm, setShowForm] = useState({
    movie_id: 0,
    screen_name: 'Screen 1',
    start_time: '',
    ticket_price: 250,
  });

  // Occupancy & Overview State
  const [selectedShowId, setSelectedShowId] = useState<number | 'ALL'>('ALL');
  const [overviewData, setOverviewData] = useState<AdminCinemaOverviewResponse | null>(null);
  const [occupancyData, setOccupancyData] = useState<AdminOccupancyResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    setError(null);
    setLoadingData(true);
    try {
      const [moviesData, showsData, overview] = await Promise.all([
        api.getMovies(),
        api.getShows(),
        api.adminGetCinemaOverview(),
      ]);
      setMovies(moviesData);
      setShows(showsData);
      setOverviewData(overview);

      if (moviesData.length > 0 && showForm.movie_id === 0) {
        setShowForm((prev) => ({ ...prev, movie_id: moviesData[0].id }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load admin data.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSelectShow = async (val: string) => {
    setError(null);
    if (val === 'ALL') {
      setSelectedShowId('ALL');
      setOccupancyData(null);
      setLoadingData(true);
      try {
        const overview = await api.adminGetCinemaOverview();
        setOverviewData(overview);
      } catch (err: any) {
        setError(err.message || 'Failed to refresh cinema overview.');
      } finally {
        setLoadingData(false);
      }
    } else {
      const id = Number(val);
      setSelectedShowId(id);
      setLoadingData(true);
      try {
        const data = await api.adminGetShowOccupancy(id);
        setOccupancyData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load show occupancy.');
      } finally {
        setLoadingData(false);
      }
    }
  };

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      const created = await api.adminCreateMovie(movieForm);
      setSuccessMsg(`Movie "${created.title}" successfully added!`);
      setMovieForm({
        title: '',
        description: '',
        poster_url: '',
        language: 'English',
        duration_mins: 120,
        certification: 'UA',
        genre: '',
      });
      loadInitialData();
    } catch (err: any) {
      setError(err.message || 'Failed to add movie.');
    }
  };

  const handleDeleteMovie = async (movieId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.adminDeleteMovie(movieId);
      setSuccessMsg(`Movie "${title}" deleted successfully.`);
      loadInitialData();
    } catch (err: any) {
      setError(err.message || 'Cannot delete movie.');
    }
  };

  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      if (!showForm.start_time) {
        setError('Please select a valid start date and time.');
        return;
      }
      await api.adminCreateShow({
        movie_id: Number(showForm.movie_id),
        screen_name: showForm.screen_name,
        start_time: new Date(showForm.start_time).toISOString(),
        ticket_price: Number(showForm.ticket_price),
      });
      setSuccessMsg('Show successfully scheduled without overlaps!');
      loadInitialData();
    } catch (err: any) {
      setError(err.message || 'Schedule conflict: show overlaps with another show.');
    }
  };

  const handleDeleteShow = async (showId: number) => {
    if (!confirm('Are you sure you want to delete this show?')) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await api.adminDeleteShow(showId);
      setSuccessMsg('Show successfully deleted.');
      loadInitialData();
    } catch (err: any) {
      setError(err.message || 'Cannot delete show.');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4">
        <SecurityShieldIcon className="w-12 h-12 text-[#E47A75] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-[#F4EFE6]">Access Denied</h2>
        <p className="text-xs text-[#B9B2A8] mt-1">
          This portal requires Administrator authorization.
        </p>
      </div>
    );
  }

  // Filter ledger bookings when in 'ALL' view
  const filteredLedgerBookings = overviewData?.bookings.filter((b) => {
    if (!ledgerSearch.trim()) return true;
    const query = ledgerSearch.toLowerCase();
    return (
      b.booking_reference.toLowerCase().includes(query) ||
      b.movie_title.toLowerCase().includes(query) ||
      b.customer_name.toLowerCase().includes(query) ||
      b.customer_email.toLowerCase().includes(query) ||
      b.seats.join(', ').toLowerCase().includes(query) ||
      b.status.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#34332F] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-[#F0A451] uppercase tracking-wider">
            Cinema Management
          </span>
          <h1 className="text-3xl font-black text-[#F4EFE6] mt-1">Staff Admin Panel</h1>
          <p className="text-xs text-[#89857D] mt-1">
            Manage catalogue, schedule shows (with overlap protection), and inspect live cinema bookings.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 rounded-full admin-tab-container">
          <button
            onClick={() => setActiveTab('occupancy')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'occupancy'
                ? 'bg-[#F0A451] text-[#17120C] shadow-sm'
                : 'admin-tab-btn-inactive hover:text-[#F4EFE6]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Show Occupancy</span>
          </button>
          <button
            onClick={() => setActiveTab('shows')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'shows'
                ? 'bg-[#F0A451] text-[#17120C] shadow-sm'
                : 'admin-tab-btn-inactive hover:text-[#F4EFE6]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Shows</span>
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'movies'
                ? 'bg-[#F0A451] text-[#17120C] shadow-sm'
                : 'admin-tab-btn-inactive hover:text-[#F4EFE6]'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Manage Movies</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-[#823E46]/20 border border-[#823E46] text-[#E47A75] text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-[#345447]/20 border border-[#345447] text-[#6FA987] text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: SHOW OCCUPANCY & CINEMA LEDGER */}
      {activeTab === 'occupancy' && (
        <div id="admin-occupancy" className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#F4EFE6]">
                {selectedShowId === 'ALL' ? 'Cinema Master Ledger & Overview' : 'Show Occupancy & Live Bookings'}
              </h2>
              <p className="text-xs text-[#89857D]">
                {selectedShowId === 'ALL'
                  ? 'All pre-seeded and customer bookings across the cinema roster.'
                  : 'Inspect individual show occupancy, booked seats, and audit seat map.'}
              </p>
            </div>

            {/* Show Selector Dropdown */}
            <div className="flex items-center gap-2">
              <select
                id="admin-occupancy-show-select"
                name="selectedShowId"
                value={selectedShowId}
                onChange={(e) => handleSelectShow(e.target.value)}
                className="px-3.5 py-2 rounded-xl admin-input text-xs font-medium focus:outline-none focus:border-[#F0A451] cursor-pointer min-w-[280px]"
              >
                <option value="ALL">All Shows — Cinema Master Ledger (Overview)</option>
                {shows.map((show) => {
                  const dt = new Date(show.start_time);
                  const showBookings = overviewData?.bookings.filter((b) => b.show_id === show.id && b.status === 'CONFIRMED') || [];
                  const bookedSeats = showBookings.reduce((sum, b) => sum + b.seats.length, 0);
                  return (
                    <option key={show.id} value={show.id}>
                      {show.movie?.title || 'Movie'} — {dt.toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      at {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {bookedSeats > 0 ? ` • [${bookedSeats} Booked]` : ''}
                    </option>
                  );
                })}
              </select>

              <button
                onClick={() => handleSelectShow(String(selectedShowId))}
                title="Refresh occupancy data"
                className="p-2 rounded-xl admin-card hover:bg-[#22231F] transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 text-[#89857D] ${loadingData ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loadingData ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-[#F0A451] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-[#89857D] mt-2">Loading live cinema records...</p>
            </div>
          ) : selectedShowId === 'ALL' && overviewData ? (
            /* VIEW A: CINEMA MASTER OVERVIEW & GLOBAL BOOKINGS LEDGER */
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl admin-card">
                  <span className="text-[10px] font-bold text-[#89857D] uppercase tracking-wider">
                    Total Bookings
                  </span>
                  <div className="text-2xl font-black text-[#F4EFE6] mt-1">
                    {overviewData.confirmed_bookings_count}{' '}
                    <span className="text-xs font-normal text-[#89857D]">
                      Confirmed ({overviewData.total_bookings_count} total)
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl admin-card">
                  <span className="text-[10px] font-bold text-[#89857D] uppercase tracking-wider">
                    Tickets Sold
                  </span>
                  <div className="text-2xl font-black text-[#F0A451] mt-1">
                    {overviewData.total_booked_seats}{' '}
                    <span className="text-xs font-normal text-[#89857D]">Seats Booked</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl admin-card">
                  <span className="text-[10px] font-bold text-[#89857D] uppercase tracking-wider">
                    Gross Box Office
                  </span>
                  <div className="text-2xl font-black text-[#6FA987] mt-1">
                    ₹{overviewData.total_gross_revenue.toFixed(2)}
                  </div>
                </div>

                <div className="p-5 rounded-2xl admin-card">
                  <span className="text-[10px] font-bold text-[#89857D] uppercase tracking-wider">
                    Scheduled Screenings
                  </span>
                  <div className="text-2xl font-black text-[#F4EFE6] mt-1">
                    {overviewData.active_shows_count}{' '}
                    <span className="text-xs font-normal text-[#89857D]">Shows Active</span>
                  </div>
                </div>
              </div>

              {/* Master Booking Ledger */}
              <div className="p-5 sm:p-6 rounded-2xl admin-card flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#F0A451]" />
                    <h3 className="text-sm font-bold text-[#F4EFE6]">
                      Master Cinema Booking Ledger ({filteredLedgerBookings.length} records)
                    </h3>
                  </div>

                  {/* Search Bar for Ledger */}
                  <div className="relative max-w-xs w-full">
                    <Search className="w-3.5 h-3.5 text-[#89857D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search ref, movie, customer, seat..."
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl admin-input text-xs"
                    />
                  </div>
                </div>

                {filteredLedgerBookings.length === 0 ? (
                  <p className="py-12 text-center text-xs text-[#89857D]">No matching bookings found in the ledger.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#34332F] text-[#89857D]">
                          <th className="py-2.5 px-2">Reference</th>
                          <th className="py-2.5 px-2">Movie &amp; Screen</th>
                          <th className="py-2.5 px-2">Showtime</th>
                          <th className="py-2.5 px-2">Customer</th>
                          <th className="py-2.5 px-2">Seats</th>
                          <th className="py-2.5 px-2">Amount</th>
                          <th className="py-2.5 px-2">Status</th>
                          <th className="py-2.5 px-2">Booked On</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#34332F]/50">
                        {filteredLedgerBookings.map((b) => {
                          const showDt = new Date(b.show_time);
                          const bookDt = new Date(b.created_at);
                          return (
                            <tr key={b.booking_id} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                              <td className="py-3 px-2 font-mono font-bold text-[#F0A451]">
                                {b.booking_reference}
                              </td>
                              <td className="py-3 px-2">
                                <div className="font-semibold text-[#F4EFE6]">{b.movie_title}</div>
                                <div className="text-[10px] text-[#89857D]">{b.screen_name}</div>
                              </td>
                              <td className="py-3 px-2 text-[#89857D]">
                                <div>{showDt.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                                <div className="text-[10px]">{showDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              </td>
                              <td className="py-3 px-2">
                                <div className="text-[#F4EFE6] font-medium">{b.customer_name}</div>
                                <div className="text-[10px] text-[#89857D]">{b.customer_email}</div>
                              </td>
                              <td className="py-3 px-2 font-mono text-[#F4EFE6] font-semibold">
                                {b.seats.join(', ')}
                              </td>
                              <td className="py-3 px-2 font-semibold text-[#F4EFE6]">
                                ₹{b.total_amount.toFixed(2)}
                              </td>
                              <td className="py-3 px-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    b.status === 'CONFIRMED'
                                      ? 'bg-[#345447]/20 border border-[#345447] text-[#6FA987]'
                                      : 'bg-[#823E46]/20 border border-[#823E46] text-[#E47A75]'
                                  }`}
                                >
                                  {b.status}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-[#89857D] text-[11px]">
                                {bookDt.toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                                {bookDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : occupancyData ? (
            /* VIEW B: INDIVIDUAL SHOW OCCUPANCY & ADMIN SEAT MAP */
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl admin-card">
                  <span className="text-[10px] font-bold text-[#89857D] uppercase">Booked Seats</span>
                  <div className="text-2xl font-black text-[#F4EFE6] mt-1">
                    {occupancyData.booked_count} <span className="text-sm font-normal text-[#89857D]">/ 80</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl admin-card">
                  <span className="text-[10px] font-bold text-[#89857D] uppercase">Occupancy Rate</span>
                  <div className="text-2xl font-black text-[#F0A451] mt-1">
                    {occupancyData.occupancy_percentage}%
                  </div>
                </div>

                <div className="p-5 rounded-2xl admin-card">
                  <span className="text-[10px] font-bold text-[#89857D] uppercase">Total Money Collected</span>
                  <div className="text-2xl font-black text-[#6FA987] mt-1">
                    ₹{occupancyData.total_revenue.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Bookings Table & Admin Seat Map */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Bookings List */}
                <div className="lg:col-span-7 p-5 rounded-2xl admin-card flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-[#F4EFE6]">
                    Customer Bookings List ({occupancyData.bookings.length})
                  </h3>

                  {occupancyData.bookings.length === 0 ? (
                    <p className="py-8 text-center text-xs text-[#89857D]">No bookings made for this show yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#34332F] text-[#89857D]">
                            <th className="py-2 px-1">Reference</th>
                            <th className="py-2 px-1">Customer</th>
                            <th className="py-2 px-1">Seats</th>
                            <th className="py-2 px-1">Time</th>
                            <th className="py-2 px-1">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#34332F]/50">
                          {occupancyData.bookings.map((b) => (
                            <tr key={b.booking_id}>
                              <td className="py-2.5 px-1 font-mono text-[#F0A451] font-bold">{b.booking_reference}</td>
                              <td className="py-2.5 px-1 text-[#F4EFE6] font-medium">{b.customer_name}</td>
                              <td className="py-2.5 px-1 font-mono">{b.seats.join(', ')}</td>
                              <td className="py-2.5 px-1 text-[#89857D]">
                                {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-2.5 px-1 font-semibold text-[#F4EFE6]">₹{b.total_amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Admin Seat Map */}
                <div className="lg:col-span-5 p-5 rounded-2xl admin-card flex flex-col items-center">
                  <h3 className="text-sm font-bold text-[#F4EFE6] mb-3 self-start">Admin Seat Map View</h3>
                  <div className="w-full max-w-xs flex flex-col gap-1.5 my-auto">
                    {['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'].map((rowLetter) => (
                      <div key={rowLetter} className="flex items-center justify-center gap-1.5">
                        <span className="w-3 text-[10px] font-bold admin-seat-row-label text-center">{rowLetter}</span>
                        <div className="flex items-center gap-1">
                          {occupancyData.seat_map
                            .filter((s) => s.row === rowLetter)
                            .sort((a, b) => a.col - b.col)
                            .map((s) => (
                              <div
                                key={s.seat_number}
                                title={`${s.seat_number} - ${s.status}`}
                                className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center transition-all ${
                                  s.status === 'BOOKED'
                                    ? 'admin-seat-booked'
                                    : 'admin-seat-available'
                                }`}
                              >
                                {s.col}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-[#89857D] mt-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded admin-legend-available"></span> Available
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded admin-legend-booked"></span> Booked
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: SCHEDULE SHOWS */}
      {activeTab === 'shows' && (
        <div id="admin-schedule" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Create Show Form */}
          <div className="lg:col-span-5 p-6 rounded-3xl admin-card flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#F4EFE6]">Schedule a New Show</h2>
            <p className="text-xs text-[#89857D]">
              Automatic scheduling protection prevents any two shows on Screen 1 from overlapping in time.
            </p>

            <form onSubmit={handleCreateShow} className="flex flex-col gap-3.5 mt-2">
              <div className="space-y-1">
                <label htmlFor="admin-schedule-movie" className="text-xs text-[#89857D]">Select Movie</label>
                <select
                  id="admin-schedule-movie"
                  name="scheduleMovieId"
                  required
                  value={showForm.movie_id}
                  onChange={(e) => setShowForm({ ...showForm, movie_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl admin-input text-xs"
                >
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.duration_mins} mins)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="admin-schedule-starttime" className="text-xs text-[#89857D]">Start Date &amp; Time</label>
                <input
                  id="admin-schedule-starttime"
                  name="scheduleStartTime"
                  type="datetime-local"
                  required
                  value={showForm.start_time}
                  onChange={(e) => setShowForm({ ...showForm, start_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl admin-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="admin-schedule-price" className="text-xs text-[#89857D]">Ticket Price (₹)</label>
                <input
                  id="admin-schedule-price"
                  name="schedulePrice"
                  type="number"
                  min="50"
                  step="10"
                  required
                  value={showForm.ticket_price}
                  onChange={(e) => setShowForm({ ...showForm, ticket_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl admin-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="admin-schedule-screen" className="text-xs text-[#89857D]">Auditorium</label>
                <input
                  id="admin-schedule-screen"
                  name="scheduleScreen"
                  type="text"
                  disabled
                  value="Screen 1 (Single-Screen Auditorium)"
                  className="w-full px-3 py-2 rounded-xl admin-card-inner opacity-75 text-xs text-[#89857D]"
                />
              </div>

              {/* Calculated End-Time Indicator */}
              {showForm.start_time && (() => {
                const selMovie = movies.find((m) => m.id === showForm.movie_id);
                if (!selMovie) return null;
                const startDate = new Date(showForm.start_time);
                if (isNaN(startDate.getTime())) return null;
                const endDate = new Date(startDate.getTime() + selMovie.duration_mins * 60000);
                return (
                  <div className="p-2.5 rounded-xl admin-card-inner flex items-center justify-between text-[11px] text-[#89857D]">
                    <span>Occupied Window:</span>
                    <span className="font-bold text-[#F0A451]">
                      {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                      {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })()}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#F0A451] hover:bg-[#FFB96B] text-[#17120C] font-bold text-xs mt-2 transition cursor-pointer"
              >
                Schedule Show
              </button>
            </form>
          </div>

          {/* Existing Shows List */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <h2 className="text-lg font-bold text-[#F4EFE6]">Existing Showtimes ({shows.length})</h2>
            <div className="flex flex-col gap-2.5">
              {shows.map((show) => {
                const dt = new Date(show.start_time);
                return (
                  <div
                    key={show.id}
                    className="p-4 rounded-2xl admin-card flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-[#F4EFE6]">{show.movie?.title || 'Movie'}</h4>
                      <div className="flex items-center gap-2 text-xs text-[#89857D] mt-0.5">
                        <span>{dt.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className="text-[#F0A451] font-semibold">₹{show.ticket_price.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteShow(show.id)}
                      title="Delete show (rejected if bookings exist)"
                      className="w-8 h-8 rounded-xl bg-[#823E46]/20 hover:bg-[#823E46]/40 border border-[#823E46] text-[#E47A75] flex items-center justify-center transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE MOVIES */}
      {activeTab === 'movies' && (
        <div id="admin-movies" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Movie Form */}
          <div className="lg:col-span-5 p-6 rounded-3xl admin-card flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#F4EFE6]">Add Movie to Catalog</h2>
            <form onSubmit={handleCreateMovie} className="flex flex-col gap-3">
              <div className="space-y-1">
                <label htmlFor="admin-movie-title" className="text-xs text-[#89857D]">Movie Title</label>
                <input
                  id="admin-movie-title"
                  name="movieTitle"
                  type="text"
                  required
                  placeholder="e.g. Inception"
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl admin-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="admin-movie-poster" className="text-xs text-[#89857D]">Poster Image URL</label>
                <input
                  id="admin-movie-poster"
                  name="moviePosterUrl"
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={movieForm.poster_url}
                  onChange={(e) => setMovieForm({ ...movieForm, poster_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl admin-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label htmlFor="admin-movie-lang" className="text-xs text-[#89857D]">Language</label>
                  <input
                    id="admin-movie-lang"
                    name="movieLanguage"
                    type="text"
                    required
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl admin-input text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="admin-movie-cert" className="text-xs text-[#89857D]">Certification (U / UA / A)</label>
                  <select
                    id="admin-movie-cert"
                    name="movieCertification"
                    value={movieForm.certification}
                    onChange={(e) =>
                      setMovieForm({ ...movieForm, certification: e.target.value as 'U' | 'UA' | 'A' })
                    }
                    className="w-full px-3 py-2 rounded-xl admin-input text-xs"
                  >
                    <option value="U">U (Universal)</option>
                    <option value="UA">UA (Parental Guidance)</option>
                    <option value="A">A (Adults Only)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label htmlFor="admin-movie-duration" className="text-xs text-[#89857D]">Duration (Minutes)</label>
                  <input
                    id="admin-movie-duration"
                    name="movieDuration"
                    type="number"
                    min="30"
                    required
                    value={movieForm.duration_mins}
                    onChange={(e) => setMovieForm({ ...movieForm, duration_mins: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl admin-input text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="admin-movie-genre" className="text-xs text-[#89857D]">Genre</label>
                  <input
                    id="admin-movie-genre"
                    name="movieGenre"
                    type="text"
                    placeholder="e.g. Sci-Fi Thriller"
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl admin-input text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="admin-movie-desc" className="text-xs text-[#89857D]">Synopsis / Description</label>
                <textarea
                  id="admin-movie-desc"
                  name="movieDescription"
                  rows={2}
                  placeholder="Summary of film..."
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl admin-input text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#F0A451] hover:bg-[#FFB96B] text-[#17120C] font-bold text-xs mt-2 transition cursor-pointer"
              >
                Add Movie
              </button>
            </form>
          </div>

          {/* Movies List */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <h2 className="text-lg font-bold text-[#F4EFE6]">Curated Movies ({movies.length})</h2>
            <div className="flex flex-col gap-2.5">
              {movies.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl admin-card flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    {m.poster_url && (
                      <div className="w-10 h-14 rounded-lg admin-card-inner overflow-hidden flex items-center justify-center shrink-0">
                        <img src={m.poster_url} alt={m.title} className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-[#F4EFE6]">{m.title}</h4>
                      <p className="text-xs text-[#89857D] mt-0.5">
                        {m.language} • {m.duration_mins} mins • <span className="text-[#F0A451] font-bold">{m.certification}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteMovie(m.id, m.title)}
                    title="Delete Movie"
                    className="w-8 h-8 rounded-xl bg-[#823E46]/20 hover:bg-[#823E46]/40 border border-[#823E46] text-[#E47A75] flex items-center justify-center transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
