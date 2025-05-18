import React, { useState, useEffect } from 'react';
import { DashboardHeader, MobileNavbar } from '../components/DashboardComponents';
import API from '../api/api';
import '../styles/Feedback.css';
import { Star, Calendar, MapPin, Clock, X, Search } from 'lucide-react';

// Filter Bar Component
const FilterBar = ({ filterStatus, setFilterStatus }) => {
  const filters = [
    { label: 'All', value: 'ALL' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Feedback Submitted', value: 'FEEDBACK_SUBMITTED' }
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

export default function EnhancedFeedback() {
  const [pastReservations, setPastReservations] = useState([]);
  const [feedbackRatings, setFeedbackRatings] = useState({}); // Cache for feedback ratings
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeReservation, setActiveReservation] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [messageType, setMessageType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [feedbackDetails, setFeedbackDetails] = useState(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  useEffect(() => {
    const fetchPastReservations = async () => {
      try {
        setLoading(true);
        const response = await API.get('/reservations/past-approved');
        const sortedReservations = response.data.sort((a, b) => {
          return new Date(b.end_datetime) - new Date(a.end_datetime);
        });

        // Fetch ratings for feedback-submitted reservations
        const ratings = {};
        const feedbackPromises = sortedReservations
          .filter(res => res.feedbackSubmitted)
          .map(async (res) => {
            try {
              const feedbackResponse = await API.get(`/feedback/reservation/${res.id}`);
              if (feedbackResponse.data && feedbackResponse.data.length > 0) {
                ratings[res.id] = feedbackResponse.data[0].rating;
              }
            } catch (err) {
              console.error(`Failed to fetch rating for reservation ${res.id}:`, err);
            }
          });

        await Promise.all(feedbackPromises);
        setFeedbackRatings(ratings);
        setPastReservations(sortedReservations);
        setError('');
      } catch (err) {
        setError('Failed to load past reservations: ' + (err.response?.data.detail || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchPastReservations();
    const interval = setInterval(fetchPastReservations, 60000);
    return () => clearInterval(interval);
  }, []);

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!activeReservation) {
      setFeedbackMsg('No reservation selected');
      setMessageType('error');
      return;
    }
    try {
      await API.post('/feedback', {
        reservation_id: activeReservation.id,
        rating,
        comments: comment
      });
      setPastReservations(prev =>
        prev.map(res =>
          res.id === activeReservation.id
            ? { ...res, feedbackSubmitted: true }
            : res
        )
      );
      setFeedbackRatings(prev => ({ ...prev, [activeReservation.id]: rating }));
      setRating(5);
      setComment('');
      setFeedbackMsg('Feedback submitted successfully!');
      setMessageType('success');
      setTimeout(() => {
        setModalOpen(false);
        setActiveReservation(null);
        setFeedbackMsg('');
      }, 2000);
    } catch (err) {
      setFeedbackMsg(err.response?.data.detail || 'Error submitting feedback');
      setMessageType('error');
    }
  };

  const viewFeedback = async (reservation) => {
    try {
      const response = await API.get(`/feedback/reservation/${reservation.id}`);
      if (response.data && response.data.length > 0) {
        console.log('Feedback response:', response.data[0]); // Debug log
        setFeedbackDetails(response.data[0]); // Take the first feedback
        setFeedbackModalOpen(true);
      } else {
        setError('No feedback found for this reservation');
      }
    } catch (err) {
      setError('Failed to load feedback: ' + (err.response?.data.detail || err.message));
    }
  };

  const closeFeedbackModal = () => {
    setFeedbackModalOpen(false);
    setTimeout(() => {
      setFeedbackDetails(null);
    }, 300);
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const hasEnded = (reservation) => {
    const endTime = new Date(reservation.end_datetime);
    const now = new Date();
    return endTime < now;
  };

  const formatDate = (dateTimeStr) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateTimeStr).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateTimeStr) => {
    const options = {
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateTimeStr).toLocaleTimeString(undefined, options);
  };

  const startFeedback = (reservation) => {
    setActiveReservation(reservation);
    setFeedbackMsg('');
    setMessageType('');
    setModalOpen(true);
  };

  const cancelFeedback = () => {
    setModalOpen(false);
    setTimeout(() => {
      setActiveReservation(null);
      setRating(5);
      setComment('');
      setFeedbackMsg('');
      setMessageType('');
    }, 300);
  };

  const clearFilters = () => {
    setFilterStatus('ALL');
    setSearchTerm('');
    setSortOption('date-desc');
  };

  const renderStars = () => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={28}
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => handleRatingChange(star)}
            fill={star <= rating ? '#f59e0b' : 'none'}
            stroke={star <= rating ? '#f59e0b' : '#d1d5db'}
          />
        ))}
        <span className="rating-text">
          {rating === 1 ? "Poor" :
           rating === 2 ? "Below Average" :
           rating === 3 ? "Average" :
           rating === 4 ? "Good" : "Excellent"}
        </span>
      </div>
    );
  };

  const renderFeedbackStars = (rating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={24}
            fill={star <= rating ? '#f59e0b' : 'none'}
            stroke={star <= rating ? '#f59e0b' : '#d1d5db'}
          />
        ))}
        <span className="rating-text">
          {rating === 1 ? "Poor" :
           rating === 2 ? "Below Average" :
           rating === 3 ? "Average" :
           rating === 4 ? "Good" : "Excellent"}
        </span>
      </div>
    );
  };

  // Filter and sort reservations
  const filteredReservations = pastReservations
    .filter(res => {
      if (filterStatus === 'COMPLETED') {
        return hasEnded(res) && !res.feedbackSubmitted;
      } else if (filterStatus === 'IN_PROGRESS') {
        return !hasEnded(res);
      } else if (filterStatus === 'FEEDBACK_SUBMITTED') {
        return res.feedbackSubmitted;
      }
      return true; // ALL
    })
    .filter(res => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        res.hall_name.toLowerCase().includes(searchLower) ||
        (res.description && res.description.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      if (sortOption === 'date-desc') {
        return new Date(b.end_datetime) - new Date(a.end_datetime);
      } else if (sortOption === 'date-asc') {
        return new Date(a.end_datetime) - new Date(b.end_datetime);
      } else if (sortOption === 'hall') {
        return a.hall_name.localeCompare(b.hall_name);
      }
      return 0;
    });

  return (
    <div className="feedback-page">
      <DashboardHeader />
      
      <div className="feedback-container">
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
            <option value="hall">Sort by Hall Name</option>
          </select>
          <button onClick={clearFilters} className="btn btn-secondary">
            Clear Filters
          </button>
        </div>

        {error && (
          <div className="feedback-message error-message">
            <p>{error}</p>
          </div>
        )}

        <FilterBar filterStatus={filterStatus} setFilterStatus={setFilterStatus} />

        <div className="reservation-count">
          Showing {filteredReservations.length} of {pastReservations.length} reservations
        </div>

        {modalOpen && (
          <div className="modal-overlay" onClick={cancelFeedback}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Submit Feedback</h2>
                <button className="close-button" onClick={cancelFeedback}>
                  <X size={24} />
                </button>
              </div>
              
              {activeReservation && (
                <div className="modal-body">
                  <div className="event-details">
                    <h3>{activeReservation.description || 'Reservation'}</h3>
                    
                    <div className="detail-item">
                      <MapPin size={16} />
                      <span>{activeReservation.hall_name}</span>
                    </div>
                    
                    <div className="detail-item">
                      <Calendar size={16} />
                      <span>{formatDate(activeReservation.start_datetime)}</span>
                    </div>
                    
                    <div className="detail-item">
                      <Clock size={16} />
                      <span>
                        {formatTime(activeReservation.start_datetime)} - {formatTime(activeReservation.end_datetime)}
                      </span>
                    </div>
                  </div>
                  
                  {feedbackMsg && (
                    <div className={`feedback-message ${messageType === 'success' ? 'success-message' : 'error-message'}`}>
                      {feedbackMsg}
                    </div>
                  )}
                  
                  <form onSubmit={submitFeedback}>
                    <div className="form-group">
                      <label className="form-label">Rating</label>
                      {renderStars()}
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label" htmlFor="feedback-comment">Comments</label>
                      <textarea
                        id="feedback-comment"
                        placeholder="Share your experience with this reservation..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        className="form-control textarea"
                      />
                    </div>
                    
                    <div className="button-group">
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                      >
                        Submit Feedback
                      </button>
                      <button 
                        type="button" 
                        onClick={cancelFeedback}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {feedbackModalOpen && feedbackDetails && (
          <div className="modal-overlay" onClick={closeFeedbackModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Feedback Details</h2>
                <button className="close-button" onClick={closeFeedbackModal}>
                  <X size={24} />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="event-details">
                  <h3>{feedbackDetails.reservation?.description || 'Reservation'}</h3>
                  
                  <div className="detail-item">
                    <MapPin size={16} />
                    <span>{feedbackDetails.reservation?.hall?.name || 'Unknown Hall'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <Calendar size={16} />
                    <span>{feedbackDetails.reservation ? formatDate(feedbackDetails.reservation.start_datetime) : 'Unknown Date'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <Clock size={16} />
                    <span>
                      {feedbackDetails.reservation
                        ? `${formatTime(feedbackDetails.reservation.start_datetime)} - ${formatTime(feedbackDetails.reservation.end_datetime)}`
                        : 'Unknown Time'}
                    </span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Your Rating</label>
                  {renderFeedbackStars(feedbackDetails.rating || 0)}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Your Comments</label>
                  <p className="feedback-comment">{feedbackDetails.comments || 'No comments provided'}</p>
                </div>
                
                <div className="button-group">
                  <button 
                    type="button" 
                    onClick={closeFeedbackModal}
                    className="btn btn-secondary full-width"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <span>Loading past reservations...</span>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Past Reservations</h3>
            <p>You don't have any past reservations that require feedback.</p>
          </div>
        ) : (
          <div className="card-grid">
            {filteredReservations.map(reservation => (
              <div 
                key={reservation.id} 
                className={`reservation-card ${reservation.feedbackSubmitted ? 'feedback-submitted' : ''}`}
              >
                <div className="card-header">
                  <h3>{reservation.description || 'Reservation'}</h3>
                  {hasEnded(reservation) ? (
                    <span className="status-badge status-completed">Completed</span>
                  ) : (
                    <span className="status-badge status-progress">In Progress</span>
                  )}
                </div>
                
                <div className="card-body">
                  <div className="card-detail">
                    <MapPin size={16} className="icon" />
                    <span>{reservation.hall_name}</span>
                  </div>
                  
                  <div className="detail-item">
                    <Calendar size={16} />
                    <span>{formatDate(reservation.start_datetime)}</span>
                  </div>
                  
                  <div className="detail-item">
                    <Clock size={16} />
                    <span>
                      {formatTime(reservation.start_datetime)} - {formatTime(reservation.end_datetime)}
                    </span>
                  </div>
                </div>
                
                <div className="card-footer">
                  {hasEnded(reservation) ? (
                    reservation.feedbackSubmitted ? (
                      <div 
                        className="feedback-status feedback-submitted clickable"
                        onClick={() => viewFeedback(reservation)}
                      >
                        <span className="status-text">Feedback Submitted</span>
                        <div className="mini-stars">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              size={14} 
                              fill={star <= (feedbackRatings[reservation.id] || 0) ? '#f59e0b' : 'none'}
                              stroke={star <= (feedbackRatings[reservation.id] || 0) ? '#f59e0b' : '#d1d5db'}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="feedback-status feedback-pending">
                        <span className="status-text">Feedback Pending</span>
                        <button
                          onClick={() => startFeedback(reservation)}
                          className="btn btn-primary full-width"
                        >
                          Add Feedback
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="pending-status">Not Yet Completed</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <MobileNavbar />
    </div>
  );
}