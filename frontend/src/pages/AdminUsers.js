import React, { useEffect, useState } from 'react';
import API from '../api/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    API.get('/admin/users').then(r => setUsers(r.data));
  }, []);
  return (
    <div className="container">
      <h2>All Users</h2>
      <ul>
        {users.map(u => (
          <li key={u.id}>{u.full_name} ({u.email})</li>
        ))}
      </ul>
    </div>
  );
}
