/**
 * AppHeader Component
 * Floating header that matches frontend Navbar design
 * Shows on every screen with logo, title, and user menu
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Modal,
  SafeAreaView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing } from '../utils/theme';

const { width } = Dimensions.get('window');

const AppHeader = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userInitials, setUserInitials] = useState('');

  useEffect(() => {
    // Get user initials for avatar
    if (user?.username || user?.full_name) {
      const name = user.full_name || user.username;
      const initials = name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
      setUserInitials(initials);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      // Clear any stored data
      await AsyncStorage.multiRemove(['token', 'user', 'chatHistory']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const UserAvatar = () => (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>
        {String(userInitials || '👤')}
      </Text>
    </View>
  );

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.topStripe} />
        
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/Sanjeevani Logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Sanjeevani</Text>
          </View>

          <View style={styles.userSection}>
            {isAuthenticated ? (
              <Pressable 
                onPress={() => setShowUserMenu(true)}
                style={styles.userButton}
              >
                <UserAvatar />
                <MaterialIcons 
                  name="keyboard-arrow-down" 
                  size={16} 
                  color={colors.white} 
                />
              </Pressable>
            ) : (
              <Pressable style={styles.loginButton}>
                <Text style={styles.loginText}>Login</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>

      <Modal
        visible={showUserMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUserMenu(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowUserMenu(false)}
        >
          <View style={styles.dropdown}>
            <View style={styles.userInfo}>
              <UserAvatar />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {String(user?.full_name || user?.username || 'User')}
                </Text>
                {user?.email && (
                  <Text style={styles.userEmail}>{String(user.email || '')}</Text>
                )}
              </View>
            </View>
            
            <Pressable 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={20} color={colors.error} />
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'transparent',
  },
  topStripe: {
    height: 12,
    backgroundColor: '#166534', // Dark green (green-800)
  },
  header: {
    height: 80,
    backgroundColor: '#fef3c7', // Amber-100
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#166534', // Green-800
    letterSpacing: 0.5,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803d', // Green-700
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
  },
  loginButton: {
    backgroundColor: '#15803d', // Green-700
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  loginText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16a34a', // Green-600
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 92, // Account for header height
    paddingRight: spacing.lg,
  },
  dropdown: {
    backgroundColor: colors.white,
    borderRadius: 12,
    width: 220,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userDetails: {
    marginLeft: spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
});

export default AppHeader;