import React, { useEffect, useState } from 'react';
import api from '../services/api';
import TripCard from '../components/TripCard';
import '../styles/home.css';

function TripsByDateGroup({ groups }) {
  
  return (
    <div className="groups-wrapper">
      {Object.keys(groups).length === 0 && <div className="empty-note">No trips found for this route.</div>}
      {Object.entries(groups).map(([dateStr, trips]) => (
        <div className="date-group" key={dateStr}>
          <div className="date-group-header">
            <h3>{new Date(dateStr).toLocaleDateString()}</h3>
            <div className="date-group-sub">Available buses: {trips.length}</div>
          </div>

          <div className="date-group-list">
            {trips.map(trip => (
              <div key={trip._id || trip.id} className="date-group-item">
                <TripCard trip={trip} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [trips, setTrips] = useState([]);
  const [filters, setFilters] = useState({ from: '', to: '', date: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trips', { params: filters });
      const data = res.data.data?.trips || [];
      console.log('DEBUG trips:', data); // helpful during testing
      setTrips(data);
    } catch (err) {
      console.error(err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTrips();
  };

  // Route search without date -> show all times grouped by date
  const isRouteSearchAllDates = filters.from.trim() !== '' && filters.to.trim() !== '' && !filters.date;

  // Build grouped object: date (yyyy-mm-dd) => sorted array of trips (by time)
  const grouped = trips.reduce((acc, t) => {
    const d = t.date ? new Date(t.date) : null;
    const key = d ? d.toISOString().split('T')[0] : 'unscheduled';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  // Sort group keys (dates) ascending, and sort trips in each group by time
  const sortedGrouped = Object.keys(grouped)
    .sort((a, b) => {
      if (a === 'unscheduled') return 1;
      if (b === 'unscheduled') return -1;
      return new Date(a) - new Date(b);
    })
    .reduce((obj, k) => {
      obj[k] = grouped[k].sort((x, y) => {
        if (x.time && y.time) return x.time.localeCompare(y.time);
        return new Date(x.date) - new Date(y.date);
      });
      return obj;
    }, {});

  return (
    <div className="home-page">
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <h1>Find Your Next Journey</h1>
            <p className="hero-sub">Discover available trips and book your seats with ease.</p>

            <form className="hero-search" onSubmit={handleSearch}>
              <input
                className="input"
                placeholder="From"
                value={filters.from}
                onChange={e => setFilters({ ...filters, from: e.target.value })}
              />
              <input
                className="input"
                placeholder="To"
                value={filters.to}
                onChange={e => setFilters({ ...filters, to: e.target.value })}
              />
              <input
                type="date"
                className="input"
                value={filters.date}
                onChange={e => setFilters({ ...filters, date: e.target.value })}
              />
              <button className="btn" type="submit">Search Trips</button>
            </form>

            <div className="search-hint" style={{ marginTop: 8, color: '#6b7280', fontSize: 13 }}>
              Tip: Date khali chhodein agar aap route ki saari buses (sab times) dekhna chahte hain.
            </div>
          </div>

          <div className="hero-right" aria-hidden>
            <div className="hero-card">
              <img src="/images/hero-travel.jpg" alt="" />
            </div>
          </div>
        </div>
      </header>

      <section className="available">
        <div className="available-header">
          <h2>Available Trips</h2>
          <p className="muted">Choose from our carefully selected destinations and enjoy a comfortable journey.</p>
        </div>

        {loading ? (
          <div className="empty-note">Loading trips…</div>
        ) : (
          <>
            {isRouteSearchAllDates ? (
              <TripsByDateGroup groups={sortedGrouped} />
            ) : (
              <div className="trips-wrapper">
                {trips.length === 0 ? (
                  <div className="empty-note">No trips available. Admins can add trips.</div>
                ) : trips.map((t, i) => (
                  <div className="trip-col" key={t._id || t.id} style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="trip-card-anim">
                      <TripCard trip={t} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <footer className="home-footer">
          <div className="footer-left">© {new Date().getFullYear()} ArgoTravel</div>
          <div className="footer-right">Made with ♥ · Contact · Privacy</div>
        </footer>
      </section>
    </div>
  );
}
