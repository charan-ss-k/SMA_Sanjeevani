/**
 * Badge Component
 * Status indicator
 */

import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing, borderRadius } from '../utils/theme';

export const Badge = ({
  label,
  children,
  variant = 'default', // default, success, error, warning, info, primary
  size = 'md', // sm, md, lg
  style = {},
}) => {
  const variants = {
    default: { bg: colors.gray[200], text: colors.text },
    success: { bg: colors.success, text: colors.white },
    error: { bg: colors.error, text: colors.white },
    warning: { bg: colors.warning, text: colors.white },
    info: { bg: colors.info, text: colors.white },
    primary: { bg: colors.secondary, text: colors.white },
  };

  const sizes = {
    sm: { padding: spacing.xs, fontSize: 10 },
    md: { padding: spacing.sm, fontSize: 12 },
    lg: { padding: spacing.md, fontSize: 14 },
  };

  const variantStyle = variants[variant] || variants.default;
  const sizeStyle = sizes[size];
  
  const content = children || label;

  return (
    <View
      style={[
        {
          backgroundColor: variantStyle.bg,
          borderRadius: borderRadius.full,
          paddingHorizontal: sizeStyle.padding * 2,
          paddingVertical: sizeStyle.padding,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: variantStyle.text,
          fontSize: sizeStyle.fontSize,
          fontWeight: '600',
        }}
      >
        {content}
      </Text>
    </View>
  );
};

export default Badge;
