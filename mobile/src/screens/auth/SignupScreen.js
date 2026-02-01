/**
 * Signup Screen
 * New user registration
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
import { validateEmail, validatePassword } from '../../utils/helpers';

export default function SignupScreen({ navigation }) {
  const { signup, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [validationErrors, setValidationErrors] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(false);

  const validateForm = () => {
    const errors = {};

    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      errors.terms = 'You must agree to terms';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async () => {
    clearError();
    if (!validateForm()) return;

    try {
      // Split fullName into firstName and lastName like frontend does
      const trimmedName = fullName.trim();
      const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
      
      let firstName, lastName;
      if (nameParts.length === 0) {
        firstName = '';
        lastName = 'User';
      } else if (nameParts.length === 1) {
        firstName = nameParts[0];
        lastName = nameParts[0];
      } else {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      }

      const ageNumber = age ? parseInt(age, 10) : null;
      
      await signup(username, email, password, firstName, lastName, ageNumber, gender);
      // Navigation happens automatically via auth state
    } catch (err) {
      // Error handled in useAuth hook
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Creating your account..." />;
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
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={[
              typography.h2,
              {
                color: colors.primary,
                marginBottom: spacing.sm,
              },
            ]}
          >
            Create Account
          </Text>
          <Text
            style={[
              typography.body,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Join Sanjeevani and manage your health
          </Text>
        </View>
        {error && (
          <Alert
            type="error"
            title="Signup Failed"
            message={error}
            onDismiss={clearError}
            dismissAfter={5000}
          />
        )}
        <View style={{ marginBottom: spacing.lg }}>
          <Input
            label="Username"
            placeholder="johndoe"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (validationErrors.username) {
                setValidationErrors({ ...validationErrors, username: null });
              }
            }}
            autoCapitalize="none"
            error={validationErrors.username}
            required
            style={{ marginBottom: spacing.md }}
          />

          <Input
            label="Full Name"
            placeholder="John Doe"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (validationErrors.fullName) {
                setValidationErrors({ ...validationErrors, fullName: null });
              }
            }}
            error={validationErrors.fullName}
            required
            style={{ marginBottom: spacing.md }}
          />

          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (validationErrors.email) {
                setValidationErrors({ ...validationErrors, email: null });
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={validationErrors.email}
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
            style={{ marginBottom: spacing.md }}
          />

          <Input
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (validationErrors.confirmPassword) {
                setValidationErrors({
                  ...validationErrors,
                  confirmPassword: null,
                });
              }
            }}
            secureTextEntry
            error={validationErrors.confirmPassword}
            required
            style={{ marginBottom: spacing.md }}
          />

          <Input
            label="Age (Optional)"
            placeholder="25"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            style={{ marginBottom: spacing.md }}
          />

          <View style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.label, { marginBottom: spacing.xs }]}>
              Gender (Optional)
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable
                onPress={() => setGender('Male')}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: gender === 'Male' ? colors.primary : colors.border,
                  backgroundColor: gender === 'Male' ? colors.primaryLight : colors.white,
                }}
              >
                <Text
                  style={[
                    typography.body,
                    {
                      textAlign: 'center',
                      color: gender === 'Male' ? colors.primary : colors.textSecondary,
                    },
                  ]}
                >
                  Male
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setGender('Female')}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: gender === 'Female' ? colors.primary : colors.border,
                  backgroundColor: gender === 'Female' ? colors.primaryLight : colors.white,
                }}
              >
                <Text
                  style={[
                    typography.body,
                    {
                      textAlign: 'center',
                      color: gender === 'Female' ? colors.primary : colors.textSecondary,
                    },
                  ]}
                >
                  Female
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setGender('Other')}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: gender === 'Other' ? colors.primary : colors.border,
                  backgroundColor: gender === 'Other' ? colors.primaryLight : colors.white,
                }}
              >
                <Text
                  style={[
                    typography.body,
                    {
                      textAlign: 'center',
                      color: gender === 'Other' ? colors.primary : colors.textSecondary,
                    },
                  ]}
                >
                  Other
                </Text>
              </Pressable>
            </View>
          </View>
          <Pressable
            onPress={() => setAgreeTerms(!agreeTerms)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.lg,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderWidth: 1,
                borderColor: agreeTerms ? colors.secondary : colors.border,
                borderRadius: 4,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: spacing.sm,
                backgroundColor: agreeTerms ? colors.secondary : 'transparent',
              }}
            >
              {agreeTerms && (
                <Text style={{ color: colors.white, fontWeight: 'bold' }}>
                  ✓
                </Text>
              )}
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              I agree to Terms & Privacy Policy
            </Text>
          </Pressable>

          {validationErrors.terms && (
            <Text
              style={{
                color: colors.error,
                fontSize: 12,
                marginBottom: spacing.md,
              }}
            >
              {validationErrors.terms}
            </Text>
          )}

          <Button
            title="Create Account"
            onPress={handleSignup}
            isLoading={isLoading}
            fullWidth
            size="lg"
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary, marginRight: spacing.sm }}>
            Already have an account?
          </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text
              style={{
                color: colors.secondary,
                fontWeight: '600',
              }}
            >
              Sign In
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
