import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set token in localStorage and axios headers
  const setToken = (token) => {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  // Remove token from localStorage and axios headers
  const removeToken = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('Attempting to login with:', { email }); // Debug log

      const response = await api.post('/auth/login', {
        email,
        password,
      });

      console.log('Login response:', response.data); // Debug log

      if (response.data && response.data.token) {
        setUser(response.data.user);
        setToken(response.data.token);
        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error details:', error); // Debug log
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Server is not responding. Please try again later.');
      } else if (!error.response) {
        throw new Error('Cannot connect to server. Please check if the server is running at http://localhost:3000');
      } else if (error.response.status === 401) {
        throw new Error('Invalid email or password. Please try again.');
      } else if (error.response.status === 404) {
        throw new Error('Login endpoint not found. Please check server configuration.');
      } else if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      // Input validation
      if (!username || !email || !password) {
        throw new Error('All fields are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      console.log('Attempting to register with:', { name: username, email }); // Debug log
       
      const response = await api.post('/auth/register', {
        name: username,
        email,
        password,
      });
      

      console.log('Registration response:', response.data); // Debug log

      if (response.data && response.data.token) {
        setUser(response.data.user);
        setToken(response.data.token);
        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Registration error details:', error); // Debug log
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Server is not responding. Please try again later.');
      } else if (!error.response) {
        throw new Error('Cannot connect to server. Please check if the server is running at http://localhost:3000');
      } else if (error.response.status === 404) {
        throw new Error('Registration endpoint not found. Please check server configuration.');
      } else if (error.response.status === 409) {
        throw new Error('This email is already registered. Please use a different email or try logging in.');
      } else if (error.response.status === 400) {
        const errorMessage = error.response.data.errors 
          ? error.response.data.errors.join('. ') 
          : error.response.data.message || 'Invalid registration data. Please check your input.';
        throw new Error(errorMessage);
      } else if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error(`Registration failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    removeToken();
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 


