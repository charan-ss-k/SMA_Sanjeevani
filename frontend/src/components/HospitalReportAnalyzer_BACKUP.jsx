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
      const response = await fetch(`${apiBase}/api/hospital-reports/analyze`, {
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
      
      // Play success sound (if not muted)
      if (!isMuted) {
        playTTS('Hospital report analysis complete', language);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Analysis cancelled');
      } else {
        console.error('Analysis error:', error);
        setAnalysisError(error.message);
        if (!isMuted) {
          playTTS('Analysis failed. Please try again.', language);
        }
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
    if (isMuted) return;
    const content = `${title}: ${text}`;
    playTTS(content, language);
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
      console.error('Failed to load history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const saveReport = async () => {
    if (!analysisResult) return;

    setSavingReport(true);
    try {
      const payload = {
        report_title: analysisResult?.structured_data?.hospital_details?.name || file?.name || 'Hospital Report',
        uploaded_file: file?.name || analysisResult?.uploaded_file || null,
        ocr_method: analysisResult?.ocr_method || null,
        extracted_text: analysisResult?.extracted_text || null,
        structured_data: analysisResult?.structured_data || null,
      };

      const response = await fetch(`${apiBase}/api/hospital-report-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || data.message || 'Failed to save report');
      }

      const saved = await response.json();
      setHistoryItems(prev => [saved, ...prev]);
    } catch (e) {
      console.error('Save report failed:', e);
      setAnalysisError(e.message || 'Failed to save report');
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
            🏥 Hospital Report Analyzer
            </h1>
            <button
              onClick={() => setIsMuted(prev => !prev)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                isMuted ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-800'
              }`}
            >
              {isMuted ? '🔇 Muted' : '🔊 Sound On'}
            </button>
          </div>
          <p className="text-gray-600 mt-2">
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
                          <div className="font-semibold text-gray-800 wrap-break-word whitespace-normal">
                            {medName || 'Unnamed medicine'}
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
                    title="💡 Medical Advice"
                    data={analysisResult.structured_data.medical_advice}
                    onSpeak={speakSection}
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
                      {savingReport ? '💾 Saving...' : '💾 Save Report to History'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">📚 Report History</h2>
              <button
                onClick={refreshHistory}
                className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              >
                🔄 Refresh
              </button>
            </div>

            {historyLoading && (
              <div className="text-gray-500">Loading history...</div>
            )}

            {!historyLoading && historyItems.length === 0 && (
              <div className="text-gray-500">No saved reports yet. Save one to see it here.</div>
            )}

            <div className="space-y-3">
              {historyItems.map(item => (
                <div key={item.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {item.report_title || item.uploaded_file || 'Hospital Report'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Saved: {new Date(item.created_at).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        Medicines: {(item.structured_data?.medicines || []).length}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                        className="px-3 py-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition whitespace-nowrap"
                      >
                        {expandedHistoryId === item.id ? '📖 Collapse' : '📖 Expand'}
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="px-3 py-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Expanded Report View */}
                  {expandedHistoryId === item.id && item.structured_data && (
                    <div className="mt-4 pt-4 border-t border-gray-300 space-y-3">
                      {/* Hospital Details */}
                      {item.structured_data.hospital_details && Object.keys(item.structured_data.hospital_details).length > 0 && (
                        <ExpandedInfoSection
                          title="🏥 Hospital Details"
                          data={item.structured_data.hospital_details}
                        />
                      )}

                      {/* Patient Details */}
                      {item.structured_data.patient_details && Object.keys(item.structured_data.patient_details).length > 0 && (
                        <ExpandedInfoSection
                          title="👤 Patient Information"
                          data={item.structured_data.patient_details}
                        />
                      )}

                      {/* Doctor Details */}
                      {item.structured_data.doctor_details && Object.keys(item.structured_data.doctor_details).length > 0 && (
                        <ExpandedInfoSection
                          title="👨‍⚕️ Doctor Details"
                          data={item.structured_data.doctor_details}
                        />
                      )}

                      {/* Visit Details */}
                      {item.structured_data.visit_details && Object.keys(item.structured_data.visit_details).length > 0 && (
                        <ExpandedInfoSection
                          title="📅 Visit Details"
                          data={item.structured_data.visit_details}
                        />
                      )}

                      {/* Medicines */}
                      {item.structured_data.medicines && item.structured_data.medicines.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <h4 className="font-bold text-gray-800 mb-2">💊 Prescribed Medicines</h4>
                          <div className="space-y-2">
                            {item.structured_data.medicines.map((med, idx) => {
                              const medName = med.medicine_name || med.name || med.medicine || med.drug_name || med.item_name || '';
                              const dosage = med.dosage || med.strength || med.dose || '';
                              const frequency = med.frequency || med.freq || '';
                              const duration = med.duration || med.days || '';
                              const timing = med.timing || med.time || '';
                              const instructions = med.special_instructions || med.instructions || med.note || '';

                              return (
                                <div key={idx} className="bg-white p-3 rounded border text-sm">
                                  <div className="font-semibold text-gray-800 wrap-break-word">
                                    {medName || 'Unnamed medicine'}
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
                          title="💡 Medical Advice"
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
