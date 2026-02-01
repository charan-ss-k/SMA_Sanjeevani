import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, LanguageContext } from '../main';
import { t } from '../utils/translations';
import { playTTS } from '../utils/tts';

const ReminderNotification = () => {
  const { isAuthenticated, authToken } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  const [activeReminder, setActiveReminder] = useState(null);
  const [isRinging, setIsRinging] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [oscillator, setOscillator] = useState(null);

  // Play alarm sound
  const playAlarm = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.frequency.value = 800;
      osc.type = 'sine';
      gainNode.gain.value = 0.3;
      
      osc.start();
      
      // Create beeping pattern
      let beepOn = true;
      const beepInterval = setInterval(() => {
        gainNode.gain.value = beepOn ? 0.3 : 0;
        beepOn = !beepOn;
      }, 300);
      
      setAudioContext(ctx);
      setOscillator({ osc, gainNode, beepInterval });
      setIsRinging(true);
    } catch (error) {
      console.error('Failed to play alarm:', error);
    }
  };

  // Stop alarm sound
  const stopAlarm = () => {
    if (oscillator) {
      clearInterval(oscillator.beepInterval);
      oscillator.osc.stop();
      oscillator.gainNode.disconnect();
      audioContext.close();
      setOscillator(null);
      setAudioContext(null);
    }
    setIsRinging(false);
  };

  // Check reminders every minute
  useEffect(() => {
    if (!isAuthenticated || !authToken) return;

    const checkReminders = async () => {
      try {
        const response = await fetch('/api/reminders/', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (response.ok) {
          const reminders = await response.json();
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          
          // Find reminders due now
          const dueReminders = reminders.filter(r => r.reminder_time === currentTime);
          
          if (dueReminders.length > 0 && !activeReminder) {
            const reminder = dueReminders[0];
            setActiveReminder(reminder);
            
            // Play alarm
            playAlarm();
            
            // Speak the reminder
            const quantity = reminder.quantity || reminder.days?.quantity;
            const qtyText = quantity ? `, ${t('quantity', language)}: ${quantity}` : '';
            const message = `${t('timeToTake', language)} ${reminder.medicine_name}, ${t('dosage', language)}: ${reminder.dosage}${qtyText}`;
            
            setTimeout(() => {
              playTTS(message, language);
            }, 500);
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`💊 ${reminder.medicine_name}`, {
                body: `${t('dosage', language)}: ${reminder.dosage}${qtyText}`,
                icon: '/icon.png',
                requireInteraction: true
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to check reminders:', error);
      }
    };

    // Check immediately
    checkReminders();
    
    // Then check every 60 seconds
    const interval = setInterval(checkReminders, 60000);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    return () => {
      clearInterval(interval);
      stopAlarm();
    };
  }, [isAuthenticated, authToken, activeReminder, language]);

  const handleStop = () => {
    stopAlarm();
    setActiveReminder(null);
  };

  if (!activeReminder) return null;

  const quantity = activeReminder.quantity || activeReminder.days?.quantity;
  const qtyText = quantity ? ` • ${t('quantity', language)}: ${quantity}` : '';

  return (
    <div className="fixed top-20 right-4 z-50 animate-bounce">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl shadow-2xl p-6 max-w-sm border-4 border-white">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`text-4xl ${isRinging ? 'animate-pulse' : ''}`}>
              🔔
            </div>
            <div>
              <h3 className="font-bold text-xl">{t('medicineReminder', language)}</h3>
              <p className="text-sm opacity-90">{t('timeToTakeMedicine', language)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
          <p className="font-bold text-2xl mb-2">💊 {activeReminder.medicine_name}</p>
          <p className="text-lg">{t('dosage', language)}: {activeReminder.dosage}{qtyText}</p>
          <p className="text-sm mt-2 opacity-90">⏰ {activeReminder.reminder_time}</p>
        </div>
        
        <button
          onClick={handleStop}
          className="w-full bg-white text-red-600 hover:bg-red-50 font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg"
        >
          🛑 {t('stopAlarm', language)}
        </button>
      </div>
    </div>
  );
};

export default ReminderNotification;
