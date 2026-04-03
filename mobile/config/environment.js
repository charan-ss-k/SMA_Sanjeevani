/**
 * Environment Configuration
 * Handles API endpoints and feature flags
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
  dev: {
    API_BASE_URL: resolveDevApiBaseUrl(),
    API_TIMEOUT: 30000,
    ENABLE_AI_STREAMING: true,
    ENABLE_TTS: true,
    DEBUG: true,
  },
  staging: {
    API_BASE_URL: 'https://staging.sanjeevani.app',
    API_TIMEOUT: 30000,
    ENABLE_AI_STREAMING: true,
    ENABLE_TTS: true,
    DEBUG: false,
  },
  prod: {
    API_BASE_URL: 'https://api.sanjeevani.app',
    API_TIMEOUT: 30000,
    ENABLE_AI_STREAMING: true,
    ENABLE_TTS: true,
    DEBUG: false,
  },
};

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.prod;
};

export const {
  API_BASE_URL,
  API_TIMEOUT,
  ENABLE_AI_STREAMING,
  ENABLE_TTS,
  DEBUG,
} = getEnvVars();

export default getEnvVars;
