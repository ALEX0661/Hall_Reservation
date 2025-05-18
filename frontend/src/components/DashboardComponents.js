import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Layout, Calendar, ListCheck, Bell, MessageSquare } from 'lucide-react';
import '../styles/Dashboard.css';

// Menu items configuration - centralized for consistency
export const menuItems = [
  { 
    to: "/dashboard", 
    icon: <Layout size={22} strokeWidth={1.5} />, 
    label: "Dashboard"
  },
  { 
    to: "/reservations", 
    icon: <ListCheck size={22} strokeWidth={1.5} />, 
    label: "Bookings"
  },
  { 
    to: "/reservations/new", 
    icon: <Calendar size={22} strokeWidth={1.5} />, 
    label: "New Booking"
  },
  { 
    to: "/feedback", 
    icon: <MessageSquare size={22} strokeWidth={1.5} />, 
    label: "Feedback" 
  },
  { 
    to: "/notifications", 
    icon: <Bell size={22} strokeWidth={1.5} />, 
    label: "Notifications" 
  }
];

// Header component: reflects current page title and includes logout button
export function DashboardHeader() {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const isDashboard = location.pathname === '/dashboard';

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.fullName || user.full_name || user.email.split('@')[0];
  };

  const getAvatarInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  // Determine header title based on current path
  const getHeaderTitle = () => {
    if (isDashboard) {
      return {
        primary: `Welcome back,`,
        secondary: getUserDisplayName()
      };
    }
    const menuItem = menuItems.find(item => item.to === location.pathname);
    return {
      primary: menuItem ? menuItem.label : 'Page',
      secondary: null
    };
  };

  const { primary, secondary } = getHeaderTitle();

  return (
    <div className="dashboard-header">
      <div className="header-content">
        {isDashboard && (
          <div className="avatar-circle">
            {getAvatarInitial()}
          </div>
        )}
        <div className="header-text">
          <h1 className="header-title primary-title">{primary}</h1>
          {secondary && <h4 className="header-title secondary-title">{secondary}</h4>}
        </div>
      </div>
      <button className="logout-button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

// Fixed bottom mobile navbar
export function MobileNavbar({ notificationCount = 0 }) {
  const location = useLocation();
  const { unreadCount } = useNotifications();

  return (
    <nav className="mobile-navbar">
      {menuItems.map((item, idx) => (
        <Link
          to={item.to}
          key={idx}
          className={`nav-item ${location.pathname === item.to ? 'active' : ''}`}
        >
          <div className="nav-icon">
            {item.label === 'Notifications' && (unreadCount || notificationCount) > 0 ? (
              <div className="icon-with-badge">
                {item.icon}
                <span className="notification-badge">{unreadCount || notificationCount}</span>
              </div>
            ) : (
              item.icon
            )}
          </div>
          <div className="nav-label">{item.label}</div>
        </Link>
      ))}
    </nav>
  );
}

// Grid of menu cards for dashboard
export function MenuGrid({ notificationCount = 0, excludeDashboardIcon = false }) {
  const { unreadCount } = useNotifications();
  const filteredItems = excludeDashboardIcon
    ? menuItems.filter(item => item.to !== '/dashboard')
    : menuItems;

  return (
    <div className="menu-grid">
      {filteredItems.map((item, idx) => (
        <Link to={item.to} key={idx} className="menu-card">
          <div className="menu-icon">
            {item.label === 'Notifications' && (unreadCount || notificationCount) > 0 ? (
              <div className="icon-with-badge">
                {item.icon}
                <span className="notification-badge">{unreadCount || notificationCount}</span>
              </div>
            ) : (
              item.icon
            )}
          </div>
          <div className="menu-label">{item.label}</div>
        </Link>
      ))}
    </div>
  );
}