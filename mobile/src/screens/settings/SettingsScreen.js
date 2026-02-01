/**
 * Settings Screen
 * User preferences and account settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert as RNAlert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Alert } from '../../components';
import { colors, spacing, typography } from '../../utils/theme';

const SettingRow = ({ label, value, onPress, toggleValue, isToggle }) => (
  <Pressable
    onPress={onPress}
    disabled={isToggle}
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}
  >
    <Text
      style={[
        typography.body,
        {
          color: colors.text,
        },
      ]}
    >
      {label}
    </Text>
    {isToggle ? (
      <Switch
        value={toggleValue}
        onValueChange={toggleValue}
        trackColor={{ false: colors.gray[200], true: colors.primary }}
        thumbColor={toggleValue ? colors.white : colors.gray[300]}
      />
    ) : (
      <Text
        style={[
          typography.caption,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {value}
      </Text>
    )}
  </Pressable>
);

const SettingSection = ({ title, children }) => (
  <Card variant="outlined" padding="md" style={{ marginBottom: spacing.lg }}>
    <Text
      style={[
        typography.labelSmall,
        {
          color: colors.textSecondary,
          marginBottom: spacing.md,
          textTransform: 'uppercase',
        },
      ]}
    >
      {title}
    </Text>
    <View>{children}</View>
  </Card>
);

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [healthReminders, setHealthReminders] = useState(true);
  const [autoSaveHistory, setAutoSaveHistory] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    RNAlert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
              navigation.replace('Login');
            } catch (err) {
              setError('Failed to logout');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    RNAlert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => {
            // TODO: Implement account deletion
            setError('Account deletion not yet implemented');
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.lg,
        paddingTop: spacing.lg + 92, // Add padding for AppHeader
      }}
    >
      <Text
        style={[
          typography.h3,
          {
            color: colors.text,
            marginBottom: spacing.lg,
          },
        ]}
      >
        ⚙️ Settings
      </Text>
      {error && (
        <Alert
          type="error"
          message={error}
          onDismiss={() => setError(null)}
          dismissAfter={5000}
        />
      )}
      <SettingSection title="Profile">
        <Pressable
          style={{
            paddingVertical: spacing.md,
          }}
        >
          <View
            style={{
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={[
                typography.labelSmall,
                {
                  color: colors.textSecondary,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              Full Name
            </Text>
            <Text
              style={[
                typography.body,
                {
                  color: colors.text,
                },
              ]}
            >
              {String(user?.fullName || user?.full_name || user?.username || 'N/A')}
            </Text>
          </View>

          <View
            style={{
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={[
                typography.labelSmall,
                {
                  color: colors.textSecondary,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              Email
            </Text>
            <Text
              style={[
                typography.body,
                {
                  color: colors.text,
                },
              ]}
            >
              {String(user?.email || 'N/A')}
            </Text>
          </View>

          <Button
            title="Edit Profile"
            onPress={() => {
              // TODO: Navigate to edit profile screen
              console.log('Edit profile');
            }}
            variant="secondary"
            fullWidth
          />
        </Pressable>
      </SettingSection>
      <SettingSection title="Notifications">
        <SettingRow
          label="Enable All Notifications"
          isToggle={true}
          toggleValue={notifications}
          onPress={() => setNotifications(!notifications)}
        />
        <SettingRow
          label="Health Reminders"
          isToggle={true}
          toggleValue={healthReminders}
          onPress={() => setHealthReminders(!healthReminders)}
          disabled={!notifications}
        />
        <SettingRow
          label="Appointment Reminders"
          isToggle={true}
          toggleValue={true}
          onPress={() => {}}
          disabled={!notifications}
        />
      </SettingSection>
      <SettingSection title="Privacy & Location">
        <SettingRow
          label="Location Services"
          isToggle={true}
          toggleValue={locationServices}
          onPress={() => setLocationServices(!locationServices)}
        />
        <SettingRow
          label="Auto-save Chat History"
          isToggle={true}
          toggleValue={autoSaveHistory}
          onPress={() => setAutoSaveHistory(!autoSaveHistory)}
        />
      </SettingSection>
      <SettingSection title="About">
        <SettingRow label="App Version" value="1.0.0" />
        <Pressable
          style={{
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text
            style={[
              typography.body,
              {
                color: colors.secondary,
              },
            ]}
          >
            📚 Privacy Policy
          </Text>
        </Pressable>
        <Pressable
          style={{
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
          }}
        >
          <Text
            style={[
              typography.body,
              {
                color: colors.secondary,
              },
            ]}
          >
            📄 Terms & Conditions
          </Text>
        </Pressable>
      </SettingSection>
      <SettingSection title="Danger Zone">
        <View style={{ gap: spacing.sm }}>
          <Button
            title="🚪 Logout"
            onPress={handleLogout}
            variant="danger"
            fullWidth
          />
          <Button
            title="🗑️ Delete Account"
            onPress={handleDeleteAccount}
            variant="danger"
            fullWidth
          />
        </View>
      </SettingSection>
      <SettingSection title="Support">
        <View style={{ gap: spacing.sm }}>
          <Button
            title="📧 Contact Support"
            onPress={() => {
              // TODO: Open email or support form
              console.log('Contact support');
            }}
            variant="secondary"
            fullWidth
          />
          <Button
            title="🐛 Report a Bug"
            onPress={() => {
              // TODO: Open bug report form
              console.log('Report bug');
            }}
            variant="secondary"
            fullWidth
          />
        </View>
      </SettingSection>
      <View style={{ height: spacing.lg }} />
    </ScrollView>
  );
}
