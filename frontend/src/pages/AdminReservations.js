import React, { useEffect, useState } from 'react';
import API from '../api/api';

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const response = await API.get('/admin/reservations');
        console.log("Received reservation data:", response.data); // Debug log
        setReservations(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching reservations:", err);
        setError("Failed to load reservations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/admin/reservations/${id}/approve`);
      // Refresh the list
      const response = await API.get('/admin/reservations');
      setReservations(response.data);
    } catch (err) {
      console.error("Error approving reservation:", err);
      setError("Failed to approve reservation. Please try again.");
    }
  };

  const handleDeny = async (id) => {
    const reason = prompt("Please provide a reason for denial:");
    if (reason === null) return; // User cancelled
    if (reason.trim() === "") {
      alert("A reason for denial is required.");
      return;
    }

    try {
      console.log(`Sending deny request with reason: "${reason}"`);
      
      // Try with explicit content type
      await API.put(`/admin/reservations/${id}/deny?admin_message=${encodeURIComponent(reason)}`
      );
      
      // Refresh the list
      const response = await API.get('/admin/reservations');
      setReservations(response.data);
    } catch (err) {
      console.error("Error denying reservation:", err);
      console.error("Error details:", err.response?.data || err.message);
      setError(`Failed to deny reservation: ${err.response?.data?.detail || "Please try again."}`);
    }
  };

  if (loading) return <div className="container">Loading reservations...</div>;
  if (error) return <div className="container error">{error}</div>;

  return (
    <div className="container">
      <h2>All Reservations</h2>
      {reservations.length === 0 ? (
        <p>No reservations found.</p>
      ) : (
        <ul className="reservation-list">
          {reservations.map(r => (
            <li key={r.id} className="reservation-item">
              <div className="reservation-details">
                <strong>User:</strong> {r.user?.full_name || r.user?.email || 'Unknown user'}<br />
                <strong>Hall:</strong> {r.hall?.name || 'Unknown hall'}<br />
                <strong>Time:</strong> {formatDateTime(r.start_datetime)} → {formatDateTime(r.end_datetime)}<br />
                <strong>Status:</strong> {r.status}
                {r.admin_message && (
                  <div className="admin-message">
                    <strong>Admin Note:</strong> {r.admin_message}
                  </div>
                )}
              </div>
              {r.status === 'PENDING' && (
                <div className="action-buttons">
                  <button onClick={() => handleApprove(r.id)} className="approve-btn">Approve</button>
                  <button onClick={() => handleDeny(r.id)} className="deny-btn">Deny</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}