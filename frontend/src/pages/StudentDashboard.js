import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { DashboardHeader, MenuGrid, MobileNavbar } from '../components/DashboardComponents';
import API from '../api/api';
import '../styles/Dashboard.css';

export default function StudentDashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    denied: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await API.get('/reservations');

      const reservations = response.data;
      const counts = reservations.reduce(
        (acc, reservation) => {
          const status = reservation.status.toLowerCase();
          if (status === 'pending') acc.pending += 1;
          else if (status === 'approved') acc.approved += 1;
          else if (status === 'denied') acc.denied += 1;
          return acc;
        },
        { pending: 0, approved: 0, denied: 0 }
      );

      setStats(counts);
      setError(null);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservation data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  return (
    <div className="dashboard-container">
      <DashboardHeader />
      
      <div className="dashboard-content">
        <MenuGrid excludeDashboardIcon={true} />
        
        <div className="quick-stats">
          <h3>Quick Overview</h3>
          {error && (
            <div className="error-message">
              {error}
              <button
                className="retry-button"
                onClick={fetchReservations}
              >
                Retry
              </button>
            </div>
          )}
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Pending</h4>
              <div className={`stat-circle yellow ${loading ? 'skeleton skeleton-circle' : ''}`}>
                {loading ? '' : stats.pending}
              </div>
            </div>
            <div className="stat-card">
              <h4>Approved</h4>
              <div className={`stat-circle green ${loading ? 'skeleton skeleton-circle' : ''}`}>
                {loading ? '' : stats.approved}
              </div>
            </div>
            <div className="stat-card">
              <h4>Denied</h4>
              <div className={`stat-circle red ${loading ? 'skeleton skeleton-circle' : ''}`}>
                {loading ? '' : stats.denied}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <MobileNavbar />
    </div>
  );
}