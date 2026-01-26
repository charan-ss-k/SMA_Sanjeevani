import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../main';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { setUser, setToken } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    age: '',
    gender: 'Male'
  });

  const API_BASE = 'http://localhost:8000';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.username || formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    
    if (isLogin) {
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    } else {
      if (!formData.email || !formData.email.includes('@')) {
        setError('Please enter a valid email');
        return false;
      }
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (!formData.fullName || formData.fullName.length < 2) {
        setError('Please enter your full name');
        return false;
      }
      if (!formData.age || formData.age < 1 || formData.age > 150) {
        setError('Please enter a valid age');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      
      let payload;
      if (isLogin) {
        payload = {
          username: formData.username,
          password: formData.password
        };
      } else {
        // Split fullName into first_name and last_name
        const trimmedName = formData.fullName.trim();
        const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
        
        let first_name, last_name;
        if (nameParts.length === 0) {
          first_name = '';
          last_name = 'User';
        } else if (nameParts.length === 1) {
          first_name = nameParts[0];
          last_name = nameParts[0]; // Use same name for last name if only one word
        } else {
          first_name = nameParts[0];
          last_name = nameParts.slice(1).join(' ');
        }
        
        payload = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: first_name,
          last_name: last_name,
          age: parseInt(formData.age) || null,
          gender: formData.gender || null
        };
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Authentication failed' }));
        setError(errorData.detail || errorData.message || 'Authentication failed');
        return;
      }

      const data = await response.json();

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setToken(data.access_token);
      setUser(data.user);

      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        age: '',
        gender: 'Male'
      });

      onClose();
      navigate('/dashboard');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      age: '',
      gender: 'Male'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-container" onClick={e => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>✕</button>
        
        <div className="auth-modal-content">
          {/* Left Section - Branding */}
          <div className="auth-modal-branding">
            <div className="auth-branding-content">
              <h1 className="auth-brand-title">Sanjeevani</h1>
              <p className="auth-brand-subtitle">Your Personal Health Assistant</p>
              
              <div className="auth-features">
                <div className="auth-feature-item">
                  <span className="auth-feature-icon">🔒</span>
                  <span className="auth-feature-text">Secure & Private</span>
                </div>
                <div className="auth-feature-item">
                  <span className="auth-feature-icon">💊</span>
                  <span className="auth-feature-text">Medicine Tracking</span>
                </div>
                <div className="auth-feature-item">
                  <span className="auth-feature-icon">📊</span>
                  <span className="auth-feature-text">Health Analytics</span>
                </div>
                <div className="auth-feature-item">
                  <span className="auth-feature-icon">🔔</span>
                  <span className="auth-feature-text">Smart Reminders</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Form */}
          <div className="auth-modal-form-section">
            <div className="auth-tabs">
              <button
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <div className="auth-error-message">
                  <span>⚠️</span> {error}
                </div>
              )}

              <div className="auth-form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {!isLogin && (
                <>
                  <div className="auth-form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="auth-form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="auth-form-row">
                    <div className="auth-form-group">
                      <label htmlFor="age">Age</label>
                      <input
                        type="number"
                        id="age"
                        name="age"
                        placeholder="Age"
                        min="1"
                        max="150"
                        value={formData.age}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="auth-form-group">
                      <label htmlFor="gender">Gender</label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="auth-form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {!isLogin && (
                <div className="auth-form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="auth-submit-btn"
              >
                {loading ? (
                  <>
                    <span className="auth-spinner"></span>
                    {isLogin ? 'Logging in...' : 'Creating account...'}
                  </>
                ) : (
                  isLogin ? 'Login' : 'Create Account'
                )}
              </button>

              <div className="auth-toggle-container">
                <p>
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  <button
                    type="button"
                    onClick={handleToggle}
                    className="auth-toggle-btn"
                  >
                    {isLogin ? 'Sign Up' : 'Login'}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
