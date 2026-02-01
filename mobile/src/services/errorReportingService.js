/**
 * Error Reporting Service
 * Sentry integration for crash reporting and error tracking
 */

import * as Sentry from 'sentry-expo';
import { apiClient } from '../api/client';

class ErrorReportingService {
  /**
   * Initialize Sentry
   */
  static initialize() {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      enableInExpoDevelopment: true,
      environment: process.env.REACT_APP_ENV || 'development',
      tracesSampleRate: 1.0,
    });
  }

  /**
   * Capture exception
   */
  static captureException(error, context = {}) {
    try {
      Sentry.captureException(error, {
        contexts: {
          app: context,
        },
      });
    } catch (e) {
      console.error('Failed to capture exception:', e);
    }
  }

  /**
   * Capture message
   */
  static captureMessage(message, level = 'info') {
    try {
      Sentry.captureMessage(message, level);
    } catch (e) {
      console.error('Failed to capture message:', e);
    }
  }

  /**
   * Set user context
   */
  static setUserContext(userId, email, name) {
    try {
      Sentry.setUser({
        id: userId,
        email,
        username: name,
      });
    } catch (e) {
      console.error('Failed to set user context:', e);
    }
  }

  /**
   * Add breadcrumb
   */
  static addBreadcrumb(message, category, level = 'info') {
    try {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        timestamp: new Date(),
      });
    } catch (e) {
      console.error('Failed to add breadcrumb:', e);
    }
  }

  /**
   * Report API error
   */
  static reportApiError(error, endpoint, method) {
    try {
      this.captureException(error, {
        api: {
          endpoint,
          method,
          status: error.response?.status,
          message: error.response?.data?.message,
        },
      });
    } catch (e) {
      console.error('Failed to report API error:', e);
    }
  }

  /**
   * Report custom error
   */
  static reportCustomError(errorName, errorMessage, additionalData = {}) {
    try {
      this.captureException(new Error(errorMessage), {
        custom: {
          errorName,
          ...additionalData,
        },
      });
    } catch (e) {
      console.error('Failed to report custom error:', e);
    }
  }

  /**
   * Set custom tags
   */
  static setTag(key, value) {
    try {
      Sentry.setTag(key, value);
    } catch (e) {
      console.error('Failed to set tag:', e);
    }
  }
}

export default ErrorReportingService;
