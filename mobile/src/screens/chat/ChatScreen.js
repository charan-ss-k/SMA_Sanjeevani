/**
 * Chat Screen
 * AI Medical Assistant chat with streaming responses
 * Matches frontend ChatWidget.jsx functionality exactly
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import { renderMedicalResponse, getMedicalTextForTTS } from '../../utils/formatMedicalResponse';
import ttsService from '../../services/ttsService';
import { Card, Button, Alert } from '../../components';
import { colors, spacing, typography } from '../../utils/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const ChatMessageBubble = ({ message, isUser, onSpeak, isMuted, t, isSpeaking, isProcessing }) => {
  // Safety check to prevent text rendering errors
  if (!message || typeof message !== 'object' || !message.text) {
    return null;
  }
  
  // Ensure text is always a string
  const safeText = String(message.text || '');
  if (!safeText.trim()) {
    return null;
  }
  
  return (
    <View
      style={{
        marginVertical: spacing.sm,
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          maxWidth: '85%',
          marginHorizontal: spacing.sm,
        }}
      >
        <Card
          variant="elevated"
          padding="md"
          style={{
            backgroundColor: isUser ? '#15803d' : '#FFFFFF',
            borderRadius: 18,
            borderBottomRightRadius: isUser ? 6 : 18,
            borderBottomLeftRadius: isUser ? 18 : 6,
            borderWidth: isUser ? 0 : 1,
            borderColor: '#BBF7D0',
          }}
        >
          {isUser ? (
            <Text
              style={[
                typography.body,
                {
                  color: colors.white,
                  lineHeight: 22,
                },
              ]}
            >
              {safeText}
            </Text>
          ) : (
            <ScrollView 
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {renderMedicalResponse(safeText)}
            </ScrollView>
          )}
        </Card>
        {!isUser && (
          <Pressable
            onPress={() => onSpeak(safeText)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: spacing.sm,
              paddingHorizontal: spacing.md,
              opacity: isMuted && !isSpeaking ? 0.5 : 1,
            }}
            disabled={isMuted && !isSpeaking}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : null}
            <MaterialIcons
              name={isSpeaking ? 'stop' : (isMuted ? 'volume-off' : 'volume-up')}
              size={16}
              color={colors.textSecondary}
            />
            <Text
              style={[
                typography.caption,
                {
                  color: colors.textSecondary,
                  marginLeft: spacing.xs,
                },
              ]}
            >
              {isSpeaking
                ? (isProcessing ? t('ttsProcessing') : t('stop'))
                : (isMuted ? t('ttsMuted') : t('tapToSpeak'))}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default function ChatScreen() {
  const { language, t } = useLanguage();
  const { 
    chatHistory, 
    sendMessage, 
    addMessage, 
    isLoading, 
    error: contextError, 
    isMuted, 
    toggleMute,
  } = useChat();
  const [inputText, setInputText] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTtsMessageId, setActiveTtsMessageId] = useState(null);
  const [isTtsProcessing, setIsTtsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const flatListRef = useRef(null);

  const stopTTSPlayback = useCallback(async () => {
    try {
      await ttsService.stop();
    } catch (_) {
      // noop
    }
    setActiveTtsMessageId(null);
    setIsTtsProcessing(false);
  }, []);

  // Clear local error when context error changes (ignore chat history load errors)
  useEffect(() => {
    if (contextError && !contextError.includes('Failed to load chat history')) {
      setError(contextError);
    }
  }, [contextError]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (flatListRef.current && (chatHistory.length > 0 || streamingText)) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatHistory, streamingText]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopTTSPlayback();
      };
    }, [stopTTSPlayback])
  );

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      console.log('[ChatScreen] Request stopped by user');
    }
    setIsStreaming(false);
    setStreamingText('');
    // Stop any ongoing TTS
    stopTTSPlayback();
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isStreaming) return;

    // Stop any ongoing speech when user sends a new input
    await stopTTSPlayback();

    const userMessage = inputText.trim();
    setInputText('');
    setStreamingText('');
    setError(null);
    setIsStreaming(true);

    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Add user message to history
      addMessage(userMessage, 'user');

      // Stream AI response - matches frontend ChatWidget behavior
      await sendMessage(
        userMessage,
        (chunk) => {
          // chunk is the accumulated text, not incremental
          setStreamingText(String(chunk || ''));
        },
        () => {
          // Complete callback
          setIsStreaming(false);
          setStreamingText('');
          setAbortController(null);
        },
        (err) => {
          // Error callback
          setError(err.message || 'Failed to get response');
          setIsStreaming(false);
          setStreamingText('');
          setAbortController(null);
        }
      );
    } catch (err) {
      setError(err.message || 'Error sending message');
      setIsStreaming(false);
      setStreamingText('');
      setAbortController(null);
    }
  };

  const handleSpeak = async (messageId, text) => {
    if (isMuted) return;

    // Toggle stop if currently speaking same message
    if (activeTtsMessageId === String(messageId)) {
      await ttsService.stop();
      setActiveTtsMessageId(null);
      setIsTtsProcessing(false);
      return;
    }
    
    try {
      setError(null);
      setActiveTtsMessageId(String(messageId));
      setIsTtsProcessing(true);
      // Convert medical formatted text to plain text for TTS
      const plainText = getMedicalTextForTTS(text);
      await ttsService.synthesizeAndPlay(plainText, language);
    } catch (err) {
      setError(t('failedToPlayAudio'));
    } finally {
      setActiveTtsMessageId(null);
      setIsTtsProcessing(false);
    }
  };

  const handleMuteToggle = () => {
    toggleMute();
    if (!isMuted) {
      // If we're muting, stop any current TTS
      stopTTSPlayback();
    }
  };

  const handleInputChange = (text) => {
    // Stop speech as soon as user starts a new input
    if ((activeTtsMessageId || isTtsProcessing) && text.trim().length > 0) {
      stopTTSPlayback();
    }
    setInputText(text);
  };

  // Combine chat history with streaming message for display
  const displayMessages = [
    ...chatHistory.filter(msg => msg && typeof msg === 'object' && msg.text && msg.sender && msg.id),
    ...(streamingText
      ? [
          {
            id: 'streaming',
            sender: 'ai',
            text: String(streamingText || ''),
            timestamp: new Date(),
          },
        ]
      : []),
  ].filter(msg => {
    return msg && 
           typeof msg === 'object' && 
           msg.text !== undefined && 
           msg.text !== null &&
           String(msg.text || '').trim().length > 0 &&
           msg.sender &&
           msg.id;
  }).map(msg => ({
    ...msg,
    text: String(msg.text || ''),
    sender: String(msg.sender || 'user'),
    id: String(msg.id || Date.now())
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 92 }}>
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(item, index) => {
            if (item && item.id) {
              return String(item.id);
            }
            return `message-${index}-${Date.now()}`;
          }}
          renderItem={({ item }) => {
            // Messages are already validated in displayMessages
            if (!item) {
              return null;
            }
            
            return (
              <ChatMessageBubble
                message={item}
                isUser={item.sender === 'user'}
                onSpeak={(text) => handleSpeak(item.id, text)}
                isMuted={isMuted}
                t={t}
                isSpeaking={activeTtsMessageId === String(item.id)}
                isProcessing={activeTtsMessageId === String(item.id) && isTtsProcessing}
              />
            );
          }}
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: spacing.xl,
            backgroundColor: '#F0FDF4',
          }}
          ListHeaderComponent={
            <View
              style={{
                marginBottom: spacing.md,
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#BBF7D0',
                padding: spacing.lg,
                shadowColor: '#0F172A',
                shadowOpacity: 0.08,
                shadowOffset: { width: 0, height: 6 },
                shadowRadius: 14,
                elevation: 4,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: spacing.sm,
                  }}
                >
                  <MaterialIcons name="medical-services" size={24} color="#0C4A6E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#0C4A6E' }}>AI Health Assistant</Text>
                  <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Ask in simple language and get structured medical guidance</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingBottom: 100,
                paddingTop: 50,
              }}
            >
              <Text
                style={[
                  typography.h4,
                  {
                    color: colors.textSecondary,
                    marginBottom: spacing.md,
                    textAlign: 'center',
                  },
                ]}
              >
                Start a Conversation
              </Text>
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.textSecondary,
                    textAlign: 'center',
                    paddingHorizontal: spacing.lg,
                  },
                ]}
              >
                Ask me about health, medicines, symptoms, or any medical questions you have
              </Text>
            </View>
          }
          scrollEnabled={true}
        />

        {isStreaming && streamingText === '' && (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
          }}>
            <View style={{
              backgroundColor: colors.white,
              borderRadius: 16,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderBottomLeftRadius: 4,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{
                marginLeft: spacing.sm,
                color: colors.textSecondary,
                fontSize: 14,
              }}>
                Thinking...
              </Text>
            </View>
          </View>
        )}

        {error && (
          <Alert
            type="error"
            message={error}
            onDismiss={() => setError(null)}
            dismissAfter={4000}
          />
        )}

        <View
          style={{
            padding: spacing.md,
            paddingBottom: Platform.OS === 'ios' ? spacing.md : spacing.lg,
            backgroundColor: '#FFFFFF',
            borderTopColor: '#D1FAE5',
            borderTopWidth: 1,
            minHeight: 70,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              backgroundColor: '#F8FAFC',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#D1FAE5',
              padding: 6,
            }}
          >
            <TextInput
              value={inputText}
              onChangeText={handleInputChange}
              onFocus={() => {
                // Scroll to bottom when keyboard opens
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              placeholder="Ask me anything..."
              placeholderTextColor={colors.textLight}
              multiline
              maxHeight={100}
              editable={!isStreaming}
              returnKeyType="default"
              blurOnSubmit={false}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 12,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + 2,
                color: colors.text,
                fontSize: 16,
                minHeight: 44,
                backgroundColor: '#FFFFFF',
              }}
            />
            
            {isStreaming ? (
              <Pressable
                onPress={handleStop}
                style={{
                  backgroundColor: '#D97706',
                  borderRadius: 12,
                  padding: spacing.md,
                  marginLeft: spacing.sm,
                  justifyContent: 'center',
                  alignItems: 'center',
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                <MaterialIcons name="stop" size={20} color={colors.white} />
              </Pressable>
            ) : (
              <Pressable
                onPress={handleSendMessage}
                disabled={!inputText.trim() || isStreaming}
                style={{
                  backgroundColor:
                    inputText.trim() && !isStreaming
                      ? '#15803d'
                      : colors.gray[200],
                  borderRadius: 12,
                  padding: spacing.md,
                  marginLeft: spacing.sm,
                  justifyContent: 'center',
                  alignItems: 'center',
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                <MaterialIcons 
                  name="send" 
                  size={20} 
                  color={inputText.trim() && !isStreaming ? colors.white : colors.gray[400]} 
                />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
