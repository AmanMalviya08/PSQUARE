import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/signup', form);
      // backend responds: { status, token, data: { user } }
      login(res.data.data.user, res.data.token); // (user, token)
      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);
      const msg = err?.response?.data?.message || 'Signup failed';
      alert(msg);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Sign Up</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label className="label">Name</label>
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div className="field">
            <label className="label">Confirm Password</label>
            <input
              type="password"
              className="input"
              value={form.passwordConfirm}
              onChange={e => setForm({ ...form, passwordConfirm: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn">Sign Up</button>
        </form>
      </div>
    </div>
  );
}
