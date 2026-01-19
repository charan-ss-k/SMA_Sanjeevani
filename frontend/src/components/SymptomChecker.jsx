import React, { useState } from 'react';

const COMMON_SYMPTOMS = [
  'fever', 'headache', 'body pain', 'cough', 'cold', 'sore throat', 'fatigue',
  'nausea', 'vomiting', 'diarrhea', 'constipation', 'stomach pain', 'rash',
  'itching', 'dizziness', 'back pain', 'joint pain', 'muscle pain', 'weakness',
  'chills', 'sweating', 'loss of appetite', 'insomnia', 'anxiety', 'dry cough',
  'runny nose', 'eye irritation', 'chest pain', 'shortness of breath'
];

const ALLERGIES_LIST = [
  'penicillin', 'amoxicillin', 'aspirin', 'ibuprofen', 'paracetamol', 'dairy',
  'peanuts', 'shellfish', 'eggs', 'gluten', 'soy', 'nuts', 'fish', 'sesame'
];

const CONDITIONS_LIST = [
  'diabetes', 'hypertension', 'asthma', 'heart disease', 'kidney disease',
  'liver disease', 'thyroid', 'arthritis', 'migraine', 'anxiety', 'depression',
  'epilepsy', 'cancer', 'tuberculosis', 'covid-19', 'hiv', 'hepatitis'
];

function speak(text) {
  if (!window.speechSynthesis) return;
  const ut = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(ut);
}

