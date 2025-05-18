import React, { useEffect, useState } from 'react';
import API from '../api/api';

export default function AdminCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Format dates with time component for ISO format compliance
  const formatDateForAPI = (date) => {
    // Convert date string to full ISO string with time component
    const fullDate = new Date(date);
    return fullDate.toISOString();
  };

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const [startDate, setStartDate] = useState(today.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(nextWeek.toISOString().split('T')[0]);
  const [selectedHall, setSelectedHall] = useState('');
  const [halls, setHalls] = useState([]);
  
  useEffect(() => {
    // Load halls for the filter dropdown
    const fetchHalls = async () => {
      try {
        const response = await API.get('/admin/halls');
        setHalls(response.data);
      } catch (err) {
        console.error("Error fetching halls:", err);
      }
    };
    
    fetchHalls();
  }, []);

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        setLoading(true);
        
        // Build query parameters with properly formatted dates
        const params = new URLSearchParams();
        params.append('start_date', formatDateForAPI(startDate));
        params.append('end_date', formatDateForAPI(endDate));
        if (selectedHall) {
          params.append('hall_id', selectedHall);
        }
        
        const response = await API.get(`/admin/calendar?${params.toString()}`);
        setEvents(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching calendar events:", err);
        setError("Failed to load calendar events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarEvents();
  }, [startDate, endDate, selectedHall]);

  const handleFilter = (e) => {
    e.preventDefault();
    // The useEffect will handle the actual fetching
  };

  // Format date for display in the UI
  const formatDateTime = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  if (loading) return <div className="container">Loading calendar events...</div>;
  if (error) return <div className="container error">{error}</div>;

  return (
    <div className="container">
      <h2>Calendar</h2>
      
      <form onSubmit={handleFilter} className="filter-form">
        <div className="form-group">
          <label>Start Date:
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              required 
            />
          </label>
        </div>
        
        <div className="form-group">
          <label>End Date:
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              required 
            />
          </label>
        </div>
        
        <div className="form-group">
          <label>Hall:
            <select value={selectedHall} onChange={(e) => setSelectedHall(e.target.value)}>
              <option value="">All Halls</option>
              {halls.map(hall => (
                <option key={hall.id} value={hall.id}>{hall.name}</option>
              ))}
            </select>
          </label>
        </div>
        
        <button type="submit">Filter</button>
      </form>
      
      {events.length === 0 ? (
        <p>No events found for the selected period.</p>
      ) : (
        <div className="calendar-events">
          <h3>Upcoming Events ({events.length})</h3>
          <ul className="event-list">
            {events.map(event => (
              <li key={event.id} className="event-item">
                <div className="event-time">
                  {formatDateTime(event.start)} - {formatDateTime(event.end)}
                </div>
                <div className="event-title">{event.title}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}