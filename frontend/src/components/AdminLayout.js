import React from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../styles/AdminDashboard.css';

const AdminLayout = ({ children, dashboardStats, unreadCount }) => {
  return (
    <div className="admin-dashboard">
      {/* Admin Header */}
      <AdminHeader unreadCount={unreadCount} />

      {/* Main Content */}
      <div className="admin-content">
        {/* Sidebar Navigation */}
        <AdminSidebar 
          dashboardStats={dashboardStats} 
          unreadCount={unreadCount} 
        />

        {/* Dashboard Main Content */}
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;