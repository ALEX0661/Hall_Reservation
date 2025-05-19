import React, { useEffect, useState } from 'react';
import API from '../api/api';
import AdminLayout from '../components/AdminLayout';
import { FiHome } from 'react-icons/fi';
import '../styles/AdminHalls.css';

export default function AdminHallsPage() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [dashboardStats, setDashboardStats] = useState({
    totalHalls: 0,
    totalCapacity: 0,
    avgCapacity: 0
  });

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    setLoading(true);
    try {
      const response = await API.get('/admin/halls');
      setHalls(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching halls:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (hallsData) => {
    const totalHalls = hallsData.length;
    const totalCapacity = hallsData.reduce((sum, hall) => sum + (hall.capacity || 0), 0);
    const avgCapacity = totalHalls > 0 ? Math.round(totalCapacity / totalHalls) : 0;
    
    setDashboardStats({
      totalHalls,
      totalCapacity,
      avgCapacity
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort halls
  const sortedHalls = halls.sort((a, b) => {
    const fieldA = sortField === 'capacity' ? (a.capacity || 0) : a[sortField];
    const fieldB = sortField === 'capacity' ? (b.capacity || 0) : b[sortField];
    
    if (sortDirection === 'asc') {
      return fieldA > fieldB ? 1 : -1;
    } else {
      return fieldA < fieldB ? 1 : -1;
    }
  });

  return (
    <AdminLayout dashboardStats={dashboardStats}>
      <div className="halls-container">
        <header className="page-header">
          <h1><FiHome className="page-icon" /> Halls Management</h1>
          <p>View lecture halls and room capacities</p>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <FiHome />
            </div>
            <div className="stat-text">
              <p className="stat-label">Total Halls</p>
              <h3 className="stat-value">{dashboardStats.totalHalls}</h3>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon admin">
              <FiHome />
            </div>
            <div className="stat-text">
              <p className="stat-label">Total Capacity</p>
              <h3 className="stat-value">{dashboardStats.totalCapacity}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon student">
              <FiHome />
            </div>
            <div className="stat-text">
              <p className="stat-label">Average Capacity</p>
              <h3 className="stat-value">{dashboardStats.avgCapacity}</h3>
            </div>
          </div>
        </div>

        {/* Halls Table */}
        <div className="halls-table-container">
          {loading ? (
            <div className="loading">Loading halls...</div>
          ) : (
            <>
              {sortedHalls.length === 0 ? (
                <div className="no-halls">
                  <p>No halls found.</p>
                </div>
              ) : (
                <table className="halls-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('id')}>
                        ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('name')}>
                        Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('capacity')}>
                        Capacity {sortField === 'capacity' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHalls.map((hall) => (
                      <tr key={hall.id}>
                        <td>{hall.id}</td>
                        <td>{hall.name}</td>
                        <td>{hall.capacity || 'Not set'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}