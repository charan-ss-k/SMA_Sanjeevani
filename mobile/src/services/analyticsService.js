/**
 * Analytics Service
 * Firebase Analytics integration for tracking user behavior
 */

import * as Analytics from 'expo-firebase-analytics';

class AnalyticsService {
  /**
   * Log custom event
   */
  async logEvent(eventName, properties = {}) {
    try {
      await Analytics.logEvent(eventName, properties);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  /**
   * Track screen view
   */
  async logScreenView(screenName, screenClass) {
    try {
      await this.logEvent('screen_view', {
        firebase_screen: screenName,
        firebase_screen_class: screenClass,
      });
    } catch (error) {
      console.error('Screen view tracking error:', error);
    }
  }

  /**
   * Track user login
   */
  async logLogin(method) {
    try {
      await this.logEvent('login', { method });
    } catch (error) {
      console.error('Login tracking error:', error);
    }
  }

  /**
   * Track user signup
   */
  async logSignup(method) {
    try {
      await this.logEvent('sign_up', { method });
    } catch (error) {
      console.error('Signup tracking error:', error);
    }
  }

  /**
   * Track appointment booking
   */
  async logAppointmentBooked(appointmentData) {
    try {
      await this.logEvent('appointment_booked', {
        doctor_id: appointmentData.doctorId,
        consultation_type: appointmentData.type,
        amount: appointmentData.amount,
        currency: 'INR',
      });
    } catch (error) {
      console.error('Appointment booking tracking error:', error);
    }
  }

  /**
   * Track medicine identification
   */
  async logMedicineIdentified(medicineData) {
    try {
      await this.logEvent('medicine_identified', {
        medicine_name: medicineData.name,
        confidence: medicineData.confidence,
      });
    } catch (error) {
      console.error('Medicine identification tracking error:', error);
    }
  }

  /**
   * Track chat message
   */
  async logChatMessage() {
    try {
      await this.logEvent('chat_message_sent', {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Chat message tracking error:', error);
    }
  }

  /**
   * Track payment completion
   */
  async logPaymentCompleted(paymentData) {
    try {
      await this.logEvent('purchase', {
        value: paymentData.amount,
        currency: 'INR',
        transaction_id: paymentData.paymentId,
        payment_method: paymentData.method,
      });
    } catch (error) {
      console.error('Payment tracking error:', error);
    }
  }

  /**
   * Set user properties
   */
  async setUserProperty(name, value) {
    try {
      await Analytics.setUserProperty(name, value);
    } catch (error) {
      console.error('User property setting error:', error);
    }
  }

  /**
   * Set user ID
   */
  async setUserId(userId) {
    try {
      await this.setUserProperty('user_id', userId);
    } catch (error) {
      console.error('User ID setting error:', error);
    }
  }
}

export default new AnalyticsService();
