import React, { useState, useEffect, useContext } from 'react';
import logo from '../assets/Sanjeevani Logo.png';
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

const MedicineCard = ({ med, onDelete, onEdit, onSpeak, onSetReminder }) => (
  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500 hover:shadow-lg transition">
    <div className="flex gap-3 items-start">
      <div className="h-14 w-14 bg-gradient-to-br from-green-100 to-blue-100 rounded-md flex items-center justify-center font-bold text-green-700">
        💊
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-gray-800 text-lg">{med.name}</h4>
          <div className="flex items-center gap-1">
            <button onClick={onSpeak} className="p-2 bg-amber-50 rounded hover:bg-amber-100 text-sm">🔊</button>
            <button onClick={onEdit} className="p-2 bg-blue-50 rounded hover:bg-blue-100 text-sm">✏️</button>
            <button onClick={onDelete} className="p-2 bg-red-50 rounded hover:bg-red-100 text-sm">🗑️</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
          <div>💉 <span className="font-semibold">{med.dosage}</span></div>
          <div>📅 <span className="font-semibold">{med.frequency}</span></div>
          <div>⏳ <span className="font-semibold">{med.duration}</span></div>
          <div>📦 <span className="font-semibold">{med.quantity} {t('units', language)}</span></div>
        </div>
        {med.reminders && med.reminders.length > 0 && (
          <div className="mt-2 p-2 bg-green-50 rounded">
            <div className="text-xs font-semibold text-green-800">{t('reminders', language)}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {med.reminders.map((r, i) => (
                <span key={i} className="bg-green-200 text-green-900 px-2 py-1 rounded text-xs font-medium">
                  ⏰ {r}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-2 text-xs text-gray-500">📝 {med.notes || 'No notes'}</div>
      </div>
    </div>
  </div>
);

const PrescriptionHandling = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
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
  const [scanning, setScanning] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [takenMedicines, setTakenMedicines] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('prescriptions');
    const savedTaken = localStorage.getItem('medicinesTaken');
    if (saved) setMedicines(JSON.parse(saved));
    if (savedTaken) setTakenMedicines(JSON.parse(savedTaken));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('prescriptions', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('medicinesTaken', JSON.stringify(takenMedicines));
  }, [takenMedicines]);

  // Check for upcoming reminders every minute
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const upcoming = [];
      medicines.forEach(med => {
        if (med.reminders) {
          med.reminders.forEach(reminder => {
            if (reminder === currentTime) {
              upcoming.push(med);
              // Show notification
              if (Notification.permission === 'granted') {
                new Notification(`Time to take ${med.name}!`, {
                  body: `${med.dosage} - ${med.notes}`,
                  icon: '💊',
                });
              }
              speak(`Time to take ${med.name}, ${med.dosage}`);
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
  }, [medicines]);

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      window.speechSynthesis.cancel();
      console.log('[PrescriptionHandling] TTS muted');
    } else {
      console.log('[PrescriptionHandling] TTS unmuted');
    }
  };

  const handleAddMedicine = () => {
    if (!formData.name || !formData.dosage || !formData.frequency) {
      alert(t('pleaseFillRequired', language));
      return;
    }

    if (editingId) {
      // Edit existing
      setMedicines(prev => prev.map(m => 
        m.id === editingId ? { ...formData, id: editingId } : m
      ));
      setEditingId(null);
    } else {
      // Add new
      setMedicines(prev => [...prev, {
        ...formData,
        id: Date.now(),
        quantity: parseInt(formData.quantity) || 0,
        reminders: formData.reminders || [],
      }]);
    }

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
    if (!isMuted) speak(editingId ? t('medicineUpdated', language) : t('medicineAdded', language), language);
  };

  const handleEditMedicine = (med) => {
    setFormData(med);
    setEditingId(med.id);
    setShowForm(true);
  };

  const handleDeleteMedicine = (id) => {
    if (confirm(t('deleteThisMedicine', language))) {
      setMedicines(prev => prev.filter(m => m.id !== id));
      if (!isMuted) speak(t('medicineDeleted', language), language);
    }
  };

  const handleAddReminder = (medId, time) => {
    if (!time) return;
    setMedicines(prev => prev.map(m => 
      m.id === medId 
        ? { ...m, reminders: [...(m.reminders || []), time].sort() }
        : m
    ));
    if (!isMuted) speak(`${t('reminderSetFor', language)} ${time}`, language);
  };

  const handleRemoveReminder = (medId, time) => {
    setMedicines(prev => prev.map(m => 
      m.id === medId 
        ? { ...m, reminders: m.reminders.filter(r => r !== time) }
        : m
    ));
  };

  const handleMarkTaken = (med) => {
    const now = new Date().toLocaleString();
    setTakenMedicines(prev => [...prev, {
      ...med,
      takenAt: now,
    }]);
    if (!isMuted) speak(`${med.name} ${t('markedAsTaken', language)}`, language);
    setUpcomingReminders(prev => prev.filter(m => m.id !== med.id));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setScanning(true);
      setTimeout(() => {
        setScanning(false);
        // Simulate OCR
        setMedicines(prev => [...prev, {
          id: Date.now(),
          name: 'Medicine from Prescription',
          dosage: '500mg',
          frequency: 'Twice Daily',
          duration: '5 days',
          quantity: 10,
          reminders: ['09:00', '21:00'],
          notes: 'Take after food',
        }]);
        speak(t('prescriptionScannedAdded', language), language);
      }, 2000);
    }
  };

  const handleTakePhoto = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setMedicines(prev => [...prev, {
        id: Date.now(),
        name: 'Medicine from Photo',
        dosage: '250mg',
        frequency: 'Once Daily',
        duration: '7 days',
        quantity: 7,
        reminders: ['08:00'],
        notes: 'Take in morning',
      }]);
      speak(t('photoCapturedAdded', language), language);
    }, 2000);
  };

  const stats = {
    totalMedicines: medicines.length,
    todayReminders: medicines.reduce((acc, m) => acc + (m.reminders?.length || 0), 0),
    medicinesTaken: takenMedicines.filter(m => new Date(m.takenAt).toDateString() === new Date().toDateString()).length,
  };

  return (
    <>
      {!isAuthenticated && <FeatureLoginPrompt featureName="prescription management" />}
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 pt-24 pb-10">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-green-800 mb-2">{t('prescriptionMedicineManagement', language)}</h1>
            <p className="text-xl text-gray-700">{t('uploadTrackReminders', language)}</p>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">{t('totalMedicines', language)}</h3>
            <p className="text-4xl font-bold mt-2">{stats.totalMedicines}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">{t('todaysReminders', language)}</h3>
            <p className="text-4xl font-bold mt-2">{stats.todayReminders}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">{t('medicinesTakenToday', language)}</h3>
            <p className="text-4xl font-bold mt-2">{stats.medicinesTaken}</p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('uploadPrescription', language)}</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleTakePhoto}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white py-4 rounded-lg text-lg font-semibold transition"
            >
              {t('takePhoto', language)}
            </button>
            <label className="flex-1 cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              <div className="border-2 border-dashed border-green-300 py-4 rounded-lg text-lg text-center hover:bg-green-50 transition bg-green-50 font-semibold text-green-900">
                {t('uploadFile', language)}
              </div>
            </label>
          </div>
          {scanning && (
            <div className="mt-4 flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="animate-spin h-6 w-6 border-4 border-blue-300 border-t-blue-700 rounded-full"></div>
              <div className="text-blue-900 font-semibold">{t('scanningPrescription', language)}</div>
            </div>
          )}
        </div>

        {/* Upcoming Reminders Alert */}
        {upcomingReminders.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-red-900 mb-3">{t('timeToTakeMedicines', language)}</h3>
            <div className="space-y-2">
              {upcomingReminders.map(med => (
                <div key={med.id} className="flex items-center justify-between bg-white p-3 rounded">
                  <div>
                    <div className="font-bold text-lg">{med.name}</div>
                    <div className="text-sm text-gray-600">{med.dosage} - {med.notes}</div>
                  </div>
                  <button
                    onClick={() => handleMarkTaken(med)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
                  >
                    {t('markTaken', language)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Medicines List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t('yourMedicines', language)}</h2>
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditingId(null);
                  }}
                  className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  {t('addMedicine', language)}
                </button>
              </div>

              {medicines.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">{t('noMedicinesAdded', language)}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicines.map(med => (
                    <MedicineCard
                      key={med.id}
                      med={med}
                      onDelete={() => handleDeleteMedicine(med.id)}
                      onEdit={() => handleEditMedicine(med)}
                      onSpeak={() => speak(`${med.name}, ${med.dosage}, ${med.frequency}, ${med.notes}`, language)}
                      onSetReminder={(time) => handleAddReminder(med.id, time)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Form & Reminders */}
          <aside className="space-y-6">
            
            {/* Add/Edit Form */}
            {showForm && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-300">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{editingId ? t('editMedicine', language) : t('addMedicineTitle', language)}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('medicineNameRequired', language)}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Paracetamol"
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('dosageRequired', language)}</label>
                    <input
                      type="text"
                      value={formData.dosage}
                      onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                      placeholder="e.g., 500mg"
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('frequencyRequired', language)}</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    >
                      <option value="">{t('selectFrequency', language)}</option>
                      <option value="Once Daily">{t('onceDaily', language)}</option>
                      <option value="Twice Daily">{t('twiceDaily', language)}</option>
                      <option value="Thrice Daily">{t('thriceDaily', language)}</option>
                      <option value="Every 4 hours">{t('every4Hours', language)}</option>
                      <option value="Every 6 hours">{t('every6Hours', language)}</option>
                      <option value="Every 8 hours">{t('every8Hours', language)}</option>
                      <option value="As needed">{t('asNeeded', language)}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('duration', language)}</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      placeholder="e.g., 5 days, 1 week"
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('quantity', language)}</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      placeholder="e.g., 10"
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('instructionsNotes', language)}</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="e.g., Take after food"
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Set Reminder Times</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="time"
                        id="reminderTime"
                        className="flex-1 p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const time = document.getElementById('reminderTime').value;
                          if (time) {
                            setFormData({...formData, reminders: [...(formData.reminders || []), time].sort()});
                            document.getElementById('reminderTime').value = '';
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-semibold"
                      >
                        {t('add', language)}
                      </button>
                    </div>
                    {formData.reminders && formData.reminders.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.reminders.map((r, i) => (
                          <span key={i} className="bg-blue-100 text-blue-900 px-2 py-1 rounded text-sm font-medium flex items-center gap-2">
                            ⏰ {r}
                            <button onClick={() => setFormData({...formData, reminders: formData.reminders.filter((_, idx) => idx !== i)})} className="hover:text-red-600">✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAddMedicine}
                      className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2 rounded font-semibold"
                    >
                      {editingId ? t('update', language) : t('save', language)}
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        setFormData({name: '', dosage: '', frequency: '', duration: '', quantity: '', reminders: [], notes: ''});
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded font-semibold"
                    >
                      {t('cancel', language)}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Today's History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">{t('todaysIntakeHistory', language)}</h3>
              {takenMedicines.filter(m => new Date(m.takenAt).toDateString() === new Date().toDateString()).length === 0 ? (
                <p className="text-gray-500 text-sm">{t('noMedicinesTakenToday', language)}</p>
              ) : (
                <div className="space-y-2">
                  {takenMedicines
                    .filter(m => new Date(m.takenAt).toDateString() === new Date().toDateString())
                    .map((m, i) => (
                      <div key={i} className="p-3 bg-green-50 rounded text-sm border-l-4 border-green-500">
                        <div className="font-semibold">{m.name} - {m.dosage}</div>
                        <div className="text-xs text-gray-600">{t('takenAt', language)} {m.takenAt}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>

          </aside>

        </div>

      </div>
      </div>
    </>
  );
};

export default PrescriptionHandling;
