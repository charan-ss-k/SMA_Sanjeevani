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
    default: { bg: '#EEF2F7', text: '#334155' },
    success: { bg: '#DCFCE7', text: '#14532D' },
    error: { bg: '#FEE2E2', text: '#7F1D1D' },
    warning: { bg: '#FEF3C7', text: '#78350F' },
    info: { bg: '#E0F2FE', text: '#0C4A6E' },
    primary: { bg: '#DCFCE7', text: '#166534' },
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
          borderWidth: 1,
          borderColor: 'rgba(15, 23, 42, 0.08)',
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
