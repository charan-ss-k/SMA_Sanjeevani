import React, { useState, useRef, useContext, useEffect } from 'react';
import { AuthContext, LanguageContext } from '../main';
import { playTTS, muteTTS, unmuteTTS } from '../utils/tts';
import { getPrescriptionText } from '../data/prescriptionTranslations';

const HospitalReportAnalyzer = () => {
  const { authToken } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (isMuted) {
      muteTTS();
    } else {
      unmuteTTS();
    }
  }, [isMuted]);

  // Fetch history on component mount and when auth token changes
  useEffect(() => {
    const apiBase = window.__API_BASE__ || 'http://localhost:8000';
    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const response = await fetch(`${apiBase}/api/hospital-report-history`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const data = await response.json();
        if (response.ok) {
          setHistoryItems(data);
        }
      } catch (e) {
        console.error('Failed to load history:', e);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [authToken]);

  const apiBase = window.__API_BASE__ || 'http://localhost:8000';

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
      setAnalysisError(getPrescriptionText('selectFileFirst', language));
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
      const response = await fetch(`${apiBase}/api/hospital-reports/analyze`, {
        method: 'POST',
        body: formData,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || data.message || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
      playTTS(getPrescriptionText('analysisComplete', language), language);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Analysis was cancelled');
        setAnalysisError(getPrescriptionText('analysisCancelled', language));
      } else {
        console.error('Analysis error:', err);
        setAnalysisError(err.message || getPrescriptionText('failedToAnalyze', language));
      }
    } finally {
      setAnalyzing(false);
      abortControllerRef.current = null;
    }
  };

  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const clearReport = () => {
    setFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setAnalysisError('');
  };

  const refreshHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/hospital-report-history`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      const data = await response.json();
      if (response.ok) {
        setHistoryItems(data);
      }
    } catch (e) {
      console.error('Failed to refresh history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const speakSection = (text, title) => {
    const announcement = `${title}. ${text}`;
    playTTS(announcement, language);
  };

  const saveReport = async () => {
    if (!analysisResult) return;

    setSavingReport(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('structured_data', JSON.stringify(analysisResult.structured_data || {}));
      formData.append('extracted_text', analysisResult.extracted_text || '');
      formData.append('report_title', file.name || 'Hospital Report');

      const response = await fetch(`${apiBase}/api/hospital-report-history`, {
        method: 'POST',
        body: formData,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || data.message || 'Failed to save report');
      }

      const saved = await response.json();
      setHistoryItems(prev => [saved, ...prev]);
    } catch (e) {
      console.error('Save report failed:', e);
      setAnalysisError(e.message || getPrescriptionText('failedToSavePrescription', language));
    } finally {
      setSavingReport(false);
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      const response = await fetch(`${apiBase}/api/hospital-report-history/${id}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      if (response.ok) {
        setHistoryItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (e) {
      console.error('Delete history failed:', e);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 p-6 mt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-3xl font-bold text-gray-800">
              🏥 {getPrescriptionText('hospitalReportAnalyzer', language)}
            </h1>
            <button
              onClick={() => setIsMuted(prev => !prev)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                isMuted ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-800'
              }`}
            >
              {isMuted ? `🔇 ${getPrescriptionText('muted', language)}` : `🔊 ${getPrescriptionText('soundOn', language)}`}
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            {getPrescriptionText('uploadTypedPrintedReport', language)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📤 {getPrescriptionText('uploadReport', language)}</h2>

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
                    {getPrescriptionText('dropReportHereOrClick', language)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getPrescriptionText('supportsJpgPngPdf', language)}
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
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {analyzing ? `🔄 ${getPrescriptionText('analyzingReport', language)}` : `🔍 ${getPrescriptionText('analyzeReport', language)}`}
              </button>
              {analyzing && (
                <button
                  onClick={cancelAnalysis}
                  className="px-4 py-3 rounded-lg font-semibold bg-orange-500 text-white hover:bg-orange-600"
                >
                  ⏸️ {getPrescriptionText('stopAnalysis', language)}
                </button>
              )}
              {file && !analyzing && (
                <button
                  onClick={clearReport}
                  className="px-4 py-3 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600"
                >
                  ❌ {getPrescriptionText('clearReport', language)}
                </button>
              )}
            </div>

            {analysisError && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {analysisError}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📊 {getPrescriptionText('analysisResults', language)}</h2>

            {analyzing && (
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-gray-600">🔄 {getPrescriptionText('analyzingReport', language)}...</p>
              </div>
            )}

            {!analyzing && !analysisResult && !analysisError && (
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-gray-500">{getPrescriptionText('analysisResultsWillAppearHere', language)}</p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-4">
                {/* Extracted Text */}
                {analysisResult.extracted_text && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-2">📝 {getPrescriptionText('extractedText', language)}</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{analysisResult.extracted_text}</p>
                  </div>
                )}

                {/* Structured Data */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-bold text-gray-800 mb-3">📊 {getPrescriptionText('structuredData', language)}</h3>

                {/* Patient Information */}
                {analysisResult.structured_data.patient && Object.keys(analysisResult.structured_data.patient).length > 0 && (
                  <InfoCard title={`👤 ${getPrescriptionText('patientInfo', language)}`} data={analysisResult.structured_data.patient} onSpeak={speakSection} language={language} />
                )}

                {/* Test Results */}
                {analysisResult.structured_data.test_results && Object.keys(analysisResult.structured_data.test_results).length > 0 && (
                  <InfoCard title={`🧪 ${getPrescriptionText('testResults', language)}`} data={analysisResult.structured_data.test_results} onSpeak={speakSection} language={language} />
                )}

                {/* Medicines */}
                {analysisResult.structured_data.medicines && analysisResult.structured_data.medicines.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-800">💊 {getPrescriptionText('medicines', language)}</h3>
                      <button
                        onClick={() => speakSection(JSON.stringify(analysisResult.structured_data.medicines), getPrescriptionText('medicines', language))}
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
                          <div className="font-semibold text-gray-800 wrap-break-word whitespace-normal">
                            {medName || getPrescriptionText('unnamedMedicine', language)}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mt-2 wrap-break-word">
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
                    title={`💡 ${getPrescriptionText('medicalAdvice', language)}`}
                    data={analysisResult.structured_data.medical_advice}
                    onSpeak={speakSection}
                    language={language}
                  />
                )}

                {/* Save Report Button - Below advice section */}
                {analysisResult && (
                  <div className="flex items-center justify-center">
                    <button
                      onClick={saveReport}
                      disabled={savingReport}
                      className={`px-6 py-3 rounded-lg font-semibold transition ${
                        savingReport ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {savingReport ? `💾 ${getPrescriptionText('saving', language)}` : `💾 ${getPrescriptionText('saveReportToHistory', language)}`}
                    </button>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">📚 {getPrescriptionText('reportHistory', language)}</h2>
              <button
                onClick={refreshHistory}
                className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              >
                🔄 {getPrescriptionText('refresh', language)}
              </button>
            </div>

            {historyLoading && (
              <div className="text-gray-500">{getPrescriptionText('loadingHistory', language)}</div>
            )}

            {!historyLoading && historyItems.length === 0 && (
              <div className="text-gray-500">{getPrescriptionText('noSavedReportsYet', language)}</div>
            )}

            <div className="space-y-3">
              {historyItems.map(item => (
                <div key={item.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {item.report_title || item.uploaded_file || getPrescriptionText('hospitalReport', language)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getPrescriptionText('saved', language)}: {new Date(item.created_at).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        {getPrescriptionText('medicines', language)}: {(item.structured_data?.medicines || []).length}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                      >
                        {expandedHistoryId === item.id ? `▲ ${getPrescriptionText('hideDetails', language)}` : `▼ ${getPrescriptionText('viewDetails', language)}`}
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                      >
                        🗑️ {getPrescriptionText('deleteReport', language)}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedHistoryId === item.id && (
                    <div className="mt-4 space-y-3">
                      {/* Patient Information */}
                      {item.structured_data.patient && Object.keys(item.structured_data.patient).length > 0 && (
                        <ExpandedInfoSection
                          title={`👤 ${getPrescriptionText('patientInfo', language)}`}
                          data={item.structured_data.patient}
                        />
                      )}

                      {/* Test Results */}
                      {item.structured_data.test_results && Object.keys(item.structured_data.test_results).length > 0 && (
                        <ExpandedInfoSection
                          title={`🧪 ${getPrescriptionText('testResults', language)}`}
                          data={item.structured_data.test_results}
                        />
                      )}

                      {/* Medicines */}
                      {item.structured_data.medicines && item.structured_data.medicines.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <h4 className="font-bold text-gray-800 mb-2">💊 {getPrescriptionText('medicines', language)}</h4>
                          <div className="space-y-2">
                            {item.structured_data.medicines.map((med, idx) => {
                              const medName = med.medicine_name || med.name || med.medicine || med.drug_name || med.item_name || '';
                              const dosage = med.dosage || med.strength || med.dose || '';
                              const frequency = med.frequency || med.freq || '';
                              const duration = med.duration || med.days || '';
                              const timing = med.timing || med.time || '';
                              const instructions = med.special_instructions || med.instructions || med.note || '';

                              return (
                                <div key={idx} className="bg-white p-2 rounded border text-xs">
                                  <div className="font-semibold text-gray-700 text-sm">
                                    {medName || getPrescriptionText('unnamedMedicine', language)}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-gray-600 mt-2 text-xs">
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
                      {item.structured_data.medical_advice && Object.keys(item.structured_data.medical_advice).length > 0 && (
                        <ExpandedInfoSection
                          title={`💡 ${getPrescriptionText('medicalAdvice', language)}`}
                          data={item.structured_data.medical_advice}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Info Card Component
const InfoCard = ({ title, data, onSpeak, language }) => {
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
              <span className="text-gray-600 wrap-break-word whitespace-normal flex-1 min-w-40">
                {value}
              </span>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

// Expanded Info Section for History Items
const ExpandedInfoSection = ({ title, data }) => {
  return (
    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
      <h4 className="font-bold text-gray-800 mb-2">{title}</h4>
      <div className="space-y-1 text-sm">
        {Object.entries(data).map(([key, value]) => (
          value && value !== 'Not specified' && (
            <div key={key} className="flex flex-wrap gap-x-2">
              <span className="font-semibold text-gray-700 capitalize min-w-[120px] text-xs">
                {key.replace(/_/g, ' ')}:
              </span>
              <span className="text-gray-600 wrap-break-word whitespace-normal flex-1 text-xs">
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
