/**
 * Chat Screen
 * AI Medical Assistant chat with streaming responses
 * Matches frontend ChatWidget.jsx functionality exactly
 */

import React, { useState, useRef, useEffect } from 'react';
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
import { renderMedicalResponse, getMedicalTextForTTS } from '../../utils/formatMedicalResponse';
import ttsService from '../../services/ttsService';
import { Card, Button, Alert } from '../../components';
import { colors, spacing, typography } from '../../utils/theme';
import { MaterialIcons } from '@expo/vector-icons';

const ChatMessageBubble = ({ message, isUser, onSpeak, isMuted }) => {
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
            backgroundColor: isUser ? colors.primary : colors.white,
            borderRadius: 16,
            borderBottomRightRadius: isUser ? 4 : 16,
            borderBottomLeftRadius: isUser ? 16 : 4,
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
              opacity: isMuted ? 0.5 : 1,
            }}
          >
            <MaterialIcons
              name={isMuted ? 'volume-off' : 'volume-up'}
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
              {isMuted ? 'TTS Muted' : 'Tap to speak'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default function ChatScreen() {
  const { 
    chatHistory, 
    sendMessage, 
    addMessage, 
    isLoading, 
    error: contextError, 
    isMuted, 
    toggleMute 
  } = useChat();
  const [inputText, setInputText] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const flatListRef = useRef(null);

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

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      console.log('[ChatScreen] Request stopped by user');
    }
    setIsStreaming(false);
    setStreamingText('');
    // Stop any ongoing TTS
    ttsService.stop();
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isStreaming) return;

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

  const handleSpeak = async (text) => {
    if (isMuted) return;
    
    try {
      // Convert medical formatted text to plain text for TTS
      const plainText = getMedicalTextForTTS(text);
      await ttsService.synthesizeAndPlay(plainText, 'en');
    } catch (err) {
      setError('Failed to play audio');
    }
  };

  const handleMuteToggle = () => {
    toggleMute();
    if (!isMuted) {
      // If we're muting, stop any current TTS
      ttsService.stop();
    }
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
                onSpeak={handleSpeak}
                isMuted={isMuted}
              />
            );
          }}
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: spacing.xl,
            backgroundColor: '#f8fffe', // Light green-blue background like frontend
          }}
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
                💬 Start a Conversation
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
            backgroundColor: colors.white,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            minHeight: 70,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: spacing.sm,
            }}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
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
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                color: colors.text,
                fontSize: 16,
                minHeight: 44,
                backgroundColor: colors.gray[100],
              }}
            />
            
            {isStreaming ? (
              <Pressable
                onPress={handleStop}
                style={{
                  backgroundColor: colors.warning,
                  borderRadius: 8,
                  padding: spacing.md,
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
                      ? colors.primary
                      : colors.gray[200],
                  borderRadius: 8,
                  padding: spacing.md,
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
