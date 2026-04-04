import React, { useState, useRef, useEffect } from 'react';
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
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WarningIcon from '@mui/icons-material/Warning';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import StopIcon from '@mui/icons-material/Stop';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const EnhancedMedicineIdentificationModal = ({ open, onClose, onSave }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Get auth token from localStorage and fetch prescription history
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
    }
    
    // Load prescription history when modal opens
    if (open) {
      fetchPrescriptionHistory();
    }
  }, [open]);

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

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setError('Analysis cancelled by user');
      console.log('📛 Analysis cancelled');
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

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
        signal: abortControllerRef.current.signal,
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
        setTabValue(0); // Show results tab
      } else {
        setError('No analysis data received');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('🛑 Analysis was cancelled');
        setError('Analysis cancelled');
      } else {
        console.error('❌ Analysis error:', err);
        setError(`Failed to analyze medicine: ${err.message}`);
      }
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
      
      // Refresh the prescription history
      await fetchPrescriptionHistory();
      
      // Reset form
      setAnalysisResult(null);
      setFile(null);
      setImagePreview(null);
      setTabValue(1); // Switch to history tab
    } catch (err) {
      console.error('Error saving prescription:', err);
      setError(`Failed to save prescription: ${err.message}`);
    }
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) {
      return;
    }

    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete prescription');
      }

      // Refresh the prescription history
      await fetchPrescriptionHistory();
      alert('Prescription deleted successfully');
    } catch (err) {
      console.error('Error deleting prescription:', err);
      alert('Failed to delete prescription: ' + err.message);
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

  // Image Preview Dialog
  const ImagePreviewDialog = () => (
    <Dialog open={showImageDialog} onClose={() => setShowImageDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Uploaded Image</DialogTitle>
      <DialogContent>
        {imagePreview && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }} />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              File: {file?.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Size: {(file?.size / 1024).toFixed(2)} KB
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowImageDialog(false)} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ background: '#f5f5f5', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalPharmacyIcon color="primary" />
        Medicine Identification & Prescription History
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={`📤 Upload & Analyze`} />
            <Tab label={`📋 History (${prescriptionHistory.length})`} />
          </Tabs>
        </Box>

        {/* Tab 1: Upload & Analyze */}
        <TabPanel value={tabValue} index={0}>
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

              {/* File Details & Preview */}
              {file && (
                <Card sx={{ mt: 3, backgroundColor: '#e3f2fd' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      📎 File Details
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="body2">
                          <strong>Name:</strong> {file.name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
                        </Typography>
                        <Typography variant="body2">
                          <strong>Type:</strong> {file.type}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => setShowImageDialog(true)}
                        size="small"
                      >
                        View Image
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleAnalyze}
                  disabled={!file || loading}
                  sx={{ flex: 1 }}
                  startIcon={loading ? <CircularProgress size={20} /> : <LocalHospitalIcon />}
                >
                  {loading ? 'Analyzing...' : 'Analyze Medicine'}
                </Button>
                
                {loading && (
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleCancel}
                    startIcon={<StopIcon />}
                  >
                    Stop Analysis
                  </Button>
                )}
              </Box>
            </Box>
          ) : (
            // Results Section
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

                  {/* 7 Essential Fields */}
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

          <ImagePreviewDialog />
        </TabPanel>

        {/* Tab 2: Prescription History */}
        <TabPanel value={tabValue} index={1}>
          {prescriptionHistory.length > 0 ? (
            <Box>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  📚 Saved Prescriptions
                </Typography>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={fetchPrescriptionHistory}
                  size="small"
                  variant="outlined"
                >
                  Refresh
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Medicine</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Dosage</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Frequency</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Saved Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prescriptionHistory.map((prescription) => (
                      <TableRow key={prescription.id} hover>
                        <TableCell>{prescription.medicine_name}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {prescription.dosage}
                          </Typography>
                        </TableCell>
                        <TableCell>{prescription.frequency}</TableCell>
                        <TableCell>{prescription.duration}</TableCell>
                        <TableCell>
                          {new Date(prescription.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletePrescription(prescription.id)}
                            title="Delete prescription"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body1" color="textSecondary">
                📭 No prescriptions saved yet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Start by uploading a medicine image in the "Upload & Analyze" tab
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 3 }}
                onClick={() => setTabValue(0)}
              >
                Upload Medicine Image
              </Button>
            </Box>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 2, background: '#f5f5f5' }}>
        {analysisResult && (
          <>
            <Button onClick={() => { setAnalysisResult(null); setFile(null); setImagePreview(null); }} color="primary">
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
