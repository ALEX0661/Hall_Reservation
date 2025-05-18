import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const Register = () => {
  const { register } = useContext(AuthContext);
  const [form, setForm] = useState({ email:'', password:'', full_name:'', student_number:'' });
  const [err, setErr] = useState('');

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault();
    try {
      await register(form);
    } catch (error) {
      console.error('Registration error:', error);
      setErr('Registration failed');
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <h2>Register</h2>
      {err && <p className="error">{err}</p>}
      <input name="full_name" placeholder="Full Name" value={form.full_name} onChange={handle} required />
      <input name="student_number" placeholder="Student #" value={form.student_number} onChange={handle} required />
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={handle} required />
      <input name="password" type="password" placeholder="Password" value={form.password} onChange={handle} required />
      <button type="submit">Sign Up</button>
      <p>
        Already have an account? <a href="/login">Login here</a>.
      </p>
    </form>
  );
};

export default Register;