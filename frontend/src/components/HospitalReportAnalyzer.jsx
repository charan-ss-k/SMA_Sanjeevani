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

            {analysisResult && analysisResult.structured_data && (
              <div className="mt-6">
                {/* Professional Medical Report - Inline Display */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                  {(() => {
                    const data = analysisResult.structured_data || {};
                    const hospital = data.hospital_details || {};
                    const doctor = data.doctor_details || {};
                    const patient = data.patient_details || {};
                    const clinical = data.clinical_details || {};
                    const medicines = data.medicines || [];
                    const advice = data.medical_advice || {};
                    
                    const hasHospitalData = hospital.name || hospital.address || hospital.phone;
                    const hasDoctorData = doctor.name || doctor.qualifications;
                    const hasPatientData = patient.name || patient.patient_id || patient.age;
                    const hasClinicalData = clinical.diagnosis || clinical.chief_complaints?.length > 0;
                    const isIncompleteData = data.additional_information?.includes("regex fallback");

                    return (
                      <>
                        {/* Warning for Incomplete Data */}
                        {isIncompleteData && (
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                            <div className="flex items-start">
                              <span className="text-2xl mr-3">⚠️</span>
                              <div>
                                <h4 className="font-bold text-yellow-800 mb-1">Incomplete Data Extraction</h4>
                                <p className="text-sm text-yellow-700">
                                  Some details could not be extracted. Only medicine information is available. 
                                  Please verify with the original prescription.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 mb-6 no-print">
                          <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                          >
                            🖨️ Print Report
                          </button>
                          <button
                            onClick={saveReport}
                            disabled={savingReport}
                            className={`px-4 py-2 rounded-lg font-semibold transition ${
                              savingReport ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {savingReport ? '💾 Saving...' : '💾 Save Report'}
                          </button>
                        </div>
                        
                        {/* Header - Hospital Details */}
                        {hasHospitalData && (
                          <div className="text-center border-b-4 border-blue-600 pb-6 mb-6">
                            <h1 className="text-3xl font-bold text-blue-900 mb-2">
                              {hospital.name || 'Medical Center'}
                            </h1>
                            {hospital.address && (
                              <p className="text-gray-700 text-sm mb-1">{hospital.address}</p>
                            )}
                            <div className="flex justify-center gap-6 text-sm text-gray-600 mt-2">
                              {hospital.phone && <span>📞 {hospital.phone}</span>}
                              {hospital.email && <span>✉️ {hospital.email}</span>}
                            </div>
                            {hospital.timings && (
                              <p className="text-xs text-gray-500 mt-2">
                                🕒 {hospital.timings} {hospital.closed_days && `• ${hospital.closed_days}`}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Doctor Details */}
                        {hasDoctorData && (
                          <div className="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-600">
                            <h3 className="font-bold text-blue-900 mb-2 text-lg">👨‍⚕️ Doctor Information</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {doctor.name && (
                                <div>
                                  <span className="text-gray-600">Name:</span>
                                  <p className="font-semibold text-gray-900">{doctor.name}</p>
                                </div>
                              )}
                              {doctor.qualifications && (
                                <div>
                                  <span className="text-gray-600">Qualifications:</span>
                                  <p className="font-semibold text-gray-900">{doctor.qualifications}</p>
                                </div>
                              )}
                              {doctor.specialization && (
                                <div>
                                  <span className="text-gray-600">Specialization:</span>
                                  <p className="font-semibold text-gray-900">{doctor.specialization}</p>
                                </div>
                              )}
                              {doctor.registration_number && (
                                <div>
                                  <span className="text-gray-600">Registration No:</span>
                                  <p className="font-semibold text-gray-900">{doctor.registration_number}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Patient Details */}
                        {hasPatientData && (
                          <div className="bg-green-50 rounded-lg p-4 mb-6 border-l-4 border-green-600">
                            <h3 className="font-bold text-green-900 mb-2 text-lg">🧑 Patient Information</h3>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              {patient.name && (
                                <div>
                                  <span className="text-gray-600">Name:</span>
                                  <p className="font-semibold text-gray-900">{patient.name}</p>
                                </div>
                              )}
                              {patient.patient_id && (
                                <div>
                                  <span className="text-gray-600">Patient ID:</span>
                                  <p className="font-semibold text-gray-900">{patient.patient_id}</p>
                                </div>
                              )}
                              {patient.age && (
                                <div>
                                  <span className="text-gray-600">Age:</span>
                                  <p className="font-semibold text-gray-900">{patient.age}</p>
                                </div>
                              )}
                              {patient.gender && (
                                <div>
                                  <span className="text-gray-600">Gender:</span>
                                  <p className="font-semibold text-gray-900">{patient.gender}</p>
                                </div>
                              )}
                              {patient.mobile && (
                                <div>
                                  <span className="text-gray-600">Contact:</span>
                                  <p className="font-semibold text-gray-900">{patient.mobile}</p>
                                </div>
                              )}
                              {patient.visit_date && (
                                <div>
                                  <span className="text-gray-600">Visit Date:</span>
                                  <p className="font-semibold text-gray-900">{patient.visit_date}</p>
                                </div>
                              )}
                              {patient.address && (
                                <div className="col-span-3">
                                  <span className="text-gray-600">Address:</span>
                                  <p className="font-semibold text-gray-900">{patient.address}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Clinical Details */}
                        {hasClinicalData && (
                          <div className="bg-orange-50 rounded-lg p-4 mb-6 border-l-4 border-orange-600">
                            <h3 className="font-bold text-orange-900 mb-2 text-lg">🩺 Clinical Information</h3>
                            
                            {/* Vitals */}
                            {(clinical.weight_kg || clinical.height_cm || clinical.bmi || clinical.blood_pressure) && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-gray-600 mb-1">VITAL SIGNS</p>
                                <div className="grid grid-cols-4 gap-2 text-sm">
                                  {clinical.weight_kg && (
                                    <div className="bg-white p-2 rounded">
                                      <span className="text-gray-600 text-xs">Weight:</span>
                                      <p className="font-bold text-orange-700">{clinical.weight_kg} kg</p>
                                    </div>
                                  )}
                                  {clinical.height_cm && (
                                    <div className="bg-white p-2 rounded">
                                      <span className="text-gray-600 text-xs">Height:</span>
                                      <p className="font-bold text-orange-700">{clinical.height_cm} cm</p>
                                    </div>
                                  )}
                                  {clinical.bmi && (
                                    <div className="bg-white p-2 rounded">
                                      <span className="text-gray-600 text-xs">BMI:</span>
                                      <p className="font-bold text-orange-700">{clinical.bmi}</p>
                                    </div>
                                  )}
                                  {clinical.blood_pressure && (
                                    <div className="bg-white p-2 rounded">
                                      <span className="text-gray-600 text-xs">BP:</span>
                                      <p className="font-bold text-orange-700">{clinical.blood_pressure}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Complaints */}
                            {clinical.chief_complaints && clinical.chief_complaints.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-gray-600 mb-1">CHIEF COMPLAINTS</p>
                                <ul className="list-disc list-inside text-sm text-gray-800 bg-white p-2 rounded">
                                  {clinical.chief_complaints.map((complaint, idx) => (
                                    <li key={idx}>{complaint}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Diagnosis */}
                            {clinical.diagnosis && (
                              <div>
                                <p className="text-xs font-semibold text-gray-600 mb-1">DIAGNOSIS</p>
                                <p className="font-bold text-orange-900 bg-white p-2 rounded">{clinical.diagnosis}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Medicines - Most Important Section */}
                        {medicines.length > 0 && (
                          <div className="bg-red-50 rounded-lg p-4 mb-6 border-l-4 border-red-600">
                            <h3 className="font-bold text-red-900 mb-3 text-lg">💊 Prescription</h3>
                            <div className="space-y-3">
                              {medicines.map((med, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-lg border border-red-200">
                                  <div className="flex items-start gap-3">
                                    <span className="bg-red-600 text-white font-bold rounded-full w-7 h-7 flex items-center justify-center text-sm flex-shrink-0">
                                      {med.serial_number || idx + 1}
                                    </span>
                                    <div className="flex-1">
                                      <h4 className="font-bold text-gray-900 text-base mb-1">
                                        {med.medicine_type && <span className="text-red-600">{med.medicine_type}. </span>}
                                        {med.name}
                                        {med.strength && <span className="text-gray-600 font-normal ml-2">{med.strength}</span>}
                                      </h4>
                                      
                                      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                                        {med.dosage && (
                                          <div>
                                            <span className="text-gray-600">Dosage:</span>
                                            <p className="font-medium text-gray-900">{med.dosage}</p>
                                          </div>
                                        )}
                                        {med.timing && (
                                          <div>
                                            <span className="text-gray-600">Timing:</span>
                                            <p className="font-medium text-gray-900">{med.timing}</p>
                                          </div>
                                        )}
                                        {med.frequency && (
                                          <div>
                                            <span className="text-gray-600">Frequency:</span>
                                            <p className="font-medium text-gray-900">{med.frequency}</p>
                                          </div>
                                        )}
                                        {med.duration && (
                                          <div>
                                            <span className="text-gray-600">Duration:</span>
                                            <p className="font-medium text-gray-900">{med.duration}</p>
                                          </div>
                                        )}
                                        {med.when_to_take && (
                                          <div>
                                            <span className="text-gray-600">When to take:</span>
                                            <p className="font-medium text-gray-900">{med.when_to_take}</p>
                                          </div>
                                        )}
                                        {med.total_quantity && (
                                          <div>
                                            <span className="text-gray-600">Total:</span>
                                            <p className="font-medium text-gray-900">{med.total_quantity}</p>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {med.instructions && (
                                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                          ℹ️ {med.instructions}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Medical Advice */}
                        {(advice.advice?.length > 0 || advice.dietary_restrictions || advice.precautions || advice.follow_up_date) && (
                          <div className="bg-purple-50 rounded-lg p-4 mb-6 border-l-4 border-purple-600">
                            <h3 className="font-bold text-purple-900 mb-2 text-lg">📝 Medical Advice & Instructions</h3>
                            
                            {advice.advice && advice.advice.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-gray-600 mb-1">GENERAL ADVICE</p>
                                <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                                  {advice.advice.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {advice.dietary_restrictions && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-gray-600 mb-1">DIETARY RESTRICTIONS</p>
                                <p className="text-sm text-gray-800">{advice.dietary_restrictions}</p>
                              </div>
                            )}

                            {advice.precautions && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-gray-600 mb-1">PRECAUTIONS</p>
                                <p className="text-sm text-gray-800">{advice.precautions}</p>
                              </div>
                            )}

                            {advice.follow_up_date && (
                              <div className="bg-purple-100 p-2 rounded">
                                <p className="text-xs font-semibold text-gray-600">FOLLOW UP</p>
                                <p className="font-bold text-purple-900">{advice.follow_up_date}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="border-t-2 border-gray-300 pt-4 mt-6 text-center">
                          <p className="text-xs text-gray-500 mb-1">
                            This is an AI-assisted analysis of the medical document. Please verify all information with the original prescription.
                          </p>
                          <p className="text-xs text-gray-400">
                            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}</style>

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
