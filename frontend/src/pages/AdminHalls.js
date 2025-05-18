import React, { useEffect, useState } from 'react';
import API from '../api/api';

export default function AdminHalls() {
  const [halls, setHalls] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    API.get('/admin/halls').then(r => setHalls(r.data));
  }, []);

  const add = async e => {
    e.preventDefault();
    await API.post('/admin/halls', { name });
    setName('');
    const r = await API.get('/admin/halls');
    setHalls(r.data);
  };

  return (
    <div className="container">
      <h2>Halls</h2>
      <form onSubmit={add} className="form">
        <input
          placeholder="Hall name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <button type="submit">Add Hall</button>
      </form>
      <ul>
        {halls.map(h => (
          <li key={h.id}>{h.name}</li>
        ))}
      </ul>
    </div>
  );
}
