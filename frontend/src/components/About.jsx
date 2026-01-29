import React, { useContext } from 'react';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';

const About = () => {
  const { language } = useContext(LanguageContext);
  
  const values = [
    {
      icon: '🤝',
      titleKey: 'trustworthiness',
      descKey: 'trustworthinessDesc',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: '🌐',
      titleKey: 'accessibility',
      descKey: 'accessibilityDesc',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: '💡',
      titleKey: 'innovation',
      descKey: 'innovationDesc',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: '❤️',
      titleKey: 'compassion',
      descKey: 'compassionDesc',
      color: 'bg-red-100 text-red-600'
    },
  ];

  const features = [
    {
      icon: '🤖',
      titleKey: 'aiPoweredTechnology',
      descKey: 'aiPoweredTechnologyDesc'
    },
    {
      icon: '🌍',
      titleKey: 'multilingualsupport',
      descKey: 'multilingualSupportDescLong'
    },
    {
      icon: '👨‍⚕️',
      titleKey: 'verifiedDoctors',
      descKey: 'verifiedDoctorsDesc'
    },
    {
      icon: '🔒',
      titleKey: 'secureAndPrivate',
      descKey: 'secureAndPrivateDesc'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-amber-50" style={{ paddingTop: '100px' }}>
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-green-900 mb-4">
            {t('aboutSanjivaniTitle', language)}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('whatWeDoDesc', language)}
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-3xl font-bold text-green-900 mb-4">
              {t('ourMission', language)}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('ourMissionDesc', language)}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="text-5xl mb-4">🔭</div>
            <h2 className="text-3xl font-bold text-blue-900 mb-4">
              {t('ourVision', language)}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('ourVisionDesc', language)}
            </p>
          </div>
        </div>

        {/* What Makes Us Different */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center text-green-900 mb-12">
            {t('whatMakesUsDifferent', language)}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="text-5xl mb-4 text-center">{feature.icon}</div>
                <h3 className="text-xl font-bold text-center text-gray-900 mb-3">
                  {t(feature.titleKey, language)}
                </h3>
                <p className="text-gray-600 text-center text-sm">
                  {t(feature.descKey, language)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Core Values */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-xl p-12 text-white mb-16">
          <h2 className="text-4xl font-bold text-center mb-12">
            {t('ourValues', language)}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 hover:bg-opacity-20 transition-all duration-300"
              >
                <div className={`inline-block p-4 rounded-full ${value.color} mb-4`}>
                  <span className="text-3xl">{value.icon}</span>
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {t(value.titleKey, language)}
                </h3>
                <p className="opacity-90">
                  {t(value.descKey, language)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center bg-white rounded-2xl shadow-lg p-12">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-4xl font-bold text-green-900 mb-4">
            {t('ourTeam', language)}
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            {t('ourTeamDesc', language)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
