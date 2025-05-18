import React, { createContext, useState, useEffect } from 'react';
import API from '../api/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = async (email, password) => {
    try {
      // Create form data instead of JSON
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      // Convert FormData to URLSearchParams for proper encoding
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      
      // Send as form data with the correct content type
      const res = await axios.post(
        'http://localhost:8000/auth/token', 
        params.toString(),
        {
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      localStorage.setItem('token', res.data.access_token);
      const me = await API.get('/auth/me');
      setUser(me.data);
      localStorage.setItem('user', JSON.stringify(me.data));
      nav(me.data.is_admin ? '/admin' : '/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data) => {
    try {
      await API.post('/auth/signup', data);
      return login(data.email, data.password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    nav('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};