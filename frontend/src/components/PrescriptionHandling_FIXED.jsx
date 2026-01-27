import React, { useState, useEffect, useContext, useRef } from 'react';
import logo from '../assets/Sanjeevani Logo.png';
import { AuthContext } from '../main';
import { LanguageContext } from '../main';
import FeatureLoginPrompt from './FeatureLoginPrompt';
import { t } from '../utils/translations';
import { playTTS } from '../utils/tts';
import MedicineIdentificationModal from './MedicineIdentificationModal';

function speak(text, language) {
  if (!window.speechSynthesis) return;
  const ut = new SpeechSynthesisUtterance(text);
  const langMap = {
    english: 'en-US', telugu: 'te-IN', hindi: 'hi-IN', marathi: 'mr-IN',
    bengali: 'bn-IN', tamil: 'ta-IN', kannada: 'kn-IN', malayalam: 'ml-IN', gujarati: 'gu-IN',
  };
  ut.lang = langMap[language] || 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(ut);
}

const MedicineCard = ({ med, onDelete, onEdit, onSpeak, onSetReminder }) => (
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

// ============================================================================
// ANALYSIS RESULT MODAL - Display OCR + LLM results from backend
// ============================================================================
const AnalysisResultModal = ({ isOpen, onClose, result, onProceed, language, isMuted }) => {
  if (!isOpen || !result) return null;

  const handleProceed = () => {
    if (!isMuted) speak(`${result.medicine_name} ${t('addedToPrescriptions', language)}`, language);
    onProceed(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 m-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📋 Prescription Analysis Results</h2>
          <button 
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Result Content */}
        <div className="space-y-4 mb-6">
          {/* Medicine Name */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-300">
            <div className="text-sm font-semibold text-gray-600 mb-1">💊 Medicine Name</div>
            <div className="text-2xl font-bold text-green-700">{result.medicine_name}</div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
              <div className="text-sm font-semibold text-gray-600 mb-1">💉 Dosage</div>
              <div className="text-lg font-bold text-blue-700">{result.dosage || 'Not specified'}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
              <div className="text-sm font-semibold text-gray-600 mb-1">📅 Frequency</div>
              <div className="text-lg font-bold text-purple-700">{result.frequency || 'Not specified'}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-300">
              <div className="text-sm font-semibold text-gray-600 mb-1">⏳ Duration</div>
              <div className="text-lg font-bold text-orange-700">{result.duration || 'Not specified'}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-300">
              <div className="text-sm font-semibold text-gray-600 mb-1">⚠️ Precautions</div>
              <div className="text-lg font-bold text-red-700">{result.precautions || 'None specified'}</div>
            </div>
          </div>

          {/* Extended Information */}
          {(result.indication || result.side_effects || result.notes) && (
            <div className="space-y-3">
              {result.indication && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                  <div className="text-sm font-semibold text-gray-600 mb-1">🎯 Indication (Why prescribed)</div>
                  <div className="text-gray-800">{result.indication}</div>
                </div>
              )}
              {result.side_effects && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-300">
                  <div className="text-sm font-semibold text-gray-600 mb-1">⚡ Possible Side Effects</div>
                  <div className="text-gray-800">{result.side_effects}</div>
                </div>
              )}
              {result.notes && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <div className="text-sm font-semibold text-gray-600 mb-1">📝 Additional Notes</div>
                  <div className="text-gray-800">{result.notes}</div>
                </div>
              )}
            </div>
          )}

          {/* Source Information */}
          <div className="p-3 bg-green-50 rounded border border-green-300 text-xs text-gray-600">
            ✓ Extracted via OCR (Optical Character Recognition) and verified with AI (Meditron-7B LLM)
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition"
          >
            ✕ Cancel
          </button>
          <button 
            onClick={handleProceed}
            className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition"
          >
            ✓ Add to Prescriptions
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CAMERA MODAL - Real camera access with permission handling
// ============================================================================
const CameraModal = ({ isOpen, onClose, onCapture, language, isMuted }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraError, setCameraError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (isOpen && !cameraError && !isCapturing) {
      startCamera();
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, cameraError, isCapturing]);

  const startCamera = async () => {
    try {
      setCameraError('');
      // Request camera access with constraint
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        if (!isMuted) speak('Camera opened successfully. Please align the prescription and click capture.', language);
      }
    } catch (err) {
      console.error('Camera error:', err);
      let errorMsg = 'Cannot access camera. Please check permissions.';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Camera permission denied. Please allow camera access in settings.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera found on this device.';
      }
      setCameraError(errorMsg);
      if (!isMuted) speak(errorMsg, language);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0);

      // Convert to blob
      canvas.toBlob((blob) => {
        if (!isMuted) speak('Photo captured. Processing prescription...', language);
        onCapture(blob);
        onClose();
        setIsCapturing(false);
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error('Capture error:', err);
      setCameraError('Failed to capture photo. Please try again.');
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 m-4">
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">📸 Capture Prescription</h2>
          <button 
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {cameraError ? (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 p-4 rounded-lg mb-4">
            <div className="font-semibold mb-2">❌ Camera Error</div>
            <div className="mb-3">{cameraError}</div>
            <div className="text-sm space-y-1">
              <p>• Check camera permissions in browser settings</p>
              <p>• Try accessing from HTTPS URL</p>
              <p>• Ensure camera is not in use by another app</p>
            </div>
          </div>
        ) : (
          <>
            {/* Camera Stream */}
            <div className="bg-black rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                className="bg-gray-800"
              />
            </div>

            {/* Hidden Canvas for Capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Instructions */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded">
              <p className="text-blue-900 font-semibold">📋 Instructions:</p>
              <p className="text-blue-800 text-sm mt-1">Place prescription in good lighting. Keep it aligned with camera. Click "Capture" when ready.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition"
              >
                ✕ Close
              </button>
              <button 
                onClick={capturePhoto}
                disabled={isCapturing}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-3 rounded-lg font-semibold transition"
              >
                {isCapturing ? '⏳ Processing...' : '📸 Capture Prescription'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PrescriptionHandling = () => {
  const { isAuthenticated } = useContext(AuthContext);
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
  const [scanning, setScanning] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [takenMedicines, setTakenMedicines] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showMedicineIdentification, setShowMedicineIdentification] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysisResult, setShowAnalysisResult] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const { authToken } = useContext(AuthContext);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('prescriptions');
    const savedTaken = localStorage.getItem('medicinesTaken');
    if (saved) setMedicines(JSON.parse(saved));
    if (savedTaken) setTakenMedicines(JSON.parse(savedTaken));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('prescriptions', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('medicinesTaken', JSON.stringify(takenMedicines));
  }, [takenMedicines]);

  // Check for upcoming reminders every minute
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const upcoming = medicines.filter(m => m.reminders?.includes(currentTime));
      setUpcomingReminders(upcoming);
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [medicines]);

  // ========================================================================
  // FILE UPLOAD - Send to backend for OCR + LLM analysis
  // ========================================================================
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setAnalysisError('Please upload an image file (PNG, JPG, etc.)');
      if (!isMuted) speak('Invalid file type. Please upload an image.', language);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setAnalysisError('File is too large. Max 10MB allowed.');
      if (!isMuted) speak('File too large. Please upload a file smaller than 10 MB.', language);
      return;
    }

    // Start analysis
    setScanning(true);
    setAnalysisError('');

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', file);

      // Send to backend
      const response = await fetch('/api/medicine-identification/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Analysis failed: ${response.status}`);
      }

      // Parse backend response
      const result = await response.json();
      console.log('Analysis result:', result);

      // Display result in modal
      setAnalysisResult(result);
      setShowAnalysisResult(true);

      if (!isMuted) {
        speak(`Found ${result.medicine_name}. ${result.dosage} dose. ${result.frequency} frequency.`, language);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error.message || 'Failed to analyze prescription. Please try again.';
      setAnalysisError(errorMsg);
      if (!isMuted) speak(errorMsg, language);
    } finally {
      setScanning(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // ========================================================================
  // CAMERA CAPTURE - Similar to file upload but from camera
  // ========================================================================
  const handleCameraCapture = async (blob) => {
    setScanning(true);
    setAnalysisError('');

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', blob, 'prescription.jpg');

      // Send to backend
      const response = await fetch('/api/medicine-identification/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Analysis failed: ${response.status}`);
      }

      // Parse result
      const result = await response.json();
      console.log('Camera analysis result:', result);

      // Display result
      setAnalysisResult(result);
      setShowAnalysisResult(true);

      if (!isMuted) {
        speak(`Captured image analyzed. Found ${result.medicine_name}.`, language);
      }
    } catch (error) {
      console.error('Camera analysis error:', error);
      const errorMsg = error.message || 'Failed to analyze photo. Please try again.';
      setAnalysisError(errorMsg);
      if (!isMuted) speak(errorMsg, language);
    } finally {
      setScanning(false);
    }
  };

  // Handle analysis result - add medicine to prescriptions
  const handleProceedWithAnalysis = (result) => {
    setMedicines(prev => [...prev, {
      id: Date.now(),
      name: result.medicine_name,
      dosage: result.dosage || 'As prescribed',
      frequency: result.frequency || 'As prescribed',
      duration: result.duration || 'Not specified',
      quantity: 0,
      reminders: [],
      notes: result.indication || result.notes || 'From prescription upload',
    }]);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (!isMuted) speak(t('systemMuted', language), language);
  };

  const handleAddMedicine = () => {
    if (formData.name && formData.dosage && formData.frequency && formData.duration) {
      if (editingId) {
        setMedicines(prev => prev.map(m => 
          m.id === editingId ? { ...m, ...formData } : m
        ));
        setEditingId(null);
      } else {
        setMedicines(prev => [...prev, { 
          ...formData,
          id: Date.now(),
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
      if (!isMuted) speak(`${formData.name} ${t('addedToPrescriptions', language)}`, language);
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleDeleteMedicine = (medId) => {
    setMedicines(prev => prev.filter(m => m.id !== medId));
  };

  const handleEditMedicine = (med) => {
    setFormData(med);
    setEditingId(med.id);
    setShowForm(true);
  };

  const handleAddReminder = (medId, time) => {
    setMedicines(prev => prev.map(m => 
      m.id === medId 
        ? { ...m, reminders: [...(m.reminders || []), time].sort() }
        : m
    ));
    if (!isMuted) speak(`${t('reminderSetFor', language)} ${time}`, language);
  };

  const handleRemoveReminder = (medId, time) => {
    setMedicines(prev => prev.map(m => 
      m.id === medId 
        ? { ...m, reminders: m.reminders.filter(r => r !== time) }
        : m
    ));
  };

  const handleMarkTaken = (med) => {
    const now = new Date().toLocaleString();
    setTakenMedicines(prev => [...prev, {
      ...med,
      takenAt: now,
    }]);
    if (!isMuted) speak(`${med.name} ${t('markedAsTaken', language)}`, language);
    setUpcomingReminders(prev => prev.filter(m => m.id !== med.id));
  };

  const handleSaveMedicineFromIdentification = (medicineData) => {
    setMedicines(prev => [...prev, {
      id: Date.now(),
      name: medicineData.medicine_name,
      dosage: medicineData.dosage,
      frequency: medicineData.frequency || 'As prescribed',
      duration: medicineData.duration,
      quantity: 0,
      reminders: [],
      notes: medicineData.notes,
    }]);
    if (!isMuted) {
      speak(`${medicineData.medicine_name} ${t('addedToPrescriptions', language)}`, language);
    }
  };

  const stats = {
    totalMedicines: medicines.length,
    todayReminders: medicines.reduce((acc, m) => acc + (m.reminders?.length || 0), 0),
    medicinesTaken: takenMedicines.filter(m => new Date(m.takenAt).toDateString() === new Date().toDateString()).length,
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">{t('totalMedicines', language)}</h3>
            <p className="text-4xl font-bold mt-2">{stats.totalMedicines}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">{t('todaysReminders', language)}</h3>
            <p className="text-4xl font-bold mt-2">{stats.todayReminders}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">{t('medicinesTakenToday', language)}</h3>
            <p className="text-4xl font-bold mt-2">{stats.medicinesTaken}</p>
          </div>
        </div>

        {/* Analysis Error Alert */}
        {analysisError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
            <div className="font-semibold">❌ Error</div>
            <div>{analysisError}</div>
          </div>
        )}

        {/* Upload Section - IMPROVED */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('uploadPrescription', language)}</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => setShowMedicineIdentification(true)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-lg text-lg font-semibold transition"
            >
              🔍 AI Medicine Identification
            </button>
            <button 
              onClick={() => setShowCamera(true)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg text-lg font-semibold transition"
            >
              📸 Take Photo (Real Camera)
            </button>
            <label className="flex-1 cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              <div className="border-2 border-dashed border-green-300 py-4 rounded-lg text-lg text-center hover:bg-green-50 transition bg-green-50 font-semibold text-green-900">
                📁 Upload File
              </div>
            </label>
          </div>
          {scanning && (
            <div className="mt-4 flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="animate-spin h-6 w-6 border-4 border-blue-300 border-t-blue-700 rounded-full"></div>
              <div className="text-blue-900 font-semibold">Analyzing prescription with OCR + AI (Meditron-7B LLM)...</div>
            </div>
          )}
        </div>

        {/* Upcoming Reminders Alert */}
        {upcomingReminders.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-red-900 mb-3">{t('timeToTakeMedicines', language)}</h3>
            <div className="space-y-2">
              {upcomingReminders.map(med => (
                <div key={med.id} className="flex items-center justify-between bg-white p-3 rounded">
                  <div>
                    <div className="font-bold text-lg">{med.name}</div>
                    <div className="text-sm text-gray-600">{med.dosage} - {med.notes}</div>
                  </div>
                  <button
                    onClick={() => handleMarkTaken(med)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
                  >
                    {t('markTaken', language)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
                      onDelete={() => handleDeleteMedicine(med.id)}
                      onEdit={() => handleEditMedicine(med)}
                      onSpeak={() => speak(`${med.name}, ${med.dosage}, ${med.frequency}, ${med.notes}`, language)}
                      onSetReminder={(time) => handleAddReminder(med.id, time)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Form & Reminders */}
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
                    <input
                      type="text"
                      value={formData.frequency}
                      onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                      placeholder="e.g., Twice Daily"
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('durationRequired', language)}</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      placeholder="e.g., 5 days"
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                      placeholder="Number of units"
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="e.g., Take after food"
                      className="w-full p-2 border-2 border-gray-300 rounded focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddMedicine}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold"
                    >
                      {editingId ? t('updateMedicine', language) : t('addMedicine', language)}
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        setFormData({
                          name: '',
                          dosage: '',
                          frequency: '',
                          duration: '',
                          quantity: '',
                          reminders: [],
                          notes: '',
                        });
                      }}
                      className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded font-semibold"
                    >
                      {t('cancel', language)}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>

    {/* Modals */}
    <CameraModal
      isOpen={showCamera}
      onClose={() => setShowCamera(false)}
      onCapture={handleCameraCapture}
      language={language}
      isMuted={isMuted}
    />

    <AnalysisResultModal
      isOpen={showAnalysisResult}
      onClose={() => setShowAnalysisResult(false)}
      result={analysisResult}
      onProceed={handleProceedWithAnalysis}
      language={language}
      isMuted={isMuted}
    />

    <MedicineIdentificationModal
      isOpen={showMedicineIdentification}
      onClose={() => setShowMedicineIdentification(false)}
      onSave={handleSaveMedicineFromIdentification}
      language={language}
      authToken={authToken}
    />
    </>
  );
};

export default PrescriptionHandling;
