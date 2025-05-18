import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { Calendar, Clock, Info, PlusCircle, AlertCircle, Building, Package, X, CheckCircle, Search, AlertTriangle } from 'lucide-react';
import { DashboardHeader, MobileNavbar } from '../components/DashboardComponents';
import '../styles/NewReservation.css';

export default function NewReservation() {
  const navigate = useNavigate();
  const [halls, setHalls] = useState([]);
  const [resources, setResources] = useState([]);
  const [data, setData] = useState({
    hall_id: '',
    start_datetime: '',
    end_datetime: '',
    resource_ids: [],
    other_resources: [],
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [errors, setErrors] = useState({});
  const [newResource, setNewResource] = useState('');
  const [resourceSearch, setResourceSearch] = useState('');
  
  // Modal states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictType, setConflictType] = useState(''); // 'time-order' or 'reservation-conflict'
  
  const [progressStep, setProgressStep] = useState(0);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hallsResponse, resourcesResponse] = await Promise.all([
          API.get('/halls'),
          API.get('/resources')
        ]);
        setHalls(hallsResponse.data);
        setResources(resourcesResponse.data);
      } catch (err) {
        setErrors({ general: 'Failed to load data' });
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format datetime for input fields to ensure consistency
  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Format to YYYY-MM-DDThh:mm
      return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
        .toISOString()
        .slice(0, 16);
    } catch (error) {
      console.error("Date formatting error:", error);
      return '';
    }
  };

  // Format datetime for display in confirmation
  const formatDateTimeForDisplay = (dateString) => {
    if (!dateString) return 'Not selected';
    try {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return dateString;
    }
  };

  const checkTimeOrderConflict = () => {
    if (!data.start_datetime || !data.end_datetime) return false;
    
    const startDate = new Date(data.start_datetime);
    const endDate = new Date(data.end_datetime);
    return endDate <= startDate;
  };

  const checkReservationConflicts = async () => {
    if (!data.hall_id || !data.start_datetime || !data.end_datetime) return true;
    if (checkTimeOrderConflict()) return false;
    
    try {
      setCheckingConflicts(true);
      const startDate = new Date(data.start_datetime);
      const endDate = new Date(data.end_datetime);
      
      // Format datetimes to ISO
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();
      
      const response = await API.get('/check-availability', {
        params: {
          hall_id: data.hall_id,
          start_datetime: startISO,
          end_datetime: endISO
        }
      });
      
      // Return true if available, false if conflict
      return response.data;
    } catch (err) {
      console.error('Conflict check error:', err);
      return true; // Assume no conflict on error for better UX
    } finally {
      setCheckingConflicts(false);
    }
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    switch (name) {
      case 'hall_id':
        if (!value) newErrors.hall_id = 'Please select a hall';
        else delete newErrors.hall_id;
        break;
      case 'start_datetime':
        if (!value) newErrors.start_datetime = 'Please select a start time';
        else delete newErrors.start_datetime;
        break;
      case 'end_datetime':
        if (!value) newErrors.end_datetime = 'Please select an end time';
        else delete newErrors.end_datetime;
        break;
      case 'description':
        if (!value) newErrors.description = 'Please provide a description';
        else if (value.length > 500) newErrors.description = 'Description must be 500 characters or less';
        else delete newErrors.description;
        break;
    }
    setErrors(newErrors);
    updateProgress(newErrors);
  };

  const updateProgress = (currentErrors) => {
    let step = 0;
    if (data.hall_id && !currentErrors.hall_id) step++;
    if (data.start_datetime && data.end_datetime && !currentErrors.start_datetime && !currentErrors.end_datetime) step++;
    if (data.resource_ids.length > 0 || data.other_resources.length > 0) step++;
    if (data.description && !currentErrors.description) step++;
    setProgressStep(step);
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    const parsedValue = name === 'hall_id' ? (value ? parseInt(value) : '') : value;
    setData(prev => ({ ...prev, [name]: parsedValue }));
    validateField(name, parsedValue);
  };

  const handleResourceToggle = (resourceId) => {
    setData(prev => {
      const updatedResources = [...prev.resource_ids];
      const index = updatedResources.indexOf(resourceId);
      if (index === -1) {
        updatedResources.push(resourceId);
      } else {
        updatedResources.splice(index, 1);
      }
      return { ...prev, resource_ids: updatedResources };
    });
  };

  const addCustomResource = (e) => {
    e.preventDefault();
    if (newResource.trim()) {
      setData(prev => ({
        ...prev,
        other_resources: [...prev.other_resources, newResource.trim()]
      }));
      setNewResource('');
    }
  };

  const removeCustomResource = (index) => {
    setData(prev => {
      const updatedResources = [...prev.other_resources];
      updatedResources.splice(index, 1);
      return { ...prev, other_resources: updatedResources };
    });
  };

  // Set preset durations (1, 2, or 4 hours)
  const setDatePreset = (hours) => {
    if (data.start_datetime) {
      try {
        const startDate = new Date(data.start_datetime);
        if (isNaN(startDate.getTime())) {
          setErrors(prev => ({ ...prev, end_datetime: 'Invalid start time' }));
          return;
        }
        
        // Create end date by adding hours
        const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);
        const formattedEndDate = formatDateTimeForInput(endDate);
        
        setData(prev => ({ ...prev, end_datetime: formattedEndDate }));
        validateField('end_datetime', formattedEndDate);
      } catch (error) {
        console.error("Error in date preset:", error);
        setErrors(prev => ({ ...prev, end_datetime: 'Error setting time' }));
      }
    } else {
      setErrors(prev => ({ ...prev, start_datetime: 'Please set start time first' }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setErrors({});
    
    // First check if end time is after start time
    if (checkTimeOrderConflict()) {
      setConflictType('time-order');
      setConflictModalOpen(true);
      return;
    }
    
    // Then check for reservation conflicts
    const isAvailable = await checkReservationConflicts();
    if (!isAvailable) {
      setConflictType('reservation-conflict');
      setConflictModalOpen(true);
      return;
    }
    
    // If all clear, show confirmation modal
    setConfirmModalOpen(true);
  };

  // Proceed with submission despite conflicts
  const proceedDespiteConflict = () => {
    setConflictModalOpen(false);
    setConfirmModalOpen(true);
  };

  // Fix the time order conflict
  const fixTimeOrderConflict = () => {
    setConflictModalOpen(false);
    
    if (data.start_datetime) {
      // Set end time to start time + 1 hour as a default fix
      const startDate = new Date(data.start_datetime);
      const suggestedEndDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      const formattedEndDate = formatDateTimeForInput(suggestedEndDate);
      
      setData(prev => ({ ...prev, end_datetime: formattedEndDate }));
      validateField('end_datetime', formattedEndDate);
    }
  };

  const confirmSubmit = async () => {
    setLoading(true);
    setConfirmModalOpen(false);

    try {
      const requestData = {
        hall_id: data.hall_id,
        start_datetime: data.start_datetime,
        end_datetime: data.end_datetime,
        resource_ids: data.resource_ids,
        other_resources: data.other_resources.join(', '),
        description: data.description
      };

      const response = await API.post('/reservations', requestData);
      setMsg('Reservation requested successfully!');
      setTimeout(() => {
        navigate('/reservations');
      }, 2000);
    } catch (err) {
      if (err.message && !err.response) {
        setErrors({ general: err.message });
      } else {
        setErrors({ general: err.response?.data?.detail || 'Error creating reservation' });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResetModalOpen(true);
  };

  const confirmReset = () => {
    setData({
      hall_id: '',
      start_datetime: '',
      end_datetime: '',
      resource_ids: [],
      other_resources: [],
      description: ''
    });
    setMsg('');
    setErrors({});
    setNewResource('');
    setResourceSearch('');
    setProgressStep(0);
    setResetModalOpen(false);
  };

  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  // Determine button text based on validation status
  const getReviewButtonText = () => {
    if (loading) return "Loading...";
    if (checkingConflicts) return "Checking Availability...";
    return "Review Reservation";
  };

  return (
    <div className="dashboard-layout">
      <DashboardHeader />

      <div className="reservation-container">
        <div className="reservation-card">
          <div className="progress-bar">
            <div className="progress-step completed" aria-label="Select Hall"></div>
            <div className={`progress-step ${progressStep >= 1 ? 'completed' : ''}`} aria-label="Select Dates"></div>
            <div className={`progress-step ${progressStep >= 2 ? 'completed' : ''}`} aria-label="Select Resources"></div>
            <div className={`progress-step ${progressStep >= 3 ? 'completed' : ''}`} aria-label="Add Description"></div>
          </div>

          {msg && (
            <div className="success-message">
              <div className="success-icon">
                <CheckCircle />
              </div>
              <p>{msg}</p>
            </div>
          )}

          {errors.general && (
            <div className="error-message">
              <AlertCircle />
              <p>{errors.general}</p>
            </div>
          )}

          {loading && !errors.general && !msg && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="reservation-form">
            <div className="form-section">
              <div className="form-field">
                <label htmlFor="hall_id" className={errors.hall_id ? 'error-label' : ''}>
                  <Building />
                  Select Hall
                </label>
                <div className="select-wrapper">
                  <select
                    id="hall_id"
                    name="hall_id"
                    value={data.hall_id || ''}
                    onChange={handleInputChange}
                    required
                    aria-describedby={errors.hall_id ? 'hall_id-error' : undefined}
                    className={errors.hall_id ? 'error-input' : ''}
                  >
                    <option value="">Select hall…</option>
                    {halls.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
                {errors.hall_id && <span id="hall_id-error" className="error-text">{errors.hall_id}</span>}
              </div>
            </div>

            <hr className="form-divider" />

            <div className="form-section">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="start_datetime" className={errors.start_datetime ? 'error-label' : ''}>
                    <Calendar />
                    Start Date and Time
                  </label>
                  <input
                    id="start_datetime"
                    name="start_datetime"
                    type="datetime-local"
                    value={formatDateTimeForInput(data.start_datetime)}
                    onChange={handleInputChange}
                    required
                    aria-describedby={errors.start_datetime ? 'start_datetime-error' : undefined}
                    className={errors.start_datetime ? 'error-input' : ''}
                  />
                  {errors.start_datetime && <span id="start_datetime-error" className="error-text">{errors.start_datetime}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="end_datetime" className={errors.end_datetime ? 'error-label' : ''}>
                    <Clock />
                    End Date and Time
                  </label>
                  <input
                    id="end_datetime"
                    name="end_datetime"
                    type="datetime-local"
                    value={formatDateTimeForInput(data.end_datetime)}
                    onChange={handleInputChange}
                    required
                    aria-describedby={errors.end_datetime ? 'end_datetime-error' : undefined}
                    className={errors.end_datetime ? 'error-input' : ''}
                  />
                  {errors.end_datetime && <span id="end_datetime-error" className="error-text">{errors.end_datetime}</span>}
                </div>
              </div>
              <div className="preset-buttons">
                <button type="button" onClick={() => setDatePreset(1)} className="preset-btn">1 Hour</button>
                <button type="button" onClick={() => setDatePreset(2)} className="preset-btn">2 Hours</button>
                <button type="button" onClick={() => setDatePreset(4)} className="preset-btn">4 Hours</button>
              </div>
            </div>

            <hr className="form-divider" />

            <div className="form-section">
              <div className="form-field">
                <label className="resources-label">
                  <Package />
                  Resources
                </label>
                <div className="resource-search">
                  <Search size={18} />
                  <input
                    type="text"
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
                    placeholder="Search resources..."
                    className="search-input"
                  />
                </div>
                <div className="resources-checkboxes">
                  {filteredResources.length > 0 ? filteredResources.map(resource => (
                    <div className="resource-checkbox" key={resource.id}>
                      <input
                        type="checkbox"
                        id={`resource-${resource.id}`}
                        checked={data.resource_ids.includes(resource.id)}
                        onChange={() => handleResourceToggle(resource.id)}
                        aria-label={`Select ${resource.name}`}
                      />
                      <label htmlFor={`resource-${resource.id}`}>{resource.name}</label>
                    </div>
                  )) : (
                    <p className="no-resources">No resources match your search</p>
                  )}
                </div>
              </div>

              <div className="form-field">
                <label>
                  <Package />
                  Other Resources
                </label>
                <div className="custom-resources">
                  <div className="custom-resource-input">
                    <input
                      type="text"
                      value={newResource}
                      onChange={(e) => setNewResource(e.target.value)}
                      placeholder="Add a custom resource..."
                      aria-label="Add custom resource"
                    />
                    <button
                      type="button"
                      className="add-resource-btn"
                      onClick={addCustomResource}
                      disabled={!newResource.trim()}
                    >
                      Add
                    </button>
                  </div>

                  {data.other_resources.length > 0 && (
                    <div className="custom-resources-list">
                      {data.other_resources.map((resource, index) => (
                        <div className="custom-resource-tag" key={index}>
                          <span>{resource}</span>
                          <button
                            type="button"
                            onClick={() => removeCustomResource(index)}
                            className="remove-resource-btn"
                            aria-label={`Remove ${resource}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <hr className="form-divider" />

            <div className="form-section">
              <div className="form-field">
                <label htmlFor="description" className={errors.description ? 'error-label' : ''}>
                  <Info />
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={data.description}
                  onChange={handleInputChange}
                  placeholder="Please explain the purpose of this reservation..."
                  rows="4"
                  required
                  aria-describedby={errors.description ? 'description-error' : undefined}
                  className={errors.description ? 'error-input' : ''}
                />
                {errors.description && <span id="description-error" className="error-text">{errors.description}</span>}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={resetForm}>
                Reset
              </button>
              <button 
                type="submit" 
                className="primary-button" 
                disabled={loading || checkingConflicts || Object.keys(errors).length > 0}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    <span>Submitting...</span>
                  </>
                ) : checkingConflicts ? (
                  <>
                    <span className="spinner-small"></span>
                    <span>Checking...</span>
                  </>
                ) : (
                  'Review Reservation'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Conflict Modal */}
        {conflictModalOpen && (
          <div className="modal-overlay" onClick={() => setConflictModalOpen(false)}>
            <div className="modal-content conflict-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <AlertTriangle className="warning-icon" size={24} />
                  {conflictType === 'time-order' 
                    ? 'Invalid Time Selection' 
                    : 'Reservation Conflict'
                  }
                </h2>
                <button className="close-button" onClick={() => setConflictModalOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="modal-body">
                {conflictType === 'time-order' ? (
                  <>
                    <p>The end time must be after the start time.</p>
                    <div className="conflict-details">
                      <div className="detail-item">
                        <Calendar size={16} />
                        <span>Start: {formatDateTimeForDisplay(data.start_datetime)}</span>
                      </div>
                      <div className="detail-item">
                        <Clock size={16} />
                        <span>End: {formatDateTimeForDisplay(data.end_datetime)}</span>
                      </div>
                    </div>
                    <div className="button-group">
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setConflictModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn btn-primary" 
                        onClick={fixTimeOrderConflict}
                      >
                        Fix Time (Add 1 Hour)
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>This time slot overlaps with an approved reservation.</p>
                    <div className="conflict-details">
                      <div className="detail-item">
                        <Building size={16} />
                        <span>Hall: {halls.find(h => h.id === data.hall_id)?.name || 'Not selected'}</span>
                      </div>
                      <div className="detail-item">
                        <Calendar size={16} />
                        <span>Start: {formatDateTimeForDisplay(data.start_datetime)}</span>
                      </div>
                      <div className="detail-item">
                        <Clock size={16} />
                        <span>End: {formatDateTimeForDisplay(data.end_datetime)}</span>
                      </div>
                    </div>
                    <div className="button-group">
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setConflictModalOpen(false)}
                      >
                        Change Time
                      </button>
                      <button 
                        className="btn btn-primary" 
                        onClick={proceedDespiteConflict}
                      >
                        Proceed Anyway
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModalOpen && (
          <div className="modal-overlay" onClick={() => setConfirmModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Confirm Reservation</h2>
                <button className="close-button" onClick={() => setConfirmModalOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="modal-body">
                <p>Please review your reservation details:</p>
                <div className="confirmation-details">
                  <div className="detail-item">
                    <Building size={16} />
                    <span>Hall: {halls.find(h => h.id === data.hall_id)?.name || 'Not selected'}</span>
                  </div>
                  <div className="detail-item">
                    <Calendar size={16} />
                    <span>Start: {formatDateTimeForDisplay(data.start_datetime)}</span>
                  </div>
                  <div className="detail-item">
                    <Clock size={16} />
                    <span>End: {formatDateTimeForDisplay(data.end_datetime)}</span>
                  </div>
                  <div className="detail-item">
                    <Package size={16} />
                    <span>Resources: {data.resource_ids.map(id => resources.find(r => r.id === id)?.name).filter(Boolean).join(', ') || 'None'}</span>
                  </div>
                  <div className="detail-item">
                    <Package size={16} />
                    <span>Other Resources: {data.other_resources.join(', ') || 'None'}</span>
                  </div>
                  <div className="detail-item">
                    <Info size={16} />
                    <span>Description: {data.description}</span>
                  </div>
                </div>
                {conflictType === 'reservation-conflict' && (
                  <div className="warning-message">
                    <AlertTriangle />
                    <p>Note: This reservation conflicts with an existing approved reservation.</p>
                  </div>
                )}
                <div className="button-group">
                  <button className="btn btn-secondary" onClick={() => setConfirmModalOpen(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={confirmSubmit}>
                    Submit Reservation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Modal */}
        {resetModalOpen && (
          <div className="modal-overlay" onClick={() => setResetModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Confirm Reset</h2>
                <button className="close-button" onClick={() => setResetModalOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to reset the form? All entered data will be lost.</p>
                <div className="button-group">
                  <button className="btn btn-secondary" onClick={() => setResetModalOpen(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={confirmReset}>
                    Reset Form
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <MobileNavbar />
    </div>
  );
}