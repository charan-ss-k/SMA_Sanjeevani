/**
 * Alert/Toast Component
 * Show messages to user
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
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
    info: { bg: colors.info, icon: 'ℹ' },
    success: { bg: colors.success, icon: '✓' },
    error: { bg: colors.error, icon: '✕' },
    warning: { bg: colors.warning, icon: '⚠' },
  };

  const typeStyle = typeStyles[type];

  return (
    <Animated.View
      style={{
        opacity,
        backgroundColor: typeStyle.bg,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginVertical: spacing.sm,
        flexDirection: 'row',
      }}
    >
      <Text
        style={{
          fontSize: 20,
          marginRight: spacing.md,
          color: colors.white,
        }}
      >
        {typeStyle.icon}
      </Text>
      <View style={{ flex: 1 }}>
        {title && (
          <Text
            style={{
              fontWeight: '600',
              color: colors.white,
              marginBottom: spacing.xs,
            }}
          >
            {title}
          </Text>
        )}
        {message && (
          <Text
            style={{
              color: colors.white,
              opacity: 0.9,
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
              color: colors.white,
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
