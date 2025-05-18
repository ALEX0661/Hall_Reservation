import React, { useEffect, useState } from 'react';
import API from '../api/api';
import { format } from 'date-fns';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
    } else {
      fetchFeedback();
    }
    
    // Set up polling to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      if (activeTab === 'notifications') {
        fetchNotifications();
      } else {
        fetchFeedback();
      }
    }, 30000);
    
    // Clean up on component unmount
    return () => clearInterval(intervalId);
  }, [activeTab]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await API.get('/notifications');
      setNotifications(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load notifications. Please try again later.');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/feedback');
      setFeedback(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load feedback. Please try again later.');
      console.error('Error fetching feedback:', err);
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

  // Helper function to format dates
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Function to highlight cancelled approved reservations
  const getNotificationStyle = (message) => {
    if (message.includes('CANCELLED after being APPROVED')) {
      return 'bg-red-100 border-l-4 border-red-500';
    }
    return '';
  };

  // Function to render star rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-500' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        {activeTab === 'notifications' && notifications.some(n => !n.is_read) && (
          <button
            onClick={markAllAsRead}
            className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-4">
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'notifications' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
          {notifications.filter(n => !n.is_read).length > 0 && (
            <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {notifications.filter(n => !n.is_read).length}
            </span>
          )}
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'feedback' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('feedback')}
        >
          User Feedback
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      {loading && <div className="text-center py-4">Loading...</div>}
      
      {!loading && activeTab === 'notifications' && (
        <>
          {notifications.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No notifications to display</div>
          ) : (
            <div className="space-y-2">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-4 rounded border ${!notification.is_read ? 'bg-blue-50' : 'bg-white'} ${getNotificationStyle(notification.message)}`}
                >
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <p className={`${!notification.is_read ? 'font-semibold' : ''}`}>{notification.message}</p>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(notification.created_at)}</p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-sm text-blue-500 hover:text-blue-700"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && activeTab === 'feedback' && (
        <>
          {feedback.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No feedback to display</div>
          ) : (
            <div className="space-y-4">
              {feedback.map(item => (
                <div key={item.id} className="bg-white p-4 rounded border shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-1">
                        <div className="font-semibold mr-2">Rating:</div>
                        <div className="text-xl">{renderStars(item.rating)}</div>
                      </div>
                      <p className="text-sm mb-2">
                        <span className="font-medium">Hall:</span> {item.reservation?.hall?.name || 'Unknown Hall'}
                      </p>
                      <p className="text-sm mb-2">
                        <span className="font-medium">Reservation Period:</span>{' '}
                        {item.reservation ? 
                          `${formatDate(item.reservation.start_datetime)} - ${formatDate(item.reservation.end_datetime)}` : 
                          'Unknown period'}
                      </p>
                      {item.comments && (
                        <div className="mt-2">
                          <p className="font-medium mb-1">Comments:</p>
                          <p className="bg-gray-50 p-3 rounded">{item.comments}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(item.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}