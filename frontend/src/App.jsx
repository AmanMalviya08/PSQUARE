// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TripDetails from './pages/TripDetails';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import AdminBookings from './components/AdminBookings';   // ✅ new
import { ToastContainer } from 'react-toastify';
import { useAuth } from './context/AuthContext';

/**
 * PrivateRoute
 * Wrap any element that requires authentication, e.g.
 * <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
 */
function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/**
 * AdminRoute
 * Wrap admin-only sections. If not logged in -> /login.
 * If logged in but not admin -> redirect to home.
 *
 * This also supports nested admin routes because the element can
 * be a component that renders its own nested <Routes /> (like AdminPanel).
 */
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <div className="container my-4">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/trip/:id" element={<TripDetails />} />

          {/* Protected routes */}
          <Route
            path="/booking/:id"
            element={
              <PrivateRoute>
                <Booking />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <PrivateRoute>
                <MyBookings />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* Admin area */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <AdminRoute>
                <AdminBookings />   {/* ✅ admin-only bookings list */}
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <ToastContainer position="top-right" />
    </>
  );
}
