/**
 * Login Screen
 * User authentication with email and password
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Input, Button, Alert, Loading } from '../../components';
import { colors, spacing, typography } from '../../utils/theme';
import { validateEmail } from '../../utils/helpers';

export default function LoginScreen({ navigation }) {
  const { login, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!username) {
      errors.username = 'Username or email is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validateForm()) return;

    try {
      await login(username, password);
      // Navigation happens automatically via auth state
    } catch (err) {
      // Error handled in useAuth hook
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Signing you in..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: spacing.lg,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: spacing.xl }}>
          <Text
            style={[
              typography.h2,
              {
                color: colors.primary,
                marginBottom: spacing.sm,
                textAlign: 'center',
              },
            ]}
          >
            Sanjeevani
          </Text>
          <Text
            style={[
              typography.body,
              {
                color: colors.textSecondary,
                textAlign: 'center',
              },
            ]}
          >
            Your Personal Health Assistant
          </Text>
        </View>
        {error && (
          <Alert
            type="error"
            title="Login Failed"
            message={error}
            onDismiss={clearError}
            dismissAfter={5000}
          />
        )}
        <View style={{ marginBottom: spacing.lg }}>
          <Input
            label="Username or Email"
            placeholder="username or email@example.com"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (validationErrors.username) {
                setValidationErrors({ ...validationErrors, username: null });
              }
            }}
            keyboardType="default"
            autoCapitalize="none"
            error={validationErrors.username}
            required
            style={{ marginBottom: spacing.md }}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (validationErrors.password) {
                setValidationErrors({ ...validationErrors, password: null });
              }
            }}
            secureTextEntry
            error={validationErrors.password}
            required
            style={{ marginBottom: spacing.lg }}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            isLoading={isLoading}
            fullWidth
            size="lg"
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: spacing.lg,
          }}
        >
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: colors.border,
            }}
          />
          <Text
            style={{
              marginHorizontal: spacing.md,
              color: colors.textSecondary,
            }}
          >
            Don't have an account?
          </Text>
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: colors.border,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text
            style={{
              color: colors.textSecondary,
              marginRight: spacing.sm,
            }}
          >
            New to Sanjeevani?
          </Text>
          <Pressable onPress={() => navigation.navigate('Signup')}>
            <Text
              style={{
                color: colors.secondary,
                fontWeight: '600',
              }}
            >
              Create Account
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
