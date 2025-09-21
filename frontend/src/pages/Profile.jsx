import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MyBookings from './MyBookings';
import '../styles/profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.patch('/users/me', form);
      updateUser(res.data.data.user);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const notice = document.createElement('div');
      notice.className = 'toast-inline success';
      notice.innerText = 'Profile updated';
      document.body.appendChild(notice);
      setTimeout(() => notice.classList.add('show'), 10);
      setTimeout(() => { notice.classList.remove('show'); setTimeout(()=>notice.remove(),300); }, 2500);
    } catch (err) {
      console.error(err);
      setSaving(false);
      const notice = document.createElement('div');
      notice.className = 'toast-inline error';
      notice.innerText = 'Update failed';
      document.body.appendChild(notice);
      setTimeout(() => notice.classList.add('show'), 10);
      setTimeout(() => { notice.classList.remove('show'); setTimeout(()=>notice.remove(),300); }, 2500);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-left" aria-hidden>
          <div className="avatar" title={user?.name || 'User'}>
            {user?.name ? user.name.split(' ').map(n=>n[0]).slice(0,2).join('') : 'U'}
          </div>
          <h2 className="profile-name">{user?.name || 'User'}</h2>
          <p className="profile-role">{user?.role ? user.role.toUpperCase() : 'USER'}</p>
        </div>

        <div className="profile-right">
          <h3 className="section-title">Account Details</h3>

          <div className="field">
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
              aria-label="Full name"
            />
          </div>

          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="name@example.com"
              type="email"
              aria-label="Email"
            />
          </div>

          <div className="actions">
            <button
              className="btn btn-ghost"
              onClick={() => setForm({ name: user?.name || '', email: user?.email || '' })}
              disabled={saving}
            >
              Reset
            </button>

            <button
              className={`btn btn-primary ${saving ? 'loading' : ''}`}
              onClick={handleSave}
              disabled={saving}
              aria-busy={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <section className="bookings-section">
        <div className="bookings-header">
          <h3>Your Bookings</h3>
          <p className="muted">Recent bookings tied to your account</p>
        </div>

        <div className="bookings-body">
          <MyBookings />
        </div>
      </section>
    </div>
  );
}
