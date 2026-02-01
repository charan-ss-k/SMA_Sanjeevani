/**
 * Utility Hooks
 * Custom hooks for common functionality
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { CancellableStream, retryStreamingRequest } from '../utils/streamingUtils';
import { ENABLE_DEBUG as DEBUG } from '../config/environment';

/**
 * Hook for handling streaming responses
 */
export const useStreaming = () => {
  const streamRef = useRef(null);

  const stream = useCallback(async (requestFn, options = {}) => {
    const {
      onChunk = () => {},
      onComplete = () => {},
      onError = () => {},
      retryOnFailure = true,
      maxRetries = 3,
    } = options;

    try {
      streamRef.current = new CancellableStream();
      const request = retryOnFailure
        ? () => retryStreamingRequest(requestFn, maxRetries)
        : requestFn;

      await request();
      onComplete();
    } catch (error) {
      if (streamRef.current?.isCancelledOrFailed()) {
        if (DEBUG) console.log('[Stream] Request was cancelled');
      } else {
        onError(error);
      }
    }
  }, []);

  const cancel = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.cancel();
    }
  }, []);

  return { stream, cancel };
};

/**
 * Hook for API calls with loading state
 */
export const useAPICall = (apiFunction, autoFetch = false, dependencies = []) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        const errorMessage = err.message || 'An error occurred';
        setError(errorMessage);
        if (DEBUG) console.error('[APICall]', errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction]
  );

  useEffect(() => {
    if (autoFetch) {
      execute();
    }
  }, dependencies);

  return { data, isLoading, error, execute };
};

/**
 * Hook for debounced input
 */
export const useDebouncedValue = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for managing form state
 */
export const useForm = (initialValues, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } catch (error) {
      if (error.validationErrors) {
        setErrors(error.validationErrors);
      } else {
        console.error('Form submission error:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    resetForm,
    setValues,
    setErrors,
  };
};

export default {
  useStreaming,
  useAPICall,
  useDebouncedValue,
  useForm,
};
