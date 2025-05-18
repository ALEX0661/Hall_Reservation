import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { DashboardHeader, MenuGrid, MobileNavbar } from '../components/DashboardComponents';
import '../styles/Dashboard.css';

export default function StudentDashboard() {
  const { user } = useContext(AuthContext);
  
  return (
    <div className="dashboard-container">
      <DashboardHeader />
      
      <div className="dashboard-content">
        <MenuGrid />
        
        <div className="quick-stats">
          <h3>Quick Overview</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Pending</h4>
              <div className="stat-circle yellow">0</div>
            </div>
            <div className="stat-card">
              <h4>Approved</h4>
              <div className="stat-circle green">0</div>
            </div>
            <div className="stat-card">
              <h4>Rejected</h4>
              <div className="stat-circle red">0</div>
            </div>
          </div>
        </div>
      </div>
      
      <MobileNavbar />
    </div>
  );
}