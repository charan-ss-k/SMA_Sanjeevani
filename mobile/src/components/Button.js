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
      bg: colors.primary,
      text: colors.white,
      border: 'transparent',
    },
    secondary: {
      bg: '#E6F8F5',
      text: colors.primaryDark,
      border: '#BFEDE6',
    },
    outline: {
      bg: 'transparent',
      text: colors.primary,
      border: colors.primary,
    },
    danger: {
      bg: colors.error,
      text: colors.white,
      border: 'transparent',
    },
  };

  const sizes = {
    sm: { paddingY: 10, paddingX: 14, fontSize: 12, radius: 10 },
    md: { paddingY: 13, paddingX: 18, fontSize: 15, radius: 12 },
    lg: { paddingY: 16, paddingX: 22, fontSize: 16, radius: 14 },
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
        borderWidth: variant === 'outline' || variant === 'secondary' ? 1 : 0,
        borderRadius: sizeStyle.radius,
        paddingVertical: sizeStyle.paddingY,
        paddingHorizontal: sizeStyle.paddingX,
        width: fullWidth ? '100%' : 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.55 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        shadowColor: variant === 'primary' ? colors.primaryDark : 'transparent',
        shadowOpacity: variant === 'primary' ? 0.18 : 0,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 10,
        elevation: variant === 'primary' ? 3 : 0,
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
            fontWeight: '700',
            letterSpacing: 0.2,
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
