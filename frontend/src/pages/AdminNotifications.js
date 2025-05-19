import React, { useState, useEffect } from 'react';
import { Check, X, Bell, Filter, Star } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import API from '../api/api';
import '../styles/AdminNotifications.css';

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

// Tab Component
const TabBar = ({ activeTab, setActiveTab, notificationCount, feedbackCount }) => {
  return (
    <div className="tab-bar">
      <button
        className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
        onClick={() => setActiveTab('notifications')}
      >
        Notifications
        {notificationCount > 0 && (
          <span className="notification-badge">{notificationCount}</span>
        )}
      </button>
      <button
        className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
        onClick={() => setActiveTab('feedback')}
      >
        User Feedback
        {feedbackCount > 0 && (
          <span className="feedback-badge">{feedbackCount}</span>
        )}
      </button>
    </div>
  );
};

// Star Rating Component
const StarRating = ({ rating }) => {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={18}
          className={`star ${star <= rating ? 'filled' : 'empty'}`}
        />
      ))}
    </div>
  );
};

// Notification Modal Component
const NotificationModal = ({ notification, onClose, onMarkAsRead }) => {
  if (!notification) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Notification Details</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <div className="notification-details">
            <p className="notification-message">{notification.message}</p>
            <p className="notification-time">{formatDate(notification.created_at)}</p>
          </div>
          <div className="button-group">
            {!notification.is_read && (
              <button className="btn btn-primary" onClick={() => onMarkAsRead(notification.id)}>
                Mark as Read
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Feedback Modal Component
const FeedbackModal = ({ feedback, onClose }) => {
  if (!feedback) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Feedback Details</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <div className="feedback-details">
            <div className="detail-row">
              <h3>Rating</h3>
              <StarRating rating={feedback.rating} />
            </div>
            <div className="detail-row">
              <h3>Hall</h3>
              <p>{feedback.reservation?.hall?.name || 'Unknown Hall'}</p>
            </div>
            <div className="detail-row">
              <h3>Reservation Period</h3>
              <p>{feedback.reservation ? 
                `${formatDate(feedback.reservation.start_datetime)} - ${formatDate(feedback.reservation.end_datetime)}` : 
                'Unknown period'}</p>
            </div>
            {feedback.comments && (
              <div className="detail-row">
                <h3>Comments</h3>
                <div className="feedback-comment">{feedback.comments}</div>
              </div>
            )}
            <div className="detail-row">
              <h3>Submitted</h3>
              <p>{formatDate(feedback.created_at)}</p>
            </div>
          </div>
          <div className="button-group">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [activeTab, setActiveTab] = useState('notifications');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalReservations: 0,
    pendingReservations: 0,
    approvedReservations: 0,
    deniedReservations: 0
  });

  useEffect(() => {
    // Fetch both notifications and feedback on initial load
    fetchAllData();
    
    // Set up polling to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      fetchAllData();
    }, 30000);
    
    // Clean up on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Fetch both notifications and feedback in parallel
      const [notificationsResponse, feedbackResponse] = await Promise.all([
        API.get('/notifications'),
        API.get('/admin/feedback')
      ]);
      
      setNotifications(notificationsResponse.data);
      setFeedback(feedbackResponse.data);
      
      // Set mock dashboard statistics
      setDashboardStats({
        totalReservations: 145,
        pendingReservations: 12,
        approvedReservations: 110,
        deniedReservations: 23
      });
      
      setError('');
    } catch (err) {
      setError('Failed to load data. Please try again later.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await API.put(`/notifications/${notificationId}/read`);
      // Update notifications in state to mark as read
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      
      // Also update the selected notification if it's the one being marked as read
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification(prev => ({ ...prev, is_read: true }));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      // Update all notifications in state to mark as read
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const openNotificationModal = (notification) => {
    setSelectedNotification(notification);
  };

  const closeNotificationModal = () => {
    setSelectedNotification(null);
  };

  const openFeedbackModal = (feedback) => {
    setSelectedFeedback(feedback);
  };

  const closeFeedbackModal = () => {
    setSelectedFeedback(null);
  };

  // Format the relative time for notifications
  const formatRelativeTime = (timestamp) => {
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

  // Format the date for feedback
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Filter notifications based on read/unread status
  const filteredNotifications = notifications.filter(note => {
    if (filterStatus === 'UNREAD') {
      return !note.is_read;
    } else if (filterStatus === 'READ') {
      return note.is_read;
    }
    return true; // ALL
  });

  // Get counts for badges
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const newFeedbackCount = feedback.filter(f => new Date(f.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

  return (
    <AdminLayout dashboardStats={dashboardStats} unreadCount={unreadCount}>
      <div className="admin-notifications-container">
        <div className="admin-notifications-header">
          <h1>Admin Notifications Center</h1>
          <div className="header-actions">
            {activeTab === 'notifications' && notifications.some(n => !n.is_read) && (
              <button className="btn btn-primary" onClick={markAllAsRead}>
                <Check size={16} />
                <span>Mark All as Read</span>
              </button>
            )}
          </div>
        </div>

        <TabBar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          notificationCount={unreadCount}
          feedbackCount={newFeedbackCount}
        />

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notifications-section">
            <div className="section-header">
              <div className="filter-container">
                <FilterBar filterStatus={filterStatus} setFilterStatus={setFilterStatus} />
              </div>
              <div className="notification-count">
                Showing {filteredNotifications.length} of {notifications.length} notifications
              </div>
            </div>
            
            {loading && filteredNotifications.length === 0 ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <span>Loading notifications...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="empty-state">
                <Bell size={48} className="empty-icon" />
                <h3>No Notifications</h3>
                <p>There are no notifications to display.</p>
              </div>
            ) : (
              <ul className="notifications-list">
                {filteredNotifications.map(notification => (
                  <li 
                    key={notification.id} 
                    className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                    onClick={() => openNotificationModal(notification)}
                  >
                    <div className="notification-content">
                      <div className="notification-message-wrapper">
                        {!notification.is_read && <span className="unread-indicator"></span>}
                        <div>
                          <p className="notification-message">
                            {notification.message}
                          </p>
                          <p className="notification-time">{formatRelativeTime(notification.created_at)}</p>
                        </div>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
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
        )}

        {activeTab === 'feedback' && (
          <div className="feedback-section">
            <div className="section-header">
              <div className="section-title">User Feedback</div>
              <div className="feedback-count">
                Showing {feedback.length} feedback submissions
              </div>
            </div>
            
            {loading && feedback.length === 0 ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <span>Loading feedback...</span>
              </div>
            ) : feedback.length === 0 ? (
              <div className="empty-state">
                <Star size={48} className="empty-icon" />
                <h3>No Feedback</h3>
                <p>There is no user feedback to display.</p>
              </div>
            ) : (
              <div className="feedback-grid">
                {feedback.map(item => (
                  <div 
                    key={item.id} 
                    className="feedback-card"
                    onClick={() => openFeedbackModal(item)}
                  >
                    <div className="feedback-header">
                      <StarRating rating={item.rating} />
                      <span className="feedback-date">{formatDate(item.created_at)}</span>
                    </div>
                    <div className="feedback-body">
                      <div className="feedback-hall">
                        <strong>Hall:</strong> {item.reservation?.hall?.name || 'Unknown Hall'}
                      </div>
                      {item.comments && (
                        <div className="feedback-comments">
                          <p>{item.comments.length > 100 ? item.comments.substring(0, 100) + '...' : item.comments}</p>
                        </div>
                      )}
                    </div>
                    <div className="feedback-footer">
                      <button className="btn btn-secondary btn-sm">View Details</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notification Modal */}
        {selectedNotification && (
          <NotificationModal 
            notification={selectedNotification} 
            onClose={closeNotificationModal}
            onMarkAsRead={markAsRead}
          />
        )}

        {/* Feedback Modal */}
        {selectedFeedback && (
          <FeedbackModal 
            feedback={selectedFeedback} 
            onClose={closeFeedbackModal}
          />
        )}
      </div>
    </AdminLayout>
  );
}