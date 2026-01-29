import React, { useState, useContext, useEffect } from 'react';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';
import { playTTS, stopAllTTS } from '../utils/tts';
import DoctorRecommendation from './DoctorRecommendation';
import AppointmentBooking from './AppointmentBooking';
import './ConsultPage.css';

const ConsultPage = () => {
  const { language } = useContext(LanguageContext);
  const [isMuted, setIsMuted] = useState(false);
  const [step, setStep] = useState('form'); // form, recommendations, booking
  const [formData, setFormData] = useState({
    symptoms: '',
    hospital_name: '',
    locality: '',
    city: '',
    state: '',
    language: 'english',
    specialization: '',
    languages_known: []
  });
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);

  const cities = [
    'Vellore', 'Kochi', 'Hyderabad', 'Mumbai', 'Bengaluru',
    'Kolkata', 'Delhi', 'New Delhi'
  ];

  const states = [
    'Tamil Nadu', 'Kerala', 'Telangana', 'Maharashtra',
    'Karnataka', 'West Bengal', 'Delhi'
  ];

  const [cityFilterOpen, setCityFilterOpen] = useState(false);
  const [stateFilterOpen, setStateFilterOpen] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState(cities);
  const [stateSuggestions, setStateSuggestions] = useState(states);

  const specializations = [
    'Cardiology', 'Ophthalmology', 'Psychiatry', 'General Medicine',
    'ENT', 'Dermatology', 'Gynecology', 'Neurology', 'Orthopedics',
    'Pediatrics'
  ];

  const languages = [
    'English', 'Telugu', 'Hindi', 'Marathi', 'Bengali',
    'Tamil', 'Kannada', 'Malayalam', 'Gujarati'
  ];

  const handleMuteToggle = () => {
    if (!isMuted) {
      stopAllTTS();
    }
    setIsMuted(!isMuted);
    if (isMuted) {
      playTTS(t('voiceUnmuted', language), language);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'city') {
      setFormData(prev => ({ ...prev, [name]: value }));
      const filtered = cities.filter(c => c.toLowerCase().includes(value.toLowerCase()));
      setCitySuggestions(filtered);
      setCityFilterOpen(true);
    } else if (name === 'state') {
      setFormData(prev => ({ ...prev, [name]: value }));
      const filtered = states.filter(s => s.toLowerCase().includes(value.toLowerCase()));
      setStateSuggestions(filtered);
      setStateFilterOpen(true);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCitySelect = (city) => {
    setFormData(prev => ({ ...prev, city }));
    setCityFilterOpen(false);
  };

  const handleStateSelect = (state) => {
    setFormData(prev => ({ ...prev, state }));
    setStateFilterOpen(false);
  };

  const handleLanguageChange = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages_known: prev.languages_known.includes(lang)
        ? prev.languages_known.filter(l => l !== lang)
        : [...prev.languages_known, lang]
    }));
  };

  const handleSearchDoctors = async () => {
    if (!formData.symptoms.trim() || !formData.locality || !formData.city || !formData.state || !formData.language) {
      alert('Please fill all required fields');
      if (!isMuted) playTTS('Please fill all required fields', language);
      return;
    }

    setLoading(true);
    try {
      const apiBase = window.__API_BASE__ || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/api/doctors/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setRecommendedDoctors(data.doctors || []);
      setStep('recommendations');
      
      if (!isMuted) {
        playTTS(`Found ${data.total} matching doctors`, language);
      }
    } catch (error) {
      console.error('Error searching doctors:', error);
      alert('Error searching for doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setStep('booking');
    if (!isMuted) {
      playTTS(`Selected ${doctor.doctor_name}`, language);
    }
  };

  const handleBookingComplete = () => {
    // Reset and show success
    setStep('form');
    setFormData({
      symptoms: '',
      hospital_name: '',
      locality: '',
      city: '',
      state: '',
      language: 'english',
      specialization: '',
      languages_known: []
    });
    setSelectedDoctor(null);
    if (!isMuted) {
      playTTS('Appointment booked successfully', language);
    }
  };

  return (
    <div className="consult-page">
      {/* Header with Mute Button */}
      <div className="consult-header">
        <div>
          <h1 className="consult-title">🏥 {t('consultDoctor', language) || 'Consult Doctor'}</h1>
          <p className="consult-subtitle">
            {t('findBestDoctor', language) || 'Find the best doctor for your health needs'}
          </p>
        </div>
        <button
          onClick={handleMuteToggle}
          className={`mute-btn ${isMuted ? 'muted' : 'unmuted'}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
      </div>

      {/* Step 1: Consultation Form */}
      {step === 'form' && (
        <div className="consult-form-section">
          <div className="form-container">
            <div className="form-group">
              <label>🏥 Hospital Name (Optional)</label>
              <input
                type="text"
                name="hospital_name"
                value={formData.hospital_name}
                onChange={handleInputChange}
                placeholder="Enter hospital name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>🩺 Symptoms (Required) *</label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                placeholder="Describe your symptoms in detail..."
                rows="4"
                className="form-textarea"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>📍 Locality (Required) *</label>
                <input
                  type="text"
                  name="locality"
                  value={formData.locality}
                  onChange={handleInputChange}
                  placeholder="e.g., Jubilee Hills"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>🏙️ City (Required) *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    onFocus={() => setCityFilterOpen(true)}
                    placeholder="Type city name..."
                    className="form-input"
                    autoComplete="off"
                  />
                  {cityFilterOpen && citySuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                      {citySuggestions.map(city => (
                        <div
                          key={city}
                          onClick={() => handleCitySelect(city)}
                          className="px-4 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100"
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>🗺️ State (Required) *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    onFocus={() => setStateFilterOpen(true)}
                    placeholder="Type state name..."
                    className="form-input"
                    autoComplete="off"
                  />
                  {stateFilterOpen && stateSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                      {stateSuggestions.map(state => (
                        <div
                          key={state}
                          onClick={() => handleStateSelect(state)}
                          className="px-4 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100"
                        >
                          {state}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>💬 Language to Communicate (Required) *</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  {languages.map(lang => (
                    <option key={lang.toLowerCase()} value={lang.toLowerCase()}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>👨‍⚕️ Doctor Specialization (Optional)</label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">All Specializations</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>🗣️ Languages Doctor Knows (Optional)</label>
              <div className="language-checkboxes">
                {languages.map(lang => (
                  <label key={lang} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.languages_known.includes(lang)}
                      onChange={() => handleLanguageChange(lang)}
                    />
                    {lang}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleSearchDoctors}
              disabled={loading}
              className="search-btn"
            >
              {loading ? '⏳ Searching...' : '🔍 Find Doctors'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Doctor Recommendations */}
      {step === 'recommendations' && (
        <DoctorRecommendation
          doctors={recommendedDoctors}
          onSelectDoctor={handleSelectDoctor}
          onBack={() => setStep('form')}
          language={language}
        />
      )}

      {/* Step 3: Appointment Booking */}
      {step === 'booking' && selectedDoctor && (
        <AppointmentBooking
          doctor={selectedDoctor}
          onComplete={handleBookingComplete}
          onBack={() => setStep('recommendations')}
          language={language}
        />
      )}
    </div>
  );
};

export default ConsultPage;
