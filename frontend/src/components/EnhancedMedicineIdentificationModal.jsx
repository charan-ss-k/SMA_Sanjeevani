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
  CardHeader,
  Tabs,
  Tab,
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Container
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
  const [tabValue, setTabValue] = useState(0);
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
        setTabValue(0); // Reset to first tab
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

      const response = await fetch('/api/prescriptions', {
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

      console.log('✅ Prescription saved successfully');
      alert('Prescription saved to your history!');
      onClose();
    } catch (err) {
      console.error('Error saving prescription:', err);
      setError(`Failed to save prescription: ${err.message}`);
    }
  };

  const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
      <div role="tabpanel" hidden={value !== index} {...other}>
        {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
      </div>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ background: '#f5f5f5', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalPharmacyIcon color="primary" />
        Medicine Identification & Information
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
          // Results Section with Tabs
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
                <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {analysisResult.medicine_name}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">Category: {analysisResult.category}</Typography>
                      <Typography variant="body2">Manufacturer: {analysisResult.manufacturer}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">Price: {analysisResult.price}</Typography>
                      <Typography variant="body2">Source: {analysisResult.source}</Typography>
                    </Grid>
                  </Grid>
                  {analysisResult.composition && analysisResult.composition.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Composition:</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {analysisResult.composition.map((comp, idx) => (
                          <Chip key={idx} label={comp} size="small" sx={{ background: 'rgba(255,255,255,0.3)' }} />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Paper>

                {/* Tabs */}
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Tab label="Overview" />
                  <Tab label="Dosage" />
                  <Tab label="Precautions" />
                  <Tab label="Side Effects" />
                  <Tab label="Interactions" />
                  <Tab label="Instructions" />
                  <Tab label="Full Info" />
                </Tabs>

                {/* Tab Contents */}
                <TabPanel value={tabValue} index={0}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Medicine Overview
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                        {analysisResult.sections?.['MEDICINE OVERVIEW'] || 
                         analysisResult.sections?.['OVERVIEW'] ||
                         analysisResult.when_to_use || 
                         'Information available'}
                      </Typography>
                    </CardContent>
                  </Card>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Dosage Information
                      </Typography>
                      <Box sx={{ background: '#f5f5f5', p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 2, fontFamily: 'monospace' }}>
                          {analysisResult.sections?.['DOSAGE INSTRUCTIONS'] || 
                           analysisResult.sections?.['DOSAGE'] ||
                           analysisResult.dosage || 
                           'Consult your doctor for dosage'}
                        </Typography>
                      </Box>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Always follow your doctor's prescription. Dosages may vary based on individual conditions.
                      </Alert>
                    </CardContent>
                  </Card>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#d32f2f' }}>
                        ⚠️ Precautions & Warnings
                      </Typography>
                      <Box sx={{ background: '#fff3cd', p: 2, borderRadius: 1, mb: 2 }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 2 }}>
                          {analysisResult.sections?.['PRECAUTIONS & WARNINGS'] || 
                           analysisResult.sections?.['PRECAUTIONS'] ||
                           analysisResult.precautions || 
                           'Consult healthcare professional'}
                        </Typography>
                      </Box>
                      {analysisResult.warnings && (
                        <List dense>
                          {analysisResult.warnings.map((warning, idx) => (
                            <ListItem key={idx}>
                              <WarningIcon sx={{ mr: 2, color: '#d32f2f' }} />
                              <ListItemText primary={warning} />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </CardContent>
                  </Card>
                </TabPanel>

                <TabPanel value={tabValue} index={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Side Effects
                      </Typography>
                      <Box sx={{ background: '#f5f5f5', p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 2 }}>
                          {analysisResult.sections?.['SIDE EFFECTS'] || 
                           analysisResult.side_effects || 
                           'Information not available'}
                        </Typography>
                      </Box>
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        If you experience unusual symptoms, contact your doctor immediately.
                      </Alert>
                    </CardContent>
                  </Card>
                </TabPanel>

                <TabPanel value={tabValue} index={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Drug Interactions
                      </Typography>
                      <Box sx={{ background: '#f5f5f5', p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 2 }}>
                          {analysisResult.sections?.['DRUG INTERACTIONS'] || 
                           analysisResult.sections?.['INTERACTIONS'] ||
                           analysisResult.interactions || 
                           'Consult your doctor about other medicines'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </TabPanel>

                <TabPanel value={tabValue} index={5}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        How to Use
                      </Typography>
                      <Box sx={{ background: '#f5f5f5', p: 2, borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 2 }}>
                          {analysisResult.sections?.['INSTRUCTIONS FOR USE'] || 
                           analysisResult.sections?.['INSTRUCTIONS'] ||
                           analysisResult.instructions || 
                           'Follow healthcare provider instructions'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </TabPanel>

                <TabPanel value={tabValue} index={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Complete Information
                      </Typography>
                      <Box sx={{ background: '#f5f5f5', p: 2, borderRadius: 1, maxHeight: 400, overflow: 'auto' }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {analysisResult.full_information || 'Information not available'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </TabPanel>

                <Divider sx={{ my: 2 }} />

                {/* Important Notice */}
                <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    🔴 IMPORTANT MEDICAL DISCLAIMER:
                  </Typography>
                  <Typography variant="body2">
                    • This information is generated by AI and is NOT a substitute for professional medical advice<br/>
                    • Always consult a qualified healthcare professional before taking any medicine<br/>
                    • Only take medicines prescribed by your doctor<br/>
                    • In case of emergency, seek immediate medical help<br/>
                    • Keep the original medicine packaging for reference
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
