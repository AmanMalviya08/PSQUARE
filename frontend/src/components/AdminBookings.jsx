import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import '../styles/admin.css';

export default function AdminBookings({ trip = null, onClose = () => {} }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings'); 
      const payload = res.data?.data?.bookings ?? res.data?.bookings ?? null;

      if (Array.isArray(payload)) {
        // filter by trip if trip prop provided
        const filtered = trip ? payload.filter(b => {
          const bTripId = b.trip?._id || b.trip?._id || b.trip;
          return String(bTripId) === String(trip._id);
        }) : payload;
        setBookings(filtered);
      } else if (Array.isArray(res.data)) {
        // some APIs might return an array at top-level
        const arr = res.data;
        const filtered = trip ? arr.filter(b => String(b.trip?._id || b.trip) === String(trip._id)) : arr;
        setBookings(filtered);
      } else {
        // server didn't return bookings array — show helpful message and empty list
        toast.info('Server did not return a bookings list. If you want server-side filtering, implement GET /api/v1/bookings to return bookings for admin.');
        setBookings([]);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip]);

  return (
    <div className="admin-bookings">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <strong>Total bookings:</strong> {bookings.length}
          {trip && <span style={{ marginLeft: 12, color: '#6b7280' }}>{trip.from} → {trip.to} ({trip.time})</span>}
        </div>
        <div>
          <button className="btn btn-ghost" onClick={fetchBookings}>Refresh</button>
          <button className="btn btn-ghost" onClick={onClose} style={{ marginLeft: 8 }}>Close</button>
        </div>
      </div>

      {loading ? (
        <div>Loading bookings…</div>
      ) : bookings.length === 0 ? (
        <div>No bookings found for this trip.</div>
      ) : (
        <div className="bookings-list">
          {bookings.map(b => (
            <div className="booking-card" key={b._id}>
              <div className="booking-card-left">
                <div className="booking-user">{b.user?.name || '—'}</div>
                <div className="booking-email">{b.user?.email || '—'}</div>
                <div className="booking-seats">Seats: {Array.isArray(b.seats) ? b.seats.join(', ') : (b.seats || '-')}</div>
              </div>

              <div className="booking-card-right">
                <div><strong>Trip:</strong> {b.trip ? `${b.trip.from} → ${b.trip.to}` : '-'}</div>
                <div><strong>Date:</strong> {b.trip?.date ? new Date(b.trip.date).toLocaleString() : '-'}</div>
                <div><strong>Payment:</strong> {b.paymentStatus || b.payment?.status || '—'}</div>
                <div><strong>Status:</strong> {b.status || '—'}</div>
                <div style={{ marginTop: 6, color: '#6b7280', fontSize: 13 }}>
                  Booked on: {new Date(b.createdAt || b.bookingDate || b.updatedAt || Date.now()).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
