import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';

const API_BASE = window.__API_BASE__ || 'http://localhost:8000';

export function LoginSignup() {
  const navigate = useNavigate();
  const { setUser, setToken } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.username || !formData.password) {
      setError('Username and password are required');
      return false;
    }
    
    if (!isLogin) {
      if (!formData.email || !formData.fullName) {
        setError('All fields are required');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (!formData.email.includes('@')) {
        setError('Please enter a valid email');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const fullUrl = `${API_BASE}${endpoint}`;
      
      console.log('🔐 Auth Request:', {
        url: fullUrl,
        method: 'POST',
        isLogin: isLogin
      });
      
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

      console.log('📤 Payload:', payload);

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('📥 Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Authentication failed' }));
        console.error('❌ Auth Error Response:', errorData);
        
        // Handle validation errors (422) - show detailed error messages
        if (response.status === 422 && errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail.map(err => {
              const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
              return `${field}: ${err.msg}`;
            }).join(', ');
            throw new Error(errorMessages);
          } else {
            throw new Error(errorData.detail);
          }
        }
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: Authentication failed`);
      }

      const data = await response.json();
      console.log('✅ Auth Success:', {
        user: data.user?.username,
        tokenLength: data.access_token?.length
      });
      
      // Store token and user info
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
      setToken(data.access_token);
      
      console.log('💾 Stored:', {
        token: localStorage.getItem('token') ? '✓' : '✗',
        user: localStorage.getItem('user') ? '✓' : '✗'
      });
      
      // Redirect to home
      setTimeout(() => navigate('/home'), 500);
    } catch (err) {
      setError(err.message || t('authenticationFailed', language));
      console.error('❌ Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-section">
            <div className="logo-circle">
              <span className="logo-text">🏥</span>
            </div>
            <h1>{t('sanjeevani', language)}</h1>
            <p className="tagline">{t('yourPersonalHealthAssistant', language)}</p>
          </div>
        </div>

        <div className="auth-form-section">
          <div className="form-tabs">
            <button
              className={`tab-button ${isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(true);
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
              }}
            >
              Login
            </button>
            <button
              className={`tab-button ${!isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(false);
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
              }}
            >
              Sign Up
            </button>
          </div>

          {error && <div className="error-message">❌ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('username', language)}</label>
              <input
                type="text"
                name="username"
                placeholder={t('enterUsername', language)}
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {!isLogin && (
              <>
                <div className="form-group">
                  <label>{t('fullName', language)}</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder={t('enterFullName', language)}
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('age', language)}</label>
                    <input
                      type="number"
                      name="age"
                      placeholder={t('ageOptional', language)}
                      value={formData.age}
                      onChange={handleChange}
                      disabled={loading}
                      min="0"
                      max="150"
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label>{t('password', language)}</label>
              <input
                type="password"
                name="password"
                placeholder={t('enterPassword', language)}
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label>{t('confirmPassword', language)}</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder={t('confirmYourPassword', language)}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {isLogin ? t('loggingIn', language) : t('creatingAccount', language)}
                </>
              ) : (
                isLogin ? t('login', language) : t('signUp', language)
              )}
            </button>
          </form>

          <p className="form-footer">
            {isLogin ? `${t('dontHaveAccount', language)} ` : `${t('alreadyHaveAccount', language)} `}
            <button
              className="switch-link"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
            >
              {isLogin ? t('signUp', language) : t('login', language)}
            </button>
          </p>
        </div>

        <div className="auth-benefits">
          <div className="benefit">
            <span className="icon">🔒</span>
            <p><strong>{t('secure', language)}</strong> - {t('secureDesc', language)}</p>
          </div>
          <div className="benefit">
            <span className="icon">📊</span>
            <p><strong>{t('track', language)}</strong> - {t('trackDesc', language)}</p>
          </div>
          <div className="benefit">
            <span className="icon">🔔</span>
            <p><strong>{t('smartReminders', language)}</strong> - {t('remindersDesc', language)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginSignup;
