/**
 * Core API Client
 * Handles all HTTP requests with streaming support for LLM and TTS endpoints
 * Manages auth tokens and error handling
 * Uses Fetch API instead of axios for React Native compatibility
 */

import * as SecureStore from 'expo-secure-store';
import getEnvVars from '../config/environment';

const { API_BASE_URL, API_TIMEOUT, DEBUG } = getEnvVars();

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT || 30000;
    this.authToken = null;
    this.userId = null;
    this.refreshToken = null;
  }

  /**
   * Build headers with auth token
   */
  async buildHeaders(additionalHeaders = {}) {
    const token = await this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Fetch wrapper with timeout
   */
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Secure Storage Methods
   */
  async setAuthToken(token, refreshToken = null) {
    try {
      await SecureStore.setItemAsync('authToken', token);
      if (refreshToken) {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
        this.refreshToken = refreshToken;
      }
      this.authToken = token;
    } catch (error) {
      if (DEBUG) console.error('Failed to store auth token:', error);
    }
  }

  async getAuthToken() {
    if (this.authToken) return this.authToken;
    try {
      this.authToken = await SecureStore.getItemAsync('authToken');
      return this.authToken;
    } catch (error) {
      if (DEBUG) console.error('Failed to retrieve auth token:', error);
      return null;
    }
  }

  async clearAuth() {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('userId');
    } catch (error) {
      if (DEBUG) console.error('Failed to clear auth:', error);
    }
    this.authToken = null;
    this.refreshToken = null;
    this.userId = null;
  }

  /**
   * Authentication Endpoints
   */
  async login(username, password) {
    try {
      const headers = await this.buildHeaders();
      const response = await this.fetchWithTimeout(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = new Error('Login failed');
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      const { access_token, refresh_token, user_id } = data;
      await this.setAuthToken(access_token, refresh_token);
      this.userId = user_id;
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async signup(username, email, password, firstName, lastName, age = null, gender = null) {
    try {
      const headers = await this.buildHeaders();
      const response = await this.fetchWithTimeout(`${this.baseURL}/auth/signup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username,
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          age,
          gender,
        }),
      });

      if (!response.ok) {
        const error = new Error('Signup failed');
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      // Backend returns: { access_token, token_type, user: { id, username, email, first_name, last_name, ... }, expires_in }
      const { access_token, refresh_token, user } = data;
      await this.setAuthToken(access_token, refresh_token);
      this.userId = user.id;
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async refreshAuthToken() {
    try {
      const refreshToken = this.refreshToken || (await SecureStore.getItemAsync('refreshToken'));
      if (!refreshToken) throw new Error('No refresh token available');

      const headers = await this.buildHeaders();
      const response = await this.fetchWithTimeout(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const { access_token, refresh_token: newRefreshToken } = data;
      await this.setAuthToken(access_token, newRefreshToken);
      return access_token;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout() {
    try {
      const headers = await this.buildHeaders();
      await this.fetchWithTimeout(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers,
      });
      await this.clearAuth();
    } catch (error) {
      await this.clearAuth();
      throw this.handleError(error);
    }
  }

  /**
   * LLM Chat/Streaming Endpoints
   * Handles text streaming from Ollama/FastAPI
   */
  async streamLLMResponse(messages, onChunk, onError, onComplete) {
    try {
      const token = await this.getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}/ai/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                onChunk(data.chunk);
              }
              if (data.error) {
                onError(new Error(data.error));
                return;
              }
            } catch (e) {
              if (DEBUG) console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer && buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6));
          if (data.chunk) onChunk(data.chunk);
        } catch (e) {
          if (DEBUG) console.error('Failed to parse final SSE data:', e);
        }
      }

      onComplete();
    } catch (error) {
      if (DEBUG) console.error('Streaming error:', error);
      onError(error);
    }
  }

  /**
   * Symptom Checker Endpoint
   * Streams LLM recommendations for symptoms
   */
  async streamSymptomRecommendation(symptoms, onChunk, onError, onComplete) {
    try {
      const token = await this.getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}/symptoms/recommend/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ symptoms }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.recommendation) {
                onChunk(data.recommendation);
              }
              if (data.error) {
                onError(new Error(data.error));
                return;
              }
            } catch (e) {
              if (DEBUG) console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      onComplete();
    } catch (error) {
      if (DEBUG) console.error('Streaming error:', error);
      onError(error);
    }
  }

  /**
   * Text-to-Speech Endpoints
   * Handles TTS audio generation and streaming
   */
  async generateTTS(text, language = 'en', voiceId = 'default') {
    try {
      const headers = await this.buildHeaders();
      const response = await this.fetchWithTimeout(`${this.baseURL}/tts/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          language,
          voice_id: voiceId,
        }),
      });

      if (!response.ok) {
        throw new Error('TTS generation failed');
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async streamTTS(text, language = 'en', voiceId = 'default') {
    try {
      const token = await this.getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}/tts/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          language,
          voice_id: voiceId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      return response;
    } catch (error) {
      if (DEBUG) console.error('TTS streaming error:', error);
      throw error;
    }
  }

  /**
   * Medicine Identification Endpoints
   */
  async identifyMedicineFromImage(imageUri, base64Data = null) {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'medicine.jpg',
      });

      const headers = await this.buildHeaders();
      delete headers['Content-Type']; // FormData sets its own Content-Type

      const response = await this.fetchWithTimeout(`${this.baseURL}/medicine/identify`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Medicine identification failed');
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Prescription Analysis Endpoints
   */
  async analyzePrescriptionImage(imageUri) {
    try {
      const formData = new FormData();
      formData.append('prescription_image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'prescription.jpg',
      });

      const headers = await this.buildHeaders();
      delete headers['Content-Type']; // FormData sets its own Content-Type

      const response = await this.fetchWithTimeout(`${this.baseURL}/prescriptions/analyze`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Prescription analysis failed');
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generic Request Methods
   */
  async get(url, config = {}) {
    try {
      const headers = await this.buildHeaders(config.headers);
      const response = await this.fetchWithTimeout(`${this.baseURL}${url}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post(url, data, config = {}) {
    try {
      const headers = await this.buildHeaders(config.headers);
      const response = await this.fetchWithTimeout(`${this.baseURL}${url}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST request with NO timeout for LLM endpoints
   * Used for symptom/medicine recommendations that may take a very long time
   * Backend will handle its own timeouts
   */
  async postWithExtendedTimeout(url, data, config = {}) {
    try {
      const headers = await this.buildHeaders(config.headers);
      
      if (DEBUG) console.log('[API] Sending POST request (no timeout):', `${this.baseURL}${url}`);
      
      // No timeout - let the request complete naturally
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      
      if (DEBUG) console.log('[API] Response received, status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        if (DEBUG) console.error('[API] Error response:', errorText);
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }

      const jsonResponse = await response.json();
      if (DEBUG) console.log('[API] Response parsed successfully');
      
      return jsonResponse;
    } catch (error) {
      if (DEBUG) console.error('[API] Request failed:', error);
      throw this.handleError(error);
    }
  }

  async put(url, data, config = {}) {
    try {
      const headers = await this.buildHeaders(config.headers);
      const response = await this.fetchWithTimeout(`${this.baseURL}${url}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(url, config = {}) {
    try {
      const headers = await this.buildHeaders(config.headers);
      const response = await this.fetchWithTimeout(`${this.baseURL}${url}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload file via FormData
   * Used for image uploads to various endpoints
   */
  async uploadFile(url, formData, config = {}) {
    try {
      const headers = await this.buildHeaders(config.headers);
      delete headers['Content-Type']; // FormData sets its own Content-Type

      const response = await this.fetchWithTimeout(`${this.baseURL}${url}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Error Handling
   */
  handleError(error) {
    let message = 'An error occurred';

    // Check for abort/timeout errors
    if (error.name === 'AbortError') {
      message = 'Request timeout - this usually happens with slow AI models. Please try again.';
    } else if (error.message) {
      message = error.message;
    }

    const apiError = new Error(message);
    apiError.status = error.status;
    apiError.code = error.code;
    apiError.originalError = error;

    if (DEBUG) {
      console.error('[API Error]', message, error);
    }

    return apiError;
  }
}

export default new APIClient();
