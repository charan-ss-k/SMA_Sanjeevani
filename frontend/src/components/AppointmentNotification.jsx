import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, LanguageContext } from '../main';
import { t } from '../utils/translations';
import { playTTS } from '../utils/tts';

const AppointmentNotification = () => {
  const { isAuthenticated, authToken } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [notificationType, setNotificationType] = useState(''); // '30min', '5min', 'now'
  const [isRinging, setIsRinging] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [oscillator, setOscillator] = useState(null);
  const [notifiedAppointments, setNotifiedAppointments] = useState({
    '30min': new Set(),
    '5min': new Set(),
    'now': new Set()
  });

  // Play alarm sound
  const playAlarm = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.frequency.value = 600; // Different frequency for appointments
      osc.type = 'sine';
      gainNode.gain.value = 0.3;
      
      osc.start();
      
      // Create beeping pattern
      let beepOn = true;
      const beepInterval = setInterval(() => {
        gainNode.gain.value = beepOn ? 0.3 : 0;
        beepOn = !beepOn;
      }, 400); // Slower beep for appointments
      
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

  // Check appointments every minute
  useEffect(() => {
    if (!isAuthenticated || !authToken) return;

    const checkAppointments = async () => {
      try {
        const response = await fetch('/api/appointments/my-appointments', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const appointments = data.appointments || [];
          const now = new Date();
          
          // Check each appointment
          for (const apt of appointments) {
            const aptDate = new Date(apt.appointment_date);
            const diffMinutes = Math.floor((aptDate - now) / (1000 * 60));
            
            // Skip past appointments
            if (diffMinutes < 0) continue;
            
            let triggerType = null;
            let notificationKey = '';
            
            // Check for 30-minute warning
            if (diffMinutes <= 30 && diffMinutes > 29) {
              triggerType = '30min';
              notificationKey = `${apt.id}-30min`;
            }
            // Check for 5-minute warning
            else if (diffMinutes <= 5 && diffMinutes > 4) {
              triggerType = '5min';
              notificationKey = `${apt.id}-5min`;
            }
            // Check for appointment time (within 1 minute window)
            else if (diffMinutes <= 1 && diffMinutes >= 0) {
              triggerType = 'now';
              notificationKey = `${apt.id}-now`;
            }
            
            // Trigger notification if needed and not already notified
            if (triggerType && !notifiedAppointments[triggerType].has(notificationKey) && !activeAppointment) {
              setActiveAppointment(apt);
              setNotificationType(triggerType);
              
              // Mark as notified
              setNotifiedAppointments(prev => ({
                ...prev,
                [triggerType]: new Set([...prev[triggerType], notificationKey])
              }));
              
              // Play alarm
              playAlarm();
              
              // Speak the appointment details
              let message = '';
              if (triggerType === '30min') {
                message = `${t('appointmentReminder', language)}: ${t('yourAppointmentWith', language)} Dr. ${apt.doctor_name} ${t('isIn', language)} 30 ${t('minutes', language)}`;
              } else if (triggerType === '5min') {
                message = `${t('urgentReminder', language)}: ${t('yourAppointmentWith', language)} Dr. ${apt.doctor_name} ${t('isIn', language)} 5 ${t('minutes', language)}`;
              } else {
                message = `${t('appointmentNow', language)}: ${t('yourAppointmentWith', language)} Dr. ${apt.doctor_name} ${t('isNow', language)}`;
              }
              
              setTimeout(() => {
                playTTS(message, language);
              }, 500);
              
              // Show browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`🏥 Dr. ${apt.doctor_name}`, {
                  body: message,
                  icon: '/icon.png',
                  requireInteraction: true
                });
              }
              
              break; // Only show one notification at a time
            }
          }
        }
      } catch (error) {
        console.error('Failed to check appointments:', error);
      }
    };

    // Check immediately
    checkAppointments();
    
    // Then check every 60 seconds
    const interval = setInterval(checkAppointments, 60000);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    return () => {
      clearInterval(interval);
      stopAlarm();
    };
  }, [isAuthenticated, authToken, activeAppointment, language, notifiedAppointments]);

  const handleStop = () => {
    stopAlarm();
    setActiveAppointment(null);
    setNotificationType('');
  };

  if (!activeAppointment) return null;

  const getNotificationTitle = () => {
    if (notificationType === '30min') return t('appointmentIn30Minutes', language);
    if (notificationType === '5min') return t('appointmentIn5Minutes', language);
    return t('appointmentNow', language);
  };

  const getNotificationIcon = () => {
    if (notificationType === '30min') return '⏰';
    if (notificationType === '5min') return '⚠️';
    return '🚨';
  };

  const getGradientClass = () => {
    if (notificationType === '30min') return 'from-blue-500 to-blue-600';
    if (notificationType === '5min') return 'from-orange-500 to-orange-600';
    return 'from-red-600 to-red-700';
  };

  return (
    <div className="fixed top-20 right-4 z-50 animate-bounce">
      <div className={`bg-gradient-to-r ${getGradientClass()} text-white rounded-2xl shadow-2xl p-6 max-w-sm border-4 border-white`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`text-4xl ${isRinging ? 'animate-pulse' : ''}`}>
              {getNotificationIcon()}
            </div>
            <div>
              <h3 className="font-bold text-xl">{getNotificationTitle()}</h3>
              <p className="text-sm opacity-90">{t('doctorAppointment', language)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
          <p className="font-bold text-2xl mb-2">🩺 Dr. {activeAppointment.doctor_name}</p>
          <p className="text-lg mb-1">
            <span className="font-semibold">{t('specialization', language)}:</span> {activeAppointment.specialization}
          </p>
          <p className="text-base mb-1">
            <span className="font-semibold">🏥 {t('hospital', language)}:</span> {activeAppointment.hospital}
          </p>
          <p className="text-base mb-1">
            <span className="font-semibold">📍 {t('location', language)}:</span> {activeAppointment.locality}, {activeAppointment.city}
          </p>
          <p className="text-sm mt-2 opacity-90">
            ⏰ {new Date(activeAppointment.appointment_date).toLocaleString()} 
          </p>
          {activeAppointment.notes && (
            <p className="text-sm mt-2 opacity-90">
              📝 {activeAppointment.notes}
            </p>
          )}
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

export default AppointmentNotification;
