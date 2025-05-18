import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function ProtectedRoute({ role }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  if (role === 'admin' && !user.is_admin) return <Navigate to="/dashboard" />;
  if (role === 'student' && user.is_admin) return <Navigate to="/admin" />;
  return <Outlet />;
}
