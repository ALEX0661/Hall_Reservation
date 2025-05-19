import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, CalendarClock, Home, Building2, 
  Bell, Cpu
} from 'lucide-react';
import '../styles/AdminDashboard.css';

const AdminSidebar = ({ dashboardStats, unreadCount }) => {
  const location = useLocation();
  
  // Helper function to determine if a menu item is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="admin-sidebar">
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
      </div>
      <div className="sidebar-menu">
        <Link to="/admin" className={`menu-item ${isActive('/admin') ? 'active' : ''}`}>
          <Home size={20} />
          <span>Dashboard</span>
        </Link>
        <Link to="/admin/users" className={`menu-item ${isActive('/admin/users') ? 'active' : ''}`}>
          <Users size={20} />
          <span>Users</span>
        </Link>
        <Link to="/admin/reservations" className={`menu-item ${isActive('/admin/reservations') ? 'active' : ''}`}>
          <CalendarClock size={20} />
          <span>Reservations</span>
          {dashboardStats?.pendingReservations > 0 && (
            <span className="menu-badge">{dashboardStats.pendingReservations}</span>
          )}
        </Link>
        <Link to="/admin/resources" className={`menu-item ${isActive('/admin/resources') ? 'active' : ''}`}>
          <Cpu size={20} />
          <span>Resources</span>
        </Link>
        <Link to="/admin/halls" className={`menu-item ${isActive('/admin/halls') ? 'active' : ''}`}>
          <Building2 size={20} />
          <span>Halls</span>
        </Link>
        <Link to="/admin/notifications" className={`menu-item ${isActive('/admin/notifications') ? 'active' : ''}`}>
          <Bell size={20} />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="menu-badge">{unreadCount}</span>
          )}
        </Link>
      </div>
    </nav>
  );
};

export default AdminSidebar;