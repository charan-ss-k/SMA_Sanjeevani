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

const Reminders = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  const [medicines, setMedicines] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [takenMedicines, setTakenMedicines] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [reminderHistory, setReminderHistory] = useState([]);

  // Load medicines and history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('prescriptions');
    const savedTaken = localStorage.getItem('medicinesTaken');
    const savedHistory = localStorage.getItem('reminderHistory');
    
    if (saved) setMedicines(JSON.parse(saved));
    if (savedTaken) setTakenMedicines(JSON.parse(savedTaken));
    if (savedHistory) setReminderHistory(JSON.parse(savedHistory));
  }, []);

  // Save taken medicines to localStorage
  useEffect(() => {
    localStorage.setItem('medicinesTaken', JSON.stringify(takenMedicines));
  }, [takenMedicines]);

  // Save reminder history to localStorage
  useEffect(() => {
    localStorage.setItem('reminderHistory', JSON.stringify(reminderHistory));
  }, [reminderHistory]);

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
              
              // Add to reminder history
              const historyEntry = {
                id: Date.now(),
                medicine: med.name,
                dosage: med.dosage,
                time: currentTime,
                date: now.toLocaleDateString(),
                status: 'pending',
              };
              setReminderHistory(prev => [historyEntry, ...prev].slice(0, 50)); // Keep last 50
              
              // Show notification
              if (Notification.permission === 'granted') {
                new Notification(`Time to take ${med.name}!`, {
                  body: `${med.dosage} - ${med.notes}`,
                  icon: '💊',
                });
              }
              
              if (!isMuted) {
                speak(`Time to take ${med.name}, ${med.dosage}`, language);
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
  }, [medicines, isMuted, language]);

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

  const handleMarkTaken = (med) => {
    const now = new Date().toLocaleString();
    const takenEntry = {
      ...med,
      takenAt: now,
    };
    
    setTakenMedicines(prev => [...prev, takenEntry]);
    
    // Update reminder history
    setReminderHistory(prev => prev.map(entry => {
      if (entry.medicine === med.name && entry.status === 'pending') {
        return { ...entry, status: 'taken', takenAt: now };
      }
      return entry;
    }));
    
    if (!isMuted) {
      playTTS(`${med.name} ${t('markedAsTaken', language)}`, language);
    }
    
    setUpcomingReminders(prev => prev.filter(m => m.id !== med.id));
  };

  const handleSnoozeReminder = (med, minutes = 10) => {
    if (!isMuted) {
      playTTS(`${t('reminderSnoozedFor', language)} ${minutes} ${t('minutes', language)}`, language);
    }
    
    // Update reminder history
    setReminderHistory(prev => prev.map(entry => {
      if (entry.medicine === med.name && entry.status === 'pending') {
        return { ...entry, status: 'snoozed', snoozedUntil: new Date(Date.now() + minutes * 60000).toLocaleTimeString() };
      }
      return entry;
    }));
    
    setUpcomingReminders(prev => prev.filter(m => m.id !== med.id));
  };

  const handleSkipReminder = (med) => {
    if (!isMuted) {
      playTTS(`${med.name} ${t('reminderSkipped', language)}`, language);
    }
    
    // Update reminder history
    setReminderHistory(prev => prev.map(entry => {
      if (entry.medicine === med.name && entry.status === 'pending') {
        return { ...entry, status: 'skipped', skippedAt: new Date().toLocaleString() };
      }
      return entry;
    }));
    
    setUpcomingReminders(prev => prev.filter(m => m.id !== med.id));
  };

  // Calculate reminder statistics
  const todayReminders = medicines.reduce((acc, m) => acc + (m.reminders?.length || 0), 0);
  const takenToday = takenMedicines.filter(m => 
    new Date(m.takenAt).toDateString() === new Date().toDateString()
  ).length;
  const missedToday = reminderHistory.filter(entry => 
    entry.date === new Date().toLocaleDateString() && entry.status === 'skipped'
  ).length;
  const pendingReminders = upcomingReminders.length;

  return (
    <>
      {!isAuthenticated && <FeatureLoginPrompt featureName="reminders management" />}
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
                      <div className="font-bold text-lg text-gray-800">{med.name}</div>
                      <div className="text-sm text-gray-600">{med.dosage} - {med.notes}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMarkTaken(med)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        ✓ {t('taken', language)}
                      </button>
                      <button
                        onClick={() => handleSnoozeReminder(med, 10)}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        ⏰ {t('snooze', language)}
                      </button>
                      <button
                        onClick={() => handleSkipReminder(med)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        ⊘ {t('skip', language)}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Today's Intake History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">{t('todaysIntakeHistory', language)}</h3>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {takenToday} {t('taken', language)}
                </span>
              </div>
              {takenMedicines.filter(m => new Date(m.takenAt).toDateString() === new Date().toDateString()).length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('noMedicinesTakenToday', language)}</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {takenMedicines
                    .filter(m => new Date(m.takenAt).toDateString() === new Date().toDateString())
                    .map((m, i) => (
                      <div key={i} className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-800">{m.name}</div>
                            <div className="text-sm text-gray-600">{m.dosage}</div>
                          </div>
                          <div className="text-xs text-gray-500">{m.takenAt}</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Reminder History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">{t('reminderHistory', language)}</h3>
                <button
                  onClick={() => setReminderHistory([])}
                  className="text-sm text-red-600 hover:text-red-800 font-semibold"
                >
                  {t('clearHistory', language)}
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
                        entry.status === 'snoozed' ? 'bg-amber-50 border-amber-500' :
                        'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800">{entry.medicine}</div>
                          <div className="text-sm text-gray-600">{entry.dosage}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {entry.date} at {entry.time}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            entry.status === 'taken' ? 'bg-green-200 text-green-800' :
                            entry.status === 'skipped' ? 'bg-red-200 text-red-800' :
                            entry.status === 'snoozed' ? 'bg-amber-200 text-amber-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {entry.status.toUpperCase()}
                          </span>
                          {entry.takenAt && (
                            <span className="text-xs text-gray-500">{entry.takenAt}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* All Scheduled Reminders */}
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('allScheduledReminders', language)}</h3>
            {medicines.filter(m => m.reminders && m.reminders.length > 0).length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('noRemindersScheduled', language)}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {medicines
                  .filter(m => m.reminders && m.reminders.length > 0)
                  .map(med => (
                    <div key={med.id} className="p-4 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-blue-400 rounded-lg flex items-center justify-center text-2xl">
                          💊
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">{med.name}</h4>
                          <p className="text-sm text-gray-600">{med.dosage}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {med.reminders.map((time, i) => (
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

export default Reminders;
