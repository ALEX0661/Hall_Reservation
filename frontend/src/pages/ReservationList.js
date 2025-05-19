import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Add this import
import API from '../api/api';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2, 
  Info,
  User,
  Home,
  X,
  ChevronRight,
  Tag,
  Search
} from 'lucide-react';
import '../styles/ReservationList.css';
import { DashboardHeader, MobileNavbar } from '../components/DashboardComponents';

// Define timezone constant
const TIMEZONE = 'Asia/Manila';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    APPROVED: { 
      className: 'status-badge status-approved', 
      icon: CheckCircle 
    },
    PENDING: { 
      className: 'status-badge status-pending', 
      icon: Clock 
    },
    DENIED: { 
      className: 'status-badge status-denied', 
      icon: XCircle 
    },
    CANCELLED: { 
      className: 'status-badge status-cancelled', 
      icon: X 
    }
  };

  const config = statusConfig[status] || { 
    className: 'status-badge status-default', 
    icon: Info 
  };
  
  const Icon = config.icon;

  return (
    <span className={config.className}>
      <Icon size={14} />
      <span>{status}</span>
    </span>
  );
};

// Filter Bar Component
const FilterBar = ({ filterStatus, setFilterStatus }) => {
  const filters = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Denied', value: 'DENIED' },
    { label: 'Cancelled', value: 'CANCELLED' }
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

// Reservation Card Component - Streamlined for mobile
const ReservationCard = ({ reservation, onClick }) => (
  <div className="reservation-card-compact" onClick={() => onClick(reservation)}>
    <div className="card-compact-content">
      <div className="card-compact-main">
        <div className="hall-info">
          <Home size={18} className="hall-icon" />
          <h3 className="hall-name">{reservation.hall.name}</h3>
        </div>
        
        <div className="card-compact-details">
          <div className="datetime-row">
            <Calendar size={14} />
            <span>{format(toZonedTime(new Date(reservation.start_datetime), TIMEZONE), 'MMM d, yyyy', { timeZone: TIMEZONE })}</span>
          </div>
          <div className="datetime-row">
            <Clock size={14} />
            <span>
              {format(toZonedTime(new Date(reservation.start_datetime), TIMEZONE), 'p', { timeZone: TIMEZONE })} - 
              {format(toZonedTime(new Date(reservation.end_datetime), TIMEZONE), 'p', { timeZone: TIMEZONE })}
            </span>
          </div>
        </div>
      </div>
      
      <div className="card-compact-status">
        <StatusBadge status={reservation.status} />
        <ChevronRight size={18} className="chevron-icon" />
      </div>
    </div>
  </div>
);

// Detail Modal Component
const ReservationDetailModal = ({ isOpen, onClose, reservation, onUpdate, onCancel, canUpdate, canCancel }) => {
  if (!isOpen || !reservation) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Reservation Details</h3>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="detail-header">
            <div className="hall-info">
              <Home size={24} className="hall-icon" />
              <h3 className="hall-name">{reservation.hall.name}</h3>
            </div>
            <StatusBadge status={reservation.status} />
          </div>
          
          <div className="detail-section">
            <h4 className="detail-section-title">
              <Calendar size={18} />
              <span>Date & Time</span>
            </h4>
            <div className="detail-content">
              <p className="detail-date">
                {format(toZonedTime(new Date(reservation.start_datetime), TIMEZONE), 'PPPP', { timeZone: TIMEZONE })}
              </p>
              <p className="detail-time">
                {format(toZonedTime(new Date(reservation.start_datetime), TIMEZONE), 'p', { timeZone: TIMEZONE })} - 
                {format(toZonedTime(new Date(reservation.end_datetime), TIMEZONE), 'p', { timeZone: TIMEZONE })}
              </p>
            </div>
          </div>
          
          {reservation.description && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <Info size={18} />
                <span>Description</span>
              </h4>
              <div className="detail-content description">
                <p>{reservation.description}</p>
              </div>
            </div>
          )}
          
          {reservation.resources.length > 0 && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <Tag size={18} />
                <span>Resources</span>
              </h4>
              <div className="detail-content">
                <div className="resource-tags">
                  {reservation.resources.map(resource => (
                    <span key={resource.id} className="resource-tag">
                      {resource.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {reservation.admin_message && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <AlertCircle size={18} />
                <span>Admin Note</span>
              </h4>
              <div className="detail-content admin-message">
                <p>{reservation.admin_message}</p>
              </div>
            </div>
          )}
          
          <div className="detail-section detail-actions">
            {canUpdate(reservation) && (
              <button 
                onClick={() => {
                  onClose();
                  onUpdate(reservation);
                }}
                className="btn btn-secondary btn-with-icon"
              >
                <Edit size={18} />
                <span>Update</span>
              </button>
            )}
            {canCancel(reservation) && (
              <button 
                onClick={() => {
                  onClose();
                  onCancel(reservation.id);
                }}
                className="btn btn-danger btn-with-icon"
              >
                <Trash2 size={18} />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = ({ text = "Loading..." }) => (
  <div className="loading-container">
    <div className="spinner"></div>
    <p>{text}</p>
  </div>
);

// Empty State Component
const EmptyState = () => (
  <div className="empty-state">
    <div className="empty-icon">
      <Calendar size={64} />
    </div>
    <h3>No Reservations Yet</h3>
    <p>You don't have any reservations. Create your first one to get started.</p>
    <Link to="/reservations/new" className="btn btn-primary">
      Create New Reservation
    </Link>
  </div>
);

// Alert Component
const Alert = ({ type, message, onClose }) => (
  <div className={`alert alert-${type}`}>
    <div className="alert-content">
      {type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
      <span>{message}</span>
    </div>
    {onClose && (
      <button onClick={onClose} className="alert-close">
        <X size={16} />
      </button>
    )}
  </div>
);

// Update Modal Component
const UpdateModal = ({ 
  isOpen, 
  onClose, 
  reservation, 
  form, 
  onChange, 
  onSubmit, 
  halls, 
  resources, 
  onResourceChange, 
  loading 
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Update Reservation</h3>
          <button onClick={onClose} className="modal-close">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">
              <Home size={18} />
              <span>Hall</span>
            </label>
            <select 
              name="hall_id" 
              value={form.hall_id} 
              onChange={onChange}
              className="form-select"
              required
            >
              {halls.map(hall => (
                <option key={hall.id} value={hall.id}>
                  {hall.name} (Capacity: {hall.capacity})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <Calendar size={18} />
                <span>Start Time</span>
              </label>
              <input 
                type="datetime-local" 
                name="start_datetime" 
                value={form.start_datetime} 
                onChange={onChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                <Clock size={18} />
                <span>End Time</span>
              </label>
              <input 
                type="datetime-local" 
                name="end_datetime" 
                value={form.end_datetime} 
                onChange={onChange}
                className="form-input"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">
              <Info size={18} />
              <span>Description</span>
            </label>
            <textarea 
              name="description" 
              value={form.description} 
              onChange={onChange}
              className="form-textarea"
              rows="3"
              placeholder="Optional description..."
            />
          </div>
          
          {resources.length > 0 && (
            <div className="form-group">
              <label className="form-label">
                <Tag size={18} />
                <span>Resources</span>
              </label>
              <div className="checkbox-grid">
                {resources.map(resource => (
                  <label key={resource.id} className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={form.resource_ids.includes(resource.id)} 
                      onChange={() => onResourceChange(resource.id)}
                    />
                    <span className="checkbox-mark"></span>
                    <span className="checkbox-text">{resource.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>Updating...</span>
                </>
              ) : (
                'Update Reservation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
export default function ReservationList() {
  const [list, setList] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    hall_id: '',
    start_datetime: '',
    end_datetime: '',
    description: '',
    resource_ids: []
  });
  const [halls, setHalls] = useState([]);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');

  useEffect(() => {
    fetchInitialData();
    
    // Set up polling for reservations
    const intervalId = setInterval(fetchReservations, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchInitialData = async () => {
    setInitialLoading(true);
    try {
      await Promise.all([
        fetchReservations(),
        fetchHalls(),
        fetchResources()
      ]);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await API.get('/reservations');
      setList(response.data);
    } catch (err) {
      setError('Failed to load reservations');
    }
  };

  const fetchHalls = async () => {
    try {
      const response = await API.get('/halls');
      setHalls(response.data);
    } catch (err) {
      setError('Failed to load halls');
    }
  };

  const fetchResources = async () => {
    try {
      const response = await API.get('/resources');
      setResources(response.data);
    } catch (err) {
      setError('Failed to load resources');
    }
  };

  const handleUpdateClick = (reservation) => {
    const startDate = toZonedTime(new Date(reservation.start_datetime), TIMEZONE);
    const endDate = toZonedTime(new Date(reservation.end_datetime), TIMEZONE);
    
    const formatDateForInput = (date) => {
      return date.toISOString().slice(0, 16);
    };

    setSelectedReservation(reservation);
    setUpdateForm({
      hall_id: reservation.hall_id,
      start_datetime: formatDateForInput(startDate),
      end_datetime: formatDateForInput(endDate),
      description: reservation.description || '',
      resource_ids: reservation.resources.map(r => r.id)
    });
    setIsUpdateModalOpen(true);
  };

  const handleCardClick = (reservation) => {
    setSelectedReservation(reservation);
    setIsDetailModalOpen(true);
  };

  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleResourceChange = (resourceId) => {
    setUpdateForm(prev => {
      const newResourceIds = prev.resource_ids.includes(resourceId)
        ? prev.resource_ids.filter(id => id !== resourceId)
        : [...prev.resource_ids, resourceId];
      
      return { ...prev, resource_ids: newResourceIds };
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Check availability
      const checkResponse = await API.get('/check-availability', {
        params: {
          hall_id: updateForm.hall_id,
          start_datetime: updateForm.start_datetime,
          end_datetime: updateForm.end_datetime,
          exclude_id: selectedReservation.id
        }
      });
      
      if (!checkResponse.data) {
        setError('This time slot is not available. Please choose another time.');
        return;
      }
      
      // Update reservation
      await API.put(`/reservations/${selectedReservation.id}`, updateForm);
      setSuccess('Reservation updated successfully');
      setIsUpdateModalOpen(false);
      fetchReservations();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const reservation = list.find(res => res.id === reservationId);
      const wasApproved = reservation && reservation.status === 'APPROVED';
      
      await API.delete(`/reservations/${reservationId}`);
      setSuccess('Reservation cancelled successfully');
      
      // Notify admins if it was approved
      if (wasApproved) {
        try {
          await API.post('/notifications', {
            user_id: null,
            message: `Reservation #${reservationId} for ${reservation.hall.name} was cancelled after approval`
          });
        } catch (notificationErr) {
          console.error('Failed to send admin notification:', notificationErr);
        }
      }
      
      fetchReservations();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cancel reservation');
    } finally {
      setLoading(false);
    }
  };

  const canUpdate = (reservation) => reservation.status === 'PENDING';
  const canCancel = (reservation) => ['PENDING', 'APPROVED'].includes(reservation.status);

  const clearAlert = () => {
    setError('');
    setSuccess('');
  };

  const clearFilters = () => {
    setFilterStatus('ALL');
    setSearchTerm('');
    setSortOption('date-desc');
  };

  // Filter and sort reservations
  const filteredReservations = list
    .filter(res => {
      if (filterStatus !== 'ALL') {
        return res.status === filterStatus;
      }
      return true;
    })
    .filter(res => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        res.hall.name.toLowerCase().includes(searchLower) ||
        (res.description && res.description.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      if (sortOption === 'date-asc') {
        return new Date(a.start_datetime) - new Date(b.start_datetime);
      } else if (sortOption === 'date-desc') {
        return new Date(b.start_datetime) - new Date(a.start_datetime);
      } else if (sortOption === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

  if (initialLoading) {
    return (
      <div className="page-container">
        <LoadingSpinner text="Loading your reservations..." />
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <DashboardHeader />
      
      <div className="page-container">
        <div className="page-header">
          <div className="page-actions">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by hall or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="sort-select"
            >
              <option value="date-desc">Sort by Date (Newest)</option>
              <option value="date-asc">Sort by Date (Oldest)</option>
              <option value="status">Sort by Status</option>
            </select>
            <button onClick={clearFilters} className="btn btn-secondary">
              Clear Filters
            </button>
            <Link to="/reservations/new" className="btn btn-primary btn-with-icon">
              <Calendar size={18} />
              <span>New Reservation</span>
            </Link>
          </div>
        </div>

        {error && (
          <Alert 
            type="error" 
            message={error} 
            onClose={clearAlert}
          />
        )}

        {success && (
          <Alert 
            type="message" 
            message={success} 
            onClose={clearAlert}
          />
        )}

        <FilterBar filterStatus={filterStatus} setFilterStatus={setFilterStatus} />

        <div className="reservation-count">
          Showing {filteredReservations.length} of {list.length} reservations
        </div>

        {filteredReservations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="reservations-list">
            {filteredReservations.map(reservation => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onClick={handleCardClick}
              />
            ))}
          </div>
        )}

        <ReservationDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          reservation={selectedReservation}
          onUpdate={handleUpdateClick}
          onCancel={handleCancelReservation}
          canUpdate={canUpdate}
          canCancel={canCancel}
        />

        <UpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          reservation={selectedReservation}
          form={updateForm}
          onChange={handleUpdateFormChange}
          onSubmit={handleUpdateSubmit}
          halls={halls}
          resources={resources}
          onResourceChange={handleResourceChange}
          loading={loading}
        />
      </div>

      <MobileNavbar />
    </div>
  );
}