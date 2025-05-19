import React, { useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiSearch, FiRefreshCw } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import API from '../api/api';
import '../styles/AdminResources.css';

export default function AdminResourcesPage() {
  const [resources, setResources] = useState([]);
  const [newResourceName, setNewResourceName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalResources: 0,
    availableResources: 0
  });
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch resources data
  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const response = await API.get('/admin/resources');
      setResources(response.data);
      
      // Update stats
      setDashboardStats({
        totalResources: response.data.length,
        availableResources: response.data.length
      });
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    
    // Simulate unread notifications for demo
    setUnreadCount(3);
  }, []);

  // Add new resource
  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!newResourceName.trim()) return;
    
    try {
      await API.post('/admin/resources', { name: newResourceName });
      setNewResourceName('');
      fetchResources();
    } catch (error) {
      console.error('Error adding resource:', error);
    }
  };

  // Delete resource
  const handleDeleteResource = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await API.delete(`/admin/resources/${id}`);
        fetchResources();
      } catch (error) {
        console.error('Error deleting resource:', error);
      }
    }
  };

  // Filter resources by search term
  const filteredResources = resources.filter(resource => 
    resource.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout dashboardStats={dashboardStats} unreadCount={unreadCount}>
      <div className="admin-resources-container">
        <header className="page-header">
          <h1>Resource Management</h1>
          <button className="btn-refresh" onClick={fetchResources}>
            <FiRefreshCw />
            <span>Refresh</span>
          </button>
        </header>

        {/* Stats Section */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <FiPlus />
            </div>
            <div className="stat-text">
              <p className="stat-label">Total Resources</p>
              <h3 className="stat-value">{dashboardStats.totalResources}</h3>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon available">
              <FiPlus />
            </div>
            <div className="stat-text">
              <p className="stat-label">Available Resources</p>
              <h3 className="stat-value">{dashboardStats.availableResources}</h3>
            </div>
          </div>
        </div>

        {/* Resource Actions */}
        <div className="resource-actions">
          <div className="add-resource-container">
            <h2>Add New Resource</h2>
            <form onSubmit={handleAddResource} className="add-resource-form">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Resource name"
                  value={newResourceName}
                  onChange={(e) => setNewResourceName(e.target.value)}
                  required
                  className="resource-input"
                />
                <button type="submit" className="btn-adds">
                  <FiPlus /> Add Resource
                </button>
              </div>
            </form>
          </div>

          <div className="search-container">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {/* Resources Table */}
        <div className="resources-table-container">
          <h2>Manage Resources</h2>
          {isLoading ? (
            <div className="loading-spinner">Loading...</div>
          ) : filteredResources.length > 0 ? (
            <div className="resources-grid">
              {filteredResources.map((resource) => (
                <div key={resource.id} className="resource-card">
                  <div className="resource-name">
                    <span>{resource.name}</span>
                  </div>
                  <div className="resource-actions">
                    <button 
                      className="btn-icon btn-icon-delete" 
                      onClick={() => handleDeleteResource(resource.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-resources">
              <p>No resources found. {searchTerm ? 'Try a different search term.' : 'Create a new resource to get started.'}</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}