/**
 * API Endpoints Service
 * Organized API route constants for easier maintenance
 */

export const API_ROUTES = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },

  // Chat/LLM
  AI: {
    CHAT: '/ai/chat',
    CHAT_STREAM: '/ai/chat/stream',
    CHAT_HISTORY: '/ai/chat/history',
    DELETE_CHAT: '/ai/chat/:id',
  },

  // Symptoms
  SYMPTOMS: {
    RECOMMEND: '/symptoms/recommend',
    RECOMMEND_STREAM: '/symptoms/recommend/stream',
    HISTORY: '/symptoms/history',
  },

  // Text-to-Speech
  TTS: {
    GENERATE: '/tts/generate',
    STREAM: '/tts/stream',
    VOICES: '/tts/voices',
  },

  // Medicine
  MEDICINE: {
    IDENTIFY: '/medicine/identify',
    SEARCH: '/medicine/search',
    HISTORY: '/medicine/history',
    DETAILS: '/medicine/:id',
  },

  // Prescriptions
  PRESCRIPTIONS: {
    ANALYZE: '/prescriptions/analyze',
    LIST: '/prescriptions',
    GET: '/prescriptions/:id',
    CREATE: '/prescriptions',
    DELETE: '/prescriptions/:id',
  },

  // Doctors
  DOCTORS: {
    LIST: '/doctors',
    SEARCH: '/doctors/search',
    GET: '/doctors/:id',
    SPECIALTIES: '/doctors/specialties',
  },

  // Appointments
  APPOINTMENTS: {
    CREATE: '/appointments',
    LIST: '/appointments',
    GET: '/appointments/:id',
    CANCEL: '/appointments/:id/cancel',
    UPDATE: '/appointments/:id',
  },

  // Reminders
  REMINDERS: {
    CREATE: '/reminders',
    LIST: '/reminders',
    UPDATE: '/reminders/:id',
    DELETE: '/reminders/:id',
  },

  // Dashboard
  DASHBOARD: {
    GET: '/dashboard',
    STATS: '/dashboard/stats',
  },
};

export default API_ROUTES;
