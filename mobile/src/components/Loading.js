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
  };

  return (
    <View style={container}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text
          style={{
            marginTop: spacing.md,
            color: colors.textSecondary,
            fontSize: 14,
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

export default Loading;
