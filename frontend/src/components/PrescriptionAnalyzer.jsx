import React, { useState, useRef, useContext } from 'react';
import { AuthContext } from '../main';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';
import { playTTS } from '../utils/tts';
import { getPrescriptionText } from '../data/prescriptionTranslations';
import { API_BASE } from '../config/apiBase';

const Icon = ({ children, className = 'h-5 w-5', ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className} {...props}>
    {children}
  </svg>
);

const CameraIcon = (props) => (
  <Icon {...props}>
    <path d="M8 7.5 9.5 5h5L16 7.5H18.5A2.5 2.5 0 0 1 21 10v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-8A2.5 2.5 0 0 1 5.5 7.5H8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="13.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
  </Icon>
);

const UploadIcon = (props) => (
  <Icon {...props}>
    <path d="M12 16V6m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 16.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Icon>
);

const AnalyzeIcon = (props) => (
  <Icon {...props}>
    <path d="m11 5 8 8-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Icon>
);

const CancelIcon = (props) => (
  <Icon {...props}>
    <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Icon>
);

const ResetIcon = (props) => (
  <Icon {...props}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M20 4v6h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

const SpeakerIcon = (props) => (
  <Icon {...props}>
    <path d="M5 14V10h4l5-4v12l-5-4H5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M16 9a3 3 0 0 1 0 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M18.5 6.5a7 7 0 0 1 0 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Icon>
);

const MuteIcon = (props) => (
  <Icon {...props}>
    <path d="M5 14V10h4l5-4v12l-5-4H5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M16.5 9.5 20 13m0-3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Icon>
);

const CheckIcon = (props) => (
  <Icon {...props}>
    <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

const WarningIcon = (props) => (
  <Icon {...props}>
    <path d="M12 4 3 20h18L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M12 9v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="16.5" r="1" fill="currentColor" />
  </Icon>
);

const ErrorIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9.5 9.5 14.5 14.5M14.5 9.5 9.5 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Icon>
);

const MedicineIcon = (props) => (
  <Icon {...props}>
    <path d="M8 6.5a3.5 3.5 0 0 1 5 0l4.5 4.5a3.5 3.5 0 0 1 0 5l-1.5 1.5a3.5 3.5 0 0 1-5 0L6.5 13a3.5 3.5 0 0 1 0-5L8 6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M10 10.5h4M12 8.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Icon>
);

const TimeIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

const LabelIcon = (props) => (
  <Icon {...props}>
    <path d="M6 8h12M6 12h8M6 16h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Icon>
);

const DotIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </Icon>
);

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
      setAnalysisError(`❌ ${getPrescriptionText('invalidFileType', language)}`);
      return;
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setAnalysisError(`❌ ${getPrescriptionText('fileTooLarge', language)}`);
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
      const dropped = droppedFiles[0];

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
      if (!allowedTypes.includes(dropped.type)) {
        setAnalysisError(`❌ ${getPrescriptionText('invalidFileType', language)}`);
        return;
      }

      if (dropped.size > 10 * 1024 * 1024) {
        setAnalysisError(`❌ ${getPrescriptionText('fileTooLarge', language)}`);
        return;
      }

      setFile(dropped);

      // Create preview
      const reader = new FileReader();
      reader.onload = (result) => {
        setImagePreview(result.target.result);
      };
      reader.readAsDataURL(dropped);
    }
  };

  // Analyze prescription
  const handleAnalyze = async () => {
    if (!file) {
      setAnalysisError(getPrescriptionText('selectFileFirst', language));
      return;
    }

    setAnalyzing(true);
    setAnalysisError('');
    setAnalysisResult(null);
    abortControllerRef.current = new AbortController();

    // Set timeout for prescription analysis (3 minutes for OCR + LLM processing)
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, 180000); // 3 minutes timeout

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/prescriptions/analyze`, {
        method: 'POST',
        body: formData,
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Analysis failed' }));
        throw new Error(error.detail || getPrescriptionText('analysisError', language));
      }

      const result = await response.json();
      setAnalysisResult(result);
      
      if (!isMuted && result.status === 'success') {
        playTTS(getPrescriptionText('analysisComplete', language), language);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        setAnalysisError(`❌ Analysis timeout - OCR and AI processing is taking longer than expected. Please try with a clearer image or try again.`);
      } else {
        setAnalysisError(`❌ ${getPrescriptionText('analysisError', language)}: ${error.message}`);
      }
      console.error('Prescription analysis error:', error);
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

  const iconButtonClass = 'inline-flex items-center justify-center gap-2';

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
            {getPrescriptionText('dosage', language)}: {medicine.confidence}
          </div>
        </div>
        <button
          onClick={() => speakMedicineInfo(medicine)}
          className="p-2 bg-amber-50 rounded hover:bg-amber-100 transition"
          title={getPrescriptionText('speak', language)}
        >
          <SpeakerIcon className="h-5 w-5 text-amber-700" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-gray-600 text-xs font-semibold inline-flex items-center gap-1.5">
            <MedicineIcon className="h-4 w-4 text-blue-600" />
            {getPrescriptionText('dosage', language).toUpperCase()}
          </div>
          <div className="text-gray-800 font-bold mt-1">{medicine.dosage || getPrescriptionText('noNotes', language)}</div>
        </div>
        <div className="bg-purple-50 p-3 rounded">
          <div className="text-gray-600 text-xs font-semibold inline-flex items-center gap-1.5">
            <TimeIcon className="h-4 w-4 text-purple-600" />
            {getPrescriptionText('frequency', language).toUpperCase()}
          </div>
          <div className="text-gray-800 font-bold mt-1">{medicine.frequency || getPrescriptionText('noNotes', language)}</div>
        </div>
        <div className="bg-green-50 p-3 rounded col-span-2">
          <div className="text-gray-600 text-xs font-semibold inline-flex items-center gap-1.5">
            <TimeIcon className="h-4 w-4 text-green-600" />
            {getPrescriptionText('duration', language).toUpperCase()}
          </div>
          <div className="text-gray-800 font-bold mt-1">{medicine.duration || getPrescriptionText('asNeeded', language)}</div>
        </div>
      </div>

      {medicine.special_instructions && (
        <div className="bg-amber-50 border-l-2 border-amber-500 p-3 rounded mb-3">
          <div className="text-xs font-semibold text-amber-800 inline-flex items-center gap-1.5">
            <WarningIcon className="h-4 w-4 text-amber-700" />
            {getPrescriptionText('warnings', language).toUpperCase()}
          </div>
          <div className="text-sm text-amber-900 mt-1">{medicine.special_instructions}</div>
        </div>
      )}

      {medicine.notes && (
        <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
          <span className="font-semibold inline-flex items-center gap-1.5">
            <LabelIcon className="h-4 w-4 text-gray-500" />
            {getPrescriptionText('notes', language)}:
          </span>{' '}
          {medicine.notes}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 inline-flex items-center gap-3">
          <CameraIcon className="h-7 w-7 text-blue-700" />
          {getPrescriptionText('handwrittenPrescriptionAnalyzer', language)}
        </h3>
        <p className="text-gray-600 text-sm">
          {getPrescriptionText('uploadHandwrittenPrescription', language)}
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
        <div className="mb-3 flex justify-center">
          <CameraIcon className="h-12 w-12 text-blue-600" />
        </div>
        <p className="text-gray-800 font-semibold mb-2 inline-flex items-center gap-2 justify-center">
          <UploadIcon className="h-5 w-5 text-blue-700" />
          {getPrescriptionText('dragImageHere', language)}
        </p>
        <p className="text-gray-600 text-sm">
          {getPrescriptionText('supportedFormats', language)}
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
                  {getPrescriptionText('analyzing', language)}
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
          className={`flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition ${iconButtonClass}`}
        >
          <AnalyzeIcon className={`h-5 w-5 ${analyzing ? 'animate-pulse' : ''}`} />
          {analyzing ? getPrescriptionText('analyzing', language) : getPrescriptionText('analyze', language)}
        </button>
        {analyzing && (
          <button
            onClick={handleCancel}
            className={`bg-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 transition ${iconButtonClass}`}
          >
            <CancelIcon className="h-5 w-5" />
            {getPrescriptionText('cancel', language)}
          </button>
        )}
        {(file || imagePreview) && (
          <button
            onClick={handleClear}
            className={`bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition ${iconButtonClass}`}
          >
            <ResetIcon className="h-5 w-5" />
            {getPrescriptionText('clear', language)}
          </button>
        )}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`font-semibold py-3 px-6 rounded-lg transition ${iconButtonClass} ${
            isMuted
              ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {isMuted ? <MuteIcon className="h-5 w-5" /> : <SpeakerIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Loading State */}
      {analyzing && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            </div>
            <p className="text-gray-700 font-semibold mb-2">{getPrescriptionText('analyzingPrescription', language)}</p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && !analyzing && (
        <div className="space-y-6">
          {/* Status Alert */}
          {analysisResult.status === 'success' && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
              <p className="text-green-800 font-semibold inline-flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-green-700" />
                {getPrescriptionText('analysisComplete', language)}
              </p>
              <p className="text-green-700 text-sm">
                {analysisResult.medicines?.length > 0
                  ? `${getPrescriptionText('found', language)} ${analysisResult.medicines.length} ${getPrescriptionText('medicines', language)}`
                  : 'OCR text extracted successfully. Medicine parsing may require manual review.'}
              </p>
            </div>
          )}

          {analysisResult.status === 'warning' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
              <p className="text-yellow-800 font-semibold inline-flex items-center gap-2">
                <WarningIcon className="h-5 w-5 text-yellow-700" />
                {analysisResult.message}
              </p>
            </div>
          )}

          {analysisResult.status === 'error' && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <p className="text-red-800 font-semibold inline-flex items-center gap-2">
                <ErrorIcon className="h-5 w-5 text-red-700" />
                {analysisResult.error}
              </p>
            </div>
          )}

          {/* Medicines List */}
          {analysisResult.medicines && analysisResult.medicines.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-800 mb-4 text-lg">
                <MedicineIcon className="inline-block h-5 w-5 mr-2 text-blue-700 align-[-2px]" />
                {getPrescriptionText('decipheredMedicines', language)} ({analysisResult.medicines.length})
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
              <p className="font-bold text-orange-800 mb-2 inline-flex items-center gap-2">
                <WarningIcon className="h-5 w-5 text-orange-700" />
                {getPrescriptionText('importantWarnings', language)}
              </p>
              <ul className="space-y-1">
                {analysisResult.warnings.map((warning, idx) => (
                  <li key={idx} className="text-orange-800 text-sm inline-flex items-start gap-2">
                    <DotIcon className="h-4 w-4 text-orange-700 mt-1 shrink-0" />
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default PrescriptionAnalyzer;
