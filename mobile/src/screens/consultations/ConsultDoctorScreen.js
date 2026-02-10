/**
 * Consult Doctor Screen
 * Complete consultation feature matching frontend:
 * - Search for doctors with filters
 * - View doctor recommendations
 * - Book appointments
 * - View appointment history
 * - View upcoming appointments/reminders
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Switch,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Picker } from '@react-native-picker/picker';
import SearchableDropdown from '../../components/SearchableDropdown';
import { Button, Card, Loading } from '../../components';
import { colors, spacing, typography } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';

const ConsultDoctorScreen = ({ navigation }) => {
  // Get authenticated user data
  const { user, userProfile } = useAuth();

  // Tab management
  const [activeTab, setActiveTab] = useState('book'); // book, history, reminders

  // Step management for booking flow
  const [step, setStep] = useState('search'); // search, results, booking

  // Booking on behalf of someone else
  const [bookingForSomeoneElse, setBookingForSomeoneElse] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Search options and form
  const [searchOptions, setSearchOptions] = useState({
    states: ['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Delhi', 'Gujarat', 'Andhra Pradesh', 'West Bengal'],
    cities: ['Bangalore', 'Mumbai', 'Chennai', 'Delhi', 'Pune', 'Hyderabad', 'Kolkata'],
    localities: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'BTM Layout', 'Jayanagar'],
    specializations: ['General Medicine', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology'],
    native_languages: ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Bengali'],
    languages: ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Bengali', 'Marathi'],
  });

  const [searchForm, setSearchForm] = useState({
    state: '',
    city: '',
    locality: '',
    specialization: '',
    native_language: '',
    languages_known: '',
  });

  // Results
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Booking form
  const [bookingForm, setBookingForm] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
  });

  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  // History
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [notificationEnabledAppointments, setNotificationEnabledAppointments] = useState(new Set());

  // Edit appointment
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    appointment_date: '',
    appointment_time: '',
    notes: '',
  });
  const [editShowDatePicker, setEditShowDatePicker] = useState(false);
  const [editShowTimePicker, setEditShowTimePicker] = useState(false);
  const [editSelectedDate, setEditSelectedDate] = useState(new Date());
  const [editSelectedTime, setEditSelectedTime] = useState(new Date());

  useEffect(() => {
    loadAppointments();
    requestNotificationPermissions();
    configureNotifications();
    loadNotificationStates();
  }, []);

  // Auto-refresh upcoming appointments when on reminders tab
  useEffect(() => {
    if (activeTab === 'reminders') {
      loadUpcomingAppointments();
      // Set up interval to refresh every minute to remove past appointments
      const interval = setInterval(() => {
        loadUpcomingAppointments();
      }, 60000); // Refresh every 60 seconds
      
      return () => clearInterval(interval);
    } else if (activeTab === 'history') {
      loadAppointmentHistory();
    }
  }, [activeTab]);

  // Helper function to format datetime for display
  const formatAppointmentDisplay = (dateTimeString) => {
    // Parse as local time (IST)
    const dt = new Date(dateTimeString);
    
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    const hours = String(dt.getHours()).padStart(2, '0');
    const minutes = String(dt.getMinutes()).padStart(2, '0');
    
    const localDate = `${day}/${month}/${year}`;
    const localTime = `${hours}:${minutes}`;
    
    return { date: localDate, time: localTime };
  };

  const configureNotifications = () => {
    // Configure how notifications are displayed
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  };

  const loadNotificationStates = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const notificationKeys = keys.filter(key => key.startsWith('notification_'));
      const enabledAppointments = new Set();
      
      for (const key of notificationKeys) {
        const appointmentId = key.replace('notification_', '');
        enabledAppointments.add(parseInt(appointmentId));
      }
      
      setNotificationEnabledAppointments(enabledAppointments);
      console.log('✅ Loaded notification states:', enabledAppointments.size);
    } catch (error) {
      console.error('❌ Error loading notification states:', error);
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('❌ Notification permissions not granted');
      } else {
        console.log('✅ Notification permissions granted');
      }
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
    }
  };

  const loadSearchOptions = async () => {
    try {
      const apiBase = 'http://98.70.223.78';
      console.log('📍 Fetching search options from:', `${apiBase}/api/appointments/search/options`);
      const response = await fetch(`${apiBase}/api/appointments/search/options`);
      
      console.log('📊 Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to load search options: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Search options loaded:', data);
      if (data.success) {
        setSearchOptions(data.options);
        console.log('✅ Search options set in state:', data.options);
      }
    } catch (err) {
      console.error('❌ Error loading search options:', err);
      setError('Failed to load doctor information');
    }
  };

  const loadAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const baseURL = 'http://98.70.223.78/api';
      
      // Fetch all appointments (history)
      const allResponse = await fetch(`${baseURL}/my-appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const allData = await allResponse.json();
      if (allData.success && allData.appointments) {
        console.log(`📜 Received ${allData.appointments.length} appointments from backend`);
        setAppointmentHistory(allData.appointments);
        await AsyncStorage.setItem('appointmentHistory', JSON.stringify(allData.appointments));
      }

      // Fetch upcoming appointments
      const upcomingResponse = await fetch(`${baseURL}/upcoming-appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const upcomingData = await upcomingResponse.json();
      if (upcomingData.success && upcomingData.appointments) {
        console.log(`✅ Received ${upcomingData.appointments.length} upcoming appointments from backend`);
        setUpcomingAppointments(upcomingData.appointments);
        await AsyncStorage.setItem('upcomingAppointments', JSON.stringify(upcomingData.appointments));
      }
    } catch (err) {
      // Try to load from AsyncStorage as fallback first
      let hasCache = false;
      try {
        const savedHistory = await AsyncStorage.getItem('appointmentHistory');
        const savedUpcoming = await AsyncStorage.getItem('upcomingAppointments');
        
        if (savedHistory) {
          const history = JSON.parse(savedHistory);
          setAppointmentHistory(history);
          console.log('📦 Loaded appointment history from cache');
          hasCache = true;
        }
        
        if (savedUpcoming) {
          const upcoming = JSON.parse(savedUpcoming);
          setUpcomingAppointments(upcoming);
          console.log('📦 Loaded upcoming appointments from cache');
          hasCache = true;
        }
      } catch (storageErr) {
        console.error('❌ Error loading from storage:', storageErr);
      }
      
      // Set appropriate message and logging based on whether we have cached data
      if (hasCache) {
        // If we have cached data, show a less alarming message
        console.log('ℹ️ Using cached data - backend temporarily unavailable');
        setError(''); // Clear any previous errors since we have data
      } else {
        // Only show error if no cached data is available
        console.error('❌ Error loading appointments:', err);
        if (err.message && err.message.includes('Network request failed')) {
          setError('⚠️ Cannot connect to backend server\n\nPlease check if the server is running and try again.');
        } else {
          setError('Failed to load appointments: ' + (err.message || 'Unknown error'));
        }
      }
    }
  };

  const loadUpcomingAppointments = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch('http://98.70.223.78/api/appointments/upcoming-appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📋 Upcoming appointments response:', data);

      if (data.success) {
        setUpcomingAppointments(data.appointments || []);
        setError(''); // Clear any previous errors
      } else {
        console.warn('⚠️ Failed to load upcoming appointments:', data.message);
        setUpcomingAppointments([]);
      }
    } catch (error) {
      // Try to load cached data first
      let hasCache = false;
      try {
        const savedUpcoming = await AsyncStorage.getItem('upcomingAppointments');
        if (savedUpcoming) {
          const upcoming = JSON.parse(savedUpcoming);
          setUpcomingAppointments(upcoming);
          console.log('📦 Loaded upcoming appointments from cache');
          hasCache = true;
          setError(''); // Don't show error if we have cached data
        } else {
          setUpcomingAppointments([]);
        }
      } catch (cacheError) {
        console.error('❌ Error loading cached data:', cacheError);
        setUpcomingAppointments([]);
      }
      
      // Only log error if no cached data available
      if (!hasCache) {
        console.error('❌ Error loading upcoming appointments:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAppointmentHistory = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await fetch('http://98.70.223.78/api/appointments/my-appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📋 Appointment history response:', data);

      if (data.success) {
        // Filter for past appointments only (appointments that have already passed)
        const now = new Date();
        const pastAppointments = (data.appointments || []).filter(appointment => {
          const appointmentDate = new Date(appointment.appointment_date);
          const isPast = appointmentDate <= now;
          console.log(`🔍 Appointment ${appointment.id}: ${appointmentDate.toISOString()} <= ${now.toISOString()} = ${isPast}`);
          return isPast;
        });
        
        console.log(`📊 Filtered ${pastAppointments.length} past appointments from ${data.appointments?.length || 0} total`);
        setAppointmentHistory(pastAppointments);
        setError(''); // Clear any previous errors
      } else {
        console.warn('⚠️ Failed to load appointment history:', data.message);
        setAppointmentHistory([]);
      }
    } catch (error) {
      // Try to load cached data first
      let hasCache = false;
      try {
        const savedHistory = await AsyncStorage.getItem('appointmentHistory');
        if (savedHistory) {
          const history = JSON.parse(savedHistory);
          // Also filter cached data for past appointments
          const now = new Date();
          const pastHistory = history.filter(appointment => {
            const appointmentDate = new Date(appointment.appointment_date);
            return appointmentDate <= now;
          });
          setAppointmentHistory(pastHistory);
          console.log('📦 Loaded appointment history from cache');
          hasCache = true;
          setError(''); // Don't show error if we have cached data
        } else {
          setAppointmentHistory([]);
        }
      } catch (cacheError) {
        console.error('❌ Error loading cached data:', cacheError);
        setAppointmentHistory([]);
      }
      
      // Only log error if no cached data available
      if (!hasCache) {
        console.error('❌ Error loading appointment history:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (name, value) => {
    setSearchForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    // Validate at least one criterion
    if (!Object.values(searchForm).some(val => val)) {
      setError('Please select at least one search criterion');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const apiBase = 'http://98.70.223.78';
      const response = await fetch(`${apiBase}/api/appointments/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchForm)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Search failed');
      }
      
      if (data.doctors && data.doctors.length > 0) {
        setDoctors(data.doctors);
        setStep('results');
        setMessage(`Found ${data.doctors.length} matching doctors`);
      } else {
        setError('No doctors found matching your criteria');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Error searching doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setStep('booking');
    // Auto-fill user details from account
    const userName = user?.fullName || userProfile?.fullName || user?.username || '';
    const userEmail = user?.email || userProfile?.email || '';
    
    setBookingForm({
      patient_name: userName,
      patient_email: userEmail,
      patient_phone: '', // Phone not stored in account, user must enter
      appointment_date: '',
      appointment_time: '',
      notes: '',
    });
    setBookingForSomeoneElse(false);
  };

  const handleBookingChange = (name, value) => {
    setBookingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      // Format in local timezone, not UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`; // YYYY-MM-DD in local timezone
      console.log(`📅 Date selected (local): ${formattedDate}`);
      handleBookingChange('appointment_date', formattedDate);
    }
  };

  const handleTimeChange = (event, time) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      setSelectedTime(time);
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`; // HH:MM
      handleBookingChange('appointment_time', formattedTime);
    }
  };

  const handleConfirmBooking = async () => {
    // Validate required fields
    if (
      !bookingForm.patient_name ||
      !bookingForm.patient_email ||
      !bookingForm.patient_phone ||
      !bookingForm.appointment_date ||
      !bookingForm.appointment_time
    ) {
      setError('Please fill all required fields');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingForm.patient_email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate phone
    if (bookingForm.patient_phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        doctor_id: selectedDoctor.employee_id,
        patient_name: bookingForm.patient_name.trim(),
        patient_email: bookingForm.patient_email.trim(),
        patient_phone: bookingForm.patient_phone.trim(),
        appointment_date: bookingForm.appointment_date,
        appointment_time: bookingForm.appointment_time,
        notes: bookingForm.notes || null,
      };

      console.log('📤 Sending appointment booking (Local IST):', payload);

      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch('http://98.70.223.78/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log('📋 Booking response:', data);

      if (data.success) {
        setMessage(`✅ Appointment booked successfully! ID: ${data.appointment_id}`);

        // Save to history
        await saveAppointmentToHistory({
          ...payload,
          doctor_name: selectedDoctor.name,
          doctor_specialization: selectedDoctor.specialization,
          doctor_hospital: selectedDoctor.hospital,
          appointment_id: data.appointment_id,
          timestamp: new Date().toISOString(),
        });

        // Reload appointments
        await loadAppointments();

        // Reset and go back to search after 2 seconds
        setTimeout(() => {
          setStep('search');
          setSearchForm({
            state: '',
            city: '',
            locality: '',
            specialization: '',
            native_language: '',
            languages_known: '',
          });
          setDoctors([]);
          setSelectedDoctor(null);
          setError('');
          setMessage('');
        }, 2000);
      } else {
        throw new Error(response.message || 'Booking failed');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Error booking appointment');
    } finally {
      setLoading(false);
    }
  };

  const saveAppointmentToHistory = async (appointment) => {
    try {
      const saved = await AsyncStorage.getItem('appointmentHistory');
      const history = saved ? JSON.parse(saved) : [];
      history.push(appointment);
      await AsyncStorage.setItem('appointmentHistory', JSON.stringify(history));
      console.log('✅ Appointment saved to history');
    } catch (err) {
      console.error('❌ Error saving to history:', err);
    }
  };

  const cancelAppointment = async (appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Cancel appointment with Dr. ${appointment.doctor_name} on ${new Date(appointment.appointment_date).toLocaleDateString()}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('authToken');
              const response = await fetch(`http://98.70.223.78/api/appointments/appointment/${appointment.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              const data = await response.json();
              if (response.success) {
                setMessage(`✅ ${response.message}`);
                await loadAppointments();
                setTimeout(() => setMessage(''), 2000);
              }
            } catch (error) {
              console.error('❌ Error cancelling appointment:', error);
              setError(`Failed to cancel: ${error.message}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    
    // Parse datetime directly (local IST time)
    const aptDateTime = new Date(appointment.appointment_date);
    
    const year = aptDateTime.getFullYear();
    const month = String(aptDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(aptDateTime.getDate()).padStart(2, '0');
    const hours = String(aptDateTime.getHours()).padStart(2, '0');
    const minutes = String(aptDateTime.getMinutes()).padStart(2, '0');
    
    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${hours}:${minutes}`;
    
    setEditForm({
      appointment_date: dateStr,
      appointment_time: timeStr,
      notes: appointment.notes || '',
    });
    setEditSelectedDate(aptDateTime);
    setEditSelectedTime(aptDateTime);
    setEditModalVisible(true);
  };

  const handleEditDateChange = (event, date) => {
    setEditShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setEditSelectedDate(date);
      // Format in local timezone, not UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      console.log(`📅 Edit date selected (local): ${formattedDate}`);
      setEditForm(prev => ({ ...prev, appointment_date: formattedDate }));
    }
  };

  const handleEditTimeChange = (event, time) => {
    setEditShowTimePicker(Platform.OS === 'ios');
    if (time) {
      setEditSelectedTime(time);
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;
      setEditForm(prev => ({ ...prev, appointment_time: formattedTime }));
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.appointment_date || !editForm.appointment_time) {
      setError('Please select both date and time');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        appointment_date: editForm.appointment_date,
        appointment_time: editForm.appointment_time,
        notes: editForm.notes || null,
      };

      console.log('📤 Updating appointment (Local IST):', payload);

      const token = await AsyncStorage.getItem('authToken');
      await fetch(`http://98.70.223.78/api/appointments/appointment/${editingAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });
      setMessage('Appointment updated successfully!');
      setEditModalVisible(false);
      setEditingAppointment(null);
      await loadAppointments();
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError(err.message || 'Failed to update appointment');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotification = async (appointment) => {
    try {
      const appointmentDate = new Date(appointment.appointment_date);
      const isNotificationEnabled = notificationEnabledAppointments.has(appointment.id);
      
      console.log('🔔 Toggling notification for:', appointmentDate.toISOString());

      // Check if appointment is in the future
      if (appointmentDate <= new Date()) {
        Alert.alert('Cannot Set Reminder', 'This appointment time has already passed.');
        return;
      }

      if (isNotificationEnabled) {
        // Disable notification
        await cancelNotification(appointment.id);
        const newSet = new Set(notificationEnabledAppointments);
        newSet.delete(appointment.id);
        setNotificationEnabledAppointments(newSet);
        Alert.alert('🔕 Notification Disabled', 'Appointment reminder has been turned off.');
      } else {
        // Enable notification (30 seconds before)
        await setReminder(appointment, appointmentDate, 0.5, '30 seconds'); // 0.5 minutes = 30 seconds
        const newSet = new Set(notificationEnabledAppointments);
        newSet.add(appointment.id);
        setNotificationEnabledAppointments(newSet);
      }
    } catch (error) {
      console.error('❌ Error in toggleNotification:', error);
      Alert.alert('Error', 'Failed to set reminder. Please try again.');
    }
  };

  const cancelNotification = async (appointmentId) => {
    try {
      const storedNotification = await AsyncStorage.getItem(`notification_${appointmentId}`);
      if (storedNotification) {
        const notificationData = JSON.parse(storedNotification);
        await Notifications.cancelScheduledNotificationAsync(notificationData.notificationId);
        await AsyncStorage.removeItem(`notification_${appointmentId}`);
        console.log('✅ Notification cancelled for appointment:', appointmentId);
      }
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
    }
  };

  const setReminder = async (appointment, appointmentDate, minutesBefore, displayText) => {
    try {
      // Calculate reminder time
      const reminderTime = new Date(appointmentDate.getTime() - minutesBefore * 60 * 1000);
      
      // Check if reminder time is in the future
      if (reminderTime <= new Date()) {
        Alert.alert(
          'Cannot Set Reminder',
          `The reminder time (${reminderTime.toLocaleString()}) has already passed. Please choose a shorter reminder interval.`
        );
        return;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏥 Appointment Reminder',
          body: `Your appointment with Dr. ${appointment.doctor_name} is in ${displayText} at ${appointment.appointment_time}`,
          data: { appointmentId: appointment.id },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: reminderTime,
      });

      // Store notification ID to cancel later if needed
      await AsyncStorage.setItem(
        `notification_${appointment.id}`,
        JSON.stringify({
          notificationId,
          appointmentId: appointment.id,
          scheduledFor: reminderTime.toISOString(),
          minutesBefore,
        })
      );

      Alert.alert(
        '🔔 Notification Enabled!',
        `You will receive a notification ${displayText} before your appointment.`,
        [{ text: 'OK' }]
      );

      console.log('✅ Notification scheduled:', notificationId);
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to set reminder. Please check notification permissions.');
    }
  };

  // Render Tab Buttons - Modern Segmented Control (matching frontend green theme)
  const renderTabs = () => (
    <View style={{
      flexDirection: 'row',
      marginBottom: spacing.lg,
      backgroundColor: '#E5E7EB',
      borderRadius: 16,
      padding: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    }}>
      <Pressable
        onPress={() => {
          setActiveTab('book');
          setStep('search');
          setError('');
          setMessage('');
          if (searchOptions.states.length === 0) {
            loadSearchOptions();
          }
        }}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          paddingHorizontal: 8,
          borderRadius: 12,
          backgroundColor: activeTab === 'book' ? '#FFFFFF' : 'transparent',
          shadowColor: activeTab === 'book' ? '#000' : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: activeTab === 'book' ? 0.1 : 0,
          shadowRadius: 4,
          elevation: activeTab === 'book' ? 3 : 0,
        }}
      >
        <Text style={{ fontSize: 14, marginRight: 4 }}>📅</Text>
        <Text style={{
          fontSize: 13,
          fontWeight: '700',
          color: activeTab === 'book' ? '#059669' : '#6B7280',
        }}>
          Book
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          setActiveTab('history');
          setError('');
          setMessage('');
        }}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          paddingHorizontal: 8,
          borderRadius: 12,
          backgroundColor: activeTab === 'history' ? '#FFFFFF' : 'transparent',
          shadowColor: activeTab === 'history' ? '#000' : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: activeTab === 'history' ? 0.1 : 0,
          shadowRadius: 4,
          elevation: activeTab === 'history' ? 3 : 0,
        }}
      >
        <Text style={{ fontSize: 14, marginRight: 4 }}>📋</Text>
        <Text style={{
          fontSize: 13,
          fontWeight: '700',
          color: activeTab === 'history' ? '#059669' : '#6B7280',
        }}>
          History
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          setActiveTab('reminders');
          setError('');
          setMessage('');
        }}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          paddingHorizontal: 8,
          borderRadius: 12,
          backgroundColor: activeTab === 'reminders' ? '#FFFFFF' : 'transparent',
          shadowColor: activeTab === 'reminders' ? '#000' : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: activeTab === 'reminders' ? 0.1 : 0,
          shadowRadius: 4,
          elevation: activeTab === 'reminders' ? 3 : 0,
        }}
      >
        <Text style={{ fontSize: 14, marginRight: 4 }}>⏰</Text>
        <Text style={{
          fontSize: 13,
          fontWeight: '700',
          color: activeTab === 'reminders' ? '#059669' : '#6B7280',
        }}>
          Upcoming
        </Text>
      </Pressable>
    </View>
  );

  // Render Search Form (Step 1)
  const renderSearchForm = () => (
    <View style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: '#D1FAE5',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.sm,
        }}>
          <Text style={{ fontSize: 22 }}>🔍</Text>
        </View>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937' }}>
            Search for a Doctor
          </Text>
          <Text style={{ fontSize: 13, color: '#6B7280' }}>
            Fill in your preferences
          </Text>
        </View>
      </View>

      <SearchableDropdown
        label="🗺️ State"
        items={searchOptions.states}
        selectedValue={searchForm.state}
        onValueChange={(value) => handleSearchChange('state', value)}
        placeholder="-- Select State --"
      />

      <SearchableDropdown
        label="🏙️ City"
        items={searchOptions.cities}
        selectedValue={searchForm.city}
        onValueChange={(value) => handleSearchChange('city', value)}
        placeholder="-- Select City --"
      />

      <SearchableDropdown
        label="📍 Locality"
        items={searchOptions.localities}
        selectedValue={searchForm.locality}
        onValueChange={(value) => handleSearchChange('locality', value)}
        placeholder="-- Select Locality --"
      />

      <SearchableDropdown
        label="👨‍⚕️ Specialization"
        items={searchOptions.specializations}
        selectedValue={searchForm.specialization}
        onValueChange={(value) => handleSearchChange('specialization', value)}
        placeholder="-- Select Specialization --"
      />

      <SearchableDropdown
        label="🗣️ Doctor's Native Language"
        items={searchOptions.native_languages}
        selectedValue={searchForm.native_language}
        onValueChange={(value) => handleSearchChange('native_language', value)}
        placeholder="-- Select Language --"
      />

      <SearchableDropdown
        label="💬 Languages Doctor Speaks"
        items={searchOptions.languages}
        selectedValue={searchForm.languages_known}
        onValueChange={(value) => handleSearchChange('languages_known', value)}
        placeholder="-- Select Language --"
      />

      <Pressable
        onPress={handleSearch}
        disabled={loading}
        style={{
          backgroundColor: '#10b981',
          paddingVertical: 16,
          borderRadius: 14,
          marginTop: spacing.lg,
          shadowColor: '#10b981',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
          opacity: loading ? 0.7 : 1,
        }}
      >
        <Text style={{ 
          color: '#FFFFFF', 
          fontSize: 16, 
          fontWeight: '700', 
          textAlign: 'center',
        }}>
          {loading ? '⏳ Searching...' : '🔍 Search Doctors'}
        </Text>
      </Pressable>
    </View>
  );

  // Render Doctor Results (Step 2)
  const renderResults = () => (
    <View style={{ marginBottom: spacing.lg }}>
      {/* Results Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: spacing.lg,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: '#D1FAE5',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.sm,
          }}>
            <Text style={{ fontSize: 18 }}>👨‍⚕️</Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>
              {doctors.length} Doctors Found
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              Select a doctor to book
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => setStep('search')}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            backgroundColor: '#F3F4F6',
            borderRadius: 10,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#4B5563' }}>← Back</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: spacing.xl,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🔍</Text>
          <Text style={{ fontSize: 15, color: '#6B7280' }}>Searching for doctors...</Text>
        </View>
      ) : doctors.length === 0 ? (
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: spacing.xl,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>😕</Text>
          <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center' }}>
            No doctors found. Try adjusting your search criteria.
          </Text>
        </View>
      ) : (
        doctors.map((doctor, idx) => (
        <View 
          key={doctor.id || doctor.employee_id || idx} 
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: spacing.lg,
            marginBottom: spacing.md,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: '#F3F4F6',
          }}
        >
          {/* Rank Badge */}
          <View style={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: '#10b981',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>#{idx + 1}</Text>
          </View>

          {/* Doctor Name & Specialization */}
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 6, paddingRight: 50 }}>
            {String(doctor.name || 'Unknown Doctor')}
          </Text>
          <View style={{
            alignSelf: 'flex-start',
            backgroundColor: '#ECFDF5',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 10,
            marginBottom: spacing.md,
          }}>
            <Text style={{ color: '#059669', fontSize: 13, fontWeight: '600' }}>
              {String(doctor.specialization || 'General')}
            </Text>
          </View>

          {/* Doctor Info */}
          <View style={{ marginBottom: spacing.md }}>
            {[
              { icon: '🏥', label: 'Hospital', value: doctor.hospital },
              { icon: '📍', label: 'Location', value: `${doctor.locality || ''}, ${doctor.city || ''}` },
              { icon: '🗺️', label: 'State', value: doctor.state },
              { icon: '📞', label: 'Phone', value: doctor.phone },
              { icon: '📧', label: 'Email', value: doctor.email },
              { icon: '🗣️', label: 'Native', value: doctor.native_language },
            ].map((item, i) => (
              <View key={i} style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                paddingVertical: 8,
                borderBottomWidth: i < 5 ? 1 : 0,
                borderBottomColor: '#F3F4F6',
              }}>
                <Text style={{ fontSize: 14, width: 24 }}>{item.icon}</Text>
                <Text style={{ fontSize: 13, color: '#6B7280', width: 70 }}>{item.label}</Text>
                <Text style={{ fontSize: 13, color: '#1F2937', fontWeight: '500', flex: 1 }}>
                  {String(item.value || 'N/A')}
                </Text>
              </View>
            ))}
          </View>

          {/* Languages */}
          <View style={{ 
            backgroundColor: '#F9FAFB', 
            borderRadius: 12, 
            padding: spacing.sm,
            marginBottom: spacing.md,
          }}>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>💬 Languages Spoken:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(doctor.languages_known && Array.isArray(doctor.languages_known) ? doctor.languages_known : []).map((lang, i) => (
                <View 
                  key={`${doctor.id || doctor.employee_id || 'doc'}-lang-${lang}-${i}`} 
                  style={{
                    backgroundColor: '#D1FAE5',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: '#065F46', fontSize: 12, fontWeight: '600' }}>{String(lang || '')}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Book Button */}
          <Pressable
            onPress={() => handleBookAppointment(doctor)}
            style={{
              backgroundColor: '#10b981',
              paddingVertical: 14,
              borderRadius: 12,
              shadowColor: '#10b981',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
              📅 Book Appointment
            </Text>
          </Pressable>
        </View>
        ))
      )}
    </View>
  );

  // Render Booking Form (Step 3)
  const renderBookingForm = () => (
    <View style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: '#D1FAE5',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.sm,
        }}>
          <Text style={{ fontSize: 22 }}>📅</Text>
        </View>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937' }}>
            Book Appointment
          </Text>
          <Text style={{ fontSize: 13, color: '#6B7280' }}>
            Fill in the details below
          </Text>
        </View>
      </View>

      {/* Doctor Summary Card */}
      <View style={{
        backgroundColor: '#10b981',
        padding: spacing.lg,
        borderRadius: 16,
        marginBottom: spacing.lg,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
          {String(selectedDoctor.name || 'Unknown Doctor')}
        </Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 2 }}>
          {String(selectedDoctor.specialization || 'General')} at {String(selectedDoctor.hospital || 'Unknown Hospital')}
        </Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
          📍 {String(selectedDoctor.locality || '')}, {String(selectedDoctor.city || '')}
        </Text>
      </View>

      <View style={styles.formGroup}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Booking for someone else?</Text>
          <Switch
            value={bookingForSomeoneElse}
            onValueChange={(value) => {
              setBookingForSomeoneElse(value);
              if (!value) {
                // Reset to user's own name when switching back
                const userName = user?.fullName || userProfile?.fullName || user?.username || '';
                handleBookingChange('patient_name', userName);
              }
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={bookingForSomeoneElse ? colors.white : colors.textLight}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          {bookingForSomeoneElse ? "Patient's Name *" : 'Your Name *'}
        </Text>
        <TextInput
          style={[styles.input, !bookingForSomeoneElse && styles.inputReadonly]}
          value={bookingForm.patient_name}
          onChangeText={(value) => handleBookingChange('patient_name', value)}
          placeholder={bookingForSomeoneElse ? "Enter patient's full name" : "Your name from account"}
          placeholderTextColor={colors.textLight}
          editable={bookingForSomeoneElse}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email * (from account)</Text>
        <TextInput
          style={[styles.input, styles.inputReadonly]}
          value={bookingForm.patient_email}
          placeholder="Email from your account"
          placeholderTextColor={colors.textLight}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={false}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={bookingForm.patient_phone}
          onChangeText={(value) => handleBookingChange('patient_phone', value)}
          placeholder="Enter your phone number"
          placeholderTextColor={colors.textLight}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Appointment Date *</Text>
        <Pressable
          style={styles.dateTimeButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateTimeButtonText}>
            {bookingForm.appointment_date
              ? `📅 ${new Date(bookingForm.appointment_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}`
              : '📅 Select Date'}
          </Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            minimumDate={new Date()} // Only today and future dates
            onChange={handleDateChange}
          />
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Appointment Time *</Text>
        <Pressable
          style={styles.dateTimeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateTimeButtonText}>
            {bookingForm.appointment_time
              ? `⏰ ${bookingForm.appointment_time}`
              : '⏰ Select Time'}
          </Text>
        </Pressable>
        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
            is24Hour={false}
          />
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Additional Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bookingForm.notes}
          onChangeText={(value) => handleBookingChange('notes', value)}
          placeholder="Any specific concerns or information..."
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.buttonRow}>
        <Button
          title="← Back"
          onPress={() => setStep('results')}
          variant="secondary"
          style={{ flex: 1, marginRight: spacing.sm }}
        />
        <Button
          title={loading ? 'Booking...' : 'Confirm Booking'}
          onPress={handleConfirmBooking}
          disabled={loading}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  );

  // Render Appointment History
  const renderHistory = () => (
    <View style={{ marginBottom: spacing.lg }}>
      {/* Section Header */}
      <View style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: spacing.lg,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: '#FEF3C7',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.sm,
          }}>
            <Text style={{ fontSize: 22 }}>📋</Text>
          </View>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937' }}>
              Appointment History
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              {appointmentHistory.length} past appointment{appointmentHistory.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {appointmentHistory.length === 0 ? (
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: spacing.xl,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📅</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 4 }}>
            No appointments yet
          </Text>
          <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
            Your past appointments will appear here
          </Text>
        </View>
      ) : (
        appointmentHistory.map((appointment, idx) => {
          const { date, time } = formatAppointmentDisplay(appointment.appointment_date);
          return (
            <View 
              key={appointment.id || `history-${idx}`} 
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: spacing.md,
                marginBottom: spacing.sm,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
                borderLeftWidth: 4,
                borderLeftColor: '#10b981',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 }}>
                Dr. {appointment.doctor_name}
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
                {appointment.doctor_specialization} at {appointment.doctor_hospital}
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  backgroundColor: '#F3F4F6',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}>
                  <Text style={{ fontSize: 12, marginRight: 4 }}>📅</Text>
                  <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500' }}>{date}</Text>
                </View>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  backgroundColor: '#F3F4F6',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}>
                  <Text style={{ fontSize: 12, marginRight: 4 }}>⏰</Text>
                  <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500' }}>{time}</Text>
                </View>
              </View>
              {appointment.notes && (
                <View style={{ 
                  marginTop: spacing.sm,
                  backgroundColor: '#FFFBEB',
                  padding: 10,
                  borderRadius: 10,
                }}>
                  <Text style={{ fontSize: 13, color: '#92400E' }}>📝 {appointment.notes}</Text>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );

  // Render Upcoming Appointments
  const renderUpcoming = () => (
    <View style={{ marginBottom: spacing.lg }}>
      {/* Section Header */}
      <View style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: spacing.lg,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: '#DBEAFE',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.sm,
          }}>
            <Text style={{ fontSize: 22 }}>⏰</Text>
          </View>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937' }}>
              Upcoming Appointments
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280' }}>
              {upcomingAppointments.length} scheduled
            </Text>
          </View>
        </View>
      </View>

      {upcomingAppointments.length === 0 ? (
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: spacing.xl,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📅</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 4 }}>
            No upcoming appointments
          </Text>
          <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>
            Book an appointment to get started
          </Text>
        </View>
      ) : (
        upcomingAppointments.map((appointment) => {
          const { date, time } = formatAppointmentDisplay(appointment.appointment_date);
          return (
            <View 
              key={appointment.id} 
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: spacing.md,
                marginBottom: spacing.md,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
                borderWidth: 1,
                borderColor: '#ECFDF5',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 }}>
                Dr. {appointment.doctor_name}
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>
                {appointment.doctor_specialization} at {appointment.doctor_hospital}
              </Text>
              
              <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  backgroundColor: '#ECFDF5',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}>
                  <Text style={{ fontSize: 12, marginRight: 4 }}>📅</Text>
                  <Text style={{ fontSize: 13, color: '#059669', fontWeight: '600' }}>{date}</Text>
                </View>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  backgroundColor: '#ECFDF5',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}>
                  <Text style={{ fontSize: 12, marginRight: 4 }}>⏰</Text>
                  <Text style={{ fontSize: 13, color: '#059669', fontWeight: '600' }}>{time}</Text>
                </View>
              </View>

              {appointment.notes && (
                <View style={{ 
                  marginBottom: spacing.md,
                  backgroundColor: '#FFFBEB',
                  padding: 10,
                  borderRadius: 10,
                }}>
                  <Text style={{ fontSize: 13, color: '#92400E' }}>📝 {appointment.notes}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Pressable
                  onPress={() => toggleNotification(appointment)}
                  style={{
                    width: 48,
                    height: 44,
                    backgroundColor: notificationEnabledAppointments.has(appointment.id) ? '#10b981' : '#F3F4F6',
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>
                    {notificationEnabledAppointments.has(appointment.id) ? '🔔' : '🔕'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleEditAppointment(appointment)}
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#4B5563' }}>✏️ Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => cancelAppointment(appointment)}
                  style={{
                    flex: 1,
                    backgroundColor: '#FEE2E2',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#DC2626' }}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F0FDF4' }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingTop: spacing.lg + 92 }}>
        {/* Header Card */}
        <View style={{ 
          marginBottom: spacing.lg,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: spacing.lg,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: '#D1FAE5',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.sm,
            }}>
              <Text style={{ fontSize: 24 }}>🏥</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 22, 
                fontWeight: '800', 
                color: '#059669',
                letterSpacing: -0.5,
              }}>
                Doctor Consultation
              </Text>
              <Text style={{ 
                fontSize: 14, 
                color: '#6B7280',
                marginTop: 2,
              }}>
                Book appointments & manage consultations
              </Text>
            </View>
          </View>
        </View>

        {renderTabs()}

        {message && (
          <View style={{
            backgroundColor: '#D1FAE5',
            borderLeftWidth: 4,
            borderLeftColor: '#10b981',
            padding: spacing.md,
            borderRadius: 12,
            marginBottom: spacing.lg,
          }}>
            <Text style={{ color: '#065F46', fontWeight: '600', fontSize: 14 }}>{String(message || '')}</Text>
          </View>
        )}
        {error && (
          <View style={{
            backgroundColor: '#FEE2E2',
            borderLeftWidth: 4,
            borderLeftColor: '#DC2626',
            padding: spacing.md,
            borderRadius: 12,
            marginBottom: spacing.lg,
          }}>
            <Text style={{ color: '#991B1B', fontWeight: '500', fontSize: 14 }}>⚠️ {String(error || '')}</Text>
          </View>
        )}

        {activeTab === 'book' && (
          <>
            {step === 'search' && renderSearchForm()}
            {step === 'results' && renderResults()}
            {step === 'booking' && renderBookingForm()}
          </>
        )}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'reminders' && renderUpcoming()}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: spacing.lg,
            width: '92%',
            maxHeight: '85%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 10,
          }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#DBEAFE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                }}>
                  <Text style={{ fontSize: 22 }}>✏️</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937' }}>
                    Edit Appointment
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>
                    Update the details below
                  </Text>
                </View>
              </View>

              {editingAppointment && (
                <View style={{
                  backgroundColor: '#10b981',
                  padding: spacing.md,
                  borderRadius: 14,
                  marginBottom: spacing.lg,
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                    Dr. {String(editingAppointment.doctor_name || 'Unknown')}
                  </Text>
                  <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
                    {String(editingAppointment.specialization || 'General')}
                  </Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                  Appointment Date *
                </Text>
                <Pressable
                  onPress={() => setEditShowDatePicker(true)}
                  style={{
                    borderWidth: 2,
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 14,
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#1F2937' }}>
                    {editForm.appointment_date
                      ? `📅 ${new Date(editForm.appointment_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}`
                      : '📅 Select Date'}
                  </Text>
                </Pressable>
                {editShowDatePicker && (
                  <DateTimePicker
                    value={editSelectedDate}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={handleEditDateChange}
                  />
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                  Appointment Time *
                </Text>
                <Pressable
                  onPress={() => setEditShowTimePicker(true)}
                  style={{
                    borderWidth: 2,
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 14,
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#1F2937' }}>
                    {editForm.appointment_time
                      ? `⏰ ${editForm.appointment_time}`
                      : '⏰ Select Time'}
                  </Text>
                </Pressable>
                {editShowTimePicker && (
                  <DateTimePicker
                    value={editSelectedTime}
                    mode="time"
                    display="default"
                    onChange={handleEditTimeChange}
                    is24Hour={false}
                  />
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                  Notes (Optional)
                </Text>
                <TextInput
                  style={{
                    borderWidth: 2,
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 12,
                    color: '#1F2937',
                    fontSize: 14,
                    height: 100,
                    textAlignVertical: 'top',
                  }}
                  value={editForm.notes}
                  onChangeText={(value) => setEditForm(prev => ({ ...prev, notes: value }))}
                  placeholder="Any specific concerns or information..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {error && (
                <View style={{
                  backgroundColor: '#FEE2E2',
                  borderLeftWidth: 4,
                  borderLeftColor: '#DC2626',
                  padding: spacing.md,
                  borderRadius: 12,
                  marginBottom: spacing.md,
                }}>
                  <Text style={{ color: '#991B1B', fontWeight: '500', fontSize: 14 }}>⚠️ {error}</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                <Pressable
                  onPress={() => {
                    setEditModalVisible(false);
                    setEditingAppointment(null);
                    setError('');
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#4B5563' }}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveEdit}
                  disabled={loading}
                  style={{
                    flex: 2,
                    backgroundColor: '#10b981',
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = {
  header: {
    marginBottom: spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.secondary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  tabTextActive: {
    color: colors.white,
  },
  messageSuccess: {
    backgroundColor: colors.success + '20',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  messageError: {
    backgroundColor: colors.error + '20',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  messageText: {
    color: colors.text,
    fontWeight: '500',
  },
  section: {
    marginBottom: spacing.xl,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  pickerContainer: {
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  newSearchButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray[200],
    borderRadius: 6,
  },
  newSearchText: {
    color: colors.text,
    fontWeight: '600',
  },
  doctorCard: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  doctorRank: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  specializationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  specializationText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  doctorInfo: {
    marginVertical: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  languagesContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  languagesLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  languageBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  languageBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  languageBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  doctorSummary: {
    backgroundColor: colors.secondary,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  summarySubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.95,
    marginBottom: 4,
  },
  summaryLocation: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.9,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  dateTimeButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  inputReadonly: {
    backgroundColor: colors.backgroundLight,
    color: colors.textLight,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  appointmentCard: {
    marginBottom: spacing.md,
  },
  appointmentDetails: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  detailText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    width: '90%',
    maxHeight: '80%',
  },
  editDoctorInfo: {
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  editDoctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  editDoctorSpec: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  bellButton: {
    width: 50,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  bellButtonActive: {
    backgroundColor: colors.success,
  },
  bellIcon: {
    fontSize: 22,
  },
};

export default ConsultDoctorScreen;
