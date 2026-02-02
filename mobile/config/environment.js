/**
 * Environment Configuration
 * Handles API endpoints and feature flags
 */

import Constants from 'expo-constants';

const ENV = {
  dev: {
    API_BASE_URL: 'http://98.70.223.78', // Azure VM IP
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
  // Try to get from expo constants first
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
