/**
 * Environment Configuration
 * Development and production settings
 */

const ENV = {
  development: {
    API_BASE_URL: 'http://98.70.223.78/api',
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
  // Default to development
  return ENV.development;
};

// Export both the function and individual variables for compatibility
export const getEnv = getEnvVars;
export const { API_BASE_URL, ENABLE_DEBUG: DEBUG, API_TIMEOUT } = ENV.development;

export default getEnvVars;
