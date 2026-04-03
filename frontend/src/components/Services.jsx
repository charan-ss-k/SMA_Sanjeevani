import React, { useContext } from 'react';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';
import AppDownloadBanner from './AppDownloadBanner';

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_40%),linear-gradient(180deg,_#f8fffb_0%,_#edfdf4_45%,_#f8fafc_100%)]" style={{ paddingTop: '100px' }}>
      <div className="container mx-auto max-w-5xl px-4 py-10 md:py-12">
        {/* Header Section */}
        <div className="mx-auto mb-8 max-w-4xl rounded-3xl border border-emerald-100 bg-white/90 p-6 md:p-8 text-center shadow-[0_14px_35px_rgba(16,185,129,0.12)]">
          <p className="mb-3 inline-flex rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-bold tracking-[0.12em] text-emerald-800">
            {t('ourServicesSubtitle', language)}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl md:text-5xl">
            {t('ourServicesTitle', language)}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Choose the service you need and continue with a simple guided flow.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 gap-4 md:gap-5">
          {services.map((service, index) => (
            <div
              key={index}
              className="group overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(15,23,42,0.14)]"
            >
              {/* Gradient Header */}
              <div className={`bg-gradient-to-r ${service.color} p-3 md:p-4 text-white`}>
                <div className="mb-2 text-3xl md:text-4xl transition-transform duration-300 group-hover:scale-110">
                  {service.icon}
                </div>
                <h3 className="text-sm md:text-lg font-bold tracking-tight leading-snug">
                  {t(service.titleKey, language)}
                </h3>
              </div>
              
              {/* Content */}
              <div className="p-3 md:p-4">
                <p className="text-xs md:text-sm leading-5 md:leading-6 text-slate-600">
                  {t(service.descKey, language)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 md:mt-14">
          <AppDownloadBanner />
        </div>
      </div>
    </div>
  );
};

export default Services;
