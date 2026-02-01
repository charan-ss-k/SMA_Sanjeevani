import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../main';
import { LanguageContext } from '../main';
import FeatureLoginPrompt from './FeatureLoginPrompt';
import { t } from '../utils/translations';
import { playTTS } from '../utils/tts';

function speak(text, language) {
  if (!window.speechSynthesis) return;
  const ut = new SpeechSynthesisUtterance(text);
  const langMap = {
    english: 'en-US', telugu: 'te-IN', hindi: 'hi-IN', marathi: 'mr-IN',
    bengali: 'bn-IN', tamil: 'ta-IN', kannada: 'kn-IN', malayalam: 'ml-IN', gujarati: 'gu-IN',
  };
  ut.lang = langMap[language] || 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(ut);
}

const RemindersEnhanced = () => {
  const { isAuthenticated, authToken } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  
  // Medicine Management State
  const [medicines, setMedicines] = useState([]);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [medicineForm, setMedicineForm] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
    reminderTimes: [''],
    notes: ''
  });
  
  // Reminder State
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [takenMedicines, setTakenMedicines] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [reminderHistory, setReminderHistory] = useState([]);

  // Fetch medicines from database
  useEffect(() => {
    if (isAuthenticated) {
      fetchMedicines();
    }
  }, [isAuthenticated]);

  const fetchMedicines = async () => {
    try {
      const response = await fetch('/api/prescriptions/', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMedicines(data);
      }
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
    }
  };

  // Handle medicine form changes
  const handleFormChange = (field, value) => {
    setMedicineForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle reminder times
  const addReminderTime = () => {
    setMedicineForm(prev => ({
      ...prev,
      reminderTimes: [...prev.reminderTimes, '']
    }));
  };

  const updateReminderTime = (index, value) => {
    const newTimes = [...medicineForm.reminderTimes];
    newTimes[index] = value;
    setMedicineForm(prev => ({
      ...prev,
      reminderTimes: newTimes
    }));
  };

  const removeReminderTime = (index) => {
    setMedicineForm(prev => ({
      ...prev,
      reminderTimes: prev.reminderTimes.filter((_, i) => i !== index)
    }));
  };

  // Save medicine with reminders
  const handleSaveMedicine = async () => {
    try {
      const medicineData = {
        medicine_name: medicineForm.name,
        dosage: medicineForm.dosage,
        frequency: medicineForm.frequency,
        duration: medicineForm.duration,
        quantity: medicineForm.quantity,
        notes: medicineForm.notes,
        reminder_times: medicineForm.reminderTimes.filter(t => t), // Remove empty times
        doctor_name: 'Self-added',
        hospital: 'Self-added'
      };

      const response = await fetch('/api/prescriptions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(medicineData)
      });

      if (response.ok) {
        const newMedicine = await response.json();
        setMedicines(prev => [...prev, newMedicine]);
        
        // Reset form
        setMedicineForm({
          name: '',
          dosage: '',
          frequency: '',
          duration: '',
          quantity: '',
          reminderTimes: [''],
          notes: ''
        });
        setShowAddMedicine(false);
        
        if (!isMuted) {
          playTTS(t('medicineAdded', language), language);
        }
        
        // Refresh medicines
        fetchMedicines();
      }
    } catch (error) {
      console.error('Failed to save medicine:', error);
    }
  };

  // Delete medicine
  const handleDeleteMedicine = async (medicineId) => {
    if (!confirm(t('confirmDeleteMedicine', language))) return;
    
    try {
      const response = await fetch(`/api/prescriptions/${medicineId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        setMedicines(prev => prev.filter(m => m.id !== medicineId));
        if (!isMuted) {
          playTTS(t('medicineDeleted', language), language);
        }
      }
    } catch (error) {
      console.error('Failed to delete medicine:', error);
    }
  };

  // Check for upcoming reminders
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const upcoming = [];
      medicines.forEach(med => {
        if (med.reminder_times && Array.isArray(med.reminder_times)) {
          med.reminder_times.forEach(reminder => {
            if (reminder === currentTime) {
              upcoming.push(med);
              
              // Add to reminder history
              const historyEntry = {
                id: Date.now(),
                medicine: med.medicine_name,
                dosage: med.dosage,
                time: currentTime,
                date: now.toLocaleDateString(),
                status: 'pending',
              };
              setReminderHistory(prev => [historyEntry, ...prev].slice(0, 50));
              
              // Show notification
              if (Notification.permission === 'granted') {
                new Notification(`${t('timeToTake', language)} ${med.medicine_name}!`, {
                  body: `${t('dosage', language)}: ${med.dosage}`,
                  icon: '💊',
                });
              }
              
              if (!isMuted) {
                speak(`${t('timeToTake', language)} ${med.medicine_name}, ${med.dosage}`, language);
              }
            }
          });
        }
      });
      
      if (upcoming.length > 0) {
        setUpcomingReminders(upcoming);
      }
    };

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [medicines, isMuted, language, isAuthenticated]);

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      window.speechSynthesis.cancel();
    }
    if (!isMuted) {
      playTTS(t('remindersMuted', language), language);
    } else {
      playTTS(t('remindersUnmuted', language), language);
    }
  };

  const handleMarkTaken = async (med) => {
    const now = new Date().toLocaleString();
    const takenEntry = {
      ...med,
      takenAt: now,
    };
    
    setTakenMedicines(prev => [...prev, takenEntry]);
    
    // Update reminder history
    setReminderHistory(prev => prev.map(entry => {
      if (entry.medicine === med.medicine_name && entry.status === 'pending') {
        return { ...entry, status: 'taken', takenAt: now };
      }
      return entry;
    }));
    
    if (!isMuted) {
      playTTS(`${med.medicine_name} ${t('markedAsTaken', language)}`, language);
    }
    
    setUpcomingReminders(prev => prev.filter(m => m.id !== med.id));
  };

  // Calculate reminder statistics
  const todayReminders = medicines.reduce((acc, m) => acc + (m.reminder_times?.length || 0), 0);
  const takenToday = takenMedicines.filter(m => 
    new Date(m.takenAt).toDateString() === new Date().toDateString()
  ).length;
  const missedToday = reminderHistory.filter(entry => 
    entry.date === new Date().toLocaleDateString() && entry.status === 'skipped'
  ).length;
  const pendingReminders = upcomingReminders.length;

  return (
    <>
      {!isAuthenticated && <FeatureLoginPrompt featureName={t('remindersManagementFeature', language)} />}
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 pt-24 pb-10">
        <div className="container mx-auto px-4 max-w-7xl">
          
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold text-green-800 mb-2">⏰ {t('reminders', language)}</h1>
              <p className="text-xl text-gray-700">{t('manageYourMedicineReminders', language)}</p>
            </div>
            <button
              onClick={handleMuteToggle}
              title={isMuted ? t('unmute', language) : t('mute', language)}
              className={`px-6 py-3 rounded-lg font-bold text-lg transition shadow-lg ${
                isMuted
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {isMuted ? `🔇 ${t('unmute', language)}` : `🔊 ${t('mute', language)}`}
            </button>
          </div>

          {/* YOUR MEDICINES SECTION - NEW */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">📋 {t('yourMedicines', language)}</h2>
              <button
                onClick={() => setShowAddMedicine(!showAddMedicine)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
              >
                <span className="text-xl">+</span> {t('addMedicine', language)}
              </button>
            </div>

            {/* Medicine List */}
            {medicines.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('noMedicinesAdded', language)}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {medicines.map(med => (
                  <div key={med.id} className="p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-blue-400 rounded-lg flex items-center justify-center text-2xl">
                        💊
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-gray-800">{med.medicine_name}</h4>
                          <button
                            onClick={() => handleDeleteMedicine(med.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">{med.dosage}</p>
                        <p className="text-xs text-gray-500">{med.frequency} • {med.duration}</p>
                        {med.reminder_times && med.reminder_times.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {med.reminder_times.map((time, i) => (
                              <span key={i} className="bg-blue-200 text-blue-900 px-2 py-1 rounded text-xs font-medium">
                                ⏰ {time}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Medicine Form */}
            {showAddMedicine && (
              <div className="border-t-2 border-gray-200 pt-6 mt-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">+ {t('addMedicine', language)}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('medicineName', language)} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medicineForm.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder={t('enterMedicineName', language)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('dosage', language)} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medicineForm.dosage}
                      onChange={(e) => handleFormChange('dosage', e.target.value)}
                      placeholder={t('enterDosage', language)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('frequency', language)} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={medicineForm.frequency}
                      onChange={(e) => handleFormChange('frequency', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">{t('selectFrequency', language)}</option>
                      <option value="Once Daily">{t('onceDaily', language)}</option>
                      <option value="Twice Daily">{t('twiceDaily', language)}</option>
                      <option value="Thrice Daily">{t('thriceDaily', language)}</option>
                      <option value="Four Times Daily">{t('fourTimesDaily', language)}</option>
                      <option value="As Needed">{t('asNeeded', language)}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('duration', language)}
                    </label>
                    <input
                      type="text"
                      value={medicineForm.duration}
                      onChange={(e) => handleFormChange('duration', e.target.value)}
                      placeholder={t('enterDuration', language)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('quantity', language)}
                    </label>
                    <input
                      type="text"
                      value={medicineForm.quantity}
                      onChange={(e) => handleFormChange('quantity', e.target.value)}
                      placeholder={t('enterQuantity', language)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('instructionsNotes', language)}
                    </label>
                    <input
                      type="text"
                      value={medicineForm.notes}
                      onChange={(e) => handleFormChange('notes', e.target.value)}
                      placeholder={t('enterNotes', language)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('setReminderTimes', language)}
                    </label>
                    {medicineForm.reminderTimes.map((time, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => updateReminderTime(index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        {medicineForm.reminderTimes.length > 1 && (
                          <button
                            onClick={() => removeReminderTime(index)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                          >
                            Remove
                          </button>
                        )}
                        {index === medicineForm.reminderTimes.length - 1 && (
                          <button
                            onClick={addReminderTime}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                          >
                            + {t('add', language)}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleSaveMedicine}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition"
                  >
                    {t('save', language)}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddMedicine(false);
                      setMedicineForm({
                        name: '',
                        dosage: '',
                        frequency: '',
                        duration: '',
                        quantity: '',
                        reminderTimes: [''],
                        notes: ''
                      });
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-8 py-3 rounded-lg font-semibold transition"
                  >
                    {t('cancel', language)}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reminder Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
              <h3 className="text-sm font-semibold opacity-90">{t('todaysReminders', language)}</h3>
              <p className="text-4xl font-bold mt-2">{todayReminders}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
              <h3 className="text-sm font-semibold opacity-90">{t('taken', language)}</h3>
              <p className="text-4xl font-bold mt-2">{takenToday}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6 shadow-lg">
              <h3 className="text-sm font-semibold opacity-90">{t('missed', language)}</h3>
              <p className="text-4xl font-bold mt-2">{missedToday}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-6 shadow-lg">
              <h3 className="text-sm font-semibold opacity-90">{t('pending', language)}</h3>
              <p className="text-4xl font-bold mt-2">{pendingReminders}</p>
            </div>
          </div>

          {/* Upcoming Reminders Alert */}
          {upcomingReminders.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-red-900 mb-3">{t('timeToTakeMedicines', language)}</h3>
              <div className="space-y-3">
                {upcomingReminders.map(med => (
                  <div key={med.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-800">{med.medicine_name}</div>
                      <div className="text-sm text-gray-600">{med.dosage}</div>
                    </div>
                    <button
                      onClick={() => handleMarkTaken(med)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                      ✓ {t('taken', language)}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Intake History & Reminder History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">✓ {t('todaysIntakeHistory', language)}</h3>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {takenToday} {t('taken', language)}
                </span>
              </div>
              {takenToday === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('noMedicinesTakenToday', language)}</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {takenMedicines
                    .filter(m => new Date(m.takenAt).toDateString() === new Date().toDateString())
                    .map((m, i) => (
                      <div key={i} className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-800">{m.medicine_name}</div>
                            <div className="text-sm text-gray-600">{m.dosage}</div>
                          </div>
                          <div className="text-xs text-gray-500">{m.takenAt}</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">{t('reminderHistory', language)}</h3>
                <button
                  onClick={() => setReminderHistory([])}
                  className="text-sm text-red-600 hover:text-red-800 font-semibold"
                >
                  🗑️ {t('clearHistory', language)}
                </button>
              </div>
              {reminderHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('noReminderHistory', language)}</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reminderHistory.map((entry) => (
                    <div 
                      key={entry.id} 
                      className={`p-4 rounded-lg border-l-4 ${
                        entry.status === 'taken' ? 'bg-green-50 border-green-500' :
                        entry.status === 'skipped' ? 'bg-red-50 border-red-500' :
                        'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800">{entry.medicine}</div>
                          <div className="text-sm text-gray-600">{entry.dosage}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {entry.date} {t('at', language)} {entry.time}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          entry.status === 'taken' ? 'bg-green-200 text-green-800' :
                          entry.status === 'skipped' ? 'bg-red-200 text-red-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* All Scheduled Reminders */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('allScheduledReminders', language)}</h3>
            {medicines.filter(m => m.reminder_times && m.reminder_times.length > 0).length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('noRemindersScheduled', language)}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {medicines
                  .filter(m => m.reminder_times && m.reminder_times.length > 0)
                  .map(med => (
                    <div key={med.id} className="p-4 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-blue-400 rounded-lg flex items-center justify-center text-2xl">
                          💊
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">{med.medicine_name}</h4>
                          <p className="text-sm text-gray-600">{med.dosage}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {med.reminder_times.map((time, i) => (
                              <span key={i} className="bg-blue-200 text-blue-900 px-2 py-1 rounded text-xs font-medium">
                                ⏰ {time}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default RemindersEnhanced;
