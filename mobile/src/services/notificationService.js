/**
 * Push Notifications Service
 * Expo Push Notifications for reminders and alerts
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { apiClient } from '../api/client';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  /**
   * Get push token for device
   */
  async getPushToken() {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push notification permission');
        return null;
      }

      // Get Expo push token
      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.projectId,
        })
      ).data;

      return token;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Register device token with backend
   */
  async registerDeviceToken(token) {
    try {
      await apiClient.post('/api/notifications/register', { token });
    } catch (error) {
      console.error('Failed to register device token:', error);
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          badge: 1,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }

  /**
   * Schedule notification for later
   */
  async scheduleNotification(title, body, triggerTime, data = {}) {
    try {
      const trigger = new Date(triggerTime).getTime() - new Date().getTime();
      
      if (trigger < 0) {
        throw new Error('Trigger time must be in the future');
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          badge: 1,
        },
        trigger: { seconds: Math.ceil(trigger / 1000) },
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Schedule medicine reminder
   */
  async scheduleMedicineReminder(medicine, time) {
    try {
      const reminderTime = new Date(time);
      
      await this.scheduleNotification(
        '💊 Medicine Reminder',
        `Time to take ${medicine.name} - ${medicine.dosage}`,
        reminderTime,
        {
          type: 'medicine_reminder',
          medicineId: medicine.id,
          medicineName: medicine.name,
        }
      );
    } catch (error) {
      console.error('Failed to schedule medicine reminder:', error);
      throw error;
    }
  }

  /**
   * Schedule appointment reminder
   */
  async scheduleAppointmentReminder(appointment, minutesBefore = 30) {
    try {
      const appointmentTime = new Date(appointment.dateTime);
      const reminderTime = new Date(
        appointmentTime.getTime() - minutesBefore * 60000
      );

      await this.scheduleNotification(
        '📅 Appointment Reminder',
        `Appointment with Dr. ${appointment.doctorName} in ${minutesBefore} minutes`,
        reminderTime,
        {
          type: 'appointment_reminder',
          appointmentId: appointment.id,
          doctorName: appointment.doctorName,
        }
      );
    } catch (error) {
      console.error('Failed to schedule appointment reminder:', error);
      throw error;
    }
  }

  /**
   * Cancel notification
   */
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications;
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Listen for notification responses
   */
  addNotificationResponseListener(callback) {
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        callback(response.notification.request.content.data);
      });

    return subscription;
  }

  /**
   * Listen for notification while app is in foreground
   */
  addNotificationReceivedListener(callback) {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        callback(notification.request.content);
      }
    );

    return subscription;
  }
}

export default new NotificationService();
