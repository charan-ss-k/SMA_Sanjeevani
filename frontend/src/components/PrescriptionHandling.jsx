import React, { useState, useEffect, useContext, useRef } from 'react';
import logo from '../assets/Sanjeevani Logo.png';
import { AuthContext } from '../main';
import { LanguageContext } from '../main';
import FeatureLoginPrompt from './FeatureLoginPrompt';
import PrescriptionAnalyzer from './PrescriptionAnalyzer';
import { t } from '../utils/translations';
import { playTTS } from '../utils/tts';

const MedicineCard = ({ med, onDelete, onEdit, onSpeak, language }) => (
  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500 hover:shadow-lg transition">
    <div className="flex gap-3 items-start">
      <div className="h-14 w-14 bg-gradient-to-br from-green-100 to-blue-100 rounded-md flex items-center justify-center font-bold text-green-700">
        💊
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-gray-800 text-lg">{med.name}</h4>
          <div className="flex items-center gap-1">
            <button onClick={onSpeak} className="p-2 bg-amber-50 rounded hover:bg-amber-100 text-sm">🔊</button>
            <button onClick={onEdit} className="p-2 bg-blue-50 rounded hover:bg-blue-100 text-sm">✏️</button>
            <button onClick={onDelete} className="p-2 bg-red-50 rounded hover:bg-red-100 text-sm">🗑️</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
          <div>💉 <span className="font-semibold">{med.dosage}</span></div>
          <div>📅 <span className="font-semibold">{med.frequency}</span></div>
          <div>⏳ <span className="font-semibold">{med.duration}</span></div>
          <div>📦 <span className="font-semibold">{med.quantity} {t('units', language)}</span></div>
        </div>
        {med.reminders && med.reminders.length > 0 && (
          <div className="mt-2 p-2 bg-green-50 rounded">
            <div className="text-xs font-semibold text-green-800">{t('reminders', language)}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {med.reminders.map((r, i) => (
                <span key={i} className="bg-green-200 text-green-900 px-2 py-1 rounded text-xs font-medium">
                  ⏰ {r}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-2 text-xs text-gray-500">📝 {med.notes || 'No notes'}</div>
      </div>
    </div>
  </div>
);

const PrescriptionHandling = () => {
  const { isAuthenticated, authToken } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  const [medicines, setMedicines] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
    reminders: [],
    notes: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'analyze'
  
  // Image analysis state
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  // Prescription history state
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('prescriptions');
    if (saved) setMedicines(JSON.parse(saved));
    
    // Fetch prescription history from database
    if (isAuthenticated) {
      fetchPrescriptionHistory();
    }
  }, [isAuthenticated]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('prescriptions', JSON.stringify(medicines));
  }, [medicines]);

  const fetchPrescriptionHistory = async () => {
    try {
      const response = await fetch('/api/prescriptions/', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPrescriptionHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch prescription history:', err);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      window.speechSynthesis.cancel();
    }
    if (!isMuted) {
      playTTS(t('voiceMuted', language), language);
    } else {
      playTTS(t('voiceUnmuted', language), language);
    }
  };

  const handleAddMedicine = () => {
    if (!formData.name || !formData.dosage || !formData.frequency) {
      alert(t('pleaseFillRequired', language));
      return;
    }

    if (editingId) {
      // Edit existing
      setMedicines(prev => prev.map(m => 
        m.id === editingId ? { ...formData, id: editingId } : m
      ));
      setEditingId(null);
    } else {
      // Add new
      setMedicines(prev => [...prev, {
        ...formData,
        id: Date.now(),
        quantity: parseInt(formData.quantity) || 0,
        reminders: formData.reminders || [],
      }]);
    }

    setFormData({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      reminders: [],
      notes: '',
    });
    setShowForm(false);
    if (!isMuted) {
      playTTS(editingId ? t('medicineUpdated', language) : t('medicineAdded', language), language);
    }
  };

  const handleEditMedicine = (med) => {
    setFormData(med);
    setEditingId(med.id);
    setShowForm(true);
  };

  const handleDeleteMedicine = (id) => {
    if (confirm(t('deleteThisMedicine', language))) {
      setMedicines(prev => prev.filter(m => m.id !== id));
      if (!isMuted) {
        playTTS(t('medicineDeleted', language), language);
      }
    }
  };

  const handleSpeakMedicine = (med) => {
    const text = `${med.name}. ${t('dosage', language)}: ${med.dosage}. ${t('frequency', language)}: ${med.frequency}. ${med.notes}`;
    playTTS(text, language);
  };

  // Image analysis handlers
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAnalysisError('');
      setAnalysisResult(null);
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
      
      if (!isMuted) {
        playTTS(t('imageSelected', language), language);
      }
    }
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setAnalyzing(false);
      setAnalysisError('Analysis cancelled by user');
      if (!isMuted) {
        playTTS(t('analysisCancelled', language), language);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setAnalysisError('Please select an image first');
      return;
    }

    setAnalyzing(true);
    setAnalysisError('');
    setAnalysisResult(null);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    if (!isMuted) {
      playTTS(t('analyzingImage', language), language);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/medicine-identification/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to analyze medicine image');
      }

      const data = await response.json();

      if (data.analysis) {
        setAnalysisResult(data.analysis);
        if (!isMuted) {
          playTTS(t('analysisComplete', language), language);
        }
      } else {
        setAnalysisError('No analysis data received');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setAnalysisError('Analysis cancelled');
      } else {
        console.error('Analysis error:', err);
        setAnalysisError(`Failed to analyze medicine: ${err.message}`);
        if (!isMuted) {
          playTTS(t('analysisFailed', language), language);
        }
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSpeakAnalysisResult = () => {
    if (!analysisResult) return;
    
    const text = `${analysisResult.medicine_name || 'Unknown medicine'}. ${
      analysisResult.dosage ? `${t('dosage', language)}: ${analysisResult.dosage}.` : ''
    } ${analysisResult.full_information || ''}`;
    
    playTTS(text, language);
  };

  const handleSaveAnalysisResult = async () => {
    if (!analysisResult) return;

    try {
      const prescriptionData = {
        medicine_name: analysisResult.medicine_name || 'Unknown Medicine',
        dosage: analysisResult.dosage || 'As prescribed',
        frequency: 'As per prescription',
        duration: 'As prescribed',
        notes: analysisResult.full_information || 'Medicine identified from image',
        doctor_name: 'AI Medicine Identification',
        category: analysisResult.category,
        manufacturer: analysisResult.manufacturer,
        price: analysisResult.price,
        source: analysisResult.source,
      };

      const response = await fetch('/api/prescriptions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(prescriptionData),
      });

      if (!response.ok) {
        throw new Error('Failed to save prescription');
      }

      // Also add to local medicines list
      setMedicines(prev => [...prev, {
        id: Date.now(),
        name: analysisResult.medicine_name || 'Unknown Medicine',
        dosage: analysisResult.dosage || 'As prescribed',
        frequency: 'As per prescription',
        duration: 'As prescribed',
        quantity: 0,
        reminders: [],
        notes: analysisResult.full_information || 'Medicine identified from image',
      }]);

      // Refresh prescription history
      fetchPrescriptionHistory();
      
      // Reset analysis state
      setAnalysisResult(null);
      setFile(null);
      setImagePreview(null);
      
      if (!isMuted) {
        playTTS(t('prescriptionSaved', language), language);
      }
    } catch (err) {
      console.error('Save error:', err);
      setAnalysisError(`Failed to save: ${err.message}`);
      if (!isMuted) {
        playTTS(t('saveFailed', language), language);
      }
    }
  };

  const handleDeletePrescription = async (id) => {
    if (!confirm(t('deleteThisPrescription', language))) return;

    try {
      const response = await fetch(`/api/prescriptions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        setPrescriptionHistory(prev => prev.filter(p => p.id !== id));
        if (!isMuted) {
          playTTS(t('prescriptionDeleted', language), language);
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const stats = {
    totalMedicines: medicines.length,
    totalPrescriptions: prescriptionHistory.length,
  };

  return (
    <>
      {!isAuthenticated && <FeatureLoginPrompt featureName="prescription management" />}
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 pt-24 pb-10">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-green-800 mb-2">{t('prescriptionMedicineManagement', language)}</h1>
            <p className="text-xl text-gray-700">{t('uploadTrackReminders', language)}</p>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">{t('totalMedicines', language)}</h3>
            <p className="text-4xl font-bold mt-2">{stats.totalMedicines}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">{t('savedPrescriptions', language)}</h3>
            <p className="text-4xl font-bold mt-2">{stats.totalPrescriptions}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-4 font-bold transition border-b-4 ${
              activeTab === 'manage'
                ? 'border-b-blue-600 text-blue-600'
                : 'border-b-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Manage Prescriptions
          </button>
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-6 py-4 font-bold transition border-b-4 ${
              activeTab === 'analyze'
                ? 'border-b-purple-600 text-purple-600'
                : 'border-b-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            📸 Analyze Handwritten
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'analyze' && (
          <div className="mb-8">
            <PrescriptionAnalyzer />
          </div>
        )}

        {activeTab === 'manage' && (
          <>

        {/* AI Medicine Identification Section - Inline */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🔍 {t('aiMedicineIdentification', language)}</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div>
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!imagePreview ? (
                  <div className="text-center">
                    <div className="text-6xl mb-4">📸</div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-lg text-lg font-semibold transition"
                    >
                      {t('selectImage', language)}
                    </button>
                    <p className="text-sm text-gray-600 mt-3">{t('uploadMedicineImage', language)}</p>
                  </div>
                ) : (
                  <div>
                    <img src={imagePreview} alt="Preview" className="w-full h-64 object-contain rounded-lg mb-4" />
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition"
                      >
                        {t('changeImage', language)}
                      </button>
                      <button
                        onClick={() => {
                          setFile(null);
                          setImagePreview(null);
                          setAnalysisResult(null);
                          setAnalysisError('');
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold transition"
                      >
                        {t('clear', language)}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {file && !analyzing && !analysisResult && (
                <button
                  onClick={handleAnalyze}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-4 rounded-lg text-lg font-bold transition"
                >
                  🔍 {t('analyzeNow', language)}
                </button>
              )}
              
              {analyzing && (
                <div className="mt-4 flex flex-col items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-300 border-t-blue-700 rounded-full"></div>
                  <div className="text-blue-900 font-semibold">{t('analyzingPleaseWait', language)}</div>
                  <button
                    onClick={handleCancelAnalysis}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                  >
                    ⛔ {t('stopAnalysis', language)}
                  </button>
                </div>
              )}
              
              {analysisError && (
                <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="text-red-800 font-semibold">{analysisError}</p>
                </div>
              )}
            </div>

            {/* Analysis Results Section */}
            <div>
              {analysisResult ? (
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border-2 border-green-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">📋 {t('analysisResults', language)}</h3>
                    <button
                      onClick={handleSpeakAnalysisResult}
                      className="bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-lg transition"
                      title={t('listenToResults', language)}
                    >
                      🔊
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {analysisResult.medicine_name && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-300 shadow-md">
                        <div className="text-xs uppercase tracking-wider text-green-700 font-bold mb-1">{t('medicineName', language)}</div>
                        <div className="text-2xl font-extrabold text-green-900 bg-yellow-100 px-3 py-2 rounded inline-block">
                          💊 {analysisResult.medicine_name}
                        </div>
                      </div>
                    )}
                    
                    {analysisResult.dosage && (
                      <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                        <div className="text-xs uppercase tracking-wider text-blue-700 font-bold mb-1">{t('dosage', language)}</div>
                        <div className="text-lg font-semibold text-gray-800">💉 {analysisResult.dosage}</div>
                      </div>
                    )}
                    
                    {analysisResult.category && (
                      <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
                        <div className="text-xs uppercase tracking-wider text-purple-700 font-bold mb-1">{t('category', language)}</div>
                        <div className="text-lg font-semibold text-gray-800">🏷️ {analysisResult.category}</div>
                      </div>
                    )}
                    
                    {analysisResult.manufacturer && (
                      <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500 shadow-sm">
                        <div className="text-xs uppercase tracking-wider text-indigo-700 font-bold mb-1">{t('manufacturer', language)}</div>
                        <div className="text-lg font-semibold text-gray-800">🏭 {analysisResult.manufacturer}</div>
                      </div>
                    )}
                    
                    {analysisResult.price && (
                      <div className="bg-white p-4 rounded-lg border-l-4 border-amber-500 shadow-sm">
                        <div className="text-xs uppercase tracking-wider text-amber-700 font-bold mb-1">{t('price', language)}</div>
                        <div className="text-xl font-bold text-amber-800">💰 {analysisResult.price}</div>
                      </div>
                    )}
                    
                    {analysisResult.full_information && (
                      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                        <div className="text-xs uppercase tracking-wider text-blue-800 font-bold mb-2">ℹ️ {t('additionalInformation', language)}</div>
                        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{analysisResult.full_information}</div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleSaveAnalysisResult}
                    className="w-full mt-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 rounded-lg font-bold transition"
                  >
                    ✓ {t('saveToPrescriptions', language)}
                  </button>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-3">🔍</div>
                    <p className="font-semibold">{t('analysisResultsWillAppearHere', language)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prescription History Section - Inline */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">📚 {t('prescriptionHistory', language)}</h2>
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                fetchPrescriptionHistory();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              {showHistory ? t('hide', language) : t('show', language)}
            </button>
          </div>
          
          {showHistory && (
            prescriptionHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{t('noPrescriptionHistory', language)}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('medicineName', language)}</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('dosage', language)}</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('frequency', language)}</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('duration', language)}</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('date', language)}</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('actions', language)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptionHistory.map(prescription => (
                      <tr key={prescription.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold">{prescription.medicine_name}</td>
                        <td className="px-4 py-3">{prescription.dosage}</td>
                        <td className="px-4 py-3">{prescription.frequency}</td>
                        <td className="px-4 py-3">{prescription.duration}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(prescription.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => playTTS(
                                `${prescription.medicine_name}. ${prescription.dosage}. ${prescription.frequency}. ${prescription.notes}`,
                                language
                              )}
                              className="p-2 bg-amber-50 rounded hover:bg-amber-100"
                            >
                              🔊
                            </button>
                            <button
                              onClick={() => handleDeletePrescription(prescription.id)}
                              className="p-2 bg-red-50 rounded hover:bg-red-100"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Medicines List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t('yourMedicines', language)}</h2>
                <button
                  onClick={() => {
                    setShowForm(true);
                    setEditingId(null);
                  }}
                  className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  {t('addMedicine', language)}
                </button>
              </div>

              {medicines.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">{t('noMedicinesAdded', language)}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medicines.map(med => (
                    <MedicineCard
                      key={med.id}
                      med={med}
                      language={language}
                      onDelete={() => handleDeleteMedicine(med.id)}
                      onEdit={() => handleEditMedicine(med)}
                      onSpeak={() => handleSpeakMedicine(med)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Form */}
          <aside className="space-y-6">
            
            {/* Add/Edit Form */}
            {showForm && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-300">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{editingId ? t('editMedicine', language) : t('addMedicineTitle', language)}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('medicineNameRequired', language)}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Paracetamol"
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('dosageRequired', language)}</label>
                    <input
                      type="text"
                      value={formData.dosage}
                      onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                      placeholder="e.g., 500mg"
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('frequencyRequired', language)}</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    >
                      <option value="">{t('selectFrequency', language)}</option>
                      <option value="Once Daily">{t('onceDaily', language)}</option>
                      <option value="Twice Daily">{t('twiceDaily', language)}</option>
                      <option value="Thrice Daily">{t('thriceDaily', language)}</option>
                      <option value="Every 4 hours">{t('every4Hours', language)}</option>
                      <option value="Every 6 hours">{t('every6Hours', language)}</option>
                      <option value="Every 8 hours">{t('every8Hours', language)}</option>
                      <option value="As needed">{t('asNeeded', language)}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('duration', language)}</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      placeholder="e.g., 5 days, 1 week"
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('quantity', language)}</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      placeholder="e.g., 10"
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('instructionsNotes', language)}</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="e.g., Take after food"
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Set Reminder Times</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="time"
                        id="reminderTime"
                        className="flex-1 p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const time = document.getElementById('reminderTime').value;
                          if (time) {
                            setFormData({...formData, reminders: [...(formData.reminders || []), time].sort()});
                            document.getElementById('reminderTime').value = '';
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-semibold"
                      >
                        {t('add', language)}
                      </button>
                    </div>
                    {formData.reminders && formData.reminders.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.reminders.map((r, i) => (
                          <span key={i} className="bg-blue-100 text-blue-900 px-2 py-1 rounded text-sm font-medium flex items-center gap-2">
                            ⏰ {r}
                            <button onClick={() => setFormData({...formData, reminders: formData.reminders.filter((_, idx) => idx !== i)})} className="hover:text-red-600">✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAddMedicine}
                      className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2 rounded font-semibold"
                    >
                      {editingId ? t('update', language) : t('save', language)}
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        setFormData({name: '', dosage: '', frequency: '', duration: '', quantity: '', reminders: [], notes: ''});
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded font-semibold"
                    >
                      {t('cancel', language)}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </aside>

        </div>
        </>
        )}
      </div>
      </div>
    </>
  );
};

export default PrescriptionHandling;
