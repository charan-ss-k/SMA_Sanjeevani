import React, { useState, useContext } from 'react';
import SymptomChecker from './SymptomChecker';
import RecommendationResult from './RecommendationResult';
import { playTTS, stopAllTTS } from '../utils/tts';
import { LanguageContext } from '../main';
import { AuthContext } from '../main';
import FeatureLoginPrompt from './FeatureLoginPrompt';
import { t } from '../utils/translations';

const MedicineRecommendation = () => {
  const { language } = useContext(LanguageContext);
  const { isAuthenticated } = useContext(AuthContext);
  const [result, setResult] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const handleMuteToggle = () => {
    if (!isMuted) {
      stopAllTTS();
    }
    setIsMuted(!isMuted);
    if (isMuted) {
      playTTS(t('voiceUnmuted', language), language);
    }
  };

  const handleResult = (fullData) => {
    // Save to localStorage for dashboard
    const saved = localStorage.getItem('symptomSearchHistory');
    const history = saved ? JSON.parse(saved) : [];
    const entry = {
      ...fullData,
      timestamp: new Date().toISOString(),
    };
    history.push(entry);
    localStorage.setItem('symptomSearchHistory', JSON.stringify(history));

    setResult(fullData);
    setShowForm(false);
    if (!isMuted) playTTS(t('gotRecommendations', language), language);
  };

  const handleReset = () => {
    setResult(null);
    setShowForm(true);
    if (!isMuted) playTTS(t('formCleared', language), language);
  };

  return (
    <>
      {!isAuthenticated && <FeatureLoginPrompt featureName="medicine recommendations" />}
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-amber-50 pt-24 pb-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-green-800 mb-4">
              {t('medicineRecommendation', language)}
            </h1>
            <p className="text-xl text-gray-700">
              {t('tellUsAboutSymptoms', language)}
            </p>
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

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form (2/3 width on large screens) */}
          {showForm ? (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-8 border-4 border-green-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-green-800">{t('tellUsAboutYourself', language)}</h2>
                  <button
                    onClick={() => !isMuted && playTTS(t('fillSymptomsInfo', language), language)}
                    className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 flex items-center gap-2 text-lg"
                  >
                    {t('readInstructions', language)}
                  </button>
                </div>
                <SymptomChecker onResult={handleResult} />
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-8 border-4 border-green-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-green-800">{t('yourRecommendations', language)}</h2>
                  <button
                    onClick={handleReset}
                    className="bg-amber-600 text-white px-6 py-3 rounded-full hover:bg-amber-700 font-semibold text-lg"
                  >
                    {t('newSymptoms', language)}
                  </button>
                </div>
                <RecommendationResult result={result} onReset={handleReset} />
              </div>
            </div>
          )}

          {/* Right Column - Info & Tips (1/3 width on large screens) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Tips */}
            <div className="bg-green-600 text-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold mb-4">{t('quickTips', language)}</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <span>{t('beHonestSymptoms', language)}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <span>{t('tellAllergies', language)}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <span>{t('listHealthConditions', language)}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <span>{t('followDosage', language)}</span>
                </li>
              </ul>
            </div>

            {/* Warning Box */}
            <div className="bg-red-100 border-4 border-red-500 rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-red-800 mb-3">{t('important', language)}</h3>
              <p className="text-lg text-red-900 leading-relaxed">
                {t('notSubstitute', language)}
              </p>
            </div>

            {/* Emergency */}
            <div className="bg-yellow-100 border-4 border-yellow-500 rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-yellow-800 mb-3">{t('emergency', language)}</h3>
              <p className="text-lg text-yellow-900 mb-4 leading-relaxed">
                {t('emergencyText', language)}
              </p>
              <button
                onClick={() => !isMuted && playTTS(t('ambulance', language), language)}
                className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg font-bold text-lg hover:bg-yellow-700"
              >
                {t('ambulance', language)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Health Tips Section */}
      <div className="mt-16 bg-white border-t-4 border-green-600 py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-green-800 mb-8 text-center">{t('generalHealthTips', language)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '💧',
                titleKey: 'stayHydrated',
                descKey: 'stayHydratedDesc'
              },
              {
                icon: '😴',
                titleKey: 'getProperSleep',
                descKey: 'getProperSleepDesc'
              },
              {
                icon: '🏃',
                titleKey: 'exerciseDaily',
                descKey: 'exerciseDailyDesc'
              },
              {
                icon: '🥗',
                titleKey: 'eatHealthyFood',
                descKey: 'eatHealthyFoodDesc'
              },
              {
                icon: '🧼',
                titleKey: 'washYourHands',
                descKey: 'washYourHandsDesc'
              },
              {
                icon: '📅',
                titleKey: 'regularCheckups',
                descKey: 'regularCheckupsDesc'
              },
            ].map((tip, i) => (
              <div key={i} className="bg-gradient-to-br from-green-50 to-amber-50 rounded-xl p-6 border-2 border-green-200 hover:shadow-lg transition">
                <div className="text-4xl mb-3">{tip.icon}</div>
                <h3 className="text-xl font-bold text-green-800 mb-2">{t(tip.titleKey, language)}</h3>
                <p className="text-gray-700 text-lg leading-relaxed">{t(tip.descKey, language)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default MedicineRecommendation;
