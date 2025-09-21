import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Usage:
 * <Route element={<AdminRoute />}>
 *   <Route path="/admin" element={<AdminDashboard />} />
 * </Route>
 */

export default function AdminRoute({ children }) {
  const { user } = useAuth();

  // not logged in
  if (!user) return <Navigate to="/login" replace />;

  // not admin
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  // pass through
  return children ? children : <Outlet />;
}
