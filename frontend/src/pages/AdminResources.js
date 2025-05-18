import React, { useEffect, useState } from 'react';
import API from '../api/api';

export default function AdminResources() {
  const [resources, setResources] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    API.get('/admin/resources').then(r => setResources(r.data));
  }, []);

  const add = async e => {
    e.preventDefault();
    await API.post('/admin/resources', { name });
    setName('');
    const r = await API.get('/admin/resources');
    setResources(r.data);
  };

  return (
    <div className="container">
      <h2>Resources</h2>
      <form onSubmit={add} className="form">
        <input
          placeholder="Resource name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <button type="submit">Add Resource</button>
      </form>
      <ul>
        {resources.map(r => (
          <li key={r.id}>{r.name}</li>
        ))}
      </ul>
    </div>
  );
}
