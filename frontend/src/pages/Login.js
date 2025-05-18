import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const submit = async e => {
    e.preventDefault();
    try {
      await login(email, pw);
    } catch (e) {
      console.error('Login error:', e);
      setErr('Invalid credentials');
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <h2>Login</h2>
      {err && <p className="error">{err}</p>}
      <input type="email" placeholder="Email" value={email}
             onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={pw}
             onChange={e => setPw(e.target.value)} required />
      <button type="submit">Log In</button>
      <p>
        No account? <a href="/register">Register here</a>.
      </p>
    </form>
  );
};

export default Login;