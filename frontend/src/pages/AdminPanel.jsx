import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import '../styles/admin.css';
import AdminBookings from '../components/AdminBookings';

export default function AdminPanel() {
  const initialForm = { from:'', to:'', date:'', time:'', totalSeats:20, price:0, imageFile: null, imagePreview: null };
  const [form, setForm] = useState(initialForm);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTripForBookings, setActiveTripForBookings] = useState(null); // trip object for bookings modal
  const fileInputRef = useRef();

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trips', { params: { adminView: true } });
      setTrips(res.data.data?.trips || res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setForm(prev=>({ ...prev, imageFile: null, imagePreview: null }));
      return;
    }
    // preview
    const reader = new FileReader();
    reader.onload = () => setForm(prev=>({ ...prev, imageFile: file, imagePreview: reader.result }));
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitCreate = async () => {
    try {
      if (!form.from || !form.to || !form.date || !form.time) {
        toast.error('Please provide from, to, date and time.');
        return;
      }
      setSaving(true);

      const fd = new FormData();
      fd.append('from', form.from);
      fd.append('to', form.to);
      fd.append('date', form.date);
      fd.append('time', form.time);
      fd.append('totalSeats', String(form.totalSeats));
      fd.append('price', String(form.price));
      if (form.imageFile) fd.append('image', form.imageFile);

      await api.post('/trips', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      toast.success('Trip created');
      resetForm();
      await fetchTrips();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const submitUpdate = async () => {
    try {
      if (!editingId) return;
      setSaving(true);

      const fd = new FormData();
      if (form.from) fd.append('from', form.from);
      if (form.to) fd.append('to', form.to);
      if (form.date) fd.append('date', form.date);
      if (form.time) fd.append('time', form.time);
      if (form.totalSeats != null) fd.append('totalSeats', String(form.totalSeats));
      if (form.price != null) fd.append('price', String(form.price));
      if (form.imageFile) fd.append('image', form.imageFile);

      await api.patch(`/trips/${editingId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      toast.success('Trip updated');
      resetForm();
      await fetchTrips();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    try {
      await api.delete(`/trips/${id}`);
      toast.success('Trip deleted');
      setTrips(prev => prev.filter(t => (t._id || t.id) !== id));
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const startEdit = (t) => {
    setEditingId(t._id || t.id);
    setForm({
      from: t.from || '',
      to: t.to || '',
      date: t.date ? (t.date.split ? t.date.split('T')[0] : new Date(t.date).toISOString().split('T')[0]) : '',
      time: t.time || '',
      totalSeats: t.totalSeats ?? 20,
      price: t.price ?? 0,
      imageFile: null,
      imagePreview: t.imageUrl || null
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // open bookings drawer for trip
  const openBookings = (trip) => {
    setActiveTripForBookings(trip);
    // optionally scroll into view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeBookings = () => {
    setActiveTripForBookings(null);
  };

  return (
    <div className="admin-panel">
      <h3 className="panel-title">{editingId ? 'Edit Trip' : 'Admin Panel — Add Trip'}</h3>

      <div className="panel card">
        <div className="form-grid">
          <input className="input" placeholder="From" value={form.from} onChange={e=>setForm({...form, from:e.target.value})} />
          <input className="input" placeholder="To" value={form.to} onChange={e=>setForm({...form, to:e.target.value})} />
          <input type="date" className="input" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
          <input type="time" className="input" value={form.time} onChange={e=>setForm({...form, time:e.target.value})} />
          <input type="number" className="input" min="1" placeholder="Seats" value={form.totalSeats} onChange={e=>setForm({...form, totalSeats:+e.target.value})} />
          <input type="number" className="input" min="0" placeholder="Price" value={form.price} onChange={e=>setForm({...form, price:+e.target.value})} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, color: '#374151' }}>Trip image (optional)</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} />
            {form.imagePreview && (
              <img src={form.imagePreview} alt="preview" style={{ width: 140, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
            )}
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          {editingId ? (
            <>
              <button className="btn" onClick={submitUpdate} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
              <button className="btn btn-ghost" onClick={resetForm}>Cancel</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={submitCreate} disabled={saving}>{saving ? 'Creating…' : 'Add Trip'}</button>
              <button className="btn btn-ghost" onClick={resetForm}>Reset</button>
            </>
          )}

          <button className="btn btn-ghost" onClick={fetchTrips}>Refresh</button>
        </div>
      </div>

      <section className="panel">
        <h3>User-visible Trips</h3>

        {loading ? (
          <p>Loading trips…</p>
        ) : trips.length === 0 ? (
          <p>No trips found.</p>
        ) : (
          <div className="trips-table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Seats</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(t => {
                  const id = t._id || t.id;
                  return (
                    <tr key={id}>
                      <td>
                        {t.imageUrl ? (
                          <img src={t.imageUrl} alt="trip" style={{ width: 80, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                        ) : (
                          <div style={{ width: 80, height: 48, background: '#f1f5f9', borderRadius: 6 }} />
                        )}
                      </td>
                      <td>{t.from}</td>
                      <td>{t.to}</td>
                      <td>{t.date ? new Date(t.date).toLocaleDateString() : '-'}</td>
                      <td>{t.time || '-'}</td>
                      <td>{t.totalSeats ?? '-'}</td>
                      <td>{t.price ?? '-'}</td>
                      <td className="actions">
                        <button className="btn btn-sm" onClick={() => startEdit(t)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(id)}>Delete</button>
                        <button className="btn btn-outline btn-sm" onClick={() => openBookings(t)}>View Bookings</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* bookings drawer/modal — show if activeTripForBookings is set */}
      {activeTripForBookings && (
        <div className="admin-bookings-drawer" role="dialog" aria-modal="true">
          <div className="admin-bookings-card">
            <div className="admin-bookings-header">
              <h3>Bookings for: {activeTripForBookings.from} → {activeTripForBookings.to} ({activeTripForBookings.time})</h3>
              <div>
                <button className="btn btn-ghost" onClick={() => { fetchTrips(); closeBookings(); }}>Close</button>
              </div>
            </div>

            <AdminBookings trip={activeTripForBookings} onClose={closeBookings} />
          </div>
        </div>
      )}
    </div>
  );
}
