import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Login.css';
import gordonLogo from '../assets/gc-logo.png';
import hallReserveLogo from '../assets/hall-reserveimg.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Redirect handled by AuthContext
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Removed invalid or incomplete togglePasswordVisibility declaration

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img
            src={gordonLogo}
            alt="Gordon College Logo"
            className="college-logo"
            aria-label="Gordon College Logo"
          />
          <img
            src={hallReserveLogo}
            alt="Hall Reserve System Logo"
            className="app-logo"
            aria-label="Hall Reserve System Logo"
          />
          <p className="login-subtitle">Gordon College, Olongapo City</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              aria-required="true"
            />
          </div>

          <div className="form-group password-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                aria-required="true"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
            aria-label={isLoading ? 'Signing in, please wait' : 'Sign in'}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account? <a href="/register">Register here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;