import React, { useState, useRef, useContext } from 'react';
import { AuthContext, LanguageContext } from '../main';
import { t } from '../utils/translations';
import { playTTS } from '../utils/tts';

const HospitalReportAnalyzer = () => {
  const { authToken } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAnalysisResult(null);
      setAnalysisError('');

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setAnalysisResult(null);
      setAnalysisError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(droppedFile);
    }
  };

  const analyzeReport = async () => {
    if (!file) {
      setAnalysisError('Please select an image file first');
      return;
    }

    setAnalyzing(true);
    setAnalysisError('');
    setAnalysisResult(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/hospital-reports/analyze', {
        method: 'POST',
        body: formData,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Analysis failed');
      }

      setAnalysisResult(data);
      
      // Play success sound
      playTTS('Hospital report analysis complete', language);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Analysis cancelled');
      } else {
        console.error('Analysis error:', error);
        setAnalysisError(error.message);
        playTTS('Analysis failed. Please try again.', language);
      }
    } finally {
      setAnalyzing(false);
      abortControllerRef.current = null;
    }
  };

  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setAnalyzing(false);
    }
  };

  const clearReport = () => {
    setFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setAnalysisError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const speakSection = (text, title) => {
    const content = `${title}: ${text}`;
    playTTS(content, language);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6 mt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🏥 Hospital Report Analyzer
          </h1>
          <p className="text-gray-600">
            Upload a typed/printed hospital report to extract structured information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📤 Upload Report</h2>

            {/* Drag & Drop Area */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Hospital Report Preview"
                    className="max-h-64 mx-auto rounded border shadow"
                  />
                  <p className="text-sm text-gray-600">{file?.name}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-6xl">📄</div>
                  <p className="text-lg font-semibold text-gray-700">
                    Drop hospital report here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports: JPG, PNG, PDF (printed/typed reports)
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={analyzeReport}
                disabled={!file || analyzing}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  !file || analyzing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {analyzing ? '⏳ Analyzing...' : '🔍 Analyze Report'}
              </button>

              {analyzing && (
                <button
                  onClick={cancelAnalysis}
                  className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  ❌ Cancel
                </button>
              )}

              {file && !analyzing && (
                <button
                  onClick={clearReport}
                  className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  🗑️ Clear
                </button>
              )}
            </div>

            {/* Error Display */}
            {analysisError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold">❌ Analysis Failed</p>
                <p className="text-red-600 text-sm mt-1">{analysisError}</p>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Analysis Results</h2>

            {!analysisResult && !analyzing && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">📋</div>
                <p>Upload a hospital report to see results</p>
              </div>
            )}

            {analyzing && (
              <div className="text-center py-12">
                <div className="animate-spin text-6xl mb-4">⚙️</div>
                <p className="text-gray-600 font-semibold">Analyzing report...</p>
                <p className="text-sm text-gray-500 mt-2">This may take 20-30 seconds</p>
              </div>
            )}

            {analysisResult && analysisResult.structured_data && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {/* Hospital Details */}
                {analysisResult.structured_data.hospital_details && Object.keys(analysisResult.structured_data.hospital_details).length > 0 && (
                  <InfoCard
                    title="🏥 Hospital Details"
                    data={analysisResult.structured_data.hospital_details}
                    onSpeak={speakSection}
                  />
                )}

                {/* Patient Details */}
                {analysisResult.structured_data.patient_details && Object.keys(analysisResult.structured_data.patient_details).length > 0 && (
                  <InfoCard
                    title="👤 Patient Information"
                    data={analysisResult.structured_data.patient_details}
                    onSpeak={speakSection}
                  />
                )}

                {/* Doctor Details */}
                {analysisResult.structured_data.doctor_details && Object.keys(analysisResult.structured_data.doctor_details).length > 0 && (
                  <InfoCard
                    title="👨‍⚕️ Doctor Details"
                    data={analysisResult.structured_data.doctor_details}
                    onSpeak={speakSection}
                  />
                )}

                {/* Visit Details */}
                {analysisResult.structured_data.visit_details && Object.keys(analysisResult.structured_data.visit_details).length > 0 && (
                  <InfoCard
                    title="📅 Visit Details"
                    data={analysisResult.structured_data.visit_details}
                    onSpeak={speakSection}
                  />
                )}

                {/* Medicines */}
                {analysisResult.structured_data.medicines && analysisResult.structured_data.medicines.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-800">💊 Prescribed Medicines ({analysisResult.structured_data.medicines.length})</h3>
                      <button
                        onClick={() => speakSection(JSON.stringify(analysisResult.structured_data.medicines), 'Medicines')}
                        className="p-2 bg-green-100 rounded hover:bg-green-200"
                      >
                        🔊
                      </button>
                    </div>
                    <div className="space-y-2">
                      {analysisResult.structured_data.medicines.map((med, idx) => {
                        const medName = med.medicine_name || med.name || med.medicine || med.drug_name || med.item_name || '';
                        const dosage = med.dosage || med.strength || med.dose || '';
                        const frequency = med.frequency || med.freq || '';
                        const duration = med.duration || med.days || '';
                        const timing = med.timing || med.time || '';
                        const instructions = med.special_instructions || med.instructions || med.note || '';

                        return (
                        <div key={idx} className="bg-white p-3 rounded border w-full">
                          <div className="font-semibold text-gray-800 break-words whitespace-normal">
                            {medName || 'Unnamed medicine'}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mt-2 break-words">
                            {dosage && <div>💉 {dosage}</div>}
                            {frequency && <div>📅 {frequency}</div>}
                            {duration && <div>⏳ {duration}</div>}
                            {timing && <div>🕐 {timing}</div>}
                          </div>
                          {instructions && (
                            <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                              📝 {instructions}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Medical Advice */}
                {analysisResult.structured_data.medical_advice && Object.keys(analysisResult.structured_data.medical_advice).length > 0 && (
                  <InfoCard
                    title="💡 Medical Advice"
                    data={analysisResult.structured_data.medical_advice}
                    onSpeak={speakSection}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Info Card Component
const InfoCard = ({ title, data, onSpeak }) => {
  const dataString = Object.entries(data)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <button
          onClick={() => onSpeak(dataString, title)}
          className="p-2 bg-blue-100 rounded hover:bg-blue-200"
        >
          🔊
        </button>
      </div>
      <div className="space-y-1 text-sm">
        {Object.entries(data).map(([key, value]) => (
          value && value !== 'Not specified' && (
            <div key={key} className="flex flex-wrap gap-x-2">
              <span className="font-semibold text-gray-700 capitalize min-w-[140px]">
                {key.replace(/_/g, ' ')}:
              </span>
              <span className="text-gray-600 break-words whitespace-normal flex-1 min-w-[160px]">
                {value}
              </span>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default HospitalReportAnalyzer;
