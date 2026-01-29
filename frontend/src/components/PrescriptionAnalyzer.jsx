import React, { useState, useRef, useContext } from 'react';
import { AuthContext } from '../main';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';
import { playTTS } from '../utils/tts';

const PrescriptionAnalyzer = () => {
  const { authToken } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setAnalysisError('❌ Invalid file type. Please upload: JPG, PNG, WebP, BMP, or TIFF');
      return;
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setAnalysisError('❌ File too large. Maximum 10MB allowed');
      return;
    }

    setFile(selectedFile);
    setAnalysisError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      setFile(droppedFiles[0]);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (result) => {
        setImagePreview(result.target.result);
      };
      reader.readAsDataURL(droppedFiles[0]);
    }
  };

  // Analyze prescription
  const handleAnalyze = async () => {
    if (!file) {
      setAnalysisError('Please select a prescription image first');
      return;
    }

    setAnalyzing(true);
    setAnalysisError('');
    setAnalysisResult(null);
    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/prescriptions/analyze', {
        method: 'POST',
        body: formData,
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to analyze prescription');
      }

      const result = await response.json();
      setAnalysisResult(result);
      
      if (!isMuted && result.status === 'success') {
        playTTS('Prescription analysis complete', language);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setAnalysisError(`❌ Analysis failed: ${error.message}`);
        console.error('Prescription analysis error:', error);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // Cancel analysis
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setAnalyzing(false);
  };

  // Clear and reset
  const handleClear = () => {
    setFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setAnalysisError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Speak medicine info
  const speakMedicineInfo = (medicine) => {
    if (isMuted) return;
    const text = `${medicine.medicine_name}, ${medicine.dosage}, ${medicine.frequency}`;
    playTTS(text, language);
  };

  // Medicine card component
  const MedicineCard = ({ medicine, index }) => (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-gray-800 text-lg">{medicine.medicine_name}</h4>
          <div className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${
            medicine.confidence === 'high' ? 'bg-green-100 text-green-800' :
            medicine.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            Confidence: {medicine.confidence}
          </div>
        </div>
        <button
          onClick={() => speakMedicineInfo(medicine)}
          className="p-2 bg-amber-50 rounded hover:bg-amber-100 transition"
          title="Speak medicine info"
        >
          🔊
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-gray-600 text-xs font-semibold">💊 DOSAGE</div>
          <div className="text-gray-800 font-bold mt-1">{medicine.dosage || 'Not specified'}</div>
        </div>
        <div className="bg-purple-50 p-3 rounded">
          <div className="text-gray-600 text-xs font-semibold">📅 FREQUENCY</div>
          <div className="text-gray-800 font-bold mt-1">{medicine.frequency || 'Not specified'}</div>
        </div>
        <div className="bg-green-50 p-3 rounded col-span-2">
          <div className="text-gray-600 text-xs font-semibold">⏳ DURATION</div>
          <div className="text-gray-800 font-bold mt-1">{medicine.duration || 'As needed'}</div>
        </div>
      </div>

      {medicine.special_instructions && (
        <div className="bg-amber-50 border-l-2 border-amber-500 p-3 rounded mb-3">
          <div className="text-xs font-semibold text-amber-800">📋 SPECIAL INSTRUCTIONS</div>
          <div className="text-sm text-amber-900 mt-1">{medicine.special_instructions}</div>
        </div>
      )}

      {medicine.notes && (
        <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
          <span className="font-semibold">📝 Notes:</span> {medicine.notes}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          📸 Handwritten Prescription Analyzer
        </h3>
        <p className="text-gray-600 text-sm">
          Upload a photo of your handwritten prescription. Our AI will analyze it and extract medicine names, dosages, and frequencies.
        </p>
      </div>

      {/* File Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50 cursor-pointer hover:bg-blue-100 transition mb-6"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="text-4xl mb-3">📷</div>
        <p className="text-gray-800 font-semibold mb-2">
          Drag prescription image here or click to upload
        </p>
        <p className="text-gray-600 text-sm">
          Supported: JPG, PNG, WebP, BMP, TIFF (Max 10MB)
        </p>
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-6">
          <div className="relative bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src={imagePreview}
              alt="Prescription preview"
              className="w-full max-h-96 object-contain"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              {analyzing && (
                <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  ⏳ Analyzing...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {analysisError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
          <p className="text-red-800">{analysisError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleAnalyze}
          disabled={!file || analyzing}
          className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {analyzing ? '⏳ Analyzing...' : '🔍 Analyze Prescription'}
        </button>
        {analyzing && (
          <button
            onClick={handleCancel}
            className="bg-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 transition"
          >
            ✕ Cancel
          </button>
        )}
        {(file || imagePreview) && (
          <button
            onClick={handleClear}
            className="bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition"
          >
            🔄 Clear
          </button>
        )}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`font-semibold py-3 px-6 rounded-lg transition ${
            isMuted
              ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Loading State */}
      {analyzing && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            </div>
            <p className="text-gray-700 font-semibold mb-2">Analyzing your prescription...</p>
            <p className="text-gray-600 text-sm">
              Processing: Image → OCR → AI Deciphering
            </p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && !analyzing && (
        <div className="space-y-6">
          {/* Status Alert */}
          {analysisResult.status === 'success' && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
              <p className="text-green-800 font-semibold">✅ Analysis Complete</p>
              <p className="text-green-700 text-sm">
                Found {analysisResult.medicines?.length || 0} medicine(s)
              </p>
            </div>
          )}

          {analysisResult.status === 'warning' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
              <p className="text-yellow-800 font-semibold">⚠️ {analysisResult.message}</p>
            </div>
          )}

          {analysisResult.status === 'error' && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <p className="text-red-800 font-semibold">❌ {analysisResult.error}</p>
            </div>
          )}

          {/* OCR Text Display */}
          {analysisResult.ocr_text && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-bold text-gray-800 mb-2">🔍 Recognized Text (OCR)</h4>
              <div className="bg-white p-3 rounded border border-gray-300 text-sm text-gray-700 max-h-32 overflow-y-auto font-mono">
                {analysisResult.ocr_text}
              </div>
            </div>
          )}

          {/* Medicines List */}
          {analysisResult.medicines && analysisResult.medicines.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-800 mb-4 text-lg">
                💊 Deciphered Medicines ({analysisResult.medicines.length})
              </h4>
              <div className="grid gap-4">
                {analysisResult.medicines.map((medicine, index) => (
                  <MedicineCard key={index} medicine={medicine} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {analysisResult.warnings && analysisResult.warnings.length > 0 && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
              <p className="font-bold text-orange-800 mb-2">⚠️ Important Warnings:</p>
              <ul className="space-y-1">
                {analysisResult.warnings.map((warning, idx) => (
                  <li key={idx} className="text-orange-800 text-sm">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pipeline Info */}
          {analysisResult.pipeline && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="font-bold text-blue-800 mb-2">🔄 Processing Pipeline:</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-2 rounded border border-blue-200">
                  <p className="text-sm font-semibold text-gray-700">Preprocessing</p>
                  <p className="text-xs text-blue-600">{analysisResult.pipeline.preprocessing}</p>
                </div>
                <div className="bg-white p-2 rounded border border-blue-200">
                  <p className="text-sm font-semibold text-gray-700">HTR (TrOCR)</p>
                  <p className="text-xs text-blue-600">{analysisResult.pipeline.htr}</p>
                </div>
                <div className="bg-white p-2 rounded border border-blue-200">
                  <p className="text-sm font-semibold text-gray-700">LLM Deciphering</p>
                  <p className="text-xs text-blue-600">{analysisResult.pipeline.llm_deciphering}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrescriptionAnalyzer;
