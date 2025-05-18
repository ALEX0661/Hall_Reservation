import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import API from '../api/api';

export default function AdminDashboard() {
  const { logout } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch unread notification count when component mounts
    fetchUnreadCount();
    
    // Set up polling to refresh unread counts every 30 seconds
    const intervalId = setInterval(fetchUnreadCount, 30000);
    
    // Clean up on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await API.get('/notifications/count');
      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <nav className="flex flex-col md:flex-row gap-4 mb-6">
        <Link to="/admin/users" className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded">
          Users
        </Link>
        <Link to="/admin/reservations" className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded">
          Reservations
        </Link>
        <Link to="/admin/resources" className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded">
          Resources
        </Link>
        <Link to="/admin/halls" className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded">
          Halls
        </Link>
        <Link to="/admin/calendar" className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded">
          Calendar
        </Link>
        <Link to="/admin/notifications" className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded relative">
          Notifications
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </Link>
        <button 
          onClick={logout} 
          className="py-2 px-4 bg-red-100 hover:bg-red-200 rounded text-red-700"
        >
          Logout
        </button>
      </nav>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Quick Actions Dashboard Tiles */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Pending Reservations</h2>
          <p className="text-gray-600">Review and manage pending reservation requests</p>
          <Link to="/admin/reservations?status=PENDING" className="mt-4 inline-block text-blue-500 hover:underline">
            View pending reservations →
          </Link>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Notifications</h2>
          <p className="text-gray-600">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'You have no new notifications'}
          </p>
          <Link to="/admin/notifications" className="mt-4 inline-block text-blue-500 hover:underline">
            View all notifications →
          </Link>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Resource Management</h2>
          <p className="text-gray-600">Manage hall resources and capacity</p>
          <Link to="/admin/resources" className="mt-4 inline-block text-blue-500 hover:underline">
            Manage resources →
          </Link>
        </div>
      </div>
    </div>
  );
}