import React, { useContext } from 'react';
import { playTTS } from '../utils/tts';
import { LanguageContext } from '../main';

const RecommendationResult = ({ result, onReset }) => {
  const { language } = useContext(LanguageContext);
  if (!result) return null;

  // Handle both old format (direct result) and new format (with input)
  const resultData = result.result || result;
  const inputData = result.input;

  const {
    predicted_condition,
    recommended_medicines,
    home_care_advice,
    doctor_consultation_advice,
    disclaimer,
    tts_payload,
  } = resultData;

  return (
    <div className="mt-6 space-y-4">
      {/* Input Summary */}
      {inputData && (
        <div className="bg-blue-50 rounded-lg border-l-4 border-blue-500 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📝 Your Inputs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Age:</span>
              <span className="ml-2 text-gray-900">{inputData.age} years</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Gender:</span>
              <span className="ml-2 text-gray-900">{inputData.gender}</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold text-gray-700">Symptoms:</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {inputData.symptoms && inputData.symptoms.map((s, i) => (
                  <span key={i} className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-sm font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            {inputData.allergies && inputData.allergies.length > 0 && (
              <div className="md:col-span-2">
                <span className="font-semibold text-gray-700">Allergies:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {inputData.allergies.map((a, i) => (
                    <span key={i} className="bg-red-100 text-red-900 px-3 py-1 rounded-full text-sm">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {inputData.existing_conditions && inputData.existing_conditions.length > 0 && (
              <div className="md:col-span-2">
                <span className="font-semibold text-gray-700">Existing Conditions:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {inputData.existing_conditions.map((c, i) => (
                    <span key={i} className="bg-yellow-100 text-yellow-900 px-3 py-1 rounded-full text-sm">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
        <h2 className="text-2xl font-bold text-green-900 mb-2">Health Recommendation</h2>
        <p className="text-gray-700 mb-3">{disclaimer}</p>
        <div className="flex gap-3">
          <button
            onClick={() => playTTS(tts_payload || 'No audio available', language)}
            className="bg-amber-50 px-4 py-2 rounded hover:bg-amber-100"
          >
            🔊 Read Aloud
          </button>
          <button onClick={onReset} className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-50">
            ← Back
          </button>
        </div>
      </div>

      {/* Predicted Condition */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-800">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Predicted Condition</h3>
        <p className="text-green-900 font-bold text-xl">{predicted_condition}</p>
      </div>

      {/* Recommended Medicines */}
      {recommended_medicines && recommended_medicines.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommended Medicines</h3>
          <div className="space-y-3">
            {recommended_medicines.map((med, i) => (
              <div key={i} className="p-4 bg-blue-50 rounded border-l-4 border-blue-400">
                <div className="font-bold text-blue-900">{med.name}</div>
                {med.dosage && <div className="text-sm text-gray-700">💊 Dosage: {med.dosage}</div>}
                {med.duration && <div className="text-sm text-gray-700">⏱ Duration: {med.duration}</div>}
                {med.instructions && <div className="text-sm text-gray-700">📋 Instructions: {med.instructions}</div>}
                {med.warnings && med.warnings.length > 0 && (
                  <div className="text-sm text-red-700 mt-2">
                    ⚠️ Warnings:
                    <ul className="ml-4">
                      {med.warnings.map((w, j) => (
                        <li key={j}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  onClick={() => playTTS(`${med.name}. ${med.dosage || ''} ${med.instructions || ''}`, language)}
                  className="text-sm text-blue-600 mt-2 hover:underline"
                >
                  🔊 Read Medicine
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Home Care Advice */}
      {home_care_advice && home_care_advice.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Home Care Advice</h3>
          <ul className="space-y-2">
            {home_care_advice.map((advice, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-600 text-lg">✓</span>
                <span className="text-gray-700">{advice}</span>
                <button
                  onClick={() => playTTS(advice, language)}
                  className="ml-2 text-amber-600 text-sm hover:underline"
                >
                  🔊
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Doctor Consultation Advice */}
      {doctor_consultation_advice && (
        <div className="bg-orange-50 rounded-lg shadow p-6 border-l-4 border-orange-400">
          <h3 className="text-lg font-semibold text-orange-900 mb-2">When to Consult a Doctor</h3>
          <p className="text-orange-800">{doctor_consultation_advice}</p>
          <button
            onClick={() => playTTS(doctor_consultation_advice, language)}
            className="text-sm text-orange-600 mt-2 hover:underline"
          >
            🔊 Read Aloud
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-sm text-yellow-800">
        <p className="font-semibold mb-1">⚠️ Important Disclaimer</p>
        <p>{disclaimer}</p>
      </div>
    </div>
  );
};

export default RecommendationResult;
