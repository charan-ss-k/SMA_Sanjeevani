/**
 * Home Screen
 * Professional Dashboard matching frontend UI with appointments, reminders, and quick access
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, typography, borderRadius } from '../../utils/theme';

const { width } = Dimensions.get('window');
const API_BASE = 'http://192.168.29.195:8000';

// Feature Slides Data (matching frontend)
const slides = [
  { title: 'Scan Medicine', description: 'Identify any medicine instantly', icon: '💊', bg: '#f0fdf4' },
  { title: 'Set Reminders', description: 'Never miss your medications', icon: '⏰', bg: '#fef3c7' },
  { title: 'Upload Prescriptions', description: 'Keep all your prescriptions organized', icon: '📋', bg: '#e0e7ff' },
  { title: 'Stay Updated', description: 'Get health tips and updates', icon: '📱', bg: '#fce7f3' },
];

// Feature Stat Card Component
const StatCard = ({ icon, title, description, bgColor = '#eff6ff' }) => (
  <View style={[styles.statCard, { backgroundColor: bgColor }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statDescription}>{description}</Text>
  </View>
);

// Appointment Card Component
const AppointmentCard = ({ appointment, onCancel, onReschedule }) => {
  const aptDate = new Date(appointment.appointment_date);
  const daysUntil = Math.ceil((aptDate - new Date()) / (1000 * 60 * 60 * 24));
  
  // Handle different field names from API vs local storage
  const hospitalName = appointment.hospital || appointment.hospital_name || appointment.doctor_hospital || 'Unknown Hospital';
  const specialization = appointment.specialization || appointment.doctor_specialization || 'Specialist';
  
  const getStatusBadge = () => {
    if (daysUntil <= 1) return { text: 'URGENT', color: '#dc2626', bg: '#fef2f2', icon: '🔴' };
    if (daysUntil <= 3) return { text: 'SOON', color: '#f59e0b', bg: '#fef3c7', icon: '🟡' };
    return { text: 'UPCOMING', color: '#16a34a', bg: '#f0fdf4', icon: '🟢' };
  };
  
  const status = getStatusBadge();
  
  return (
    <View style={styles.appointmentCard}>
      <View style={[styles.appointmentStatusBadge, { backgroundColor: status.bg }]}>
        <Text style={styles.appointmentStatusIcon}>{status.icon}</Text>
        <Text style={[styles.appointmentStatusText, { color: status.color }]}>{status.text}</Text>
      </View>
      
      <View style={styles.appointmentContent}>
        <View style={styles.appointmentHeader}>
          <Text style={styles.appointmentDoctorIcon}>🩺</Text>
          <View style={styles.appointmentDoctorInfo}>
            <Text style={styles.appointmentDoctorName}>{appointment.doctor_name}</Text>
            <Text style={styles.appointmentSpecialization}>{specialization}</Text>
          </View>
        </View>
        
        <View style={styles.appointmentDetails}>
          <View style={styles.appointmentDetailRow}>
            <Text style={styles.appointmentDetailIcon}>🏥</Text>
            <Text style={styles.appointmentDetailText}>{hospitalName}</Text>
          </View>
          <View style={styles.appointmentDetailRow}>
            <Text style={styles.appointmentDetailIcon}>📅</Text>
            <Text style={styles.appointmentDetailText}>{aptDate.toLocaleDateString()}</Text>
          </View>
          <View style={styles.appointmentDetailRow}>
            <Text style={styles.appointmentDetailIcon}>⏰</Text>
            <Text style={styles.appointmentDetailText}>{appointment.appointment_time}</Text>
          </View>
        </View>
        
        <View style={styles.appointmentActions}>
          <TouchableOpacity 
            style={[styles.appointmentBtn, styles.rescheduleBtn]}
            onPress={() => onReschedule(appointment)}
          >
            <Text style={styles.rescheduleBtnText}>Reschedule</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.appointmentBtn, styles.cancelBtn]}
            onPress={() => onCancel(appointment)}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Reminder Card Component
const ReminderCard = ({ reminder }) => {
  const statusStyles = {
    urgent: { borderColor: '#dc2626', bg: '#fef2f2', badgeColor: '#dc2626' },
    upcoming: { borderColor: '#f59e0b', bg: '#fef3c7', badgeColor: '#f59e0b' },
    normal: { borderColor: '#16a34a', bg: '#f0fdf4', badgeColor: '#16a34a' },
  };
  
  const style = statusStyles[reminder.status] || statusStyles.normal;
  
  return (
    <View style={[styles.reminderCard, { borderLeftColor: style.borderColor, backgroundColor: style.bg }]}>
      <View style={styles.reminderIcon}>
        <Text style={styles.reminderIconText}>
          {reminder.status === 'urgent' ? '🔴' : reminder.status === 'upcoming' ? '🟡' : '🟢'}
        </Text>
      </View>
      <View style={styles.reminderContent}>
        <Text style={styles.reminderTitle}>{reminder.title}</Text>
        <Text style={styles.reminderDescription}>{reminder.description}</Text>
        <Text style={styles.reminderDate}>📅 {new Date(reminder.date).toLocaleDateString()}</Text>
      </View>
      <View style={[styles.reminderBadge, { backgroundColor: '#fff' }]}>
        <Text style={[styles.reminderBadgeText, { color: style.badgeColor }]}>
          {reminder.status === 'urgent' ? 'URGENT' : reminder.status === 'upcoming' ? 'SOON' : 'NORMAL'}
        </Text>
      </View>
    </View>
  );
};

// Step Card Component for How to Use section
const StepCard = ({ number, title, description, bgColor }) => (
  <View style={[styles.stepCard, { backgroundColor: bgColor }]}>
    <Text style={styles.stepNumber}>{number}</Text>
    <Text style={styles.stepTitle}>{title}</Text>
    <Text style={styles.stepDescription}>{description}</Text>
  </View>
);

export default function HomeScreen({ navigation }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { chatHistory, fetchChatHistory } = useChat();
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  // Load appointments from API (matching ConsultDoctorScreen logic)
  const loadAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    try {
      // Use SecureStore for token (same as apiClient.js)
      const token = await SecureStore.getItemAsync('authToken');
      
      if (!token) {
        console.log('⚠️ HomeScreen: No auth token found in SecureStore');
        setLoadingAppointments(false);
        return;
      }
      
      console.log('🔄 HomeScreen: Fetching appointments from API with token...');
      
      // Use the same endpoint as ConsultDoctorScreen: /api/appointments/upcoming-appointments
      const response = await fetch(`${API_BASE}/api/appointments/upcoming-appointments`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 HomeScreen: API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 HomeScreen: API response data:', JSON.stringify(data, null, 2));
        
        // Handle both response formats: { appointments: [...] } or { success: true, appointments: [...] }
        const appointmentsList = data.appointments || [];
        console.log(`📅 HomeScreen: Loaded ${appointmentsList.length} upcoming appointments from API`);
        
        // Filter to ensure only future appointments
        const filteredAppointments = appointmentsList.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate >= new Date();
        }).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
        
        console.log(`📅 HomeScreen: ${filteredAppointments.length} appointments after filtering`);
        setAppointments(filteredAppointments);
        generateRemindersFromAppointments(filteredAppointments);
        
        // Cache the appointments using same key as ConsultDoctorScreen
        await AsyncStorage.setItem('upcomingAppointments', JSON.stringify(filteredAppointments));
      } else {
        // Fallback to AsyncStorage - use same key as ConsultDoctorScreen
        console.log('📦 HomeScreen: API failed with status', response.status, '- loading from cache');
        await loadAppointmentsFromCache();
      }
    } catch (error) {
      console.error('❌ HomeScreen: Error loading appointments:', error);
      // Fallback to AsyncStorage
      await loadAppointmentsFromCache();
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  // Load appointments from AsyncStorage cache (same keys as ConsultDoctorScreen)
  const loadAppointmentsFromCache = async () => {
    try {
      console.log('📦 HomeScreen: Attempting to load from cache...');
      const savedUpcoming = await AsyncStorage.getItem('upcomingAppointments');
      console.log('📦 HomeScreen: Cache data found:', savedUpcoming ? 'Yes' : 'No');
      
      if (savedUpcoming) {
        const upcomingList = JSON.parse(savedUpcoming);
        console.log(`📦 HomeScreen: Parsed ${upcomingList.length} appointments from cache`);
        
        // Filter to ensure only future appointments
        const filteredUpcoming = upcomingList.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate >= new Date();
        }).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
        
        console.log(`📦 HomeScreen: ${filteredUpcoming.length} appointments after filtering (future only)`);
        setAppointments(filteredUpcoming);
        generateRemindersFromAppointments(filteredUpcoming);
      } else {
        console.log('📦 HomeScreen: No cached appointments found');
        setAppointments([]);
        setReminders([]);
      }
    } catch (e) {
      console.error('❌ HomeScreen: Error loading from AsyncStorage:', e);
      setAppointments([]);
      setReminders([]);
    }
  };

  const generateRemindersFromAppointments = (appointmentsList) => {
    const appointmentReminders = appointmentsList.map(apt => {
      const aptDate = new Date(apt.appointment_date);
      const daysUntil = Math.ceil((aptDate - new Date()) / (1000 * 60 * 60 * 24));
      return {
        id: apt.id || apt.doctor_id,
        type: 'appointment',
        title: `Appointment with ${apt.doctor_name}`,
        description: `Your appointment is in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
        date: apt.appointment_date,
        status: daysUntil <= 1 ? 'urgent' : daysUntil <= 3 ? 'upcoming' : 'normal'
      };
    });
    setReminders(appointmentReminders);
  };

  useEffect(() => {
    loadData();
    // Auto-rotate slides
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Load appointments immediately on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🏠 HomeScreen mounted with auth - loading appointments immediately');
      loadAppointments();
    }
  }, [isAuthenticated]);

  // Reload appointments every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log('🏠 HomeScreen focused - loading appointments');
        loadAppointments();
      }
    }, [isAuthenticated, loadAppointments])
  );

  const loadData = async () => {
    try {
      await fetchChatHistory().catch(() => {});
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // Cancel appointment (matching frontend logic)
  const cancelAppointment = async (appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel the appointment with Dr. ${appointment.doctor_name} on ${new Date(appointment.appointment_date).toLocaleDateString()}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('authToken');
              
              console.log('🗑️ Cancelling appointment:', appointment.id);
              
              const response = await fetch(`${API_BASE}/api/appointments/appointment/${appointment.id}`, {
                method: 'DELETE',
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              const data = await response.json();
              console.log('📤 Cancel response:', response.status, data);
              
              if (response.ok || data.success) {
                // Remove from state
                const updated = appointments.filter(apt => apt.id !== appointment.id);
                setAppointments(updated);
                generateRemindersFromAppointments(updated);
                
                // Also remove from AsyncStorage (same key as ConsultDoctorScreen)
                const savedUpcoming = await AsyncStorage.getItem('upcomingAppointments');
                if (savedUpcoming) {
                  const upcomingList = JSON.parse(savedUpcoming);
                  const filtered = upcomingList.filter(apt => apt.id !== appointment.id);
                  await AsyncStorage.setItem('upcomingAppointments', JSON.stringify(filtered));
                }
                
                Alert.alert('Success', `Appointment with ${appointment.doctor_name} has been cancelled`);
                console.log('✅ Appointment cancelled successfully');
              } else {
                throw new Error(data.detail || data.message || 'Failed to cancel appointment');
              }
            } catch (error) {
              console.error('❌ Error cancelling appointment:', error);
              Alert.alert('Error', `Failed to cancel appointment: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  // Reschedule appointment
  const rescheduleAppointment = (appointment) => {
    // Navigate to consultation screen with pre-filled data
    navigation.navigate('ConsultTab', { 
      screen: 'ConsultDoctor',
      params: { rescheduleAppointment: appointment }
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (isAuthenticated) {
      await loadAppointments();
    }
    setRefreshing(false);
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const recentChats = chatHistory?.slice(-3) || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Carousel Section - Show when NOT authenticated */}
      {!isAuthenticated && (
        <View style={styles.carouselContainer}>
          <View style={[styles.carouselSlide, { backgroundColor: slides[activeSlide].bg }]}>
            <Text style={styles.carouselIcon}>{slides[activeSlide].icon}</Text>
            <Text style={styles.carouselTitle}>{slides[activeSlide].title}</Text>
            <Text style={styles.carouselDescription}>{slides[activeSlide].description}</Text>
            <Text style={styles.carouselTagline}>Bringing healthcare to your fingertips</Text>
            <View style={styles.carouselButtons}>
              <TouchableOpacity 
                style={styles.carouselPrimaryBtn}
                onPress={() => navigation.navigate('ChatTab')}
              >
                <Text style={styles.carouselPrimaryBtnText}>Ask Health Assistant</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.carouselDots}>
            {slides.map((_, i) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => setActiveSlide(i)}
                style={[styles.carouselDot, i === activeSlide && styles.carouselDotActive]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Medicine Recommendation CTA - Show when NOT authenticated */}
      {!isAuthenticated && (
        <View style={styles.ctaCard}>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>💊 Check Your Symptoms</Text>
            <Text style={styles.ctaDescription}>
              Get instant AI-powered medicine recommendations based on your symptoms
            </Text>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => navigation.navigate('MedicineTab', { screen: 'MedicineHome' })}
            >
              <Text style={styles.ctaButtonText}>Open Medicine Recommendation</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Welcome Section - Show when authenticated */}
      {isAuthenticated && (
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeTitle}>
                Welcome back, {user?.fullName?.split(' ')[0] || user?.username || 'User'}!
              </Text>
              <Text style={styles.welcomeSubtitle}>Your health companion dashboard is ready</Text>
            </View>
            <View style={styles.welcomeIconContainer}>
              <Text style={styles.welcomeIcon}>🏥</Text>
            </View>
          </View>
        </View>
      )}

      {/* Appointments Section - Show when authenticated */}
      {isAuthenticated && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Your Appointments ({appointments.length})</Text>
          </View>
          
          {loadingAppointments ? (
            <View style={styles.loadingSection}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingSectionText}>Loading appointments...</Text>
            </View>
          ) : appointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📅</Text>
              <Text style={styles.emptyStateText}>No upcoming appointments</Text>
              <Text style={styles.emptyStateSubtext}>Book one to get started!</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.appointmentsScroll}>
              {appointments.map((apt, idx) => (
                <AppointmentCard 
                  key={apt.id || idx} 
                  appointment={apt}
                  onCancel={cancelAppointment}
                  onReschedule={rescheduleAppointment}
                />
              ))}
            </ScrollView>
          )}
          
          <TouchableOpacity 
            style={styles.bookAppointmentBtn}
            onPress={() => navigation.navigate('ConsultTab', { screen: 'ConsultDoctor' })}
          >
            <Text style={styles.bookAppointmentBtnText}>📅 Book New Appointment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Stats - Show when NOT authenticated */}
      {!isAuthenticated && (
        <View style={styles.statsContainer}>
          <StatCard 
            icon="👨‍⚕️" 
            title="Expert Doctors" 
            description="Consult with qualified healthcare professionals"
            bgColor="#eff6ff"
          />
          <StatCard 
            icon="📅" 
            title="Easy Booking" 
            description="Schedule appointments in just a few taps"
            bgColor="#f0fdf4"
          />
          <StatCard 
            icon="📊" 
            title="Health Analytics" 
            description="Track your health journey with insights"
            bgColor="#faf5ff"
          />
        </View>
      )}

      {/* About Sanjeevani Section - Show when NOT authenticated */}
      {!isAuthenticated && (
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>🌟 About Sanjeevani</Text>
          <Text style={styles.aboutSubtitle}>What We Do</Text>
          <Text style={styles.aboutDescription}>
            Sanjeevani is your comprehensive healthcare companion that brings medicine identification, 
            prescription management, doctor consultations, and health tracking all in one place. 
            We're dedicated to making healthcare accessible and convenient for everyone.
          </Text>
        </View>
      )}

      {/* How to Use Section - Show when NOT authenticated */}
      {!isAuthenticated && (
        <View style={styles.howToUseSection}>
          <Text style={styles.howToUseTitle}>🚀 How to Use</Text>
          <Text style={styles.howToUseSubtitle}>Get started in 4 easy steps</Text>
          
          <View style={styles.stepsGrid}>
            <StepCard 
              number="1️⃣" 
              title="Create Account" 
              description="Sign up to access all features"
              bgColor="#f0fdf4"
            />
            <StepCard 
              number="2️⃣" 
              title="Scan Medicine" 
              description="Identify any medicine instantly"
              bgColor="#eff6ff"
            />
            <StepCard 
              number="3️⃣" 
              title="Get Recommendations" 
              description="AI-powered health advice"
              bgColor="#fef3c7"
            />
            <StepCard 
              number="4️⃣" 
              title="Book Appointments" 
              description="Consult with expert doctors"
              bgColor="#faf5ff"
            />
          </View>
        </View>
      )}

      {/* Medicine Recommendation CTA */}
      <View style={styles.bottomCtaCard}>
        <View style={styles.bottomCtaContent}>
          <Text style={styles.bottomCtaTitle}>💊 Check Your Symptoms</Text>
          <Text style={styles.bottomCtaDescription}>
            Get instant recommendations based on your symptoms
          </Text>
          <TouchableOpacity 
            style={styles.bottomCtaButton}
            onPress={() => navigation.navigate('MedicineTab', { screen: 'MedicineHome' })}
          >
            <Text style={styles.bottomCtaButtonText}>Open Medicine Recommendation</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Chats - Show if authenticated and has chats */}
      {isAuthenticated && recentChats.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>💬 Recent Chats</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ChatTab')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentChats.map((item, idx) => (
            <TouchableOpacity 
              key={item.id || idx} 
              style={styles.chatItem}
              onPress={() => navigation.navigate('ChatTab')}
            >
              <View style={styles.chatItemContent}>
                <Text style={styles.chatItemText} numberOfLines={1}>{item.text}</Text>
                <Text style={styles.chatItemDate}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.chatItemArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Health Tip Card */}
      <View style={styles.healthTipCard}>
        <Text style={styles.healthTipTitle}>💡 Health Tip</Text>
        <Text style={styles.healthTipText}>
          Stay hydrated! Drinking enough water helps your body function properly and supports your immune system.
        </Text>
      </View>

      {/* Login CTA - Show when NOT authenticated */}
      {!isAuthenticated && (
        <View style={styles.loginCtaCard}>
          <View style={styles.loginCtaContent}>
            <Text style={styles.loginCtaTitle}>Get Started with Your Health Journey</Text>
            <Text style={styles.loginCtaDescription}>
              Sign in to access personalized appointments, reminders, and health tracking features
            </Text>
            <TouchableOpacity 
              style={styles.loginCtaButton}
              onPress={() => navigation.navigate('ProfileTab', { screen: 'Login' })}
            >
              <Text style={styles.loginCtaButtonText}>🔐 Login to Continue</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.loginCtaIcon}>💚</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg + 92,
    paddingBottom: spacing.xl * 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Carousel Styles
  carouselContainer: {
    marginBottom: spacing.lg,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  carouselSlide: {
    padding: spacing.xl,
    alignItems: 'center',
    minHeight: 300,
    justifyContent: 'center',
  },
  carouselIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
    textAlign: 'center',
    includeFontPadding: false,
  },
  carouselTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#166534',
    textAlign: 'center',
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  carouselDescription: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  carouselTagline: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  carouselButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  carouselPrimaryBtn: {
    backgroundColor: '#166534',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  carouselPrimaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
    marginHorizontal: 4,
  },
  carouselDotActive: {
    backgroundColor: '#166534',
  },

  // CTA Card Styles
  ctaCard: {
    backgroundColor: '#059669',
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaContent: {
    flex: 1,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.sm,
    textAlign: 'center',
    includeFontPadding: false,
  },
  ctaDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.lg,
    lineHeight: 24,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaButtonText: {
    color: '#166534',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Welcome Card
  welcomeCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#64748b',
  },
  welcomeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeIcon: {
    fontSize: 32,
    textAlign: 'center',
  },

  // Section Styles
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: '#f1f5f9',
    paddingBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },

  // Loading Section
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  loadingSectionText: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
    textAlign: 'center',
    includeFontPadding: false,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: spacing.xs,
  },

  // Appointments
  appointmentsScroll: {
    marginBottom: spacing.md,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    marginRight: spacing.md,
    width: 300,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  appointmentStatusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  appointmentStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  appointmentContent: {},
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appointmentDoctorIcon: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  appointmentDoctorInfo: {
    flex: 1,
  },
  appointmentDoctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  appointmentSpecialization: {
    fontSize: 13,
    color: '#6b7280',
  },
  appointmentDetails: {
    marginBottom: spacing.md,
  },
  appointmentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  appointmentDetailIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
    width: 20,
  },
  appointmentDetailText: {
    fontSize: 14,
    color: '#4b5563',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  appointmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  rescheduleBtn: {
    backgroundColor: '#eff6ff',
  },
  rescheduleBtnText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 13,
  },
  cancelBtn: {
    backgroundColor: '#fef2f2',
  },
  cancelBtnText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 13,
  },
  bookAppointmentBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookAppointmentBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Reminders
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: spacing.sm,
  },
  reminderIcon: {
    marginRight: spacing.md,
  },
  reminderIconText: {
    fontSize: 24,
    textAlign: 'center',
    includeFontPadding: false,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  reminderDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  reminderDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reminderBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reminderBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Stats
  statsContainer: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    padding: spacing.xl,
    borderRadius: 20,
    marginBottom: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    fontSize: 44,
    marginBottom: spacing.md,
    textAlign: 'center',
    includeFontPadding: false,
  },
  statTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: spacing.xs,
  },
  statDescription: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },

  // About Card
  aboutCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  aboutTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: spacing.sm,
    textAlign: 'center',
    includeFontPadding: false,
  },
  aboutSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
    marginBottom: spacing.lg,
  },
  aboutDescription: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 26,
  },

  // How to Use Section
  howToUseSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  howToUseTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#166534',
    textAlign: 'center',
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  howToUseSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stepCard: {
    width: (width - spacing.md * 2 - spacing.xl * 2 - spacing.md) / 2,
    padding: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumber: {
    fontSize: 40,
    marginBottom: spacing.sm,
    textAlign: 'center',
    includeFontPadding: false,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Bottom CTA
  bottomCtaCard: {
    backgroundColor: '#059669',
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  bottomCtaContent: {
    alignItems: 'center',
  },
  bottomCtaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.sm,
    textAlign: 'center',
    includeFontPadding: false,
  },
  bottomCtaDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  bottomCtaButton: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomCtaButtonText: {
    color: '#166534',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Chat Items
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  chatItemContent: {
    flex: 1,
  },
  chatItemText: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 2,
  },
  chatItemDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  chatItemArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },

  // Health Tip
  healthTipCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#fbbf24',
  },
  healthTipTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  healthTipText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 26,
  },

  // Login CTA
  loginCtaCard: {
    backgroundColor: '#059669',
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  loginCtaContent: {
    flex: 1,
  },
  loginCtaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.sm,
  },
  loginCtaDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  loginCtaButton: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginCtaButtonText: {
    color: '#166534',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginCtaIcon: {
    fontSize: 56,
    marginLeft: spacing.lg,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
