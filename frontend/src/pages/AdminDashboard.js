import React, { useState, useEffect } from 'react';
import { 
  BarChart3, CheckSquare, Users, Building2, 
  Cpu, CalendarClock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../api/api';
import AdminLayout from '../components/AdminLayout';
import '../styles/AdminDashboard.css';

export default function EnhancedAdminDashboard() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    pendingReservations: 0,
    totalUsers: 0,
    totalHalls: 0,
    totalResources: 0
  });
  const [reservationsByStatus, setReservationsByStatus] = useState({
    pending: 0,
    approved: 0,
    denied: 0
  });
  const [recentReservations, setRecentReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data when component mounts
    fetchDashboardData();
    
    // Set up polling to refresh data every 60 seconds
    const intervalId = setInterval(fetchDashboardData, 60000);
    
    // Clean up on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch notifications count
      const notificationsResponse = await API.get('/notifications/count');
      setUnreadCount(notificationsResponse.data.unread_count);

      // Fetch pending reservations count
      const pendingReservationsResponse = await API.get('/admin/reservations?status=PENDING');
      const pendingCount = pendingReservationsResponse.data.length;

      // Fetch all reservations to calculate stats
      const allReservationsResponse = await API.get('/admin/reservations');
      const allReservations = allReservationsResponse.data;
      
      // Calculate reservations by status
      const statusCounts = allReservations.reduce(
        (acc, reservation) => {
          const status = reservation.status.toLowerCase();
          if (status === 'pending') acc.pending += 1;
          else if (status === 'approved') acc.approved += 1;
          else if (status === 'denied') acc.denied += 1;
          return acc;
        },
        { pending: 0, approved: 0, denied: 0 }
      );
      setReservationsByStatus(statusCounts);
      
      // Get recent reservations (most recent 5)
      const sortedReservations = [...allReservations].sort((a, b) => 
        new Date(b.start_datetime) - new Date(a.start_datetime)
      ).slice(0, 5);
      setRecentReservations(sortedReservations);

      // Fetch users count
      const usersResponse = await API.get('/admin/users');
      const totalUsers = usersResponse.data.length;

      // Fetch halls count
      const hallsResponse = await API.get('/admin/halls');
      const totalHalls = hallsResponse.data.length;

      // Fetch resources count
      const resourcesResponse = await API.get('/admin/resources');
      const totalResources = resourcesResponse.data.length;

      setDashboardStats({
        pendingReservations: pendingCount,
        totalUsers,
        totalHalls,
        totalResources
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch(status.toLowerCase()) {
      case 'approved': return 'status-badge approved';
      case 'denied': return 'status-badge denied';
      case 'pending': 
      default: return 'status-badge pending';
    }
  };

  return (
    <AdminLayout 
      dashboardStats={dashboardStats}
      unreadCount={unreadCount}
    >
      {error && (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {/* Key Stats Section */}
      <section className="stats-container">
        <div className="stat-card">
          <div className="stat-icon pending">
            <CheckSquare size={24} />
          </div>
          <div className="stat-info">
            <h3>Pending Reservations</h3>
            <p className="stat-value">{loading ? '...' : dashboardStats.pendingReservations}</p>
          </div>
          <Link to="/admin/reservations?status=PENDING" className="stat-link">View all</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon users">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p className="stat-value">{loading ? '...' : dashboardStats.totalUsers}</p>
          </div>
          <Link to="/admin/users" className="stat-link">Manage users</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon halls">
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <h3>Halls Available</h3>
            <p className="stat-value">{loading ? '...' : dashboardStats.totalHalls}</p>
          </div>
          <Link to="/admin/halls" className="stat-link">Manage halls</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon resources">
            <Cpu size={24} />
          </div>
          <div className="stat-info">
            <h3>Resources</h3>
            <p className="stat-value">{loading ? '...' : dashboardStats.totalResources}</p>
          </div>
          <Link to="/admin/resources" className="stat-link">Manage resources</Link>
        </div>
      </section>

      {/* Charts and Tables Section */}
      <div className="dashboard-grid">
        {/* Reservations Stats */}
        <section className="dashboard-card reservations-overview">
          <h2 className="card-title">
            <BarChart3 size={20} />
            Reservations Overview
          </h2>
          <div className="status-stats">
            <div className="status-item">
              <div className="status-marker pending"></div>
              <div className="status-details">
                <h4>Pending</h4>
                <p>{loading ? '...' : reservationsByStatus.pending}</p>
              </div>
            </div>
            <div className="status-item">
              <div className="status-marker approved"></div>
              <div className="status-details">
                <h4>Approved</h4>
                <p>{loading ? '...' : reservationsByStatus.approved}</p>
              </div>
            </div>
            <div className="status-item">
              <div className="status-marker denied"></div>
              <div className="status-details">
                <h4>Denied</h4>
                <p>{loading ? '...' : reservationsByStatus.denied}</p>
              </div>
            </div>
          </div>
          <div className="chart-placeholder">
            <div className="chart-bars">
              <div 
                className="chart-bar pending" 
                style={{
                  height: loading ? '20%' : `${(reservationsByStatus.pending / (reservationsByStatus.pending + reservationsByStatus.approved + reservationsByStatus.denied || 1)) * 100}%`
                }}
              ></div>
              <div 
                className="chart-bar approved" 
                style={{
                  height: loading ? '60%' : `${(reservationsByStatus.approved / (reservationsByStatus.pending + reservationsByStatus.approved + reservationsByStatus.denied || 1)) * 100}%`
                }}
              ></div>
              <div 
                className="chart-bar denied" 
                style={{
                  height: loading ? '20%' : `${(reservationsByStatus.denied / (reservationsByStatus.pending + reservationsByStatus.approved + reservationsByStatus.denied || 1)) * 100}%`
                }}
              ></div>
            </div>
            <div className="chart-labels">
              <span>Pending</span>
              <span>Approved</span>
              <span>Denied</span>
            </div>
          </div>
        </section>

        {/* Recent Reservations */}
        <section className="dashboard-card recent-reservations">
          <h2 className="card-title">
            <CalendarClock size={20} />
            Recent Reservations
          </h2>
          {loading ? (
            <div className="loading-placeholder">
              <div className="skeleton-row"></div>
              <div className="skeleton-row"></div>
              <div className="skeleton-row"></div>
            </div>
          ) : recentReservations.length === 0 ? (
            <p className="no-data">No recent reservations found.</p>
          ) : (
            <div className="reservation-list">
              {recentReservations.map(reservation => (
                <div key={reservation.id} className="reservation-item">
                  <div className="reservation-details">
                    <h4>{reservation.hall?.name || 'Unknown Hall'}</h4>
                    <p className="reservation-user">
                      Reserved by: {reservation.user?.full_name || 'Unknown User'}
                    </p>
                    <p className="reservation-time">
                      {formatDate(reservation.start_datetime)}
                    </p>
                  </div>
                  <div className="reservation-status">
                    <span className={getStatusBadgeClass(reservation.status)}>
                      {reservation.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/admin/reservations" className="view-all-link">View all reservations</Link>
        </section>

        {/* Quick Actions */}
        <section className="dashboard-card quick-actions">
          <h2 className="card-title">Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/admin/reservations?status=PENDING" className="action-button pending-action">
              Review Pending Reservations
            </Link>
            <Link to="/admin/resources" className="action-button resource-action">
              Manage Resources
            </Link>
            <Link to="/admin/notifications" className="action-button notification-action">
              Check Notifications
              {unreadCount > 0 && <span className="action-badge">{unreadCount}</span>}
            </Link>
            <Link to="/admin/halls" className="action-button hall-action">
              Hall Management
            </Link>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}