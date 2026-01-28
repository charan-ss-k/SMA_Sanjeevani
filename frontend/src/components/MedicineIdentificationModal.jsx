import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../main';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';

const MedicineIdentificationModal = ({ isOpen, onClose, onSave }) => {
  const { isAuthenticated, authToken } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, WebP, BMP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setUseCamera(true);
    } catch (error) {
      setCameraError('Unable to access camera: ' + error.message);
    }
  };

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      canvasRef.current.toBlob((blob) => {
        const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
        setSelectedFile(file);
        setPreview(canvasRef.current.toDataURL());
        stopCamera();
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setUseCamera(false);
  };

  const analyzeMedicine = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('📤 Uploading image:', selectedFile.name, selectedFile.type, selectedFile.size, 'bytes');
      console.log('📍 Endpoint: /api/medicine-identification/analyze');
      console.log('🔐 Auth token:', authToken ? 'Present' : 'Missing');

      const fetchOptions = {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for multipart
      };

      // Add auth header if token exists
      if (authToken) {
        fetchOptions.headers = {
          'Authorization': `Bearer ${authToken}`,
        };
      }

      const response = await fetch('/api/medicine-identification/analyze', fetchOptions);

      console.log('📥 Response received:', response.status, response.statusText);

      if (!response.ok) {
        let errorData = {};
        try {
          const text = await response.text();
          console.log('Raw response:', text);
          errorData = text ? JSON.parse(text) : {};
        } catch (e) {
          console.log('Failed to parse response:', e);
        }
        console.error('❌ Backend error:', errorData);
        throw new Error(errorData.detail || `Failed to analyze image: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Analysis response:', data);

      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
      } else {
        throw new Error(data.error || data.message || 'Failed to identify medicine');
      }
    } catch (err) {
      const errorMsg = err instanceof TypeError 
        ? `Network error: ${err.message}` 
        : (err.message || 'Error analyzing image. Please try again.');
      setError(errorMsg);
      console.error('❌ Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrescription = async () => {
    if (analysisResult && onSave) {
      // Extract dosage information
      let dosage = 'As per prescription';
      let frequency = 'As per prescription';
      let duration = 'As per prescription';
      
      // Try to extract from analysis result
      if (analysisResult.medicine_name) {
        if (analysisResult.dosage) {
          if (typeof analysisResult.dosage === 'string') {
            dosage = analysisResult.dosage;
          } else if (analysisResult.dosage.adults) {
            dosage = analysisResult.dosage.adults;
          }
        }
        
        if (analysisResult.frequency) {
          frequency = analysisResult.frequency;
        }
        
        if (analysisResult.duration_limit) {
          duration = analysisResult.duration_limit;
        } else if (analysisResult.duration) {
          duration = analysisResult.duration;
        }
      }

      const notes = [
        analysisResult.indication || '',
        analysisResult.food_interaction ? `Food interaction: ${analysisResult.food_interaction}` : '',
        analysisResult.precautions ? `Precautions: ${Array.isArray(analysisResult.precautions) ? analysisResult.precautions.join(', ') : analysisResult.precautions}` : '',
        analysisResult.age_restrictions ? `Age restrictions: ${analysisResult.age_restrictions}` : '',
      ].filter(n => n).join('. ');

      const prescriptionData = {
        medicine_name: analysisResult.medicine_name || 'Unknown Medicine',
        dosage: dosage,
        frequency: frequency,
        duration: duration,
        notes: notes || 'Identified from medicine image',
        full_analysis: analysisResult  // Store complete analysis
      };

      try {
        // Save to backend prescription history
        const response = await fetch('/api/prescriptions/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            medicine_name: prescriptionData.medicine_name,
            dosage: prescriptionData.dosage,
            frequency: prescriptionData.frequency,
            duration: prescriptionData.duration,
            notes: prescriptionData.notes,
            doctor_name: 'AI Medicine Identification'
          }),
        });

        if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch {
            errorText = 'Unable to parse error response';
          }
          console.error('Response status:', response.status, 'Body:', errorText);
          throw new Error(`Failed to save prescription: ${response.status} ${errorText}`);
        }

        console.log('✅ Prescription saved to database');
        
        // Call the onSave callback for local state update
        if (onSave) {
          onSave(prescriptionData);
        }
        
        handleClose();
      } catch (err) {
        console.error('❌ Error saving prescription:', err);
        setError(`Failed to save prescription: ${err.message}`);
      }
    }
  };

  const handleClose = () => {
    stopCamera();
    setSelectedFile(null);
    setPreview(null);
    setAnalysisResult(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">🔍 Medicine Identification</h2>
            <p className="text-blue-100 text-sm">Upload or capture medicine image for analysis</p>
          </div>
          <button
            onClick={handleClose}
            className="text-2xl hover:text-blue-200 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setUseCamera(false);
                stopCamera();
              }}
              className={`flex-1 py-2 px-4 rounded font-semibold transition ${
                !useCamera
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📁 Upload File
            </button>
            <button
              onClick={() => {
                setUseCamera(true);
                startCamera();
              }}
              className={`flex-1 py-2 px-4 rounded font-semibold transition ${
                useCamera
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📸 Take Photo
            </button>
          </div>

          {/* Upload Section */}
          {!useCamera && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-400 rounded-lg p-8 text-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="text-4xl mb-2">📷</div>
                <p className="font-semibold text-gray-700">Click to upload image</p>
                <p className="text-sm text-gray-500">or drag and drop</p>
                <p className="text-xs text-gray-400 mt-2">JPG, PNG, WebP, BMP up to 10MB</p>
              </div>
            </div>
          )}

          {/* Camera Section */}
          {useCamera && (
            <div className="space-y-4">
              {cameraError && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                  {cameraError}
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-3">
                <button
                  onClick={capturePhoto}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
                >
                  📸 Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Preview:</p>
                <img src={preview} alt="Preview" className="w-full rounded-lg max-h-96 object-cover" />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Analyze Button */}
          {!analysisResult && (
            <button
              onClick={analyzeMedicine}
              disabled={!selectedFile || loading}
              className={`w-full py-3 px-4 rounded-lg font-bold text-white transition ${
                loading || !selectedFile
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? '🔄 Analyzing...' : '🔍 Analyze Medicine'}
            </button>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-4 bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-lg border border-green-200">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-xl font-bold text-gray-800">Medicine Identified!</h3>
              </div>

              {/* Medicine Name */}
              <div className="bg-white p-4 rounded-lg border border-green-300">
                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  💊 {analysisResult.medicine_name}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Composition:</strong> {analysisResult.composition}
                </p>
              </div>

              {/* Dosage */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Adults</p>
                  <p className="font-bold text-green-700">{analysisResult.dosage.adults}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Children</p>
                  <p className="font-bold text-blue-700 text-xs">{analysisResult.dosage.children}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Seniors</p>
                  <p className="font-bold text-purple-700 text-xs">{analysisResult.dosage.seniors}</p>
                </div>
              </div>

              {/* Food & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1">🍽️ Food Interaction</p>
                  <p className="font-bold text-gray-800 text-sm">{analysisResult.food_interaction}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-gray-600 mb-1">⏱️ Max Duration</p>
                  <p className="font-bold text-gray-800 text-sm">{analysisResult.duration_limit}</p>
                </div>
              </div>

              {/* Age Restrictions */}
              <div className="bg-white p-3 rounded-lg border border-yellow-200">
                <p className="text-xs font-semibold text-gray-600 mb-1">👥 Age Restrictions</p>
                <p className="text-sm text-gray-800">{analysisResult.age_restrictions}</p>
              </div>

              {/* Precautions */}
              {analysisResult.precautions.length > 0 && (
                <div className="bg-white p-3 rounded-lg border border-orange-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">⚠️ Precautions</p>
                  <ul className="space-y-1">
                    {analysisResult.precautions.map((precaution, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-orange-500 font-bold">•</span>
                        <span>{precaution}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Contraindications */}
              {analysisResult.contraindications.length > 0 && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="text-xs font-semibold text-red-700 mb-2">🚫 When NOT to Use</p>
                  <ul className="space-y-1">
                    {analysisResult.contraindications.map((item, idx) => (
                      <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Side Effects */}
              {analysisResult.side_effects.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-xs font-semibold text-yellow-800 mb-2">⚠️ Side Effects</p>
                  <ul className="space-y-1">
                    {analysisResult.side_effects.slice(0, 3).map((effect, idx) => (
                      <li key={idx} className="text-sm text-yellow-900 flex items-start gap-2">
                        <span className="text-yellow-600 font-bold">•</span>
                        <span>{effect}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Max Daily Dose */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-700 mb-1">📊 Max Daily Dose</p>
                <p className="font-bold text-blue-900">{analysisResult.max_daily_dose}</p>
              </div>

              {/* Warnings */}
              {analysisResult.warnings.length > 0 && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-300">
                  <p className="text-xs font-semibold text-red-700 mb-2">🚨 Important Warnings</p>
                  <ul className="space-y-1">
                    {analysisResult.warnings.slice(0, 2).map((warning, idx) => (
                      <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                        <span className="text-red-600 font-bold">⚠️</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-gray-100 p-3 rounded-lg border border-gray-300 text-xs text-gray-700">
                <strong>⚕️ Disclaimer:</strong> This information is AI-generated from image analysis. Always consult a healthcare professional before taking any medication.
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSavePrescription}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
                >
                  ✅ Save to Prescriptions
                </button>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    setAnalysisResult(null);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition"
                >
                  🔄 Analyze Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicineIdentificationModal;
