/**
 * Alert/Toast Component
 * Show messages to user
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../utils/theme';

export const Alert = ({
  type = 'info', // info, success, error, warning
  title,
  message,
  onDismiss,
  dismissAfter = 4000,
  actionText = null,
  onAction = null,
}) => {
  const [opacity] = useState(new Animated.Value(1));

  useEffect(() => {
    if (dismissAfter > 0) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, dismissAfter);
      return () => clearTimeout(timer);
    }
  }, [dismissAfter, onDismiss]);

  const typeStyles = {
    info: { bg: '#E0F2FE', text: '#0C4A6E', icon: 'information-outline' },
    success: { bg: '#DCFCE7', text: '#14532D', icon: 'check-circle-outline' },
    error: { bg: '#FEE2E2', text: '#7F1D1D', icon: 'close-circle-outline' },
    warning: { bg: '#FEF3C7', text: '#78350F', icon: 'alert-outline' },
  };

  const typeStyle = typeStyles[type];

  return (
    <Animated.View
      style={{
        opacity,
        backgroundColor: typeStyle.bg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
        padding: spacing.md,
        marginVertical: spacing.sm,
        flexDirection: 'row',
      }}
    >
      <MaterialCommunityIcons
        name={typeStyle.icon}
        size={20}
        color={typeStyle.text}
        style={{ marginRight: spacing.md, marginTop: 1 }}
      />
      <View style={{ flex: 1 }}>
        {title && (
          <Text
            style={{
              fontWeight: '600',
              color: typeStyle.text,
              marginBottom: spacing.xs,
            }}
          >
            {title}
          </Text>
        )}
        {message && (
          <Text
            style={{
              color: typeStyle.text,
              opacity: 0.95,
              fontSize: 14,
            }}
          >
            {message}
          </Text>
        )}
      </View>
      {onAction && actionText && (
        <Pressable
          onPress={onAction}
          style={{ justifyContent: 'center', marginLeft: spacing.md }}
        >
          <Text
            style={{
              color: typeStyle.text,
              fontWeight: '600',
              fontSize: 14,
            }}
          >
            {actionText}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
};

export default Alert;
