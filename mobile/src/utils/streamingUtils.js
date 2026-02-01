/**
 * Streaming Utilities
 * Helper functions for handling LLM text streaming and SSE
 */

import { ENABLE_DEBUG as DEBUG } from '../config/environment';

/**
 * Parse Server-Sent Events stream
 * Handles chunked responses from backend
 */
export const parseSSEStream = async (response, onChunk, onError, onComplete) => {
  try {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') {
              onComplete?.();
              continue;
            }

            const data = JSON.parse(jsonStr);
            if (data.chunk) {
              onChunk(data.chunk);
            }
            if (data.error) {
              const error = new Error(data.error);
              onError?.(error);
              throw error;
            }
          } catch (parseError) {
            if (DEBUG) console.warn('[SSE] Failed to parse line:', line, parseError);
          }
        }
      }
    }

    // Handle remaining buffer
    if (buffer && buffer.startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.slice(6));
        if (data.chunk) onChunk(data.chunk);
      } catch (e) {
        if (DEBUG) console.warn('[SSE] Failed to parse final buffer:', buffer);
      }
    }

    onComplete?.();
  } catch (error) {
    if (DEBUG) console.error('[SSE] Stream parsing error:', error);
    onError?.(error);
  }
};

/**
 * Handle LLM streaming with automatic chunking
 * Useful for building streamed responses character-by-character
 */
export class StreamAccumulator {
  constructor(onComplete = null) {
    this.buffer = '';
    this.chunks = [];
    this.onComplete = onComplete;
  }

  addChunk(chunk) {
    if (!chunk) return;
    this.buffer += chunk;
    this.chunks.push(chunk);
    return this.buffer;
  }

  getFullText() {
    return this.buffer;
  }

  getChunks() {
    return this.chunks;
  }

  clear() {
    this.buffer = '';
    this.chunks = [];
  }

  complete() {
    if (this.onComplete) {
      this.onComplete(this.buffer);
    }
  }
}

/**
 * Retry logic for failed streaming requests
 */
export const retryStreamingRequest = async (
  requestFn,
  maxRetries = 3,
  delayMs = 1000
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (DEBUG) console.log(`[Streaming] Attempt ${attempt}/${maxRetries}`);
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        if (DEBUG) console.log(`[Streaming] Retry after ${delayMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  throw lastError;
};

/**
 * Create a cancellable streaming request
 */
export class CancellableStream {
  constructor() {
    this.abortController = new AbortController();
    this.isCancelled = false;
  }

  cancel() {
    this.isCancelled = true;
    this.abortController.abort();
    if (DEBUG) console.log('[Stream] Cancelled');
  }

  getSignal() {
    return this.abortController.signal;
  }

  isCancelledOrFailed() {
    return this.isCancelled || this.abortController.signal.aborted;
  }
}

/**
 * Utility to safely handle streaming responses
 */
export const safeStreamingHandler = {
  handleSuccess: (onSuccess) => (data) => {
    try {
      onSuccess(data);
    } catch (error) {
      if (DEBUG) console.error('[Stream] Handler error:', error);
    }
  },

  handleError: (onError) => (error) => {
    try {
      if (error?.name === 'AbortError') {
        if (DEBUG) console.log('[Stream] Request was cancelled');
      } else {
        onError(error);
      }
    } catch (handlerError) {
      if (DEBUG) console.error('[Stream] Error handler failed:', handlerError);
    }
  },
};

export default {
  parseSSEStream,
  StreamAccumulator,
  retryStreamingRequest,
  CancellableStream,
  safeStreamingHandler,
};
