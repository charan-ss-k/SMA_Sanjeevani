import React, { useContext } from 'react';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';

const Services = () => {
  const { language } = useContext(LanguageContext);
  
  const services = [
    {
      icon: '🤖',
      titleKey: 'aiSymptomAnalysis',
      descKey: 'aiSymptomAnalysisDesc',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: '👨‍⚕️',
      titleKey: 'doctorConsultation',
      descKey: 'doctorConsultationDesc',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: '📋',
      titleKey: 'prescriptionScanning',
      descKey: 'prescriptionScanningDesc',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: '💊',
      titleKey: 'medicineTracking',
      descKey: 'medicineTrackingDesc',
      color: 'from-amber-500 to-amber-600'
    },
    {
      icon: '📊',
      titleKey: 'healthDashboard',
      descKey: 'healthDashboardDesc',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: '🌍',
      titleKey: 'multilanguageSupport',
      descKey: 'multilanguageSupportDesc',
      color: 'from-teal-500 to-teal-600'
    },
    {
      icon: '🚨',
      titleKey: 'emergencySupport',
      descKey: 'emergencySupportDesc',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: '📁',
      titleKey: 'healthRecords',
      descKey: 'healthRecordsDesc',
      color: 'from-pink-500 to-pink-600'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50" style={{ paddingTop: '100px' }}>
      <div className="container mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-green-900 mb-4">
            {t('ourServicesTitle', language)}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('ourServicesSubtitle', language)}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
            >
              {/* Gradient Header */}
              <div className={`bg-gradient-to-r ${service.color} p-6 text-white`}>
                <div className="text-6xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold">
                  {t(service.titleKey, language)}
                </h3>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed">
                  {t(service.descKey, language)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            {t('getStarted', language)}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t('getStartedDesc', language)}
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-white text-green-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-amber-400 hover:text-green-900 transition-all duration-300 transform hover:scale-105"
          >
            {t('loginToContinue', language)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Services;