const SymptomChecker = ({ onResult }) => {
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState('male');
  const [symptoms, setSymptoms] = useState(['fever', 'headache']);
  const [customSymptoms, setCustomSymptoms] = useState('');
  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [pregnant, setPregnant] = useState(false);
  const [language, setLanguage] = useState('english');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);

  const toggleSymptom = (s) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleAllergy = (a) => {
    setAllergies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const toggleCondition = (c) => {
    setConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Combine predefined and custom symptoms
      let allSymptoms = [...symptoms];
      if (customSymptoms.trim()) {
        const customList = customSymptoms.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
        allSymptoms = [...new Set([...allSymptoms, ...customList])]; // Remove duplicates
      }

      if (allSymptoms.length === 0) {
        setError('Please select or enter at least one symptom');
        setLoading(false);
        speak('Please select or enter at least one symptom');
        return;
      }

      const payload = {
        age: parseInt(age),
        gender,
        symptoms: allSymptoms,
        allergies,
        existing_conditions: conditions,
        pregnancy_status: pregnant,
        language,
      };

      // Use configurable API base URL (defaults to localhost:8000)
      const apiBase = window.__API_BASE__ || 'http://127.0.0.1:8000';
      const url = `${apiBase}/api/symptoms/recommend`;
      
      console.log('[SymptomChecker] Sending POST to:', url);
      console.log('[SymptomChecker] Payload:', payload);
      speak('Processing your symptoms. This may take up to 2 minutes. Please wait.');

      // Increase timeout to 5 minutes (300 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('[SymptomChecker] Response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[SymptomChecker] Error response:', errorText);
        throw new Error(`Server error: ${res.status}. ${errorText || 'Check console for details.'}`);
      }

      const data = await res.json();
      console.log('[SymptomChecker] Success response:', data);
      // Pass both input data and result
      onResult({
        input: {
          age: parseInt(age),
          gender,
          symptoms: allSymptoms,
          allergies,
          existing_conditions: conditions,
          pregnancy_status: pregnant,
          language,
        },
        result: data,
      });
      speak('Analysis complete. Here are your recommendations.');

      // Speak the TTS payload
      if (data.tts_payload) {
        setTimeout(() => speak(data.tts_payload), 1000);
      }
    } catch (err) {
      console.error('[SymptomChecker] Full error:', err);
      if (err.name === 'AbortError') {
        setError('Request timeout. Please try again or check if backend is running.');
        speak('Request took too long. Please try again.');
      } else {
        setError(err.message || 'Network error. Is the backend running on http://127.0.0.1:8000?');
        speak('There was an error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info - Large text for rural users */}
      <div>
        <h3 className="text-2xl font-bold text-green-800 mb-4">📋 Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
            <label className="block text-lg font-semibold text-gray-800 mb-2">Age (years)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="1"
              max="120"
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg text-lg focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
            <label className="block text-lg font-semibold text-gray-800 mb-2">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg text-lg focus:outline-none focus:border-green-500"
            >
              <option value="male">👨 Male</option>
              <option value="female">👩 Female</option>
              <option value="other">🧑 Other</option>
            </select>
          </div>
          <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
            <label className="block text-lg font-semibold text-gray-800 mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg text-lg focus:outline-none focus:border-green-500"
            >
              <option value="english">English</option>
              <option value="hindi">हिन्दी (Hindi)</option>
              <option value="telugu">తెలుగు (Telugu)</option>
              <option value="tamil">தமிழ் (Tamil)</option>
              <option value="bengali">বাংলা (Bengali)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Symptoms - Predefined */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-green-800">🤒 Symptoms (Select all that apply)</h3>
          <button
            type="button"
            onClick={() => speak('Select symptoms you are experiencing')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-lg font-semibold"
          >
            🔊 Help
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(showAllSymptoms ? COMMON_SYMPTOMS : COMMON_SYMPTOMS.slice(0, 12)).map((s) => (
            <label
              key={s}
              className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-green-100 hover:border-green-500 transition"
            >
              <input
                type="checkbox"
                checked={symptoms.includes(s)}
                onChange={() => {
                  setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
                }}
                className="w-5 h-5 mr-3 cursor-pointer"
              />
              <span className="text-lg capitalize font-medium">{s}</span>
            </label>
          ))}
        </div>
        {!showAllSymptoms && COMMON_SYMPTOMS.length > 12 && (
          <button
            type="button"
            onClick={() => setShowAllSymptoms(true)}
            className="mt-4 text-green-600 font-semibold hover:text-green-800 text-lg"
          >
            + Show More Symptoms
          </button>
        )}
      </div>

      {/* Custom Symptoms Text Input */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-blue-800 mb-4">✍️ Other Symptoms (Enter in text)</h3>
        <p className="text-lg text-gray-700 mb-3">Don't see your symptom above? Enter it here.</p>
        <textarea
          value={customSymptoms}
          onChange={(e) => setCustomSymptoms(e.target.value)}
          placeholder="Example: burning sensation, ear pain, severe itching&#10;(Separate multiple symptoms with comma)"
          className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg text-lg focus:outline-none focus:border-blue-500 h-24"
        />
        <p className="text-sm text-gray-600 mt-2">Tip: Separate multiple symptoms with commas (,)</p>
      </div>

      {/* Allergies */}
      <div>
        <h3 className="text-2xl font-bold text-red-800 mb-4">⚠️ Allergies (if you have any)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ALLERGIES_LIST.map((a) => (
            <label
              key={a}
              className="flex items-center p-3 border-2 border-red-200 rounded-lg bg-red-50 cursor-pointer hover:bg-red-100 hover:border-red-500 transition"
            >
              <input
                type="checkbox"
                checked={allergies.includes(a)}
                onChange={() => {
                  setAllergies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
                }}
                className="w-5 h-5 mr-3 cursor-pointer"
              />
              <span className="text-lg capitalize font-medium">{a}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Existing Conditions */}
      <div>
        <h3 className="text-2xl font-bold text-orange-800 mb-4">🏥 Existing Health Conditions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {CONDITIONS_LIST.map((c) => (
            <label
              key={c}
              className="flex items-center p-3 border-2 border-orange-200 rounded-lg bg-orange-50 cursor-pointer hover:bg-orange-100 hover:border-orange-500 transition"
            >
              <input
                type="checkbox"
                checked={conditions.includes(c)}
                onChange={() => {
                  setConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
                }}
                className="w-5 h-5 mr-3 cursor-pointer"
              />
              <span className="text-lg capitalize font-medium">{c}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Pregnancy Status */}
      <div className="border-2 border-purple-300 rounded-lg p-6 bg-purple-50">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={pregnant}
            onChange={(e) => setPregnant(e.target.checked)}
            className="w-6 h-6 mr-4 cursor-pointer"
          />
          <span className="text-xl font-semibold text-purple-800">🤰 Currently Pregnant</span>
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-6 bg-red-100 border-3 border-red-500 text-red-800 rounded-lg text-lg font-semibold">
          ❌ {error}
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex flex-col md:flex-row gap-4 pt-6 border-t-4 border-green-300">
        <button
          type="submit"
          disabled={loading || symptoms.length === 0 && !customSymptoms.trim()}
          className="flex-1 bg-gradient-to-r from-green-700 to-green-600 text-white px-8 py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl hover:from-green-800 hover:to-green-700 transition shadow-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Processing (1-2 min)...
            </span>
          ) : (
            '💊 Get Recommendation'
          )}
        </button>
        <button
          type="button"
          onClick={() => speak('Ready to help. Select your symptoms and fill the information, then submit.')}
          className="flex-1 bg-amber-500 text-white px-8 py-4 rounded-xl font-bold text-xl hover:bg-amber-600 transition shadow-lg"
        >
          🔊 Read Instructions
        </button>
      </div>
    </form>
  );
};

export default SymptomChecker;
