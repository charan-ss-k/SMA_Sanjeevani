/**
 * Helper Utilities
 * Common utility functions for the app
 */

import { Platform } from 'react-native';

/**
 * Format date for display
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  switch (format) {
    case 'short':
      return `${month}/${day}/${year}`;
    case 'long':
      return `${day}/${month}/${year}`;
    case 'time':
      return `${hours}:${minutes}`;
    case 'datetime':
      return `${month}/${day}/${year} ${hours}:${minutes}`;
    default:
      return d.toLocaleDateString();
  }
};

/**
 * Validate email
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  return {
    isValid: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 100) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

/**
 * Get platform-specific styling
 */
export const getPlatformStyle = (style) => {
  return Platform.select(style);
};

/**
 * Format medical text for better readability
 */
export const formatMedicalResponse = (text) => {
  if (!text) return '';

  // Split by common delimiters
  let formatted = text
    .split(/\n|•|-|\*/)
    .filter((line) => line.trim())
    .map((line) => line.trim());

  return formatted;
};

/**
 * Get initials from name
 */
export const getInitials = (fullName) => {
  if (!fullName) return 'U';
  const parts = fullName.split(' ');
  return parts.map((part) => part[0]).join('').toUpperCase();
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async (
  fn,
  maxAttempts = 3,
  initialDelay = 1000
) => {
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

export default {
  formatDate,
  validateEmail,
  validatePassword,
  truncateText,
  getPlatformStyle,
  formatMedicalResponse,
  getInitials,
  retryWithBackoff,
  deepClone,
};
