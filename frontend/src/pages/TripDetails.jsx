import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/tripdetails.css';

export default function TripDetails() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/trips/${id}`);
        setTrip(res.data?.data?.trip || null);
      } catch (err) {
        console.error(err);
        setTrip(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="td-loading">Loading trip details…</div>;
  if (!trip) return <div className="td-empty">Trip not found.</div>;

  const booked = new Set((trip.bookedSeats || []).map(s => String(s)));
  const totalSeats = Number(trip.totalSeats || 0);
  const availableSeats = Math.max(0, totalSeats - (booked.size || 0));
  const formattedDate = trip.date ? new Date(trip.date).toLocaleDateString() : '-';
  const formattedPrice = typeof trip.price === 'number' ? `₹${trip.price.toLocaleString()}` : `₹${trip.price || '-'}`;

  const handleSelectSeats = () => {
    navigate(`/booking/${trip._id || trip.id}`);
  };

  return (
    <div className="td-page">
      <div className="td-card">
        <div className="td-media" aria-hidden>
          <img src={trip.imageUrl || trip.image || '/images/default-trip.jpg'} alt={`${trip.from} to ${trip.to}`} />
        </div>

        <div className="td-info">
          <h1 className="td-title">{trip.from} → {trip.to}</h1>

          <div className="td-meta">
            <div className="td-row">
              <div className="td-meta-item" tabIndex="0" aria-label={`Date ${formattedDate}`}>
                <div className="label">Date</div>
                <div className="value">{formattedDate}</div>
              </div>

              <div className="td-meta-item" tabIndex="0" aria-label={`Time ${trip.time || '-'}`}>
                <div className="label">Time</div>
                <div className="value">{trip.time || '-'}</div>
              </div>

              <div className="td-meta-item" tabIndex="0" aria-label={`Seats available ${availableSeats} of ${totalSeats}`}>
                <div className="label">Seats</div>
                <div className="value">{availableSeats} / {totalSeats}</div>
              </div>

              <div className="td-price" aria-hidden>
                <div className="price-label">Price</div>
                <div className="price-value">{formattedPrice}</div>
                <div className="price-sub">per seat</div>
              </div>
            </div>
          </div>

          <div className="td-desc">
            <h3>About this trip</h3>
            <p>{trip.description || 'Comfortable journey with experienced drivers and maintained vehicles.'}</p>
          </div>

          <div className="td-actions">
            <button className="btn-outline" onClick={() => navigator.share ? navigator.share({ title: `${trip.from} → ${trip.to}`, url: window.location.href }).catch(()=>{}) : window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Share
            </button>
            <button
              className="btn-primary"
              onClick={handleSelectSeats}
              disabled={availableSeats <= 0}
              aria-disabled={availableSeats <= 0}
            >
              {availableSeats > 0 ? 'Select Seats' : 'Sold Out'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
