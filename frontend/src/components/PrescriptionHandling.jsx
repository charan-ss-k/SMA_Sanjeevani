import React, { useState, useEffect, useContext, useRef } from 'react';
import logo from '../assets/Sanjeevani Logo.png';
import { AuthContext } from '../main';
import { LanguageContext } from '../main';
import FeatureLoginPrompt from './FeatureLoginPrompt';
import PrescriptionAnalyzer from './PrescriptionAnalyzer';
import { t } from '../utils/translations';
import { playTTS, stopAllTTS } from '../utils/tts';
import { getPrescriptionText } from '../data/prescriptionTranslations';
import { translateData } from '../data/dataTranslations';
import { API_BASE } from '../config/apiBase';
import capsuleIcon from '../assets/capsule.png';
import prescriptionIcon from '../assets/prescription.png';
import MedicationIcon from '@mui/icons-material/Medication';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ScheduleIcon from '@mui/icons-material/Schedule';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotesIcon from '@mui/icons-material/Notes';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PsychologyIcon from '@mui/icons-material/Psychology';
import BlockIcon from '@mui/icons-material/Block';
import DescriptionIcon from '@mui/icons-material/Description';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CategoryIcon from '@mui/icons-material/Category';
import BusinessIcon from '@mui/icons-material/Business';
import PaidIcon from '@mui/icons-material/Paid';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const MedicineCard = ({ med, onDelete, onEdit, onSpeak, language, translateDefaultValue, getFrequencyLabel }) => (
  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500 hover:shadow-lg transition">
    <div className="flex gap-3 items-start">
      <div className="h-14 w-14 bg-gradient-to-br from-green-100 to-blue-100 rounded-md flex items-center justify-center text-green-700">
        <MedicationIcon fontSize="small" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-gray-800 text-lg">
            {med.name === 'Unknown Medicine'
              ? getPrescriptionText('unknownMedicine', language)
              : translateData(med.name, 'medicine', language)}
          </h4>
          <div className="flex items-center gap-1">
            <button onClick={onSpeak} className="p-2 bg-amber-50 rounded hover:bg-amber-100 text-amber-700" aria-label="Speak medicine details">
              <VolumeUpIcon fontSize="small" />
            </button>
            <button onClick={onEdit} className="p-2 bg-blue-50 rounded hover:bg-blue-100 text-blue-700" aria-label="Edit medicine">
              <EditIcon fontSize="small" />
            </button>
            <button onClick={onDelete} className="p-2 bg-red-50 rounded hover:bg-red-100 text-red-700" aria-label="Delete medicine">
              <DeleteOutlineIcon fontSize="small" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
          <div className="inline-flex items-center gap-1.5"><VaccinesIcon sx={{ fontSize: 16 }} /><span className="font-semibold text-sm">{getPrescriptionText('dosage', language)}:</span> {translateDefaultValue(med.dosage)}</div>
          <div className="inline-flex items-center gap-1.5"><CalendarMonthIcon sx={{ fontSize: 16 }} /><span className="font-semibold text-sm">{getPrescriptionText('frequency', language)}:</span> {getFrequencyLabel(med.frequency)}</div>
          <div className="inline-flex items-center gap-1.5"><ScheduleIcon sx={{ fontSize: 16 }} /><span className="font-semibold text-sm">{getPrescriptionText('duration', language)}:</span> {translateDefaultValue(med.duration)}</div>
          <div className="inline-flex items-center gap-1.5"><Inventory2Icon sx={{ fontSize: 16 }} /><span className="font-semibold text-sm">{med.quantity}</span> {getPrescriptionText('units', language)}</div>
        </div>
        {med.reminders && med.reminders.length > 0 && (
          <div className="mt-2 p-2 bg-green-50 rounded">
            <div className="text-xs font-semibold text-green-800">{getPrescriptionText('reminders', language)}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {med.reminders.map((r, i) => (
                <span key={i} className="bg-green-200 text-green-900 px-2 py-1 rounded text-xs font-medium">
                  <span className="inline-flex items-center gap-1"><AccessTimeIcon sx={{ fontSize: 12 }} />{r}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-2 text-xs text-gray-500 inline-flex items-center gap-1.5"><NotesIcon sx={{ fontSize: 14 }} />{med.notes || getPrescriptionText('noNotes', language)}</div>
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
  const [isSpeaking, setIsSpeaking] = useState(false);
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

  const speakText = async (text) => {
    if (!text || !text.trim()) return;

    if (isSpeaking) {
      stopAllTTS();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      await playTTS(text, language, { userInitiated: true });
    } catch (error) {
      console.error('Prescription handling speak error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const translateDefaultValue = (value) => {
    if (!value) return value;
    if (value === 'Unknown Medicine') return getPrescriptionText('unknownMedicine', language);
    if (value === 'As prescribed') return getPrescriptionText('asPrescribed', language);
    if (value === 'As per prescription') return getPrescriptionText('asPerPrescription', language);
    return value;
  };

  const getFrequencyLabel = (value) => {
    if (!value) return value;
    const frequencyKeyMap = {
      'Once Daily': 'onceDaily',
      'Twice Daily': 'twiceDaily',
      'Thrice Daily': 'thriceDaily',
      'Every 4 hours': 'every4Hours',
      'Every 6 hours': 'every6Hours',
      'Every 8 hours': 'every8Hours',
      'As needed': 'asNeeded',
      'As per prescription': 'asPerPrescription',
      'As prescribed': 'asPrescribed',
    };

    const key = frequencyKeyMap[value];
    return key ? t(key, language) : translateDefaultValue(value);
  };

  const fetchPrescriptionHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/prescriptions/`, {
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
  };

  const handleEditMedicine = (med) => {
    setFormData(med);
    setEditingId(med.id);
    setShowForm(true);
  };

  const handleDeleteMedicine = (id) => {
    if (confirm(t('deleteThisMedicine', language))) {
      setMedicines(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleSpeakMedicine = (med) => {
    const text = `${med.name}. ${t('dosage', language)}: ${med.dosage}. ${t('frequency', language)}: ${med.frequency}. ${med.notes}`;
    speakText(text);
  };

  // Image analysis handlers
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setAnalysisError(`❌ ${getPrescriptionText('invalidFileType', language)}`);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setAnalysisError(`❌ ${getPrescriptionText('fileTooLarge', language)}`);
      return;
    }

    setFile(selectedFile);
    setAnalysisError('');
    setAnalysisResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
    if (!allowedTypes.includes(droppedFile.type)) {
      setAnalysisError(`❌ ${getPrescriptionText('invalidFileType', language)}`);
      return;
    }

    if (droppedFile.size > 10 * 1024 * 1024) {
      setAnalysisError(`❌ ${getPrescriptionText('fileTooLarge', language)}`);
      return;
    }

    setFile(droppedFile);
    setAnalysisError('');
    setAnalysisResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(droppedFile);
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setAnalyzing(false);
      setAnalysisError(t('analysisCancelled', language));
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setAnalysisError(getPrescriptionText('selectFileFirst', language));
      return;
    }

    setAnalyzing(true);
    setAnalysisError('');
    setAnalysisResult(null);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/medicine-identification/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || getPrescriptionText('analysisError', language));
      }

      const data = await response.json();

      if (data.analysis) {
        setAnalysisResult(data.analysis);
      } else {
        setAnalysisError(getPrescriptionText('noAnalysisData', language));
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setAnalysisError(t('analysisCancelled', language));
      } else {
        console.error('Analysis error:', err);
        setAnalysisError(`${t('analysisFailed', language)}: ${err.message}`);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSpeakAnalysisResult = () => {
    if (!analysisResult) return;
    
    const text = `${analysisResult.medicine_name || getPrescriptionText('unknownMedicine', language)}. ${
      analysisResult.dosage ? `${t('dosage', language)}: ${analysisResult.dosage}.` : ''
    } ${analysisResult.full_information || ''}`;
    
    speakText(text);
  };

  const handleSaveAnalysisResult = async () => {
    if (!analysisResult) return;

    try {
      const prescriptionData = {
        medicine_name: analysisResult.medicine_name || getPrescriptionText('unknownMedicine', language),
        dosage: analysisResult.dosage || getPrescriptionText('asPrescribed', language),
        frequency: getPrescriptionText('asPerPrescription', language),
        duration: getPrescriptionText('asPrescribed', language),
        notes: analysisResult.full_information || getPrescriptionText('medicineIdentifiedFromImage', language),
        doctor_name: t('aiMedicineIdentification', language),
        category: analysisResult.category,
        manufacturer: analysisResult.manufacturer,
        price: analysisResult.price,
        source: analysisResult.source,
      };

      const response = await fetch(`${API_BASE}/api/prescriptions/`, {
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
        name: analysisResult.medicine_name || getPrescriptionText('unknownMedicine', language),
        dosage: analysisResult.dosage || getPrescriptionText('asPrescribed', language),
        frequency: getPrescriptionText('asPerPrescription', language),
        duration: getPrescriptionText('asPrescribed', language),
        quantity: 0,
        reminders: [],
        notes: analysisResult.full_information || getPrescriptionText('medicineIdentifiedFromImage', language),
      }]);

      // Refresh prescription history
      fetchPrescriptionHistory();
      
      // Reset analysis state
      setAnalysisResult(null);
      setFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error('Save error:', err);
      setAnalysisError(`Failed to save: ${err.message}`);
    }
  };

  const handleDeletePrescription = async (id) => {
    if (!confirm(t('deleteThisPrescription', language))) return;

    try {
      const response = await fetch(`${API_BASE}/api/prescriptions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(t('saveFailed', language));
      }

      setPrescriptionHistory(prev => prev.filter(p => p.id !== id));
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
            <h1 className="text-5xl font-bold text-green-800 mb-2 flex items-center gap-3">
              <img src={capsuleIcon} alt="Prescription management" className="w-12 h-12 object-contain" />
              <span>{getPrescriptionText('prescriptionManagement', language).replace(/^\p{Extended_Pictographic}\s*/u, '')}</span>
            </h1>
            <p className="text-xl text-gray-700">{getPrescriptionText('managePrescriptions', language)}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 auto-rows-fr items-stretch">
          <div className="relative flex h-full min-h-[150px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-emerald-100 p-4 md:min-h-[165px] md:p-5 text-center shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="absolute left-0 top-0 h-1.5 w-full bg-emerald-500" />
            <div className="flex w-full flex-1 flex-col items-center justify-center">
              <div className="mb-2 inline-flex items-center justify-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-emerald-200 bg-white/80 shadow-sm">
                  <img src={capsuleIcon} alt="My medicines" className="h-3.5 w-3.5 object-contain" />
                </span>
                <h3 className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 leading-tight">
                  {getPrescriptionText('myMedicines', language)}
                </h3>
              </div>
              <p className="mt-2 text-2xl md:text-3xl font-black tabular-nums text-emerald-900 leading-none">{stats.totalMedicines}</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-emerald-900/70">Currently in your tracker</p>
          </div>

          <div className="relative flex h-full min-h-[150px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-white via-violet-50 to-violet-100 p-4 md:min-h-[165px] md:p-5 text-center shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="absolute left-0 top-0 h-1.5 w-full bg-violet-500" />
            <div className="flex w-full flex-1 flex-col items-center justify-center">
              <div className="mb-2 inline-flex items-center justify-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-violet-200 bg-white/80 shadow-sm">
                  <img src={prescriptionIcon} alt="Prescription history" className="h-3.5 w-3.5 object-contain" />
                </span>
                <h3 className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 leading-tight">
                  {getPrescriptionText('prescriptionHistory', language)}
                </h3>
              </div>
              <p className="mt-2 text-2xl md:text-3xl font-black tabular-nums text-violet-900 leading-none">{stats.totalPrescriptions}</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-violet-900/70">Uploaded and saved records</p>
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
            <span className="inline-flex items-center gap-2">
              <img src={prescriptionIcon} alt="Manage prescriptions" className="h-5 w-5 object-contain" />
              <span>{getPrescriptionText('managePrescriptions', language).replace(/^\p{Extended_Pictographic}\s*/u, '')}</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-6 py-4 font-bold transition border-b-4 ${
              activeTab === 'analyze'
                ? 'border-b-purple-600 text-purple-600'
                : 'border-b-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <img src={capsuleIcon} alt="Analyze prescriptions" className="h-5 w-5 object-contain" />
              <span>{getPrescriptionText('analyzePrescription', language).replace(/^\p{Extended_Pictographic}\s*/u, '')}</span>
            </span>
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
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-lg p-6 mb-8">
          <h2 className="mb-4 inline-flex items-center gap-2 text-2xl font-bold text-gray-800">
            <PsychologyIcon />
            {t('aiMedicineIdentification', language)}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="rounded-2xl border-2 border-dashed border-emerald-300 bg-gradient-to-br from-white via-emerald-50 to-emerald-100 p-6 shadow-sm"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.bmp,.tiff"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!imagePreview ? (
                  <div
                    className="text-center cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-700 shadow-sm">
                      <PhotoCameraIcon sx={{ fontSize: 34 }} />
                    </div>
                    <p className="mb-2 text-2xl font-bold text-emerald-950">Drag medicine image here or click to upload</p>
                    <p className="text-base text-emerald-900/70">Supported: JPG, PNG, WebP, BMP, TIFF (Max 10MB)</p>
                  </div>
                ) : (
                  <div>
                    <img src={imagePreview} alt="Preview" className="w-full h-64 object-contain rounded-lg mb-4" />
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 rounded-xl bg-emerald-600 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
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
                        className="flex-1 rounded-xl bg-rose-600 py-2.5 font-semibold text-white transition hover:bg-rose-700"
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
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 text-2xl font-black text-white transition hover:from-emerald-700 hover:to-teal-700"
                >
                  <span className="inline-flex items-center gap-2"><ArrowForwardIcon />{t('analyzeNow', language)}</span>
                </button>
              )}
              
              {analyzing && (
                <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-300 border-t-emerald-700"></div>
                  <div className="font-semibold text-emerald-900">{t('analyzingPleaseWait', language)}</div>
                  <button
                    onClick={handleCancelAnalysis}
                    className="rounded-lg bg-rose-600 px-6 py-2 font-semibold text-white transition hover:bg-rose-700"
                  >
                    <span className="inline-flex items-center gap-1.5"><BlockIcon sx={{ fontSize: 16 }} />{t('stopAnalysis', language)}</span>
                  </button>
                </div>
              )}
              
              {analysisError && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="font-semibold text-rose-800">{analysisError}</p>
                </div>
              )}
            </div>

            {/* Analysis Results Section */}
            <div>
              {analysisResult ? (
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-teal-50 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="inline-flex items-center gap-2 text-xl font-bold text-gray-800"><DescriptionIcon />{t('analysisResults', language)}</h3>
                    <button
                      onClick={handleSpeakAnalysisResult}
                      className="bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-lg transition"
                      title={t('listenToResults', language)}
                    >
                      {isSpeaking ? <StopCircleIcon /> : <VolumeUpIcon />}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {analysisResult.medicine_name && (
                      <div className="rounded-lg border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-violet-50 p-4 shadow-md">
                        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-700">{t('medicineName', language)}</div>
                        <div className="inline-flex items-center gap-2 rounded bg-white px-3 py-2 text-2xl font-extrabold text-emerald-900">
                          <MedicationIcon sx={{ fontSize: 24 }} /> {analysisResult.medicine_name}
                        </div>
                      </div>
                    )}
                    
                    {analysisResult.dosage && (
                      <div className="rounded-lg border-l-4 border-emerald-500 bg-white p-4 shadow-sm">
                        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-700">{t('dosage', language)}</div>
                        <div className="inline-flex items-center gap-1.5 text-lg font-semibold text-gray-800"><VaccinesIcon sx={{ fontSize: 18 }} />{analysisResult.dosage}</div>
                      </div>
                    )}
                    
                    {analysisResult.category && (
                      <div className="rounded-lg border-l-4 border-violet-500 bg-white p-4 shadow-sm">
                        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-violet-700">{t('category', language)}</div>
                        <div className="inline-flex items-center gap-1.5 text-lg font-semibold text-gray-800"><CategoryIcon sx={{ fontSize: 18 }} />{analysisResult.category}</div>
                      </div>
                    )}
                    
                    {analysisResult.manufacturer && (
                      <div className="rounded-lg border-l-4 border-emerald-500 bg-white p-4 shadow-sm">
                        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-700">{t('manufacturer', language)}</div>
                        <div className="inline-flex items-center gap-1.5 text-lg font-semibold text-gray-800"><BusinessIcon sx={{ fontSize: 18 }} />{analysisResult.manufacturer}</div>
                      </div>
                    )}
                    
                    {analysisResult.price && (
                      <div className="rounded-lg border-l-4 border-violet-500 bg-white p-4 shadow-sm">
                        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-violet-700">{t('price', language)}</div>
                        <div className="inline-flex items-center gap-1.5 text-xl font-bold text-violet-800"><PaidIcon sx={{ fontSize: 20 }} />{analysisResult.price}</div>
                      </div>
                    )}
                    
                    {analysisResult.full_information && (
                      <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                        <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800"><InfoOutlinedIcon sx={{ fontSize: 14 }} />{t('additionalInformation', language)}</div>
                        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{analysisResult.full_information}</div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleSaveAnalysisResult}
                    className="mt-4 w-full rounded-lg bg-gradient-to-r from-emerald-600 to-violet-600 py-3 font-bold text-white transition hover:from-emerald-700 hover:to-violet-700"
                  >
                    <span className="inline-flex items-center gap-1.5"><SaveIcon sx={{ fontSize: 18 }} />{t('saveToPrescriptions', language)}</span>
                  </button>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40">
                  <div className="text-center text-emerald-900/60">
                    <div className="mb-3"><SearchIcon sx={{ fontSize: 52 }} /></div>
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
            <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-gray-800"><MenuBookIcon />{t('prescriptionHistory', language)}</h2>
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
                        <td className="px-4 py-3 font-semibold">
                          {prescription.medicine_name === 'Unknown Medicine'
                            ? getPrescriptionText('unknownMedicine', language)
                            : translateData(prescription.medicine_name, 'medicine', language)}
                        </td>
                        <td className="px-4 py-3">{translateDefaultValue(prescription.dosage)}</td>
                        <td className="px-4 py-3">{getFrequencyLabel(prescription.frequency)}</td>
                        <td className="px-4 py-3">{translateDefaultValue(prescription.duration)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(prescription.created_at).toLocaleDateString(language === 'english' ? 'en-US' : 'en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => speakText(`${prescription.medicine_name}. ${prescription.dosage}. ${prescription.frequency}. ${prescription.notes}`)}
                              className="p-2 bg-amber-50 rounded hover:bg-amber-100"
                            >
                              {isSpeaking ? <StopCircleIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                            </button>
                            <button
                              onClick={() => handleDeletePrescription(prescription.id)}
                              className="p-2 bg-red-50 rounded hover:bg-red-100"
                            >
                              <DeleteOutlineIcon fontSize="small" />
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
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t('yourMedicines', language)}</h2>
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
                      translateDefaultValue={translateDefaultValue}
                      getFrequencyLabel={getFrequencyLabel}
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
                      placeholder={getPrescriptionText('enterMedicineName', language)}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('dosageRequired', language)}</label>
                    <input
                      type="text"
                      value={formData.dosage}
                      onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                      placeholder={getPrescriptionText('enterDosage', language)}
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
                      placeholder={getPrescriptionText('enterDuration', language)}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('quantity', language)}</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      placeholder={getPrescriptionText('enterQuantity', language)}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('instructionsNotes', language)}</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder={getPrescriptionText('enterNotes', language)}
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('setReminderTimes', language)}</label>
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
