import React, { useEffect, useState } from 'react';
import API from '../api/api';
import '../styles/AdminReservations.css';
import { FiCalendar, FiClock, FiUser, FiMapPin, FiSearch, FiCheck, FiX, FiInfo, FiPackage, FiMail, FiMessageSquare } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';

export default function AdminReservations({ dashboardStats, unreadCount }) {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isDenyModalOpen, setIsDenyModalOpen] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [reasonError, setReasonError] = useState(false);
  const [reservationToDeny, setReservationToDeny] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [reservations, activeFilter, searchTerm, sortOrder]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/reservations');
      console.log("Received reservation data:", response.data);
      setReservations(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError("Failed to load reservations. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...reservations];
    
    if (activeFilter !== 'ALL') {
      filtered = filtered.filter(r => r.status === activeFilter);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        (r.user?.full_name?.toLowerCase?.()?.includes(searchLower) ||
         r.user?.email?.toLowerCase?.()?.includes(searchLower) ||
         r.hall?.name?.toLowerCase?.()?.includes(searchLower) ||
         r.description?.toLowerCase?.()?.includes(searchLower) ||
         r.resources?.some?.(res => res.name?.toLowerCase?.()?.includes(searchLower)))
      );
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.start_datetime);
      const dateB = new Date(b.start_datetime);
      
      if (sortOrder === 'newest') {
        return dateB - dateA;
      } else if (sortOrder === 'oldest') {
        return dateA - dateB;
      } else if (sortOrder === 'hall') {
        return (a.hall?.name || '').localeCompare(b.hall?.name || '');
      } else if (sortOrder === 'user') {
        return (a.user?.full_name || a.user?.email || '').localeCompare(b.user?.full_name || b.user?.email || '');
      }
      return 0;
    });
    
    setFilteredReservations(filtered);
  };

  const formatDateTime = (dateString) => {
    return dateString ? new Date(dateString).toLocaleString() : 'N/A';
  };
  
  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
  };
  
  const formatTime = (dateString) => {
    return dateString ? new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/admin/reservations/${id}/approve`);
      showNotification('Reservation approved successfully!', 'success');
      fetchReservations();
    } catch (err) {
      console.error("Error approving reservation:", err);
      showNotification('Failed to approve reservation. Please try again.', 'error');
    }
  };

  const handleDeny = (id) => {
    setReservationToDeny(id);
    setDenyReason('');
    setReasonError(false);
    setIsDenyModalOpen(true);
  };

  const handleConfirmDeny = async () => {
    if (!denyReason.trim()) {
      setReasonError(true);
      return;
    }
    
    try {
      await API.put(`/admin/reservations/${reservationToDeny}/deny?admin_message=${encodeURIComponent(denyReason)}`);
      setIsDenyModalOpen(false);
      showNotification('Reservation denied successfully!', 'success');
      fetchReservations();
    } catch (err) {
      console.error("Error denying reservation:", err);
      showNotification('Failed to deny reservation. Please try again.', 'error');
      setIsDenyModalOpen(false);
    }
  };

  const closeDenyModal = () => {
    setIsDenyModalOpen(false);
    setDenyReason('');
    setReasonError(false);
    setReservationToDeny(null);
  };
  
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'APPROVED': return 'status-approved';
      case 'PENDING': return 'status-pending';
      case 'DENIED': return 'status-denied';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-default';
    }
  };
  
  const getStatusIcon = (status) => {
    switch(status) {
      case 'APPROVED': return <FiCheck />;
      case 'PENDING': return <FiClock />;
      case 'DENIED': return <FiX />;
      case 'CANCELLED': return <FiX />;
      default: return <FiInfo />;
    }
  };

  const handleCardClick = (reservation) => {
    setSelectedReservation(reservation);
  };

  const closeDetailsModal = () => {
    setSelectedReservation(null);
  };

  if (loading) return (
    <AdminLayout dashboardStats={dashboardStats} unreadCount={unreadCount}>
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading reservations...</p>
      </div>
    </AdminLayout>
  );
  
  if (error) return (
    <AdminLayout dashboardStats={dashboardStats} unreadCount={unreadCount}>
      <div className="alert alert-error">
        <div className="alert-content">
          <FiX />
          <span>{error}</span>
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout dashboardStats={dashboardStats} unreadCount={unreadCount}>
      <div className="page-container">
        {notification.show && (
          <div className={`alert alert-${notification.type}`}>
            <div className="alert-content">
              {notification.type === 'success' ? <FiCheck /> : <FiInfo />}
              <span>{notification.message}</span>
            </div>
            <button className="alert-close" onClick={() => setNotification({ show: false, message: '', type: '' })}>
              <FiX />
            </button>
          </div>
        )}
        
        <div className="page-header">
          <h1>Reservation Management</h1>
          <div className="page-actions">
            <div className="search-bar">
              <FiSearch />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search by name, email, hall, or resource..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              className="sort-select" 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="hall">Hall Name</option>
              <option value="user">User Name</option>
            </select>
          </div>
        </div>
        
        <div className="filter-bar">
          <button 
            className={`filter-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveFilter('PENDING')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'APPROVED' ? 'active' : ''}`}
            onClick={() => setActiveFilter('APPROVED')}
          >
            Approved
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'DENIED' ? 'active' : ''}`}
            onClick={() => setActiveFilter('DENIED')}
          >
            Denied
          </button>
  <button 
    className={`filter-btn ${activeFilter === 'CANCELLED' ? 'active' : ''}`}
    onClick={() => setActiveFilter('CANCELLED')}
  >
    Cancelled
  </button>
