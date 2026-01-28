import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Box,
  Typography,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WarningIcon from '@mui/icons-material/Warning';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const EnhancedMedicineIdentificationModal = ({ open, onClose, onSave }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const fileInputRef = useRef(null);

  // Get auth token from localStorage
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('🔍 Uploading medicine image...');

      const response = await fetch('/api/medicine-identification/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to analyze medicine image');
      }

      const data = await response.json();
      console.log('✅ Analysis result:', data);

      if (data.analysis) {
        setAnalysisResult(data.analysis);
      } else {
        setError('No analysis data received');
      }
    } catch (err) {
      console.error('❌ Analysis error:', err);
      setError(`Failed to analyze medicine: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrescription = async () => {
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
        let errorText = '';
        try {
          errorText = await response.text();
        } catch {
          errorText = 'Unable to parse error response';
        }
        console.error('Response status:', response.status, 'Body:', errorText);
        throw new Error(`Failed to save prescription: ${response.status} ${errorText}`);
      }

      console.log('✅ Prescription saved successfully');
      alert('Prescription saved to your history!');
      onClose();
    } catch (err) {
      console.error('Error saving prescription:', err);
      setError(`Failed to save prescription: ${err.message}`);
    }
  };

  const InfoSection = ({ title, content, bgColor = '#f5f5f5', warning = false }) => (
    <Card sx={{ mb: 2, border: warning ? '2px solid #ff6b6b' : 'none' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: warning ? '#d32f2f' : 'inherit' }}>
          {warning && '⚠️ '}{title}
        </Typography>
        <Box sx={{ background: bgColor, p: 2, borderRadius: 1, lineHeight: 1.8, maxHeight: '500px', overflowY: 'auto' }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
            {content || 'Information not available'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ background: '#f5f5f5', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalPharmacyIcon color="primary" />
        Medicine Identification
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {!analysisResult ? (
          // Upload Section
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <Box
              sx={{
                border: '2px dashed #1976d2',
                borderRadius: 2,
                p: 4,
                cursor: 'pointer',
                backgroundColor: '#f0f7ff',
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: '#e3f2fd',
                  borderColor: '#1565c0',
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUploadIcon sx={{ fontSize: 64, color: '#1976d2', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Click to upload or drag and drop
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {file ? `Selected: ${file.name}` : 'Upload a medicine image (JPG, PNG)'}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={!file || loading}
              sx={{ mt: 3, width: '100%' }}
              startIcon={loading ? <CircularProgress size={20} /> : <LocalHospitalIcon />}
            >
              {loading ? 'Analyzing...' : 'Analyze Medicine'}
            </Button>
          </Box>
        ) : (
          // Results Section - Single Column
          <Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {analysisResult.found === false && (
              <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningIcon />}>
                {analysisResult.full_information}
              </Alert>
            )}

            {analysisResult.found !== false && (
              <>
                {/* Medicine Header */}
                <Paper sx={{ p: 3, mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                    💊 {analysisResult.medicine_name}
                  </Typography>
                  {analysisResult.composition && analysisResult.composition.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Active Ingredients:</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {analysisResult.composition.map((comp, idx) => (
                          <Chip key={idx} label={comp} size="small" sx={{ background: 'rgba(255,255,255,0.3)', color: 'white' }} />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Paper>

                {/* 7 Essential Fields - Single Column */}
                <InfoSection
                  title="Medicine Name"
                  content={analysisResult.sections?.['MEDICINE NAME'] || analysisResult.medicine_name || 'Not specified'}
                  bgColor="#e8f5e9"
                />

                <InfoSection
                  title="Type"
                  content={analysisResult.sections?.['TYPE'] || analysisResult.type || 'Not specified'}
                  bgColor="#e3f2fd"
                />

                <InfoSection
                  title="Dosage"
                  content={analysisResult.sections?.['DOSAGE'] || analysisResult.dosage || 'As prescribed by doctor'}
                  bgColor="#f3e5f5"
                />

                <InfoSection
                  title="Who Can Take & Age Restrictions"
                  content={analysisResult.sections?.['WHO CAN TAKE & AGE RESTRICTIONS'] || analysisResult.who_can_take || 'Consult healthcare professional'}
                  bgColor="#fff8e1"
                />

                <InfoSection
                  title="Instructions"
                  content={analysisResult.sections?.['INSTRUCTIONS'] || analysisResult.instructions || 'Follow healthcare provider instructions'}
                  bgColor="#e0f2f1"
                />

                <InfoSection
                  title="Precautions"
                  content={analysisResult.sections?.['PRECAUTIONS'] || analysisResult.precautions || 'Consult healthcare professional'}
                  bgColor="#fff3e0"
                  warning={true}
                />

                <InfoSection
                  title="Side Effects"
                  content={analysisResult.sections?.['SIDE EFFECTS'] || analysisResult.side_effects || 'Information not available'}
                  bgColor="#ffebee"
                />

                <Divider sx={{ my: 2 }} />

                {/* Important Notice */}
                <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    🔴 IMPORTANT MEDICAL DISCLAIMER:
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                    • This information is generated by AI and is NOT a substitute for professional medical advice<br/>
                    • Always consult a qualified healthcare professional before taking any medicine<br/>
                    • Only take medicines prescribed by your doctor<br/>
                    • In case of emergency, seek immediate medical help
                  </Typography>
                </Alert>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, background: '#f5f5f5' }}>
        {analysisResult && (
          <>
            <Button onClick={() => { setAnalysisResult(null); setFile(null); }} color="primary">
              Analyze Another
            </Button>
            {analysisResult.found !== false && (
              <Button
                onClick={handleSavePrescription}
                variant="contained"
                color="success"
                sx={{ mr: 1 }}
              >
                Save to Prescriptions
              </Button>
            )}
          </>
        )}
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnhancedMedicineIdentificationModal;
