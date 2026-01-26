import React, { useContext } from 'react';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';
import { playTTS } from '../utils/tts';

const Services = () => {
  const { language } = useContext(LanguageContext);
  
  const services = [
    { icon: '📷', titleKey: 'scanPrescription', descKey: 'scanPrescriptionDesc' },
    { icon: '💊', titleKey: 'identifyMedicines', descKey: 'identifyMedicinesDesc' },
    { icon: '🗣️', titleKey: 'aiHealthAssistant', descKey: 'aiHealthAssistantDesc' },
    { icon: '🏥', titleKey: 'findClinics', descKey: 'findClinicsDesc' },
    { icon: '🕓', titleKey: 'medicineReminders', descKey: 'medicineRemindersDesc' },
    { icon: '📈', titleKey: 'yourDashboard', descKey: 'yourDashboardDesc' },
  ];

  const handleSpeak = (titleKey, descKey) => {
    const title = t(titleKey, language);
    const desc = t(descKey, language);
    playTTS(`${title}. ${desc}`, language);
  };

  return (
    <div className="pt-28 pb-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold mb-4">{t('servicesWeProvide', language)}</h1>
        <p className="text-gray-600 mb-6">{t('tapSpeakerDescription', language)}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {services.map((s, index) => {
            const title = t(s.titleKey, language);
            const desc = t(s.descKey, language);
            return (
              <div key={index} className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-4xl">{s.icon}</div>
                  <button onClick={() => handleSpeak(s.titleKey, s.descKey)} className="px-2 py-1 bg-amber-50 rounded">🔊</button>
                </div>
                <div className="font-semibold">{title}</div>
                <div className="text-sm text-gray-600">{desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Services;
