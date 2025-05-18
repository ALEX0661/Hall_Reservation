import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/api';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const response = await API.get('/notifications');
      const sortedNotifications = response.data.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setNotifications(sortedNotifications);
      setUnreadCount(sortedNotifications.filter(note => !note.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}