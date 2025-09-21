import React from 'react';
import { useNavigate } from 'react-router-dom';

// fallback image if no trip image
const PLACEHOLDER = '/images/placeholder-trip.jpg'; 

export default function TripCard({ trip }) {
  const nav = useNavigate();

  // prefer backend-provided imageUrl
  const src = trip?.imageUrl || PLACEHOLDER;

  return (
    <div className="trip-card">
      {/* Image wrapper */}
      <div
        className="trip-img-wrap"
        style={{ cursor: trip?.imageUrl ? 'pointer' : 'default' }}
      >
        <img
          src={src}
          alt={`${trip?.from || 'Unknown'} to ${trip?.to || 'Unknown'}`}
          className="trip-img"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER;
          }}
          onClick={() => {
            if (trip?.imageUrl) window.open(trip.imageUrl, '_blank');
          }}
        />
      </div>

      {/* Header section */}
      <div className="trip-head">
        <div className="trip-loc">
          {trip?.from || '---'} → {trip?.to || '---'}
        </div>
        <div className="trip-date">
          {trip?.date ? new Date(trip.date).toLocaleDateString() : '-'}
        </div>
      </div>

      {/* Body section */}
      <div className="trip-body">
        <p>🕒 Time: {trip?.time || '-'}</p>
        <p>💰 Price: ₹{trip?.price ?? '-'}</p>
        <p>
          🎟️ Seats:{' '}
          {(trip?.availableSeats ?? '-') + '/' + (trip?.totalSeats ?? '-')}
        </p>
      </div>

      {/* Footer section */}
      <div className="trip-footer">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => nav(`/trip/${trip?._id || trip?.id}`)}
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
