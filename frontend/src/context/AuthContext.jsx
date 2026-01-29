import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    // Check both 'token' and 'access_token' keys for compatibility
    const storedToken = localStorage.getItem('token') || localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    console.log('🔐 AuthContext Initialization:', {
      token: storedToken ? `${storedToken.substring(0, 20)}...` : 'null',
      user: storedUser ? 'present' : 'null'
    });

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        console.log('✅ Auth restored from localStorage');
      } catch (err) {
        console.error('❌ Failed to restore auth:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    } else {
      console.log('ℹ️ No stored auth found');
    }
    setLoading(false);
  }, []);

  const logout = () => {
    console.log('🚪 Logging out...');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    console.log('✅ Logout successful - all auth data cleared');
  };

  // Helper to get current token (checks both state and localStorage)
  const getCurrentToken = () => {
    return token || localStorage.getItem('token') || localStorage.getItem('access_token');
  };

  // Wrapper for setToken that also updates localStorage
  const setTokenWithStorage = (newToken) => {
    console.log('🔐 Setting token:', newToken ? `${newToken.substring(0, 20)}...` : 'null');
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
      localStorage.setItem('access_token', newToken); // Store in both for compatibility
      console.log('✅ Token stored in localStorage');
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      console.log('✅ Token cleared from localStorage');
    }
  };

  const value = {
    user,
    setUser: (newUser) => {
      console.log('👤 Setting user:', newUser?.username || 'null');
      setUser(newUser);
      if (newUser) {
        localStorage.setItem('user', JSON.stringify(newUser));
        console.log('✅ User stored in localStorage');
      } else {
        localStorage.removeItem('user');
        console.log('✅ User cleared from localStorage');
      }
    },
    token: getCurrentToken(), // Always return current token
    setToken: setTokenWithStorage,
    loading,
    logout,
    isAuthenticated: !!getCurrentToken() // Check both state and localStorage
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
