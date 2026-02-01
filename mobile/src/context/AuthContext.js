/**
 * Authentication Context
 * Manages user authentication state, tokens, and session data
 * Mirrors the React web folder's AuthContext logic
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';
import { ENABLE_DEBUG as DEBUG } from '../config/environment';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  /**
   * Initialize auth state on app load
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const token = await SecureStore.getItemAsync('authToken');
        const userId = await SecureStore.getItemAsync('userId');
        const storedUser = await SecureStore.getItemAsync('user');

        if (token && userId) {
          // Token exists - restore session without API call to avoid 404
          setIsAuthenticated(true);
          
          // Restore user from storage if available
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (e) {
              if (DEBUG) console.warn('[Auth] Failed to parse stored user');
            }
          }
          
          if (DEBUG) console.log('[Auth] Session restored from storage');
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        if (DEBUG) console.error('[Auth] Initialization error:', err);
        setError(err.message);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Fetch current user profile
   */
  const fetchUserProfile = useCallback(async () => {
    try {
      const profile = await apiClient.get('/auth/me');
      setUserProfile(profile);
      const userData = {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        fullName: `${profile.first_name} ${profile.last_name}`,
        avatar: profile.avatar,
      };
      setUser(userData);
      
      // Store user data for offline access
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      
      return profile;
    } catch (err) {
      if (DEBUG) console.warn('[Auth] Profile fetch failed, continuing with cached data:', err);
      // Don't logout on profile fetch failure - user is still authenticated
      // This prevents logout on 404 or network errors
      return null;
    }
  }, []);

  /**
   * Login with username (or email) and password
   */
  const login = useCallback(async (username, password) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.login(username, password);

      // Backend returns: { access_token, token_type, user: { id, username, email, first_name, last_name, ... }, expires_in }
      // Store user ID in secure storage
      await SecureStore.setItemAsync('userId', String(response.user.id));

      const userData = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        fullName: `${response.user.first_name} ${response.user.last_name}`,
        firstName: response.user.first_name,
        lastName: response.user.last_name,
        age: response.user.age,
        gender: response.user.gender,
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store user data for offline access
      await SecureStore.setItemAsync('user', JSON.stringify(userData));

      if (DEBUG) console.log('[Auth] Login successful');
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      if (DEBUG) console.error('[Auth] Login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  /**
   * Sign up new user
   */
  const signup = useCallback(async (username, email, password, firstName, lastName, age = null, gender = null) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.signup(username, email, password, firstName, lastName, age, gender);

      // Backend returns: { access_token, token_type, user: { id, username, email, first_name, last_name, ... }, expires_in }
      // Store user ID in secure storage
      await SecureStore.setItemAsync('userId', String(response.user.id));

      const userData = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        fullName: `${response.user.first_name} ${response.user.last_name}`,
        firstName: response.user.first_name,
        lastName: response.user.last_name,
        age: response.user.age,
        gender: response.user.gender,
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store user data for offline access
      await SecureStore.setItemAsync('user', JSON.stringify(userData));

      if (DEBUG) console.log('[Auth] Signup successful');
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Signup failed';
      setError(errorMessage);
      if (DEBUG) console.error('[Auth] Signup error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await apiClient.logout();
      await SecureStore.deleteItemAsync('userId');
      await SecureStore.deleteItemAsync('user');
      
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      setError(null);

      if (DEBUG) console.log('[Auth] Logout successful');
    } catch (err) {
      if (DEBUG) console.error('[Auth] Logout error:', err);
      // Still clear local state even if API call fails
      await SecureStore.deleteItemAsync('userId').catch(() => {});
      await SecureStore.deleteItemAsync('user').catch(() => {});
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates) => {
    try {
      setIsLoading(true);
      const response = await apiClient.put('/auth/profile', updates);
      setUserProfile(response);
      setUser((prev) => ({
        ...prev,
        ...updates,
      }));
      if (DEBUG) console.log('[Auth] Profile updated');
      return response;
    } catch (err) {
      if (DEBUG) console.error('[Auth] Profile update error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh authentication token
   */
  const refreshAuth = useCallback(async () => {
    try {
      await apiClient.refreshAuthToken();
      if (DEBUG) console.log('[Auth] Token refreshed');
      return true;
    } catch (err) {
      if (DEBUG) console.error('[Auth] Token refresh error:', err);
      // If refresh fails, logout user
      await logout();
      return false;
    }
  }, [logout]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    // State
    user,
    userProfile,
    isAuthenticated,
    isLoading,
    error,

    // Methods
    login,
    signup,
    logout,
    updateProfile,
    refreshAuth,
    fetchUserProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
