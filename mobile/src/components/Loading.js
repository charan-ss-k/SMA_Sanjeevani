/**
 * Loading Component
 * Activity indicator with message
 */

import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { colors, spacing } from '../utils/theme';

export const Loading = ({
  message = 'Loading...',
  size = 'large',
  color = colors.secondary,
  fullScreen = false,
}) => {
  const container = {
    flex: fullScreen ? 1 : undefined,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: fullScreen ? colors.background : 'transparent',
  };

  return (
    <View style={container}>
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          paddingVertical: 18,
          paddingHorizontal: 22,
          borderWidth: 1,
          borderColor: '#D1FAE5',
          alignItems: 'center',
          minWidth: 150,
        }}
      >
        <ActivityIndicator size={size} color={color} />
      {message && (
        <Text
          style={{
            marginTop: spacing.md,
            color: colors.textSecondary,
            fontSize: 14,
            fontWeight: '600',
          }}
        >
          {message}
        </Text>
      )}
      </View>
    </View>
  );
};

export default Loading;
