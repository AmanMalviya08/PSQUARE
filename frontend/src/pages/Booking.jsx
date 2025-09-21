import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import '../styles/booking.css';

export default function Booking() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/trips/${id}`);
        setTrip(res.data.data.trip);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [id]);

  if (!trip) return <div>Loading...</div>;

  const seatNumbers = Array.from({ length: trip.totalSeats }, (_, i) => i + 1);

  const toggleSeat = (s) => {
    if (selected.includes(s)) setSelected(selected.filter(x => x !== s));
    else setSelected([...selected, s]);
  };

  const handleConfirm = async () => {
    if (selected.length === 0) return toast.error('Select at least one seat');
    try {
      const res = await api.post('/bookings', { tripId: trip._id, seats: selected });
      const booking = res.data.data.booking;
      await api.post('/bookings/confirm-payment', {
        bookingId: booking._id,
        amount: trip.price * selected.length,
        method: 'mock'
      });
      toast.success('Booking confirmed!');
      navigate('/my-bookings');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Booking failed');
    }
  };

  return (
    <div className="booking-container">
      <h4 className="title">Select Seats for {trip.from} → {trip.to}</h4>
      
      <div className="seat-map">
        {seatNumbers.map((s) => {
          const active = selected.includes(s);
          const isSold = false; // you can replace this with trip.bookedSeats.includes(s)
          return (
            <div
              key={s}
              className={`seat-item ${isSold ? 'sold' : active ? 'selected' : 'available'}`}
              onClick={() => !isSold && toggleSeat(s)}
            >
              <div className="seat-icon"></div>
              <span className="seat-label">{s}</span>
              {!isSold && <span className="seat-price">₹{trip.price}</span>}
            </div>
          );
        })}
      </div>

      <div className="summary">
        <p>Total: <strong>₹{trip.price * selected.length}</strong></p>
        <button className="btn-confirm" onClick={handleConfirm}>Confirm & Pay</button>
      </div>
    </div>
  );
}
