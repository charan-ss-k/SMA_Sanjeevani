import React, { useState, useContext } from 'react';
import { playTTS } from '../utils/tts';
import { LanguageContext } from '../main';
import SearchableInput from './SearchableInput';

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

const SymptomChecker = ({ onResult }) => {
  const { language } = useContext(LanguageContext);
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState('male');
  const [symptoms, setSymptoms] = useState(['fever', 'headache']);
  const [customSymptoms, setCustomSymptoms] = useState('');
  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [pregnant, setPregnant] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const abortControllerRef = React.useRef(null);

  const toggleSymptom = (s) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleAllergy = (a) => {
    setAllergies(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const toggleCondition = (c) => {
    setConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('[SymptomChecker] Request stopped by user');
    }
    setLoading(false);
    window.speechSynthesis.cancel();
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      window.speechSynthesis.cancel();
      console.log('[SymptomChecker] TTS muted');
    } else {
      console.log('[SymptomChecker] TTS unmuted');
    }
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
        playTTS('Please select or enter at least one symptom', language);
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
      playTTS('Processing your symptoms. This may take up to 2 minutes. Please wait.', language);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });
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
      playTTS('Analysis complete. Here are your recommendations.', language);

      // Speak the TTS payload (only if not muted)
      if (data.tts_payload && !isMuted) {
        setTimeout(() => playTTS(data.tts_payload, language), 1000);
      }
    } catch (err) {
      console.error('[SymptomChecker] Full error:', err);
      if (err.name === 'AbortError') {
        setError('Request stopped by user.');
        playTTS('Request stopped.', language);
      } else {
        setError(err.message || 'Network error. Is the backend running on http://127.0.0.1:8000?');
        playTTS('There was an error. Please try again.', language);
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

      {/* Symptoms - Searchable */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-green-800">🤒 Symptoms (Search & Select)</h3>
          <button
            type="button"
            onClick={() => playTTS('Select symptoms you are experiencing. Type to search for symptoms', language)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-lg font-semibold"
          >
            🔊 Help
          </button>
        </div>
        <SearchableInput
          items={COMMON_SYMPTOMS}
          selectedItems={symptoms}
          onSelectionChange={setSymptoms}
          placeholder="Type a symptom (e.g., fever, headache, cough)..."
          label="Select symptoms"
          maxDisplay={8}
        />
        <p className="text-sm text-gray-600 mt-2">💡 Type the first letter of a symptom to filter the list</p>
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

      {/* Allergies - Searchable */}
      <div>
        <h3 className="text-2xl font-bold text-red-800 mb-4">⚠️ Allergies (Search & Select)</h3>
        <SearchableInput
          items={ALLERGIES_LIST}
          selectedItems={allergies}
          onSelectionChange={setAllergies}
          placeholder="Search for allergies (e.g., penicillin, peanuts, gluten)..."
          label="Select allergies if you have any"
          maxDisplay={8}
        />
        <p className="text-sm text-gray-600 mt-2">💡 Type the first letter of an allergy to filter the list</p>
      </div>

      {/* Existing Conditions - Searchable */}
      <div>
        <h3 className="text-2xl font-bold text-orange-800 mb-4">🏥 Existing Health Conditions (Search & Select)</h3>
        <SearchableInput
          items={CONDITIONS_LIST}
          selectedItems={conditions}
          onSelectionChange={setConditions}
          placeholder="Search for health conditions (e.g., diabetes, asthma, heart disease)..."
          label="Select any existing health conditions"
          maxDisplay={8}
        />
        <p className="text-sm text-gray-600 mt-2">💡 Type the first letter of a condition to filter the list</p>
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
        {/* Mute Button */}
        <button
          type="button"
          onClick={handleMuteToggle}
          title={isMuted ? 'Unmute TTS' : 'Mute TTS'}
          className={`px-6 py-4 rounded-xl font-bold text-lg transition shadow-lg ${
            isMuted
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
          }`}
        >
          {isMuted ? '🔇 Unmute' : '🔊 Mute'}
        </button>

        {/* Submit/Stop Button */}
        <button
          type={loading ? 'button' : 'submit'}
          onClick={loading ? handleStop : undefined}
          disabled={!loading && (symptoms.length === 0 && !customSymptoms.trim())}
          className={`flex-1 text-white px-8 py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl transition shadow-lg ${
            loading
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span>⏹️ Stop Processing</span>
            </span>
          ) : (
            '💊 Get Recommendation'
          )}
        </button>

        {/* Instructions Button */}
        <button
          type="button"
          onClick={() => {
            if (!isMuted) {
              playTTS('Ready to help. Select your symptoms and fill the information, then submit.', language);
            }
          }}
          className="px-6 py-4 bg-amber-500 text-white rounded-xl font-bold text-lg hover:bg-amber-600 transition shadow-lg"
        >
          🔊 Help
        </button>
      </div>
    </form>
  );
};

export default SymptomChecker;
