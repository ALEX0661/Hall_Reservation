import React, { useContext, useState } from 'react';
import { Check, X } from 'lucide-react';
import API from '../api/api';
import { AuthContext } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { DashboardHeader, MobileNavbar } from '../components/DashboardComponents';
import '../styles/Notifications.css';

// Filter Bar Component
const FilterBar = ({ filterStatus, setFilterStatus }) => {
  const filters = [
    { label: 'All', value: 'ALL' },
    { label: 'Unread', value: 'UNREAD' },
    { label: 'Read', value: 'READ' }
  ];

  return (
    <div className="filter-bar">
      {filters.map(filter => (
        <button
          key={filter.value}
          className={`filter-btn ${filterStatus === filter.value ? 'active' : ''}`}
          onClick={() => setFilterStatus(filter.value)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default function Notifications() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [filterStatus, setFilterStatus] = React.useState('ALL');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const { notifications, unreadCount, fetchNotifications } = useNotifications();

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      fetchNotifications();
      if (selectedNotification?.id === id) {
        setSelectedNotification(prev => ({ ...prev, is_read: true }));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const openModal = (notification) => {
    setSelectedNotification(notification);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setSelectedNotification(null);
    }, 300);
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(note => {
    if (filterStatus === 'UNREAD') {
      return !note.is_read;
    } else if (filterStatus === 'READ') {
      return note.is_read;
    }
    return true; // ALL
  });

  return (
    <div className="dashboard-layout">
      <DashboardHeader />
      
      <div className="notifications-container">
        <div className="page-actions">
          <FilterBar filterStatus={filterStatus} setFilterStatus={setFilterStatus} />
          {notifications.length > 0 && notifications.some(note => !note.is_read) && (
            <button 
              onClick={markAllAsRead}
              className="btn btn-primary btn-with-icon"
            >
              <Check size={18} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {error && (
          <div className="error-state">
            {error}
          </div>
        )}

        <div className="notification-count">
          Showing {filteredNotifications.length} of {notifications.length} notifications
        </div>

        {modalOpen && selectedNotification && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Notification</h2>
                <button className="close-button" onClick={closeModal}>
                  <X size={24} />
                </button>
              </div>
              <div className="modal-body">
                <div className="notification-details">
                  <p className={`notification-message ${selectedNotification.is_read ? 'read' : 'unread'}`}>
                    {selectedNotification.message}
                  </p>
                  <p className="notification-time">{formatTime(selectedNotification.created_at)}</p>
                </div>
                <div className="button-group">
                  {!selectedNotification.is_read && (
                    <button
                      onClick={() => markAsRead(selectedNotification.id)}
                      className="btn btn-primary"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={closeModal}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="loading-pulse"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            No notifications yet
          </div>
        ) : (
          <ul className="notifications-list">
            {filteredNotifications.map(note => (
              <li 
                key={note.id} 
                className={`notification-item ${note.is_read ? 'read' : 'unread'}`}
                onClick={() => openModal(note)}
              >
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    {!note.is_read && <span className="unread-indicator"></span>}
                    <div>
                      <p className={`notification-message ${!note.is_read ? 'unread' : ''}`}>
                        {note.message}
                      </p>
                      <p className="notification-time">{formatTime(note.created_at)}</p>
                    </div>
                  </div>
                  {!note.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(note.id);
                      }}
                      className="mark-read-button"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <MobileNavbar />
    </div>
  );
}