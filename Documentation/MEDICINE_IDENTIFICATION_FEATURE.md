# 🔍 Medicine Identification Feature

## Overview
The Medicine Identification feature allows users to upload or capture images of medicine tablets, strips, or packages to get detailed information about them using OCR (Optical Character Recognition) and AI analysis with Meditron-7B LLM.

## Features

### 1. **Image Upload & Camera Capture**
   - **Upload File**: Click the "Upload File" button to select an image from your device
   - **Take Photo**: Use the camera to capture a photo directly
   - **Supported Formats**: JPG, JPEG, PNG, WebP, BMP, TIFF
   - **File Size**: Maximum 10MB, minimum 1KB

### 2. **OCR Text Extraction**
   - Automatic text extraction from medicine packaging
   - Multiple OCR methods for accuracy:
     - Tesseract OCR with 4 PSM (Page Segmentation Mode) options
     - EasyOCR as fallback for better accuracy
   - Advanced image preprocessing for clarity

### 3. **AI Medicine Analysis**
   - **LLM**: Meditron-7B (medical-specialized model)
   - **Features Extracted**:
     - Medicine Name
     - Composition/Ingredients
     - Dosage (Adults, Children, Seniors)
     - Food Interaction (before/after meals)
     - Precautions
     - Side Effects
     - Contraindications (when NOT to use)
     - Maximum Daily Dose
     - Duration Limit
     - Age Restrictions
     - Important Warnings

### 4. **Save to Prescriptions**
   - Save identified medicines directly to your prescription list
   - Auto-fill medicine details
   - Set custom reminders for medicine intake

## How to Use

### Step 1: Open Medicine Identification
1. Go to **"Prescription Management"** page
2. Click the **"🔍 AI Medicine Identification"** button

### Step 2: Upload or Capture Image
- **Option A - Upload**: Click the upload area or drag & drop an image
- **Option B - Camera**: Click "📸 Take Photo" to use your device camera

### Step 3: Analyze Medicine
- Click **"🔍 Analyze Medicine"** button
- Wait for the analysis to complete (typically 10-30 seconds)
- The system will extract medicine details

### Step 4: Review Results
View detailed information including:
- Medicine name and composition
- Dosage recommendations for different age groups
- Food interaction guidelines
- Precautions and warnings
- Side effects and contraindications

### Step 5: Save to Prescriptions
- Click **"✅ Save to Prescriptions"** button
- Medicine is added to your prescription list
- Set reminders for regular intake

## Technical Details

### Backend API Endpoints

#### 1. Analyze Medicine Image
```
POST /api/medicine-identification/analyze
Content-Type: multipart/form-data
Authorization: Bearer {token}

Request:
- file: Image file (JPG, PNG, WebP, BMP, TIFF)

Response:
{
  "success": true,
  "ocr_text": "Extracted text from image",
  "analysis": {
    "medicine_name": "Paracetamol",
    "composition": "Paracetamol 500mg",
    "dosage": {
      "adults": "500-1000mg every 4-6 hours",
      "children": "10-15mg/kg every 4-6 hours",
      "seniors": "500mg every 6-8 hours"
    },
    "food_interaction": "Can be taken with or without food",
    "precautions": ["List of precautions..."],
    "side_effects": ["List of side effects..."],
    "contraindications": ["List of contraindications..."],
    "max_daily_dose": "4000mg",
    "duration_limit": "Not recommended for more than 10 days",
    "age_restrictions": "Above 12 years",
    "warnings": ["List of important warnings..."]
  }
}
```

#### 2. Save Medicine to Prescriptions
```
POST /api/medicine-identification/save-to-prescription
Authorization: Bearer {token}

Request:
{
  "medicine_name": "Paracetamol",
  "dosage": "500mg",
  "frequency": "Every 6 hours",
  "duration": "5 days",
  "notes": "Take after food"
}

Response:
{
  "success": true,
  "message": "Medicine saved successfully",
  "prescription_id": "UUID"
}
```

#### 3. Service Health Check
```
GET /api/medicine-identification/health

Response:
{
  "status": "healthy",
  "ocr_engine": "tesseract + easyocr",
  "llm_model": "meditron-7b",
  "llm_provider": "ollama"
}
```

### Frontend Components

**File**: `frontend/src/components/MedicineIdentificationModal.jsx`

- **MedicineIdentificationModal**: React component with:
  - Image upload/camera capture UI
  - Analysis progress indicator
  - Results display with formatted medicine details
  - Save to prescriptions functionality
  - Multi-language support

**Integration**: `frontend/src/components/PrescriptionHandling.jsx`
- Added "🔍 AI Medicine Identification" button
- Modal opens on button click
- Saves identified medicines to prescription list

### Backend Services

**File**: `backend/app/services/medicine_ocr_service.py`

Functions:
- `preprocess_image_multiple_methods()`: Image enhancement
- `extract_text_from_image()`: OCR text extraction
- `analyze_medicine_with_meditron()`: LLM-based analysis
- `parse_meditron_response()`: Response parsing
- `process_medicine_image()`: Complete pipeline

**File**: `backend/app/api/routes/routes_medicine_identification.py`

Three RESTful endpoints for image analysis and medicine management.

## Configuration

### Environment Variables
```
OLLAMA_MODEL=meditron
LLM_TEMPERATURE=0.2
LLM_MAX_TOKENS=1024
REQUEST_TIMEOUT=600
```

### System Requirements
- Python 3.10+
- Tesseract OCR installed
- Ollama with Meditron-7B model loaded
- OpenCV (cv2)
- Optional: EasyOCR for improved accuracy

## Accuracy & Limitations

### Accuracy Factors
- **Image Quality**: Clear, well-lit images yield better results
- **Text Clarity**: Clear packaging text improves OCR
- **Medicine Type**: Common medicines have better recognition

### Limitations
- **Handwritten Labels**: Not reliably extracted
- **Non-English Packaging**: May require language-specific OCR
- **Blurry Images**: Reduced accuracy
- **Complex Packaging**: Some details may be missed

## Troubleshooting

### Issue: Image Upload Fails
- **Solution**: Check file size (max 10MB) and format (JPG, PNG, WebP, BMP)

### Issue: Slow Analysis
- **Solution**: Meditron-7B typically takes 10-30 seconds depending on hardware
- **Optimization**: Ensure adequate system resources

### Issue: Inaccurate Medicine Name
- **Solution**: Try uploading a clearer, better-lit image
- **Tip**: Focus on the medicine packaging text

### Issue: Missing Side Effects
- **Solution**: Some medicines may have limited training data
- **Fallback**: Consult medical professional

## Future Enhancements

- [ ] Batch image processing for multiple medicines
- [ ] Barcode scanning support
- [ ] Medicine interaction checker
- [ ] Pharmacy locator integration
- [ ] Doctor consultation scheduling
- [ ] Accessibility improvements for screen readers
- [ ] Offline mode support
- [ ] Medicine image database

## Safety & Disclaimer

⚠️ **Important**: This tool is an AI assistant providing informational support. 

**Always**:
- Consult a healthcare professional before taking any medication
- Verify information from official sources
- Report any unusual symptoms to a doctor
- Do not self-diagnose or self-treat serious conditions

**Legal**: The information provided is not a substitute for professional medical advice.

## Support & Feedback

For issues or feature requests:
1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Contact the development team with details

---

**Last Updated**: 2024
**Feature Version**: 1.0
**Status**: Production Ready
