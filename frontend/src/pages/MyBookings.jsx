import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

// convert numeric seat number to label (A1, B2, etc.)
function seatLabelFromNumber(n, seatsPerRow = 4) {
  const index = Number(n) - 1;
  const row = Math.floor(index / seatsPerRow);
  const col = (index % seatsPerRow) + 1;
  const rowLetter = String.fromCharCode(65 + row);
  return `${rowLetter}${col}`;
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/my');
      setBookings(res.data?.data?.bookings || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const cancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return;
    try {
      setBusyId(id);
      const res = await api.patch(`/bookings/${id}/cancel`);
      toast.success(res.data?.message || 'Booking cancelled');
      setBookings(prev => prev.filter(b => (b._id || b.id) !== id));
    } catch (err) {
      console.error('cancelBooking error', err);
      const msg = err?.response?.data?.message || 'Failed to cancel booking';
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  const downloadTicket = async (id) => {
    try {
      setBusyId(id);
      const res = await api.get(`/bookings/${id}/ticket`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?(.+)"?/);
      const filename = match ? match[1] : `ticket-${id}.pdf`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Ticket download started');
    } catch (err) {
      console.error('downloadTicket error', err);
      const msg = err?.response?.data?.message || 'Failed to download ticket';
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="text-center py-5 text-muted">Loading your bookings…</div>;

  if (!bookings.length) return (
    <div className="container py-4">
      <div className="alert alert-info mb-0">No bookings yet. Explore trips and book a seat!</div>
    </div>
  );

  return (
    <div className="container py-3">
      <div className="d-flex flex-column gap-3">
        {bookings.map(b => {
          const id = b._id || b.id;
          const seats = Array.isArray(b.seats) ? b.seats : [];
          const perSeat = Number(b.trip?.price || 0);
          const total = perSeat * seats.length;
          const created = b.createdAt ? new Date(b.createdAt).toLocaleString() : '-';
          const seatsPerRow = 4;
          const totalSeats = Number(b.trip?.totalSeats || 20);
          const rows = Math.ceil(totalSeats / seatsPerRow);
          const isCancelled = (b.status || '').toLowerCase() === 'cancelled';

          return (
            <div key={id} className="card shadow-sm">
              <div className="card-body p-3">
                <div className="row g-3 align-items-start">
                  {/* Left: Trip thumbnail */}
                  <div className="col-auto d-flex flex-column align-items-center">
                    <div style={{ width: 120, height: 80, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9' }}>
                      {b.trip?.imageUrl || b.trip?.image ? (
                        <img
                          src={b.trip.imageUrl || b.trip.image}
                          alt={`${b.trip?.from} to ${b.trip?.to}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center" style={{ height: '100%', background: 'linear-gradient(135deg,#3554d1,#2b42b8)', color:'#fff', fontWeight:800 }}>
                          {(b.trip?.from || '?').slice(0,1)}
                        </div>
                      )}
                    </div>

                    <div className="text-center mt-2">
                      <div className="fw-bold small">{b.trip?.from || '-'} → {b.trip?.to || '-'}</div>
                      <div className="text-muted small">{b.trip?.date ? new Date(b.trip.date).toLocaleDateString() : '-'} · {b.trip?.time || '-'}</div>
                      <div className="text-muted small">Booked: {created}</div>
                    </div>
                  </div>

                  {/* Right: Details */}
                  <div className="col">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="h6 mb-0">Booking</div>
                        <div className="text-muted small">ID: <code className="text-muted">{id}</code></div>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold fs-5">₹{total}</div>
                        <div className="text-muted small">({seats.length} × ₹{perSeat})</div>
                      </div>
                    </div>

                    <div className="row gx-2 gy-2 align-items-center mb-2">
                      <div className="col-auto">
                        <span className={`badge ${ isCancelled ? 'bg-light text-danger' : ((b.status || '').toLowerCase() === 'pending' ? 'bg-warning text-dark' : 'bg-success') }`}>
                          {b.status || 'unknown'}
                        </span>
                      </div>
                      <div className="col-auto">
                        <span className="text-muted small">Payment: {b.paymentStatus || '—'}</span>
                      </div>
                    </div>

                    {/* Seat Map */}
                    <div className="mb-2">
                      <div className="d-flex flex-wrap" style={{ gap: 6 }}>
                        {Array.from({ length: rows * seatsPerRow }, (_, i) => {
                          const num = i + 1;
                          const isBooked = seats.includes(num) || seats.includes(String(num));
                          const label = seatLabelFromNumber(num, seatsPerRow);
                          return (
                            <span
                              key={num}
                              className={`badge ${isBooked ? 'bg-success text-white' : 'bg-light text-muted'}`}
                              style={{ minWidth: 42, padding: '8px 6px', textAlign: 'center', borderRadius: 8, fontWeight: 700 }}
                              title={`Seat ${label}`}
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mb-2">
                      <strong>Seats:</strong> {seats.length ? seats.map(s => seatLabelFromNumber(s, seatsPerRow)).join(', ') : '-'}
                    </div>

                    {/* Actions */}
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => downloadTicket(id)}
                        disabled={busyId === id}
                      >
                        {busyId === id ? 'Please wait…' : 'Download Ticket'}
                      </button>

                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => cancelBooking(id)}
                        disabled={busyId === id || isCancelled}
                      >
                        {busyId === id ? 'Cancelling…' : (isCancelled ? 'Cancelled' : 'Cancel Booking')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
