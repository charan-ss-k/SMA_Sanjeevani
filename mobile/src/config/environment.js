/**
 * Environment Configuration
 * Development and production settings
 */

const ENV = {
  development: {
    API_BASE_URL: 'http://192.168.29.195:8000/api',
    ENABLE_DEBUG: true,
    API_TIMEOUT: 70000, // 70 seconds to accommodate backend's 60-second Ollama timeout
  },
  production: {
    API_BASE_URL: 'https://api.sanjeevani.com/api',
    ENABLE_DEBUG: false,
    API_TIMEOUT: 70000, // 70 seconds to accommodate backend's 60-second Ollama timeout
  },
};

const getEnvVars = () => {
  // Default to development
  return ENV.development;
};

// Export both the function and individual variables for compatibility
export const getEnv = getEnvVars;
export const { API_BASE_URL, ENABLE_DEBUG: DEBUG, API_TIMEOUT } = ENV.development;

export default getEnvVars;
