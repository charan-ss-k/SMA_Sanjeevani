/**
 * Button Component
 * Pressable wrapper with consistent styling
 */

import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../utils/theme';

export const Button = ({
  onPress,
  title,
  variant = 'primary', // primary, secondary, outline, danger
  size = 'md', // sm, md, lg
  isLoading = false,
  disabled = false,
  icon = null,
  style = {},
  textStyle = {},
  fullWidth = false,
}) => {
  const variants = {
    primary: {
      bg: colors.secondary,
      text: colors.white,
      border: 'transparent',
    },
    secondary: {
      bg: colors.primaryLight,
      text: colors.white,
      border: 'transparent',
    },
    outline: {
      bg: 'transparent',
      text: colors.secondary,
      border: colors.secondary,
    },
    danger: {
      bg: colors.error,
      text: colors.white,
      border: 'transparent',
    },
  };

  const sizes = {
    sm: { padding: spacing.sm, fontSize: 12 },
    md: { padding: spacing.md, fontSize: 14 },
    lg: { padding: spacing.lg, fontSize: 16 },
  };

  const variantStyle = variants[variant];
  const sizeStyle = sizes[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={({ pressed }) => ({
        backgroundColor: variantStyle.bg,
        borderColor: variantStyle.border,
        borderWidth: variant === 'outline' ? 1 : 0,
        borderRadius: borderRadius.md,
        paddingVertical: sizeStyle.padding,
        paddingHorizontal: sizeStyle.padding * 1.5,
        width: fullWidth ? '100%' : 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed || disabled ? 0.7 : 1,
        ...style,
      })}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variantStyle.text}
          style={{ marginRight: spacing.sm }}
        />
      ) : icon ? (
        <View style={{ marginRight: spacing.sm }}>{icon}</View>
      ) : null}
      <Text
        style={[
          {
            color: variantStyle.text,
            fontSize: sizeStyle.fontSize,
            fontWeight: '600',
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

export default Button;
