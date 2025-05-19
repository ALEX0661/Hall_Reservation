import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Register.css';
import gordonLogo from '../assets/gc-logo.png';
import hallReserveLogo from '../assets/hall-reserveimg.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const { register } = useContext(AuthContext);
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    full_name: '', 
    student_number: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prevForm => ({ 
      ...prevForm, 
      [e.target.name]: e.target.value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(form);
      // Redirect will be handled by AuthContext
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
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
          <p className="register-subtitle">Gordon College, Olongapo City</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <h2>Create Account</h2>
          
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="full_name">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label htmlFor="student_number">Student Number</label>
            <input
              id="student_number"
              name="student_number"
              type="text"
              value={form.student_number}
              onChange={handleChange}
              placeholder="Enter your student number"
              required
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
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
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
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
            className="register-button"
            disabled={isLoading}
            aria-label={isLoading ? 'Creating account, please wait' : 'Create Account'}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account? <a href="/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;