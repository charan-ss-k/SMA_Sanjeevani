/**
 * Auth Screen - Combined Login/Signup
 * Matches frontend LoginSignup.jsx design with purple gradient and tabs
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../utils/theme';

const { width } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
  const { login, signup, isLoading, error, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [localError, setLocalError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    age: '',
    gender: 'Male'
  });

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setLocalError('');
    if (error) clearError();
  };

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    setLocalError('');
    if (error) clearError();
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      age: '',
      gender: 'Male'
    });
  };

  const validateForm = () => {
    if (!formData.username || !formData.password) {
      setLocalError('Username and password are required');
      return false;
    }
    
    if (!isLogin) {
      if (!formData.email || !formData.fullName) {
        setLocalError('All fields are required');
        return false;
      }
      if (formData.password.length < 6) {
        setLocalError('Password must be at least 6 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setLocalError('Passwords do not match');
        return false;
      }
      if (!formData.email.includes('@')) {
        setLocalError('Please enter a valid email');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    setLocalError('');
    if (error) clearError();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isLogin) {
        await login(formData.username, formData.password);
      } else {
        // Split fullName into firstName and lastName like frontend does
        const trimmedName = formData.fullName.trim();
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

        const ageNumber = formData.age ? parseInt(formData.age, 10) : null;
        
        await signup(formData.username, formData.email, formData.password, firstName, lastName, ageNumber, formData.gender);
      }
      // Navigation happens automatically via auth state
    } catch (err) {
      // Error handled in useAuth hook
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#166534', '#15803d']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Header Section */}
            <LinearGradient
              colors={['#166534', '#15803d']}
              style={styles.header}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.logoCircle}>
                <Image
                  source={require('../../../assets/Sanjeevani Logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>Sanjeevani</Text>
              <Text style={styles.tagline}>Your Personal Health Assistant</Text>
            </LinearGradient>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Tabs */}
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, isLogin && styles.tabActive]}
                  onPress={() => switchTab(true)}
                  disabled={isLoading}
                >
                  <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, !isLogin && styles.tabActive]}
                  onPress={() => switchTab(false)}
                  disabled={isLoading}
                >
                  <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {displayError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>❌ {displayError}</Text>
                </View>
              )}

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter username"
                  placeholderTextColor="#9ca3af"
                  value={formData.username}
                  onChangeText={(text) => handleChange('username', text)}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              {/* Signup only fields */}
              {!isLogin && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="#9ca3af"
                      value={formData.fullName}
                      onChangeText={(text) => handleChange('fullName', text)}
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="your.email@example.com"
                      placeholderTextColor="#9ca3af"
                      value={formData.email}
                      onChangeText={(text) => handleChange('email', text)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>Age (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="25"
                        placeholderTextColor="#9ca3af"
                        value={formData.age}
                        onChangeText={(text) => handleChange('age', text)}
                        keyboardType="numeric"
                        editable={!isLoading}
                      />
                    </View>

                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>Gender</Text>
                      <View style={styles.genderContainer}>
                        {['Male', 'Female', 'Other'].map((g) => (
                          <TouchableOpacity
                            key={g}
                            style={[
                              styles.genderOption,
                              formData.gender === g && styles.genderOptionActive
                            ]}
                            onPress={() => handleChange('gender', g)}
                            disabled={isLoading}
                          >
                            <Text style={[
                              styles.genderText,
                              formData.gender === g && styles.genderTextActive
                            ]}>
                              {g.charAt(0)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </>
              )}

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  value={formData.password}
                  onChangeText={(text) => handleChange('password', text)}
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              {/* Confirm Password (signup only) */}
              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleChange('confirmPassword', text)}
                    secureTextEntry
                    editable={!isLoading}
                  />
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.submitButtonText}>
                      {isLogin ? 'Logging in...' : 'Creating account...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isLogin ? 'Login' : 'Sign Up'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Switch Link */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </Text>
                <TouchableOpacity onPress={() => switchTab(!isLogin)} disabled={isLoading}>
                  <Text style={styles.switchLink}>
                    {isLogin ? 'Sign Up' : 'Login'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Benefits Section */}
            <View style={styles.benefits}>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>🔒</Text>
                <Text style={styles.benefitText}>
                  <Text style={styles.benefitBold}>Secure</Text> - Your data is encrypted
                </Text>
              </View>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>📊</Text>
                <Text style={styles.benefitText}>
                  <Text style={styles.benefitBold}>Track</Text> - Monitor your health journey
                </Text>
              </View>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>🔔</Text>
                <Text style={styles.benefitText}>
                  <Text style={styles.benefitBold}>Reminders</Text> - Never miss medications
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  header: {
    padding: 40,
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 15,
    overflow: 'hidden',
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 5,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '300',
  },
  formSection: {
    padding: 30,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    marginBottom: 25,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginBottom: -2,
  },
  tabActive: {
    borderBottomColor: '#166534',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#166534',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  row: {
    flexDirection: 'row',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  genderOptionActive: {
    borderColor: '#166534',
    backgroundColor: '#f0fdf4',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  genderTextActive: {
    color: '#166534',
  },
  submitButton: {
    backgroundColor: '#15803d',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  switchText: {
    color: '#6b7280',
    fontSize: 14,
  },
  switchLink: {
    color: '#15803d',
    fontSize: 14,
    fontWeight: '600',
  },
  benefits: {
    backgroundColor: '#f9fafb',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  benefitBold: {
    fontWeight: '700',
    color: '#1f2937',
  },
});
