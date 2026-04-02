/**
 * Card Component
 * Container with consistent styling
 */

import React from 'react';
import { View } from 'react-native';
import { colors, spacing, borderRadius } from '../utils/theme';

export const Card = ({
  children,
  style = {},
  padding = 'md',
  variant = 'default', // default, elevated, outlined
  onPress = null,
}) => {
  const paddingSizes = {
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
  };

  const variants = {
    default: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: '#EEF2F7',
    },
    elevated: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: '#D1FAE5',
      elevation: 5,
      shadowColor: '#0F172A',
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
    },
    outlined: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
  };

  return (
    <View
      style={[
        {
          padding: paddingSizes[padding],
          ...variants[variant],
        },
        onPress && { overflow: 'hidden' },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default Card;
