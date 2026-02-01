/**
 * Chat/History Context
 * Manages chat history, conversations, and AI responses
 * Matches frontend ChatWidget.jsx implementation exactly
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import { ENABLE_DEBUG as DEBUG } from '../config/environment';

const ChatContext = createContext({});

export const ChatProvider = ({ children }) => {
  const [chatHistory, setChatHistory] = useState([
    {
      id: 0,
      sender: 'ai',
      text: '🏥 Hello! I\'m Sanjeevani AI, your 24/7 medical assistant. I can help you with health questions, symptoms, medications, and general medical advice. What would you like to know today?',
      timestamp: new Date(),
    }
  ]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  /**
   * Add message to current conversation and persist to storage
   */
  const addMessage = useCallback((message, sender = 'user') => {
    const newMessage = {
      id: Date.now(),
      sender,
      text: String(message || ''), // Ensure text is always a string
      timestamp: new Date(),
    };

    setChatHistory((prevMessages) => {
      const updated = [...prevMessages, newMessage];
      // Save to AsyncStorage (React Native equivalent of sessionStorage)
      const messagesToSave = updated.filter(m => m.id !== 0); // Exclude welcome message
      AsyncStorage.setItem('chatHistory', JSON.stringify(messagesToSave)).catch(err => {
        if (DEBUG) console.warn('[Chat] Storage save error:', err);
      });
      return updated;
    });
    return newMessage;
  }, []);

  /**
   * Load chat history from backend - matches frontend /api/qa-history endpoint exactly
   */
  const fetchChatHistory = useCallback(async () => {
    if (historyLoaded) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (DEBUG) console.log('[Chat] Loading history from backend...');
      
      // First, try to get cached history from AsyncStorage
      try {
        const cached = await AsyncStorage.getItem('chatHistory');
        if (cached) {
          const cachedHistory = JSON.parse(cached);
          if (DEBUG) console.log('[Chat] Loaded cached history:', cachedHistory.length, 'messages');
          setChatHistory([
            {
              id: 0,
              sender: 'ai',
              text: '🏥 Hello! I\'m Sanjeevani AI, your 24/7 medical assistant. I can help you with health questions, symptoms, medications, and general medical advice. What would you like to know today?',
              timestamp: new Date(),
            },
            ...cachedHistory
          ]);
        }
      } catch (cacheErr) {
        if (DEBUG) console.warn('[Chat] Cache load error:', cacheErr);
      }
      
      // Then try to load from backend API (same as frontend)
      const history = await apiClient.get('/qa-history?limit=50');
      
      if (history && Array.isArray(history) && history.length > 0) {
        if (DEBUG) console.log('[Chat] Loaded backend history:', history.length, 'conversations');
        
        // Convert backend format to chat messages format (matches frontend)
        const historyMessages = history.flatMap((qa) => [
          {
            id: `user-${qa.id}`,
            sender: 'user',
            text: qa.question,
            timestamp: new Date(qa.created_at)
          },
          {
            id: `ai-${qa.id}`,
            sender: 'ai', 
            text: qa.answer,
            timestamp: new Date(qa.created_at)
          }
        ]);
        
        // Update messages with database history
        setChatHistory([
          {
            id: 0,
            sender: 'ai',
            text: '🏥 Hello! I\'m Sanjeevani AI, your 24/7 medical assistant. I can help you with health questions, symptoms, medications, and general medical advice. What would you like to know today?',
            timestamp: new Date(),
          },
          ...historyMessages
        ]);
        
        // Also save to AsyncStorage for quick access
        await AsyncStorage.setItem('chatHistory', JSON.stringify(historyMessages));
      } else {
        if (DEBUG) console.log('[Chat] No previous history found in database');
      }
      
      setHistoryLoaded(true);
      return true;
    } catch (err) {
      if (DEBUG) console.error('[Chat] History fetch error:', err);
      setError('Failed to load chat history');
      setHistoryLoaded(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [historyLoaded]);

  /**
   * Send message using /api/medical-qa endpoint - matches frontend ChatWidget exactly
   */
  const sendMessage = useCallback(
    async (message, onChunk, onComplete, onError) => {
      let aiResponse = null;
      let abortController = null;
      
      try {
        setIsLoading(true);
        setError(null);
        
        if (DEBUG) console.log('[Chat] Sending message to API:', message);
        
        // Create abort controller for this request (matches frontend)
        abortController = new AbortController();
        
        // Call medical QA API - exactly matches frontend ChatWidget
        const response = await fetch(`${apiClient.baseURL}/medical-qa`, {
          method: 'POST',
          headers: await apiClient.buildHeaders(),
          body: JSON.stringify({
            question: message,
            language: 'english', // Matches frontend default
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        if (DEBUG) console.log('[Chat] Received response:', data);

        aiResponse = String(data.answer || 'Unable to generate a response. Please try again.');
        
        // Simulate streaming by splitting response (matches frontend behavior)
        if (onChunk) {
          const words = String(aiResponse).split(' ');
          let currentText = '';
          for (const word of words) {
            currentText += (currentText ? ' ' : '') + word;
            onChunk(String(currentText));
            await new Promise(resolve => setTimeout(resolve, 30)); // Match frontend timing
          }
        }

        // Add AI response to history (matches frontend)
        const aiMessage = {
          id: Date.now(),
          sender: 'ai',
          text: String(aiResponse || ''),
          timestamp: new Date(),
        };

        setChatHistory((prevMessages) => {
          const updated = [...prevMessages, aiMessage];
          // Save to AsyncStorage for persistence (matches frontend sessionStorage)
          const messagesToSave = updated.filter(m => m.id !== 0);
          AsyncStorage.setItem('chatHistory', JSON.stringify(messagesToSave)).catch(err => {
            if (DEBUG) console.warn('[Chat] Storage save error:', err);
          });
          return updated;
        });
        
        if (DEBUG) console.log('[Chat] Response received and displayed. Auto-saved to database by backend');
        onComplete?.();
        return aiResponse;
      } catch (err) {
        if (DEBUG) console.error('[Chat] Send message error:', err);
        
        // Check if error is due to abort (matches frontend)
        if (err.name === 'AbortError') {
          if (DEBUG) console.log('[Chat] Request was cancelled by user');
          const cancelledMessage = {
            id: Date.now(),
            sender: 'ai',
            text: '⏹️ Request stopped. Feel free to ask another question!',
            timestamp: new Date(),
          };
          addMessage(cancelledMessage.text, 'ai');
          onComplete?.();
          return;
        }
        
        // If we have a partial response, still add it
        if (aiResponse) {
          addMessage(aiResponse, 'ai');
        } else {
          // Add error message (matches frontend)
          const errorMessage = {
            id: Date.now(),
            sender: 'ai',
            text: '⚠️ I encountered an error while processing your question. Please check if the backend is running and try again.',
            timestamp: new Date(),
          };
          addMessage(errorMessage.text, 'ai');
        }
        
        setError(err.message || 'Error sending message');
        onError?.(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage]
  );

  /**
   * Clear chat history and reset to welcome message
   */
  const clearHistory = useCallback(async () => {
    try {
      setChatHistory([
        {
          id: 0,
          sender: 'ai',
          text: '🏥 Hello! I\'m Sanjeevani AI, your 24/7 medical assistant. I can help you with health questions, symptoms, medications, and general medical advice. What would you like to know today?',
          timestamp: new Date(),
        }
      ]);
      await AsyncStorage.removeItem('chatHistory');
      setHistoryLoaded(false); // Allow reload
      if (DEBUG) console.log('[Chat] History cleared');
    } catch (err) {
      if (DEBUG) console.error('[Chat] Clear error:', err);
    }
  }, []);

  /**
   * Delete specific message
   */
  const deleteMessage = useCallback((messageId) => {
    setChatHistory((prev) => {
      const updated = prev.filter((msg) => msg.id !== messageId);
      // Update storage
      const messagesToSave = updated.filter(m => m.id !== 0);
      AsyncStorage.setItem('chatHistory', JSON.stringify(messagesToSave)).catch(err => {
        if (DEBUG) console.warn('[Chat] Storage update error:', err);
      });
      return updated;
    });
  }, []);

  /**
   * Toggle TTS mute state
   */
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (DEBUG) console.log('[Chat] TTS toggled:', !isMuted ? 'muted' : 'unmuted');
  }, [isMuted]);

  // Auto-load history on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChatHistory();
    }, 300); // Small delay to ensure context is ready
    return () => clearTimeout(timer);
  }, [fetchChatHistory]);

  const value = {
    chatHistory,
    currentConversation,
    isLoading,
    error,
    isMuted,
    historyLoaded,
    addMessage,
    fetchChatHistory,
    sendMessage,
    clearHistory,
    deleteMessage,
    toggleMute,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export default ChatContext;
