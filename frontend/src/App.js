import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import ReservationList from './pages/ReservationList';
import NewReservation from './pages/NewReservation';
import Feedback from './pages/Feedback';
import Notifications from './pages/Notifications';

import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminReservations from './pages/AdminReservations';
import AdminResources from './pages/AdminResources';
import AdminHalls from './pages/AdminHalls';
import CalendarView from './pages/AdminCalendar';
import AdminNotifications from './pages/AdminNotifications';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student */}
          <Route element={<ProtectedRoute role="student" />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/reservations" element={<ReservationList />} />
            <Route path="/reservations/new" element={<NewReservation />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/reservations" element={<AdminReservations />} />
            <Route path="/admin/resources" element={<AdminResources />} />
            <Route path="/admin/halls" element={<AdminHalls />} />
            <Route path="/admin/calendar" element={<CalendarView />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
          </Route>

          <Route path="*" element={<h2>404: Page not found</h2>} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;