</div>

<div className="reservation-count">
  {filteredReservations.length} reservation{filteredReservations.length !== 1 ? 's' : ''} found
</div>

{filteredReservations.length === 0 ? (
  <div className="empty-state">
    <div className="empty-icon">
      <FiCalendar size={48} />
    </div>
    <h3>No Reservations Found</h3>
    <p>There are no reservations matching your current filters.</p>
    <button 
      className="btn btn-primary" 
      onClick={() => {
        setActiveFilter('ALL');
        setSearchTerm('');
      }}
    >
      Clear Filters
    </button>
  </div>
) : (
  <div className="reservations-list">
    {filteredReservations.map(r => (
      <div 
        key={r.id} 
        className="reservation-card-compact"
        onClick={() => handleCardClick(r)}
        style={{ cursor: 'pointer' }}
      >
        <div className="card-compact-content">
                  <div className="card-compact-main">
                    <div className="hall-info">
                      <span className="hall-icon">
                        <FiMapPin />
                      </span>
                      <h3 className="hall-name">{r.hall?.name || 'Unknown hall'}</h3>
                    </div>
                    <div className="card-compact-details">
                      <div className="datetime-row">
                        <FiUser /> 
                        <span>{r.user?.full_name || r.user?.email || 'Unknown user'}</span>
                      </div>
                      <div className="datetime-row">
                        <FiCalendar /> 
                        <span>{formatDate(r.start_datetime)}</span>
                      </div>
                      <div className="datetime-row">
                        <FiClock /> 
                        <span>{formatTime(r.start_datetime)} - {formatTime(r.end_datetime)}</span>
                      </div>
                      {r.resources?.length > 0 && (
                        <div className="datetime-row">
                          <FiPackage />
                          <span>
                            Resources: {r.resources.map((res, index) => (
                              <span key={index}>{res.name}{res.quantity > 1 ? ` (x${res.quantity})` : ''}{index < r.resources.length - 1 ? ', ' : ''}</span>
                            ))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="card-compact-status">
                    <div className={`status-badge ${getStatusClass(r.status)}`}>
                      {getStatusIcon(r.status)} {r.status}
                    </div>
                    
                    {r.status === 'PENDING' && (
                      <div className="action-buttons">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleApprove(r.id); }} 
                          className="btn btn-sm btn-success"
                          title="Approve this reservation"
                        >
                          <FiCheck /> Approve
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeny(r.id); }} 
                          className="btn btn-sm btn-danger"
                          title="Deny this reservation"
                        >
                          <FiX /> Deny
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {r.admin_message && (
                  <div className="admin-message">
                    <strong>Admin Note:</strong> {r.admin_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {isDenyModalOpen && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>Deny Reservation</h3>
                <button className="modal-close" onClick={closeDenyModal}>
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="denyReason" className="form-label">Reason for denial (required)</label>
                  <textarea 
                    id="denyReason" 
                    className="form-textarea" 
                    rows="4" 
                    placeholder="Please provide a reason for denying this reservation."
                    value={denyReason}
                    onChange={(e) => setDenyReason(e.target.value)}
                  ></textarea>
                  {reasonError && (
                    <p className="form-error">Please provide a reason for denial</p>
                  )}
                </div>
                <div className="modal-actions">
                  <button className="btn btn-danger" onClick={handleConfirmDeny}>Confirm Denial</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedReservation && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>Reservation Details</h3>
                <button className="modal-close" onClick={closeDetailsModal}>
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <div className="reservation-details">
                  <div className="detail-row">
                    <FiMapPin />
                    <span><strong>Hall:</strong> {selectedReservation.hall?.name || 'Unknown hall'}</span>
                  </div>
                  <div className="detail-row">
                    <FiUser />
                    <span><strong>User:</strong> {selectedReservation.user?.full_name || 'Unknown user'}</span>
                  </div>
                  <div className="detail-row">
                    <FiMail />
                    <span><strong>Email:</strong> {selectedReservation.user?.email || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <FiCalendar />
                    <span><strong>Date:</strong> {formatDate(selectedReservation.start_datetime)}</span>
                  </div>
                  <div className="detail-row">
                    <FiClock />
                    <span><strong>Time:</strong> {formatTime(selectedReservation.start_datetime)} - {formatTime(selectedReservation.end_datetime)}</span>
                  </div>
                  <div className="detail-row">
                    <FiInfo />
                    <span><strong>Status:</strong> {selectedReservation.status}</span>
                  </div>
                  {selectedReservation.description && (
                    <div className="detail-row">
                      <FiMessageSquare />
                      <span><strong>Description:</strong> {selectedReservation.description}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <FiPackage />
                    <span>
                      <strong>Resources:</strong> 
                      {selectedReservation.resources?.length > 0 
                        ? selectedReservation.resources.map((res, index) => (
                            <span key={index}>{res.name}{res.quantity > 1 ? ` (x${res.quantity})` : ''}{index < selectedReservation.resources.length - 1 ? ', ' : ''}</span>
                          ))
                        : 'None'}
                    </span>
                  </div>
                  {selectedReservation.admin_message && (
                    <div className="detail-row">
                      <FiMessageSquare />
                      <span><strong>Admin Note:</strong> {selectedReservation.admin_message}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={closeDetailsModal}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}