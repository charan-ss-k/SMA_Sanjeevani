/**
 * Environment Configuration
 * Development and production settings
 */

import Constants from 'expo-constants';

const resolveDevApiBaseUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (configuredUrl && !/localhost|127\.0\.0\.1/i.test(configuredUrl)) {
    return configuredUrl;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoConfig?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    null;

  if (hostUri) {
    const host = hostUri.replace(/^https?:\/\//i, '').replace(/^exp:\/\//i, '').split(':')[0];
    if (host) {
      return `http://${host}:8000/api`;
    }
  }

  return configuredUrl || 'http://localhost:8000/api';
};

const ENV = {
  development: {
    API_BASE_URL: resolveDevApiBaseUrl(),
    ENABLE_DEBUG: true,
    API_TIMEOUT: 120000, // 2 minutes for general API calls
    PRESCRIPTION_TIMEOUT: 180000, // 3 minutes for prescription OCR + AI analysis
  },
  production: {
    API_BASE_URL: 'https://api.sanjeevani.com/api',
    ENABLE_DEBUG: false,
    API_TIMEOUT: 120000, // 2 minutes for general API calls
    PRESCRIPTION_TIMEOUT: 180000, // 3 minutes for prescription OCR + AI analysis
  },
};

const getEnvVars = () => {
  return ENV.development;
};

// Export both the function and individual variables for compatibility
export const getEnv = getEnvVars;
export const { API_BASE_URL, ENABLE_DEBUG: DEBUG, API_TIMEOUT } = ENV.development;
export const API_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export default getEnvVars;
