/**
 * Prescription & Medicine Management Screen
 * Mobile version matching frontend PrescriptionHandling.jsx
 * Features: Medicine management, AI identification, prescription history
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Modal,
  Alert as RNAlert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Alert } from '../../components';
import { colors, spacing, typography } from '../../utils/theme';
import apiClient from '../../api/client';

const FREQUENCY_OPTIONS = [
  { label: 'Select Frequency', value: '' },
  { label: 'Once Daily', value: 'Once Daily' },
  { label: 'Twice Daily', value: 'Twice Daily' },
  { label: 'Thrice Daily', value: 'Thrice Daily' },
  { label: 'Every 4 hours', value: 'Every 4 hours' },
  { label: 'Every 6 hours', value: 'Every 6 hours' },
  { label: 'Every 8 hours', value: 'Every 8 hours' },
  { label: 'As needed', value: 'As needed' },
];

const MedicineCard = ({ med, onDelete, onEdit, onSpeak }) => (
  <View style={{ 
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
    borderColor: '#F3F4F6',
  }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      {/* Medicine Icon */}
      <View style={{
        width: 52,
        height: 52,
        backgroundColor: '#EEF2FF',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
      }}>
        <Text style={{ fontSize: 26 }}>💊</Text>
      </View>
      
      {/* Medicine Info */}
      <View style={{ flex: 1 }}>
        {/* Name and Actions Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <Text style={{ 
            fontSize: 17, 
            fontWeight: '700', 
            color: '#1F2937', 
            flex: 1,
            marginRight: spacing.sm,
          }}>
            {String(med.name || '')}
          </Text>
          
          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable 
              onPress={onSpeak} 
              style={{ 
                width: 36, 
                height: 36, 
                backgroundColor: '#FEF3C7', 
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16 }}>🔊</Text>
            </Pressable>
            <Pressable 
              onPress={onEdit} 
              style={{ 
                width: 36, 
                height: 36, 
                backgroundColor: '#DBEAFE', 
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16 }}>✏️</Text>
            </Pressable>
            <Pressable 
              onPress={onDelete} 
              style={{ 
                width: 36, 
                height: 36, 
                backgroundColor: '#FEE2E2', 
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </Pressable>
          </View>
        </View>
        
        {/* Medicine Details - Pill Tags */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            backgroundColor: '#F3F4F6',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
          }}>
            <Text style={{ fontSize: 12, marginRight: 4 }}>💉</Text>
            <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500' }}>{String(med.dosage || '-')}</Text>
          </View>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            backgroundColor: '#F3F4F6',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
          }}>
            <Text style={{ fontSize: 12, marginRight: 4 }}>📅</Text>
            <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500' }}>{String(med.frequency || '-')}</Text>
          </View>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            backgroundColor: '#F3F4F6',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
          }}>
            <Text style={{ fontSize: 12, marginRight: 4 }}>⏳</Text>
            <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500' }}>{String(med.duration || '-')}</Text>
          </View>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            backgroundColor: '#F3F4F6',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
          }}>
            <Text style={{ fontSize: 12, marginRight: 4 }}>📦</Text>
            <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '500' }}>{String(med.quantity || 0)} units</Text>
          </View>
        </View>
        
        {/* Reminders Section */}
        {med.reminders && med.reminders.length > 0 && (
          <View style={{ 
            backgroundColor: '#ECFDF5', 
            padding: 12, 
            borderRadius: 12, 
            marginBottom: 10,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 14, marginRight: 6 }}>⏰</Text>
              <Text style={{ 
                fontSize: 13, 
                fontWeight: '600', 
                color: '#065F46',
              }}>
                Reminders Active
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {med.reminders.map((r, i) => (
                <View 
                  key={i} 
                  style={{ 
                    backgroundColor: '#A7F3D0', 
                    paddingHorizontal: 12, 
                    paddingVertical: 6, 
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ 
                    fontSize: 13, 
                    color: '#064E3B', 
                    fontWeight: '600',
                  }}>
                    {String(r)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Notes */}
        {med.notes ? (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'flex-start',
            backgroundColor: '#FFFBEB',
            padding: 10,
            borderRadius: 10,
          }}>
            <Text style={{ fontSize: 14, marginRight: 6 }}>📝</Text>
            <Text style={{ 
              fontSize: 13, 
              color: '#92400E', 
              flex: 1,
              lineHeight: 18,
            }}>
              {String(med.notes)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  </View>
);

const StatCard = ({ title, value, gradient, icon }) => (
  <View style={{
    flex: 1,
    backgroundColor: gradient === 'blue' ? '#3B82F6' : '#22C55E',
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: gradient === 'blue' ? '#3B82F6' : '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  }}>
    {/* Decorative circle */}
    <View style={{
      position: 'absolute',
      top: -20,
      right: -20,
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.15)',
    }} />
    <View style={{
      position: 'absolute',
      bottom: -30,
      left: -30,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255,255,255,0.1)',
    }} />
    
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <Text style={{ fontSize: 20, marginRight: 6 }}>{icon || (gradient === 'blue' ? '💊' : '📄')}</Text>
      <Text style={{ 
        fontSize: 12, 
        fontWeight: '600', 
        color: 'rgba(255,255,255,0.9)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {String(title)}
      </Text>
    </View>
    <Text style={{ 
      fontSize: 32, 
      fontWeight: '800', 
      color: '#FFFFFF',
      letterSpacing: -1,
    }}>
      {String(value)}
    </Text>
  </View>
);

export default function PrescriptionScreen({ navigation }) {
  const { user, isAuthenticated } = useAuth();
  
  // Medicines state (local)
  const [medicines, setMedicines] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
    reminders: [],
    notes: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  
  // Image analysis state
  const [imageUri, setImageUri] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  
  // Prescription history state (from API)
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('manage');
  
  // Error state
  const [error, setError] = useState(null);

  // Configure notifications on mount
  useEffect(() => {
    configureNotifications();
    requestNotificationPermissions();
  }, []);

  // Load medicines from AsyncStorage on mount
  useEffect(() => {
    loadMedicines();
    if (isAuthenticated) {
      fetchPrescriptionHistory();
    }
  }, [isAuthenticated]);

  // Save medicines to AsyncStorage whenever they change
  useEffect(() => {
    saveMedicines();
  }, [medicines]);

  // Configure how notifications are displayed
  const configureNotifications = () => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  };

  // Request notification permissions
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

  // Schedule a medicine reminder notification
  const scheduleMedicineReminder = async (medicineName, dosage, timeString, medicineId) => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      
      // Schedule daily recurring notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Medicine Reminder',
          body: `Time to take ${medicineName} - ${dosage}`,
          data: { medicineId, time: timeString },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });

      // Store notification ID
      await AsyncStorage.setItem(
        `med_reminder_${medicineId}_${timeString.replace(':', '')}`,
        JSON.stringify({
          notificationId,
          medicineId,
          medicineName,
          time: timeString,
        })
      );

      console.log('✅ Medicine reminder scheduled:', notificationId, 'for', timeString);
      return notificationId;
    } catch (error) {
      console.error('❌ Error scheduling medicine reminder:', error);
      throw error;
    }
  };

  // Cancel a medicine reminder
  const cancelMedicineReminder = async (medicineId, timeString) => {
    try {
      const key = `med_reminder_${medicineId}_${timeString.replace(':', '')}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        const { notificationId } = JSON.parse(stored);
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        await AsyncStorage.removeItem(key);
        console.log('✅ Cancelled reminder:', notificationId);
      }
    } catch (error) {
      console.error('❌ Error cancelling reminder:', error);
    }
  };

  const loadMedicines = async () => {
    try {
      const saved = await AsyncStorage.getItem('prescriptions');
      if (saved) {
        setMedicines(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load medicines:', err);
    }
  };

  const saveMedicines = async () => {
    try {
      await AsyncStorage.setItem('prescriptions', JSON.stringify(medicines));
    } catch (err) {
      console.error('Failed to save medicines:', err);
    }
  };

  const fetchPrescriptionHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/prescriptions/');
      if (Array.isArray(response)) {
        setPrescriptionHistory(response);
      }
    } catch (err) {
      console.error('Failed to fetch prescription history:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrescriptionHistory();
    setRefreshing(false);
  }, []);

  const handleAddMedicine = async () => {
    if (!formData.name || !formData.dosage || !formData.frequency) {
      RNAlert.alert('Required Fields', 'Please fill in Medicine Name, Dosage, and Frequency');
      return;
    }

    const medicineId = editingId || Date.now();
    const medicineData = {
      ...formData,
      id: medicineId,
      quantity: parseInt(formData.quantity) || 0,
      reminders: formData.reminders || [],
    };

    // Schedule notifications for all reminders
    if (formData.reminders && formData.reminders.length > 0) {
      let scheduledCount = 0;
      for (const time of formData.reminders) {
        try {
          await scheduleMedicineReminder(formData.name, formData.dosage, time, medicineId);
          scheduledCount++;
        } catch (err) {
          console.error('Failed to schedule reminder for', time, err);
        }
      }
      
      if (scheduledCount > 0) {
        RNAlert.alert(
          '🔔 Reminders Set!',
          `${scheduledCount} daily reminder(s) scheduled for ${formData.name}. You will be notified at the specified times.`,
          [{ text: 'OK' }]
        );
      }
    }

    if (editingId) {
      setMedicines(prev => prev.map(m =>
        m.id === editingId ? medicineData : m
      ));
      setEditingId(null);
    } else {
      setMedicines(prev => [...prev, medicineData]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      reminders: [],
      notes: '',
    });
    setShowForm(false);
    setEditingId(null);
    setSelectedTime(new Date());
  };

  const handleEditMedicine = (med) => {
    setFormData(med);
    setEditingId(med.id);
    setShowForm(true);
  };

  const handleDeleteMedicine = async (id) => {
    RNAlert.alert(
      'Delete Medicine',
      'Are you sure you want to delete this medicine? This will also cancel all reminders.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Cancel all reminders for this medicine
            const med = medicines.find(m => m.id === id);
            if (med && med.reminders) {
              for (const time of med.reminders) {
                await cancelMedicineReminder(id, time);
              }
            }
            setMedicines(prev => prev.filter(m => m.id !== id));
          },
        },
      ]
    );
  };

  const handleSpeakMedicine = (med) => {
    // TTS functionality - can integrate with expo-speech
    const text = `${med.name}. Dosage: ${med.dosage}. Frequency: ${med.frequency}. ${med.notes || ''}`;
    RNAlert.alert('Medicine Info', text);
  };

  // Handle time picker change
  const handleTimeChange = (event, selected) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (event.type === 'dismissed') {
      return;
    }
    
    if (selected) {
      setSelectedTime(selected);
      const hours = selected.getHours().toString().padStart(2, '0');
      const minutes = selected.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      // Add the time to reminders if not already present
      if (!formData.reminders.includes(timeString)) {
        setFormData(prev => ({
          ...prev,
          reminders: [...(prev.reminders || []), timeString].sort(),
        }));
      } else {
        RNAlert.alert('Duplicate', 'This reminder time is already added');
      }
    }
  };

  const removeReminder = (index) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index),
    }));
  };

  // Image picker and analysis
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      RNAlert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setAnalysisResult(null);
      setAnalysisError('');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      RNAlert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setAnalysisResult(null);
      setAnalysisError('');
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri) {
      setAnalysisError('Please select an image first');
      return;
    }

    setAnalyzing(true);
    setAnalysisError('');
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'medicine.jpg',
      });

      const response = await apiClient.uploadFile('/medicine-identification/analyze', formData);

      if (response.analysis) {
        setAnalysisResult(response.analysis);
      } else {
        setAnalysisError('No analysis data received');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisError(`Failed to analyze: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCancelAnalysis = () => {
    setAnalyzing(false);
    setAnalysisError('Analysis cancelled');
  };

  const handleSaveAnalysisResult = async () => {
    if (!analysisResult) return;

    try {
      const prescriptionData = {
        medicine_name: analysisResult.medicine_name || 'Unknown Medicine',
        dosage: analysisResult.dosage || 'As prescribed',
        frequency: 'As per prescription',
        duration: 'As prescribed',
        notes: analysisResult.full_information || 'Medicine identified from image',
        doctor_name: 'AI Medicine Identification',
      };

      await apiClient.post('/prescriptions/', prescriptionData);

      // Add to local medicines list
      setMedicines(prev => [...prev, {
        id: Date.now(),
        name: analysisResult.medicine_name || 'Unknown Medicine',
        dosage: analysisResult.dosage || 'As prescribed',
        frequency: 'As per prescription',
        duration: 'As prescribed',
        quantity: 0,
        reminders: [],
        notes: analysisResult.full_information || 'Medicine identified from image',
      }]);

      // Refresh history
      fetchPrescriptionHistory();

      // Reset analysis state
      setAnalysisResult(null);
      setImageUri(null);

      RNAlert.alert('Success', 'Prescription saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      setAnalysisError(`Failed to save: ${err.message}`);
    }
  };

  const handleDeletePrescription = async (id) => {
    RNAlert.alert(
      'Delete Prescription',
      'Are you sure you want to delete this prescription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/prescriptions/${id}`);
              setPrescriptionHistory(prev => prev.filter(p => p.id !== id));
            } catch (err) {
              console.error('Delete error:', err);
              setError('Failed to delete prescription');
            }
          },
        },
      ]
    );
  };

  const stats = {
    totalMedicines: medicines.length,
    totalPrescriptions: prescriptionHistory.length,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F0FDF4' }}
      contentContainerStyle={{ padding: spacing.md, paddingTop: spacing.lg + 92 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: '#DCFCE7',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.sm,
          }}>
            <Text style={{ fontSize: 24 }}>💊</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 22, 
              fontWeight: '800', 
              color: '#166534',
              letterSpacing: -0.5,
            }}>
              Prescription & Medicine
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: '#6B7280',
              marginTop: 2,
            }}>
              Upload, track, and set reminders
            </Text>
          </View>
        </View>
      </View>

      {error && (
        <Alert
          type="error"
          message={error}
          onDismiss={() => setError(null)}
          dismissAfter={5000}
        />
      )}

      {/* Quick Stats */}
      <View style={{ 
        flexDirection: 'row', 
        gap: spacing.md, 
        marginBottom: spacing.xl,
      }}>
        <StatCard title="Medicines" value={stats.totalMedicines} gradient="blue" icon="💊" />
        <StatCard title="Prescriptions" value={stats.totalPrescriptions} gradient="green" icon="📄" />
      </View>

      {/* Tab Navigation - Modern Segmented Control */}
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
          onPress={() => setActiveTab('manage')}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            paddingHorizontal: spacing.md,
            borderRadius: 12,
            backgroundColor: activeTab === 'manage' ? '#FFFFFF' : 'transparent',
            shadowColor: activeTab === 'manage' ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: activeTab === 'manage' ? 0.1 : 0,
            shadowRadius: 4,
            elevation: activeTab === 'manage' ? 3 : 0,
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 8 }}>📋</Text>
          <Text style={{
            fontSize: 15,
            fontWeight: '700',
            color: activeTab === 'manage' ? '#1F2937' : '#6B7280',
            letterSpacing: 0.3,
          }}>
            Manage
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('analyze')}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            paddingHorizontal: spacing.md,
            borderRadius: 12,
            backgroundColor: activeTab === 'analyze' ? '#FFFFFF' : 'transparent',
            shadowColor: activeTab === 'analyze' ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: activeTab === 'analyze' ? 0.1 : 0,
            shadowRadius: 4,
            elevation: activeTab === 'analyze' ? 3 : 0,
          }}
        >
          <Text style={{ fontSize: 18, marginRight: 8 }}>🔬</Text>
          <Text style={{
            fontSize: 15,
            fontWeight: '700',
            color: activeTab === 'analyze' ? '#1F2937' : '#6B7280',
            letterSpacing: 0.3,
          }}>
            Identify
          </Text>
        </Pressable>
      </View>

      {/* Analyze Tab Content */}
      {activeTab === 'analyze' && (
        <Card variant="elevated" padding="lg" style={{ 
          marginBottom: spacing.lg,
          borderRadius: 20,
        }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginBottom: spacing.lg,
          }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: '#EEF2FF',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.sm,
            }}>
              <Text style={{ fontSize: 22 }}>🔬</Text>
            </View>
            <View>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '700', 
                color: '#1F2937',
              }}>
                AI Medicine Identification
              </Text>
              <Text style={{ 
                fontSize: 13, 
                color: '#6B7280',
              }}>
                Scan to identify medicines
              </Text>
            </View>
          </View>

          {/* Image Upload Section */}
          <View style={{
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: '#93C5FD',
            borderRadius: 12,
            padding: spacing.lg,
            backgroundColor: '#EFF6FF',
            marginBottom: spacing.md,
          }}>
            {!imageUri ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📸</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    title="📷 Camera"
                    onPress={takePhoto}
                    variant="primary"
                  />
                  <Button
                    title="🖼️ Gallery"
                    onPress={pickImage}
                    variant="secondary"
                  />
                </View>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
                  Take a photo or select from gallery
                </Text>
              </View>
            ) : (
              <View>
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: spacing.md }}
                  resizeMode="contain"
                />
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    title="Change"
                    onPress={pickImage}
                    variant="secondary"
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Clear"
                    onPress={() => {
                      setImageUri(null);
                      setAnalysisResult(null);
                      setAnalysisError('');
                    }}
                    variant="danger"
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Analyze Button */}
          {imageUri && !analyzing && !analysisResult && (
            <Button
              title="🔍 Analyze Now"
              onPress={handleAnalyze}
              variant="primary"
              fullWidth
              style={{ marginBottom: spacing.md }}
            />
          )}

          {/* Loading State */}
          {analyzing && (
            <View style={{ alignItems: 'center', padding: spacing.lg, backgroundColor: '#EFF6FF', borderRadius: 8, marginBottom: spacing.md }}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={[typography.body, { color: '#1E40AF', marginTop: spacing.sm }]}>Analyzing... Please wait</Text>
              <Button
                title="⛔ Cancel"
                onPress={handleCancelAnalysis}
                variant="danger"
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}

          {/* Error Display */}
          {analysisError ? (
            <View style={{ backgroundColor: '#FEF2F2', padding: spacing.md, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#EF4444', marginBottom: spacing.md }}>
              <Text style={{ color: '#991B1B', fontWeight: '600' }}>{String(analysisError)}</Text>
            </View>
          ) : null}

          {/* Analysis Results */}
          {analysisResult && (
            <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: spacing.md, borderWidth: 2, borderColor: '#86EFAC' }}>
              <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>📋 Analysis Results</Text>

              {analysisResult.medicine_name && (
                <View style={{ backgroundColor: '#FEFCE8', padding: spacing.md, borderRadius: 8, marginBottom: spacing.sm }}>
                  <Text style={[typography.labelSmall, { color: '#166534' }]}>Medicine Name</Text>
                  <Text style={[typography.h4, { color: '#166534' }]}>💊 {String(analysisResult.medicine_name)}</Text>
                </View>
              )}

              {analysisResult.dosage && (
                <View style={{ backgroundColor: '#FFFFFF', padding: spacing.sm, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#3B82F6', marginBottom: spacing.sm }}>
                  <Text style={[typography.labelSmall, { color: '#1E40AF' }]}>Dosage</Text>
                  <Text style={[typography.body, { color: colors.text }]}>💉 {String(analysisResult.dosage)}</Text>
                </View>
              )}

              {analysisResult.category && (
                <View style={{ backgroundColor: '#FFFFFF', padding: spacing.sm, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#9333EA', marginBottom: spacing.sm }}>
                  <Text style={[typography.labelSmall, { color: '#6B21A8' }]}>Category</Text>
                  <Text style={[typography.body, { color: colors.text }]}>🏷️ {String(analysisResult.category)}</Text>
                </View>
              )}

              {analysisResult.manufacturer && (
                <View style={{ backgroundColor: '#FFFFFF', padding: spacing.sm, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#4F46E5', marginBottom: spacing.sm }}>
                  <Text style={[typography.labelSmall, { color: '#3730A3' }]}>Manufacturer</Text>
                  <Text style={[typography.body, { color: colors.text }]}>🏭 {String(analysisResult.manufacturer)}</Text>
                </View>
              )}

              {analysisResult.price && (
                <View style={{ backgroundColor: '#FFFFFF', padding: spacing.sm, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#F59E0B', marginBottom: spacing.sm }}>
                  <Text style={[typography.labelSmall, { color: '#B45309' }]}>Price</Text>
                  <Text style={[typography.h4, { color: '#B45309' }]}>💰 {String(analysisResult.price)}</Text>
                </View>
              )}

              {analysisResult.full_information && (
                <View style={{ backgroundColor: '#EFF6FF', padding: spacing.sm, borderRadius: 8, borderWidth: 2, borderColor: '#BFDBFE', marginBottom: spacing.md }}>
                  <Text style={[typography.labelSmall, { color: '#1E40AF', marginBottom: 4 }]}>ℹ️ Additional Information</Text>
                  <Text style={[typography.caption, { color: colors.text }]}>{String(analysisResult.full_information)}</Text>
                </View>
              )}

              <Button
                title="✓ Save to Prescriptions"
                onPress={handleSaveAnalysisResult}
                variant="primary"
                fullWidth
              />
            </View>
          )}
        </Card>
      )}

      {/* Manage Tab Content */}
      {activeTab === 'manage' && (
        <>
          {/* Prescription History Section */}
          <Card variant="elevated" padding="md" style={{ 
            marginBottom: spacing.lg,
            borderRadius: 20,
          }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: spacing.md,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: '#FEF3C7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                }}>
                  <Text style={{ fontSize: 18 }}>📚</Text>
                </View>
                <View>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '700', 
                    color: '#1F2937',
                  }}>
                    Prescription History
                  </Text>
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#6B7280',
                  }}>
                    {prescriptionHistory.length} records
                  </Text>
                </View>
              </View>
              <Button
                title={showHistory ? 'Hide' : 'Show'}
                onPress={() => {
                  setShowHistory(!showHistory);
                  if (!showHistory) fetchPrescriptionHistory();
                }}
                variant="secondary"
                size="sm"
              />
            </View>

            {showHistory && (
              loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : prescriptionHistory.length === 0 ? (
                <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg }]}>
                  No prescription history found
                </Text>
              ) : (
                prescriptionHistory.map(prescription => (
                  <View
                    key={prescription.id}
                    style={{
                      backgroundColor: '#F9FAFB',
                      padding: spacing.sm,
                      borderRadius: 8,
                      marginBottom: spacing.sm,
                      borderLeftWidth: 4,
                      borderLeftColor: colors.primary,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.body, { fontWeight: '600', color: colors.text }]}>{String(prescription.medicine_name || '')}</Text>
                        <Text style={[typography.caption, { color: colors.textSecondary }]}>
                          {String(prescription.dosage || '')} • {String(prescription.frequency || '')}
                        </Text>
                        <Text style={[typography.caption, { color: colors.textSecondary }]}>
                          {prescription.created_at ? new Date(prescription.created_at).toLocaleDateString() : ''}
                        </Text>
                      </View>
                      <Pressable onPress={() => handleDeletePrescription(prescription.id)} style={{ padding: 8 }}>
                        <Text>🗑️</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )
            )}
          </Card>

          {/* Your Medicines Section */}
          <Card variant="elevated" padding="md" style={{ 
            marginBottom: spacing.lg,
            borderRadius: 20,
          }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: spacing.md,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: '#DBEAFE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                }}>
                  <Text style={{ fontSize: 18 }}>💊</Text>
                </View>
                <View>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '700', 
                    color: '#1F2937',
                  }}>
                    Your Medicines
                  </Text>
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#6B7280',
                  }}>
                    {medicines.length} medicine{medicines.length !== 1 ? 's' : ''} tracked
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  resetForm();
                  setShowForm(true);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#3B82F6',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Text style={{ fontSize: 16, color: '#FFFFFF', marginRight: 4 }}>+</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Add</Text>
              </Pressable>
            </View>

            {medicines.length === 0 ? (
              <View style={{ 
                alignItems: 'center', 
                paddingVertical: spacing.xl,
                backgroundColor: '#F9FAFB',
                borderRadius: 16,
              }}>
                <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>💊</Text>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: '#6B7280',
                  marginBottom: 4,
                }}>
                  No medicines yet
                </Text>
                <Text style={{ 
                  fontSize: 13, 
                  color: '#9CA3AF',
                  textAlign: 'center',
                }}>
                  Tap "+ Add" to start tracking
                </Text>
              </View>
            ) : (
              medicines.map(med => (
                <MedicineCard
                  key={med.id}
                  med={med}
                  onDelete={() => handleDeleteMedicine(med.id)}
                  onEdit={() => handleEditMedicine(med)}
                  onSpeak={() => handleSpeakMedicine(med)}
                />
              ))
            )}
          </Card>
        </>
      )}

      {/* Add/Edit Medicine Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        transparent={true}
        onRequestClose={resetForm}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '90%' }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.lg }]}>
                {editingId ? '✏️ Edit Medicine' : '💊 Add Medicine'}
              </Text>

              {/* Medicine Name */}
              <View style={{ marginBottom: spacing.md }}>
                <Text style={[typography.labelSmall, { color: colors.textSecondary, marginBottom: spacing.xs }]}>Medicine Name *</Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Paracetamol"
                  style={{
                    borderWidth: 2,
                    borderColor: '#D1D5DB',
                    borderRadius: 8,
                    padding: spacing.sm,
                    fontSize: 16,
                  }}
                />
              </View>

              {/* Dosage */}
              <View style={{ marginBottom: spacing.md }}>
                <Text style={[typography.labelSmall, { color: colors.textSecondary, marginBottom: spacing.xs }]}>Dosage *</Text>
                <TextInput
                  value={formData.dosage}
                  onChangeText={(text) => setFormData({ ...formData, dosage: text })}
                  placeholder="e.g., 500mg"
                  style={{
                    borderWidth: 2,
                    borderColor: '#D1D5DB',
                    borderRadius: 8,
                    padding: spacing.sm,
                    fontSize: 16,
                  }}
                />
              </View>

              {/* Frequency */}
              <View style={{ marginBottom: spacing.md }}>
                <Text style={[typography.labelSmall, { color: colors.textSecondary, marginBottom: spacing.xs }]}>Frequency *</Text>
                <View style={{ borderWidth: 2, borderColor: '#D1D5DB', borderRadius: 8 }}>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => setFormData({ ...formData, frequency: option.value })}
                      style={{
                        padding: spacing.sm,
                        backgroundColor: formData.frequency === option.value ? '#DBEAFE' : 'transparent',
                        borderBottomWidth: option.value === 'As needed' ? 0 : 1,
                        borderBottomColor: '#E5E7EB',
                      }}
                    >
                      <Text style={{ color: formData.frequency === option.value ? '#2563EB' : colors.text }}>
                        {String(option.label)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Duration */}
              <View style={{ marginBottom: spacing.md }}>
                <Text style={[typography.labelSmall, { color: colors.textSecondary, marginBottom: spacing.xs }]}>Duration</Text>
                <TextInput
                  value={formData.duration}
                  onChangeText={(text) => setFormData({ ...formData, duration: text })}
                  placeholder="e.g., 5 days, 1 week"
                  style={{
                    borderWidth: 2,
                    borderColor: '#D1D5DB',
                    borderRadius: 8,
                    padding: spacing.sm,
                    fontSize: 16,
                  }}
                />
              </View>

              {/* Quantity */}
              <View style={{ marginBottom: spacing.md }}>
                <Text style={[typography.labelSmall, { color: colors.textSecondary, marginBottom: spacing.xs }]}>Quantity</Text>
                <TextInput
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  placeholder="e.g., 10"
                  keyboardType="numeric"
                  style={{
                    borderWidth: 2,
                    borderColor: '#D1D5DB',
                    borderRadius: 8,
                    padding: spacing.sm,
                    fontSize: 16,
                  }}
                />
              </View>

              {/* Notes */}
              <View style={{ marginBottom: spacing.md }}>
                <Text style={[typography.labelSmall, { color: colors.textSecondary, marginBottom: spacing.xs }]}>Instructions/Notes</Text>
                <TextInput
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="e.g., Take after food"
                  multiline
                  numberOfLines={3}
                  style={{
                    borderWidth: 2,
                    borderColor: '#D1D5DB',
                    borderRadius: 8,
                    padding: spacing.sm,
                    fontSize: 16,
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              {/* Reminder Times */}
              <View style={{ marginBottom: spacing.md }}>
                <Text style={[typography.labelSmall, { color: colors.textSecondary, marginBottom: spacing.xs }]}>🔔 Reminder Times (Daily Notifications)</Text>
                
                {/* Add Reminder Button */}
                <Pressable
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#EFF6FF',
                    borderWidth: 2,
                    borderColor: '#3B82F6',
                    borderRadius: 8,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  }}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={{ fontSize: 20, marginRight: 8 }}>⏰</Text>
                  <Text style={{ color: '#2563EB', fontWeight: '600', fontSize: 16 }}>
                    Add Reminder Time
                  </Text>
                </Pressable>

                {/* Time Picker */}
                {showTimePicker && (
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                  />
                )}

                {/* Display Added Reminders */}
                {formData.reminders && formData.reminders.length > 0 && (
                  <View style={{ marginTop: spacing.sm }}>
                    <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
                      Tap a reminder to remove it:
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                      {formData.reminders.map((r, i) => (
                        <Pressable
                          key={i}
                          onPress={() => removeReminder(i)}
                          style={{ 
                            backgroundColor: '#DCFCE7', 
                            paddingHorizontal: 14, 
                            paddingVertical: 8, 
                            borderRadius: 20, 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            gap: 6,
                            borderWidth: 1,
                            borderColor: '#22C55E',
                          }}
                        >
                          <Text style={{ fontSize: 16 }}>🔔</Text>
                          <Text style={{ color: '#166534', fontSize: 14, fontWeight: '600' }}>{String(r)}</Text>
                          <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {formData.reminders && formData.reminders.length === 0 && (
                  <Text style={[typography.caption, { color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' }]}>
                    No reminders set. Tap above to add daily notification reminders.
                  </Text>
                )}
              </View>

              {/* Form Buttons */}
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                <Button
                  title={editingId ? 'Update' : 'Save'}
                  onPress={handleAddMedicine}
                  variant="primary"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Cancel"
                  onPress={resetForm}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}
