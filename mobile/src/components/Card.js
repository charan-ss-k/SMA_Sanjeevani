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
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      borderWidth: 0,
    },
    elevated: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      elevation: 3,
      shadowColor: colors.black,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 3,
    },
    outlined: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
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
