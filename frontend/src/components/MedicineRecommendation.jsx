import React, { useState } from 'react';
import SymptomChecker from './SymptomChecker';
import RecommendationResult from './RecommendationResult';

function speak(text) {
  if (!window.speechSynthesis) return;
  const ut = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(ut);
}

const MedicineRecommendation = () => {
  const [result, setResult] = useState(null);
  const [showForm, setShowForm] = useState(true);

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
    speak('Got your recommendations. Please review them carefully.');
  };

  const handleReset = () => {
    setResult(null);
    setShowForm(true);
    speak('Form cleared. Ready for new input.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-amber-50 pt-24 pb-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-green-800 mb-4">
            💊 Medicine Recommendation
          </h1>
          <p className="text-xl text-gray-700">
            Tell us about your symptoms, and AI will recommend safe medicines for you
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form (2/3 width on large screens) */}
          {showForm ? (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-8 border-4 border-green-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-green-800">Tell us about yourself</h2>
                  <button
                    onClick={() => speak('Fill in your symptoms and health information')}
                    className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 flex items-center gap-2 text-lg"
                  >
                    🔊 Read Instructions
                  </button>
                </div>
                <SymptomChecker onResult={handleResult} />
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-8 border-4 border-green-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-green-800">Your Recommendations</h2>
                  <button
                    onClick={handleReset}
                    className="bg-amber-600 text-white px-6 py-3 rounded-full hover:bg-amber-700 font-semibold text-lg"
                  >
                    ← New Symptoms
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
              <h3 className="text-2xl font-bold mb-4">💡 Quick Tips</h3>
              <ul className="space-y-3 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <span>Be honest about your symptoms</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <span>Tell us if you're allergic to any medicine</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <span>List all health conditions you have</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <span>Follow dosage carefully</span>
                </li>
              </ul>
            </div>

            {/* Warning Box */}
            <div className="bg-red-100 border-4 border-red-500 rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-red-800 mb-3">⚠️ Important</h3>
              <p className="text-lg text-red-900 leading-relaxed">
                This is not a substitute for professional medical advice. Always consult a doctor for serious symptoms.
              </p>
            </div>

            {/* Emergency */}
            <div className="bg-yellow-100 border-4 border-yellow-500 rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-yellow-800 mb-3">🆘 Emergency</h3>
              <p className="text-lg text-yellow-900 mb-4 leading-relaxed">
                If you have chest pain, difficulty breathing, or severe bleeding — call ambulance immediately!
              </p>
              <button
                onClick={() => speak('Emergency hotline 108')}
                className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg font-bold text-lg hover:bg-yellow-700"
              >
                📞 Ambulance: 108
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Health Tips Section */}
      <div className="mt-16 bg-white border-t-4 border-green-600 py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-green-800 mb-8 text-center">General Health Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '💧',
                title: 'Stay Hydrated',
                desc: 'Drink 8-10 glasses of water daily. Pure water helps your body fight infections.'
              },
              {
                icon: '😴',
                title: 'Get Proper Sleep',
                desc: 'Sleep 7-9 hours every night. Good sleep boosts your immunity.'
              },
              {
                icon: '🏃',
                title: 'Exercise Daily',
                desc: 'Walk 30 minutes daily. Exercise keeps your heart and mind healthy.'
              },
              {
                icon: '🥗',
                title: 'Eat Healthy Food',
                desc: 'Eat vegetables, fruits, and whole grains. Avoid junk food.'
              },
              {
                icon: '🧼',
                title: 'Wash Your Hands',
                desc: 'Wash hands before eating and after using toilet. Prevent infections.'
              },
              {
                icon: '📅',
                title: 'Regular Checkups',
                desc: 'Visit doctor every 6 months. Early detection saves lives.'
              },
            ].map((tip, i) => (
              <div key={i} className="bg-gradient-to-br from-green-50 to-amber-50 rounded-xl p-6 border-2 border-green-200 hover:shadow-lg transition">
                <div className="text-4xl mb-3">{tip.icon}</div>
                <h3 className="text-xl font-bold text-green-800 mb-2">{tip.title}</h3>
                <p className="text-gray-700 text-lg leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineRecommendation;
