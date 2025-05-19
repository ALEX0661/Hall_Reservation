import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import API from '../api/api';
import { Search, UserCheck, UserX } from 'lucide-react';
import '../styles/AdminUsers.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Apply filters and sorting whenever users, filter or searchTerm changes
    let result = [...users];
    
    // Apply filter
    if (filter === 'admin') {
      result = result.filter(user => user.is_admin);
    } else if (filter === 'student') {
      result = result.filter(user => !user.is_admin);
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.full_name?.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term) ||
        user.student_number?.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    if (sortBy === 'name') {
      result.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    } else if (sortBy === 'email') {
      result.sort((a, b) => a.email.localeCompare(b.email));
    } else if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    setFilteredUsers(result);
  }, [users, filter, searchTerm, sortBy]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await API.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users. Please try again.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dashboard stats
  const dashboardStats = {
    totalUsers: users.length,
    adminUsers: users.filter(u => u.is_admin).length,
    studentUsers: users.filter(u => !u.is_admin).length
  };

  const renderUserCard = (user) => (
    <div className="reservation-card-compact" key={user.id}>
      <div className="card-compact-content">
        <div className="card-compact-main">
          <div className="hall-info">
            {user.is_admin ? 
              <UserCheck size={18} className="hall-icon" /> : 
              <UserX size={18} className="hall-icon" />
            }
            <h3 className="hall-name">{user.full_name || 'Unnamed User'}</h3>
          </div>
          <div className="card-compact-details">
            <div className="datetime-row">
              <span>Email:</span> {user.email}
            </div>
            {user.student_number && (
              <div className="datetime-row">
                <span>Student ID:</span> {user.student_number}
              </div>
            )}
            <div className="datetime-row">
              <span>Added on:</span> {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="card-compact-status">
          <span className={`status-badge ${user.is_admin ? 'status-approved' : 'status-default'}`}>
            {user.is_admin ? 'Admin' : 'Student'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout dashboardStats={dashboardStats}>
      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <h1>User Management</h1>
          <div className="page-actions">
            <div className="search-bar">
              <Search size={18} />
              <input 
                type="text" 
                className="search-input"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="date">Sort by Date Added</option>
            </select>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Users ({users.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'admin' ? 'active' : ''}`}
            onClick={() => setFilter('admin')}
          >
            Admins ({users.filter(u => u.is_admin).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'student' ? 'active' : ''}`}
            onClick={() => setFilter('student')}
          >
            Students ({users.filter(u => !u.is_admin).length})
          </button>
        </div>

        {/* User Count */}
        <div className="reservation-count">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="alert alert-error">
            <div className="alert-content">
              <span>{error}</span>
            </div>
            <button 
              className="alert-close" 
              onClick={() => setError('')}
            >
              ×
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-container">
            <div className=" Officer"></div>
            <span>Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <h3>No users found</h3>
            <p>
              {searchTerm ? 
                'Try adjusting your search or filters to find what you\'re looking for.' : 
                'There are no users in the system yet.'}
            </p>
          </div>
        ) : (
          <div className="reservations-list">
            {filteredUsers.map(user => renderUserCard(user))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}