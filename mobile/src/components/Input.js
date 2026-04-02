/**
 * Input Component
 * TextInput wrapper with validation and styling
 */

import React, { useState } from 'react';
import { View, TextInput, Text } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../utils/theme';

export const Input = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  editable = true,
  error = null,
  label = null,
  required = false,
  style = {},
  inputStyle = {},
  multiline = false,
  numberOfLines = 1,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={style}>
      {label && (
        <Text
          style={{
            fontSize: typography.bodySmall.fontSize,
            fontWeight: '600',
            color: colors.text,
            marginBottom: spacing.sm,
          }}
        >
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        editable={editable}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline={multiline}
        numberOfLines={numberOfLines}
        placeholderTextColor={colors.textLight}
        style={[
          {
            borderWidth: 1,
            borderColor: error ? colors.error : isFocused ? colors.primary : colors.borderStrong,
            borderRadius: borderRadius.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            fontSize: typography.body.fontSize,
            color: colors.text,
            backgroundColor: '#FFFFFF',
            shadowColor: isFocused ? colors.primary : 'transparent',
            shadowOpacity: isFocused ? 0.15 : 0,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 8,
            elevation: isFocused ? 2 : 0,
          },
          inputStyle,
        ]}
      />
      {error && (
        <Text
          style={{
            color: colors.error,
            fontSize: typography.caption.fontSize,
            marginTop: spacing.sm,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input;
