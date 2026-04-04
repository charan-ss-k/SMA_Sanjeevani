import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/environment';
import { useLanguage } from '../../context/LanguageContext';
import ttsService from '../../services/ttsService';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const MedicineRecommendationScreen = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [showSymptomsModal, setShowSymptomsModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTtsKey, setActiveTtsKey] = useState(null);
  const [isTtsProcessing, setIsTtsProcessing] = useState(false);
  const currentRequestRef = useRef(null);

  const stopTTSPlayback = useCallback(async () => {
    try {
      await ttsService.stop();
    } catch (_) {
      // noop
    }
    setActiveTtsKey(null);
    setIsTtsProcessing(false);
  }, []);

  const handleSpeak = async (key, text) => {
    const normalizedKey = String(key);
    const safeText = String(text || '').trim();
    if (!safeText) return;

    if (activeTtsKey === normalizedKey) {
      await stopTTSPlayback();
      return;
    }

    try {
      setActiveTtsKey(normalizedKey);
      setIsTtsProcessing(true);
      await ttsService.synthesizeAndPlay(safeText, language);
    } catch (error) {
      Alert.alert('TTS', 'Unable to play audio for this item');
    } finally {
      setActiveTtsKey(null);
      setIsTtsProcessing(false);
    }
  };

  const renderSpeakButton = (key, text) => {
    const isSpeaking = activeTtsKey === String(key);
    const isProcessing = isSpeaking && isTtsProcessing;

    return (
      <TouchableOpacity
        onPress={() => handleSpeak(key, text)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 10,
          backgroundColor: isSpeaking ? '#FEE2E2' : '#E0F2FE',
          borderWidth: 1,
          borderColor: isSpeaking ? '#FCA5A5' : '#BAE6FD',
          gap: 6,
        }}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#0369A1" />
        ) : (
          <MaterialCommunityIcons
            name={isSpeaking ? 'stop-circle-outline' : 'volume-high'}
            size={14}
            color="#0369A1"
          />
        )}
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
          {isProcessing ? 'Processing...' : isSpeaking ? 'Stop' : 'Speak'}
        </Text>
      </TouchableOpacity>
    );
  };

  // Predefined symptoms from frontend - convert to dropdown format
  const predefinedSymptoms = [
    { label: 'Fever', value: 'fever' },
    { label: 'Headache', value: 'headache' },
    { label: 'Body Pain', value: 'body pain' },
    { label: 'Cough', value: 'cough' },
    { label: 'Cold', value: 'cold' },
    { label: 'Sore Throat', value: 'sore throat' },
    { label: 'Fatigue', value: 'fatigue' },
    { label: 'Nausea', value: 'nausea' },
    { label: 'Vomiting', value: 'vomiting' },
    { label: 'Diarrhea', value: 'diarrhea' },
    { label: 'Constipation', value: 'constipation' },
    { label: 'Stomach Pain', value: 'stomach pain' },
    { label: 'Rash', value: 'rash' },
    { label: 'Itching', value: 'itching' },
    { label: 'Dizziness', value: 'dizziness' },
    { label: 'Back Pain', value: 'back pain' },
    { label: 'Joint Pain', value: 'joint pain' },
    { label: 'Muscle Pain', value: 'muscle pain' },
    { label: 'Weakness', value: 'weakness' },
    { label: 'Chills', value: 'chills' },
    { label: 'Sweating', value: 'sweating' },
    { label: 'Loss of Appetite', value: 'loss of appetite' },
    { label: 'Insomnia', value: 'insomnia' },
    { label: 'Anxiety', value: 'anxiety' },
    { label: 'Dry Cough', value: 'dry cough' },
    { label: 'Runny Nose', value: 'runny nose' },
    { label: 'Eye Irritation', value: 'eye irritation' },
    { label: 'Chest Pain', value: 'chest pain' },
    { label: 'Shortness of Breath', value: 'shortness of breath' }
  ];

  // Form state
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState('male');
  const [selectedSymptoms, setSelectedSymptoms] = useState(['fever', 'headache']); // Default like frontend
  const [symptoms, setSymptoms] = useState(''); // Additional symptoms
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [pregnant, setPregnant] = useState(false);

  const resetRecommendationState = useCallback(() => {
    stopTTSPlayback();
    setResult(null);
    setShowForm(true);
    setShowSymptomsModal(false);
    setSearchText('');
    setSelectedSymptoms(['fever', 'headache']);
    setSymptoms('');
    setAllergies('');
    setConditions('');
    setAge('25');
    setGender('male');
    setPregnant(false);
    setLoading(false);
  }, [stopTTSPlayback]);

  useFocusEffect(
    useCallback(() => {
      resetRecommendationState();

      return () => {
        if (currentRequestRef.current) {
          currentRequestRef.current.abort();
          currentRequestRef.current = null;
        }
        stopTTSPlayback();
        setShowSymptomsModal(false);
        setSearchText('');
        setLoading(false);
      };
    }, [resetRecommendationState, stopTTSPlayback])
  );

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSymptomsChange = (values) => {
    setSelectedSymptoms(values);
  };

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0 && !symptoms.trim()) {
      Alert.alert('Error', 'Please select at least one symptom');
      return;
    }

    setLoading(true);
    const requestController = new AbortController();
    currentRequestRef.current = requestController;
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      // Combine selected symptoms and custom symptoms
      let allSymptoms = [...selectedSymptoms];
      if (symptoms.trim()) {
        const customSymptoms = symptoms.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
        allSymptoms = [...new Set([...allSymptoms, ...customSymptoms])];
      }
      
      const allergiesArray = allergies.split(',').map(s => s.trim()).filter(s => s);
      const conditionsArray = conditions.split(',').map(s => s.trim()).filter(s => s);

      const payload = {
        age: parseInt(age),
        gender,
        symptoms: allSymptoms,
        allergies: allergiesArray,
        existing_conditions: conditionsArray,
        pregnancy_status: pregnant,
        language,
      };

      console.log('Sending symptom recommendation request:', payload);

      const response = await fetch(`${API_BASE_URL}/symptoms/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: requestController.signal,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Symptom recommendation response:', data);

      if (response.ok) {
        setResult(data);
        setShowForm(false);
      } else {
        throw new Error(data.detail || 'Failed to get recommendation');
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }
      console.error('Error getting medicine recommendation:', error);
      Alert.alert('Error', `Failed to get recommendation: ${error.message}`);
    } finally {
      if (currentRequestRef.current === requestController) {
        currentRequestRef.current = null;
      }
      setLoading(false);
    }
  };

  const handleReset = () => {
    resetRecommendationState();
  };

  const renderForm = () => (
    <View style={styles.formContainer}>
      {/* Personal Information Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBadge}>
            <MaterialCommunityIcons name="account-outline" size={24} color="#166534" style={styles.sectionIconText} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Text style={styles.sectionSubtitle}>Help us personalize your recommendation</Text>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age (Years)</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.ageInput}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="25"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.inputSuffix}>years</Text>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderContainer}>
            {[
              { value: 'male', icon: 'account', label: 'Male' },
              { value: 'female', icon: 'account', label: 'Female' },
              { value: 'other', icon: 'account', label: 'Other' }
            ].map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.genderOption, gender === g.value && styles.genderSelected]}
                onPress={() => setGender(g.value)}
              >
                <MaterialCommunityIcons name={g.icon} size={18} color={gender === g.value ? '#166534' : '#6B7280'} style={styles.genderIcon} />
                <Text style={[styles.genderText, gender === g.value && styles.genderSelectedText]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {gender === 'female' && (
            <TouchableOpacity
              style={styles.pregnancyCheckboxContainer}
              onPress={() => setPregnant(!pregnant)}
              activeOpacity={0.7}
            >
              <View style={[styles.pregnancyCheckbox, pregnant && styles.pregnancyCheckboxChecked]}>
                {pregnant && <Text style={styles.checkboxText}>✓</Text>}
              </View>
              <View style={styles.pregnancyTextContainer}>
                <Text style={styles.pregnancyCheckboxText}>I am currently pregnant</Text>
                <Text style={styles.pregnancyHelperText}>This affects medication safety</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Symptoms Section */}
      <View style={[styles.sectionContainer, styles.symptomsSection]}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBadge, styles.symptomsIconBadge]}>
            <MaterialCommunityIcons name="thermometer" size={24} color="#166534" style={styles.sectionIconText} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Tell Us About Your Symptoms</Text>
            <Text style={styles.sectionSubtitle}>Select what you're experiencing</Text>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, styles.requiredLabel]}>Select Common Symptoms</Text>
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredBadgeText}>Required</Text>
            </View>
          </View>
          <Text style={styles.helperText}>Choose from common symptoms below</Text>
          <TouchableOpacity 
            style={styles.dropdownTrigger}
            onPress={() => setShowSymptomsModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dropdownLeft}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={18} color="#374151" style={styles.dropdownIcon} />
              <Text style={styles.dropdownTriggerText}>
                {selectedSymptoms.length > 0 
                  ? `${selectedSymptoms.length} symptom${selectedSymptoms.length > 1 ? 's' : ''} selected`
                  : "-- Select Symptoms --"
                }
              </Text>
            </View>
            <View style={styles.dropdownArrowContainer}>
              <Text style={styles.dropdownArrow}>▼</Text>
            </View>
          </TouchableOpacity>
          {selectedSymptoms.length > 0 && (
            <View style={styles.selectedSymptomsContainer}>
              {selectedSymptoms.map((symptom) => (
                <View key={symptom} style={styles.selectedSymptomTag}>
                  <Text style={styles.selectedSymptomText}>
                    {predefinedSymptoms.find(s => s.value === symptom)?.label || symptom}
                  </Text>
                  <TouchableOpacity 
                    style={styles.removeSymptomButton}
                    onPress={() => toggleSymptom(symptom)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialCommunityIcons name="close" size={14} color="#64748B" style={styles.removeSymptomText} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Other Symptoms (Optional)</Text>
          <Text style={styles.helperText}>Enter additional symptoms separated by commas</Text>
          <TextInput
            style={[styles.input, styles.symptomsInput]}
            value={symptoms}
            onChangeText={setSymptoms}
            placeholder="e.g., unusual symptoms not listed above"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Allergies Section */}
      <View style={[styles.sectionContainer, styles.allergiesSection]}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBadge, styles.allergiesIconBadge]}>
            <MaterialCommunityIcons name="alert-outline" size={24} color="#DC2626" style={styles.sectionIconText} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Known Allergies</Text>
            <Text style={styles.sectionSubtitle}>Help us keep you safe</Text>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Allergies (Optional)</Text>
          <Text style={styles.helperText}>Enter allergies separated by commas</Text>
          <TextInput
            style={styles.input}
            value={allergies}
            onChangeText={setAllergies}
            placeholder="e.g., peanuts, shellfish, penicillin"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Conditions Section */}
      <View style={[styles.sectionContainer, styles.conditionsSection]}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBadge, styles.conditionsIconBadge]}>
            <MaterialCommunityIcons name="file-document-outline" size={24} color="#EA580C" style={styles.sectionIconText} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Existing Health Conditions</Text>
            <Text style={styles.sectionSubtitle}>Tell us about your medical history</Text>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Conditions (Optional)</Text>
          <Text style={styles.helperText}>Enter conditions separated by commas</Text>
          <TextInput
            style={styles.input}
            value={conditions}
            onChangeText={setConditions}
            placeholder="e.g., diabetes, hypertension, asthma"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.white} size="small" />
              <Text style={styles.loadingText}>Analyzing Your Symptoms...</Text>
            </View>
          ) : (
            <View style={styles.submitButtonContent}>
              <MaterialCommunityIcons name="magnify" size={18} color={colors.white} style={styles.submitButtonIcon} />
              <Text style={styles.submitButtonText}>Get Medicine Recommendation</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.submitHelperText}>
          Your data is processed securely and never stored
        </Text>
      </View>
    </View>
  );

  const renderResult = () => (
    <View style={styles.resultContainer}>
      {/* Result Header */}
      <View style={styles.resultHeader}>
        <View style={styles.resultSuccessIcon}>
          <MaterialCommunityIcons name="check-circle" size={28} color="#16A34A" style={styles.resultSuccessEmoji} />
        </View>
        <Text style={styles.resultTitle}>Your Personalized Recommendation</Text>
        <Text style={styles.resultSubtitle}>Based on your symptoms and health profile</Text>
        <View style={styles.resultBadgeRow}>
          <View style={styles.resultBadge}>
            <Text style={styles.resultBadgeText}>AI Analysis Complete</Text>
          </View>
        </View>
      </View>
      
      {/* Condition Card */}
      {result.predicted_condition && (
        <View style={[styles.resultCard, styles.conditionCard]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBadge, styles.conditionIconBadge]}>
              <MaterialCommunityIcons name="magnify" size={16} color="#1E40AF" style={styles.cardIconText} />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>Possible Condition</Text>
              <Text style={styles.cardSubtitle}>Based on symptom analysis</Text>
            </View>
            {renderSpeakButton('condition', result.predicted_condition)}
          </View>
          <View style={styles.conditionContentBox}>
            <Text style={styles.conditionText}>{result.predicted_condition}</Text>
          </View>
        </View>
      )}
      
      {/* Medicines Card */}
      {result.recommended_medicines && result.recommended_medicines.length > 0 && (
        <View style={[styles.resultCard, styles.medicinesCard]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBadge, styles.medicinesIconBadge]}>
              <MaterialCommunityIcons name="pill" size={16} color="#166534" style={styles.cardIconText} />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>Recommended Medicines</Text>
              <Text style={styles.cardSubtitle}>{result.recommended_medicines.length} medicine{result.recommended_medicines.length > 1 ? 's' : ''} suggested</Text>
            </View>
          </View>
          <View style={styles.medicinesContainer}>
            {result.recommended_medicines.map((medicine, index) => (
              <View key={index} style={styles.medicineDetailCard}>
                <View style={styles.medicineHeader}>
                  <View style={styles.medicineNumberBadge}>
                    <Text style={styles.medicineNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.medicineName}>
                    {typeof medicine === 'object' ? medicine.name : medicine}
                  </Text>
                  {renderSpeakButton(
                    `medicine-${index}`,
                    typeof medicine === 'object'
                      ? `${medicine.name || ''}. Dosage: ${medicine.dosage || 'As prescribed'}. Duration: ${medicine.duration || 'As advised'}. Instructions: ${medicine.instructions || ''}`
                      : String(medicine || '')
                  )}
                </View>
                {typeof medicine === 'object' && (
                  <View style={styles.medicineDetails}>
                    {medicine.dosage && (
                      <View style={styles.medicineDetailRow}>
                        <MaterialCommunityIcons name="chart-bar" size={14} color="#6B7280" style={styles.medicineDetailIcon} />
                        <Text style={styles.medicineDetail}>
                          <Text style={styles.medicineLabel}>Dosage: </Text>
                          {medicine.dosage}
                        </Text>
                      </View>
                    )}
                    {medicine.duration && (
                      <View style={styles.medicineDetailRow}>
                        <MaterialCommunityIcons name="timer-outline" size={14} color="#6B7280" style={styles.medicineDetailIcon} />
                        <Text style={styles.medicineDetail}>
                          <Text style={styles.medicineLabel}>Duration: </Text>
                          {medicine.duration}
                        </Text>
                      </View>
                    )}
                    {medicine.instructions && (
                      <View style={styles.medicineDetailRow}>
                        <MaterialCommunityIcons name="note-text-outline" size={14} color="#6B7280" style={styles.medicineDetailIcon} />
                        <Text style={styles.medicineDetail}>
                          <Text style={styles.medicineLabel}>Instructions: </Text>
                          {medicine.instructions}
                        </Text>
                      </View>
                    )}
                    {medicine.warnings && medicine.warnings.length > 0 && (
                      <View style={styles.warningsContainer}>
                        <View style={styles.warningsHeader}>
                          <MaterialCommunityIcons name="alert-outline" size={14} color="#DC2626" style={styles.warningsIcon} />
                          <Text style={styles.warningsLabel}>Warnings</Text>
                        </View>
                        {medicine.warnings.map((warning, wIndex) => (
                          <Text key={wIndex} style={styles.warningText}>
                            • {warning}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Home Care Advice Card */}
      {result.home_care_advice && (
        <View style={[styles.resultCard, styles.homeCard]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBadge, styles.homeIconBadge]}>
              <MaterialCommunityIcons name="home-outline" size={16} color="#7C3AED" style={styles.cardIconText} />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>Home Care Advice</Text>
              <Text style={styles.cardSubtitle}>Self-care recommendations</Text>
            </View>
            {renderSpeakButton(
              'home-care',
              Array.isArray(result.home_care_advice)
                ? result.home_care_advice.join('. ')
                : result.home_care_advice
            )}
          </View>
          {Array.isArray(result.home_care_advice) ? (
            <View style={styles.adviceContainer}>
              {result.home_care_advice.map((advice, index) => (
                <View key={index} style={styles.adviceItem}>
                  <View style={styles.adviceBulletContainer}>
                    <MaterialCommunityIcons name="check" size={12} color="#166534" style={styles.adviceBullet} />
                  </View>
                  <Text style={styles.adviceText}>{advice}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.cardContent}>{result.home_care_advice}</Text>
          )}
        </View>
      )}
      
      {/* Doctor Consultation Card */}
      {result.doctor_consultation_advice && (
        <View style={[styles.resultCard, styles.doctorCard]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBadge, styles.doctorIconBadge]}>
              <MaterialCommunityIcons name="doctor" size={16} color="#9A3412" style={styles.cardIconText} />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>Doctor Consultation</Text>
              <Text style={styles.cardSubtitle}>Professional medical advice</Text>
            </View>
            {renderSpeakButton('doctor-consult', result.doctor_consultation_advice)}
          </View>
          <View style={styles.doctorAdviceBox}>
            <Text style={styles.cardContent}>{result.doctor_consultation_advice}</Text>
          </View>
        </View>
      )}

      {/* Disclaimer Card */}
      <View style={styles.disclaimerCard}>
        <View style={styles.disclaimerHeader}>
          <MaterialCommunityIcons name="alert-outline" size={16} color="#B45309" style={styles.disclaimerIcon} />
          <Text style={styles.disclaimerTitle}>Important Disclaimer</Text>
        </View>
        <Text style={styles.disclaimerText}>
          This recommendation is for informational purposes only. Always consult with a healthcare professional before taking any medication or treatment.
        </Text>
      </View>

      {/* Reset Button */}
      <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.8}>
        <MaterialCommunityIcons name="refresh" size={16} color="#FFFFFF" style={styles.resetButtonIcon} />
        <Text style={styles.resetButtonText}>Get New Recommendation</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSymptomsModal = () => {
    const filteredSymptoms = searchText.trim() 
      ? predefinedSymptoms.filter(symptom => 
          symptom.label.toLowerCase().includes(searchText.toLowerCase())
        )
      : predefinedSymptoms;

    return (
      <Modal
        visible={showSymptomsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSymptomsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconBadge}>
                  <MaterialCommunityIcons name="thermometer" size={20} color="#166534" style={styles.modalIconText} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Select Symptoms</Text>
                  <Text style={styles.modalSubtitle}>Choose all that apply</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowSymptomsModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={18} color="#475569" style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.modalSearchContainer}>
              <MaterialCommunityIcons name="magnify" size={16} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search symptoms..."
                placeholderTextColor="#9ca3af"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <MaterialCommunityIcons name="close" size={14} color="#9CA3AF" style={styles.clearSearchText} />
                </TouchableOpacity>
              )}
            </View>

            {/* Selected Count Badge */}
            {selectedSymptoms.length > 0 && (
              <View style={styles.selectedCountBadge}>
                <Text style={styles.selectedCountText}>
                  {selectedSymptoms.length} symptom{selectedSymptoms.length > 1 ? 's' : ''} selected
                </Text>
              </View>
            )}
            
            {/* Symptoms List */}
            <FlatList
              data={filteredSymptoms}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedSymptoms.includes(item.value) && styles.modalItemSelected
                  ]}
                  onPress={() => toggleSymptom(item.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalItemLeft}>
                    <View style={[
                      styles.modalItemCheckbox,
                      selectedSymptoms.includes(item.value) && styles.modalItemCheckboxSelected
                    ]}>
                      {selectedSymptoms.includes(item.value) && (
                        <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" style={styles.modalCheckmark} />
                      )}
                    </View>
                    <Text style={[
                      styles.modalItemText,
                      selectedSymptoms.includes(item.value) && styles.modalItemTextSelected
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptySearchResult}>
                  <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" style={styles.emptySearchIcon} />
                  <Text style={styles.emptySearchText}>No symptoms found</Text>
                  <Text style={styles.emptySearchSubtext}>Try a different search term</Text>
                </View>
              }
            />
            
            {/* Done Button */}
            <TouchableOpacity 
              style={styles.modalDoneButton}
              onPress={() => {
                setShowSymptomsModal(false);
                setSearchText('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDoneText}>
                Done {selectedSymptoms.length > 0 && `(${selectedSymptoms.length} selected)`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Professional Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="pill" size={32} color="#166534" style={styles.headerIcon} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title} numberOfLines={2}>Medicine Recommendations</Text>
            <Text style={styles.subtitle}>Get personalized medicine recommendations based on your symptoms</Text>
          </View>
          <View style={styles.headerBadgeRow}>
            <View style={styles.headerBadge}>
              <MaterialCommunityIcons name="robot-outline" size={12} color="#334155" style={styles.headerBadgeIcon} />
              <Text style={styles.headerBadgeText}>AI-Powered</Text>
            </View>
            <View style={styles.headerBadge}>
              <MaterialCommunityIcons name="shield-check-outline" size={12} color="#334155" style={styles.headerBadgeIcon} />
              <Text style={styles.headerBadgeText}>Secure</Text>
            </View>
            <View style={styles.headerBadge}>
              <MaterialCommunityIcons name="flash-outline" size={12} color="#334155" style={styles.headerBadgeIcon} />
              <Text style={styles.headerBadgeText}>Instant</Text>
            </View>
          </View>
        </View>
        
        {showForm ? renderForm() : renderResult()}
      </ScrollView>
      
      {renderSymptomsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.lg + 84,
    paddingBottom: spacing.xxl,
  },
  
  // Professional Header Card
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#E6F8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#BFEDE6',
  },
  headerIcon: {
    fontSize: 32,
  },
  headerTextWrap: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#166534',
    marginBottom: spacing.sm,
    textAlign: 'center',
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 22,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: 4,
  },
  headerBadgeIcon: {
    fontSize: 12,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  
  // Form Styles
  formContainer: {
    flex: 1,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  sectionIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  symptomsIconBadge: {
    backgroundColor: '#f0fdf4',
  },
  allergiesIconBadge: {
    backgroundColor: '#fef2f2',
  },
  conditionsIconBadge: {
    backgroundColor: '#fff7ed',
  },
  sectionIconText: {
    fontSize: 24,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 4,
  },
  sectionHeader: {
    marginBottom: spacing.lg,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  
  // Section-specific colors - ALL PRESERVED
  symptomsSection: {
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  allergiesSection: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626', // Red
    backgroundColor: '#fef2f2',
  },
  conditionsSection: {
    borderLeftWidth: 4,
    borderLeftColor: '#ea580c',
    backgroundColor: '#fff7ed',
  },
  
  // Input Styles
  inputGroup: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  requiredLabel: {
    marginBottom: 0,
  },
  requiredBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626',
  },
  helperText: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  ageInput: {
    width: 84,
    borderWidth: 0,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#f9fafb',
    textAlign: 'center',
  },
  inputSuffix: {
    paddingRight: spacing.md,
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  symptomsInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  
  // Dropdown Styles
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 12,
    padding: spacing.md,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  dropdownTriggerText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  dropdownArrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold',
  },
  
  // Selected Symptoms Tags
  selectedSymptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  selectedSymptomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectedSymptomText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
    marginRight: 6,
  },
  removeSymptomButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeSymptomText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  modalIconText: {
    fontSize: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: '#374151',
  },
  clearSearchText: {
    fontSize: 14,
    color: '#9ca3af',
    padding: spacing.xs,
  },
  selectedCountBadge: {
    backgroundColor: '#f0fdf4',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  selectedCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },
  modalList: {
    paddingHorizontal: spacing.lg,
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemSelected: {
    backgroundColor: '#f0fdf4',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 0,
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalItemCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemCheckboxSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
  },
  modalItemTextSelected: {
    fontWeight: '600',
    color: '#166534',
  },
  modalCheckmark: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  emptySearchResult: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptySearchIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptySearchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  modalDoneButton: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    padding: spacing.lg,
    margin: spacing.lg,
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalDoneText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.white,
  },
  
  // Gender Selection
  genderContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderOption: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  genderSelected: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  genderIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  genderSelectedText: {
    color: colors.white,
  },
  
  // Pregnancy Checkbox
  pregnancyCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#f3e8ff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#c084fc',
  },
  pregnancyCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#9333ea',
    borderRadius: 6,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  pregnancyCheckboxChecked: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  pregnancyTextContainer: {
    flex: 1,
  },
  pregnancyCheckboxText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7c3aed',
  },
  pregnancyHelperText: {
    fontSize: 12,
    color: '#a78bfa',
    marginTop: 2,
  },
  checkboxText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Submit Button
  submitContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  submitButton: {
    backgroundColor: '#059669',
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitButtonIcon: {
    fontSize: 20,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 0.3,
  },
  submitHelperText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  
  // Results Styles
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  resultSuccessIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: '#16a34a',
  },
  resultSuccessEmoji: {
    fontSize: 32,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  resultBadgeRow: {
    flexDirection: 'row',
  },
  resultBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  
  // Result Cards
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  conditionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  medicinesCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  homeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ea580c',
  },
  doctorCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  conditionIconBadge: {
    backgroundColor: '#eff6ff',
  },
  medicinesIconBadge: {
    backgroundColor: '#f0fdf4',
  },
  homeIconBadge: {
    backgroundColor: '#fff7ed',
  },
  doctorIconBadge: {
    backgroundColor: '#fef2f2',
  },
  cardIconText: {
    fontSize: 22,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  cardContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4b5563',
  },
  
  // Condition Content
  conditionContentBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: spacing.md,
  },
  conditionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    lineHeight: 24,
  },
  
  // Doctor Advice Box
  doctorAdviceBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: spacing.md,
  },
  
  // Medicines List
  medicinesContainer: {
    gap: spacing.md,
  },
  medicineDetailCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  medicineNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  medicineNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    flex: 1,
  },
  medicineDetails: {
    marginLeft: 36,
  },
  medicineDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  medicineDetailIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
    marginTop: 2,
  },
  medicineDetail: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  medicineLabel: {
    fontWeight: '600',
    color: '#166534',
  },
  warningsContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  warningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  warningsIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  warningsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  warningText: {
    fontSize: 13,
    color: '#dc2626',
    marginBottom: spacing.xs,
    paddingLeft: spacing.md,
    lineHeight: 18,
  },
  
  // Home Care Advice List
  adviceContainer: {
    gap: spacing.sm,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  adviceBulletContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 1,
  },
  adviceBullet: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  adviceText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
    flex: 1,
  },
  
  // Legacy medicine item styles
  medicineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: spacing.md,
  },
  medicineBullet: {
    fontSize: 18,
    color: '#16a34a',
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  medicineText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
    flex: 1,
  },
  
  // Disclaimer
  disclaimerCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  disclaimerIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  disclaimerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#92400e',
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#92400e',
    textAlign: 'center',
  },
  
  // Reset Button
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#059669',
    borderRadius: 16,
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  resetButtonIcon: {
    fontSize: 18,
  },
  resetButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#059669',
  },
});

export default MedicineRecommendationScreen;