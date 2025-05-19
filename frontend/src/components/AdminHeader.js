import React, { useContext } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/AdminDashboard.css';

const AdminHeader = ({ unreadCount }) => {
  const { user, logout } = useContext(AuthContext);

  // Get avatar initials from user name
  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="admin-header">
      <div className="header-content">
        <div className="header-welcome">
          <h1>Welcome back, Admin</h1>
          {user && user.full_name && (
            <p className="admin-name">{user.full_name}</p>
          )}
        </div>
        <div className="header-actions">
          <Link to="/admin/notifications" className="notification-button">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-indicator">{unreadCount}</span>
            )}
          </Link>
          <div className="admin-avatar">
            {getInitials(user?.full_name)}
          </div>
          <button onClick={logout} className="logout-button">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;