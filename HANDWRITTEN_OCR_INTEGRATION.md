# Handwritten Prescription OCR - Integration Checklist

## 📋 Pre-Integration Steps

### 1. Install Dependencies
```bash
cd backend
pip install -r HANDWRITTEN_OCR_REQUIREMENTS.txt

# Optional: For CRAFT text detection
pip install craft-text-detector>=0.4.1
```

### 2. Verify Files Created
```
backend/app/services/
✅ handwritten_prescription_ocr.py
✅ handwritten_prescription_analyzer.py

backend/app/routes/
✅ handwritten_prescription_routes.py

backend/
✅ HANDWRITTEN_OCR_REQUIREMENTS.txt

Project Root/
✅ HANDWRITTEN_PRESCRIPTION_OCR_GUIDE.md
✅ HANDWRITTEN_OCR_QUICK_REFERENCE.md
✅ HANDWRITTEN_OCR_INTEGRATION.md (this file)
```

---

## 🔧 Integration Steps

### Step 1: Update Main FastAPI App

**Location:** `backend/app/main.py` (or equivalent)

**Add these imports:**
```python
from app.routes.handwritten_prescription_routes import router as prescription_router
```

**Add this line after creating the FastAPI app:**
```python
app = FastAPI(
    title="SMA Sanjeevani",
    description="Healthcare system with prescription analysis",
    version="1.0.0"
)

# ✅ ADD THIS LINE
app.include_router(prescription_router)

# ... rest of your app code
```

### Step 2: Verify File Imports

Ensure your `backend/app/__init__.py` includes:
```python
# backend/app/__init__.py
from . import services
from . import routes
```

---

## 🧪 Testing Integration

### Test 1: Import Check
```bash
python -c "from app.services.handwritten_prescription_analyzer import HandwrittenPrescriptionAnalyzer; print('✅ Import successful')"
```

### Test 2: Service Info
```bash
# Start your backend server
python backend/start.py

# In another terminal
curl http://localhost:8000/api/prescription/service-info
```

**Expected Response:**
```json
{
    "service_name": "Handwritten Prescription Analysis Service",
    "description": "Complete pipeline for analyzing handwritten prescriptions...",
    "phases": {...}
}
```

### Test 3: OCR Capabilities
```bash
curl http://localhost:8000/api/prescription/ocr-capabilities
```

**Expected Response:**
```json
{
    "service": "Handwritten Prescription OCR",
    "ocr_system": {
        "type": "Line-based TrOCR with text detection",
        "trocr_available": true,
        "craft_available": false,
        "fallback": "Contour-based text detection if CRAFT unavailable"
    },
    "pipeline": [...]
}
```

### Test 4: Prescription Analysis (with Test Image)

**Prepare:** Get a sample prescription image

```bash
curl -X POST http://localhost:8000/api/prescription/analyze-handwritten \
  -F "file=@test_prescription.jpg"
```

**Expected Response:**
```json
{
    "status": "success",
    "message": "Handwritten prescription analysis completed successfully",
    "ocr_phase": {
        "status": "✅ Complete",
        "text_lines_detected": 4,
        "ocr_text": "Paracetamol 500mg\nTake 2 tablets twice daily...",
        "text_lines": ["Paracetamol 500mg", "Take 2 tablets twice daily", ...]
    },
    "llm_phase": {
        "status": "✅ Complete",
        "medicines": [
            {
                "medicine_name": "Paracetamol",
                "dosage": "500mg",
                "frequency": "Twice daily",
                "duration": "5 days",
                "special_instructions": "",
                "confidence": "high",
                "notes": ""
            }
        ]
    },
    "medicines": [...]
}
```

---

## 🔌 Frontend Integration

### React Component Example

```javascript
import React, { useState } from 'react';

function PrescriptionUploader() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/prescription/analyze-handwritten', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prescription-analyzer">
      <h2>Analyze Handwritten Prescription</h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={loading}
      />

      {loading && <p>Processing prescription...</p>}

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="results">
          <h3>Analysis Results</h3>

          {result.status === 'success' && (
            <>
              <h4>Extracted Text:</h4>
              <pre>{result.ocr_phase.ocr_text}</pre>

              <h4>Found Medicines:</h4>
              <ul>
                {result.medicines.map((med, idx) => (
                  <li key={idx}>
                    <strong>{med.medicine_name}</strong> {med.dosage}
                    <br />
                    <small>
                      {med.frequency}
                      {med.duration && ` for ${med.duration}`}
                      {med.special_instructions && ` - ${med.special_instructions}`}
                    </small>
                  </li>
                ))}
              </ul>

              <div className="warnings">
                <h4>⚠️ Important Notes:</h4>
                <ul>
                  {result.warnings?.map((warn, idx) => (
                    <li key={idx}>{warn}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {result.status === 'error' && (
            <div className="error">
              Failed to analyze prescription: {result.error}
            </div>
          )}

          {result.status === 'warning' && (
            <div className="warning">
              {result.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PrescriptionUploader;
```

---

## 📱 Vue.js Component Example

```vue
<template>
  <div class="prescription-analyzer">
    <h2>Analyze Handwritten Prescription</h2>

    <div class="upload-area">
      <input
        type="file"
        accept="image/*"
        @change="handleFileUpload"
        :disabled="loading"
      />
    </div>

    <div v-if="loading" class="loading">
      Processing prescription...
    </div>

    <div v-if="error" class="error">
      Error: {{ error }}
    </div>

    <div v-if="result" class="results">
      <div v-if="result.status === 'success'">
        <h3>Extracted Text:</h3>
        <pre>{{ result.ocr_phase.ocr_text }}</pre>

        <h3>Found Medicines:</h3>
        <ul>
          <li v-for="(medicine, idx) in result.medicines" :key="idx">
            <strong>{{ medicine.medicine_name }}</strong>
            {{ medicine.dosage }}
            <br />
            <small>
              {{ medicine.frequency }}
              <span v-if="medicine.duration"> for {{ medicine.duration }}</span>
              <span v-if="medicine.special_instructions">
                - {{ medicine.special_instructions }}
              </span>
            </small>
          </li>
        </ul>

        <div class="warnings">
          <h4>⚠️ Important Notes:</h4>
          <ul>
            <li v-for="(warn, idx) in result.warnings" :key="idx">
              {{ warn }}
            </li>
          </ul>
        </div>
      </div>

      <div v-else-if="result.status === 'error'" class="error">
        Failed to analyze prescription: {{ result.error }}
      </div>

      <div v-else class="warning">
        {{ result.message }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      result: null,
      error: null
    };
  },
  methods: {
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.loading = true;
      this.error = null;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/prescription/analyze-handwritten', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        this.result = await response.json();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

## 🧪 Direct Python Usage

### Example 1: Analyze Local Image
```python
from app.services.handwritten_prescription_analyzer import HandwrittenPrescriptionAnalyzer

result = HandwrittenPrescriptionAnalyzer.analyze_handwritten_prescription(
    "prescription.jpg"
)

if result['status'] == 'success':
    print(f"Found {len(result['medicines'])} medicines:")
    for med in result['medicines']:
        print(f"  - {med['medicine_name']} {med['dosage']}")
        print(f"    {med['frequency']}")
else:
    print(f"Error: {result['error']}")
```

### Example 2: Analyze Image Bytes
```python
from app.services.handwritten_prescription_analyzer import HandwrittenPrescriptionAnalyzer

with open('prescription.jpg', 'rb') as f:
    image_bytes = f.read()

result = HandwrittenPrescriptionAnalyzer.analyze_handwritten_prescription_from_bytes(
    image_bytes,
    "prescription.jpg"
)

print(result['medicines'])
```

### Example 3: Get Service Info
```python
from app.services.handwritten_prescription_analyzer import HandwrittenPrescriptionAnalyzer

info = HandwrittenPrescriptionAnalyzer.get_service_info()

print("Service:", info['service_name'])
print("Phases:", info['phases'].keys())
```

---

## 🔍 Debugging

### Enable Debug Logging
```python
import logging

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Now run your analysis - you'll see detailed logs
result = HandwrittenPrescriptionAnalyzer.analyze_handwritten_prescription("test.jpg")
```

### Expected Debug Output
```
INFO:root:🏥 Starting handwritten prescription analysis for: test.jpg
INFO:root:📝 PHASE 1: Extracting text with line-based TrOCR...
INFO:root:🔍 Detecting text regions...
INFO:root:🔍 Using contour-based text region detection...
INFO:root:✅ Contour detection found 5 text regions
INFO:root:📍 Extracting 5 text line crops...
INFO:root:✅ Extracted 5 valid crops
INFO:root:🧠 Recognizing text in 5 crops...
INFO:root:📥 Loading TrOCR model...
INFO:root:✅ TrOCR model loaded successfully
INFO:root:📍 STEP 7: Sorting lines in reading order...
INFO:root:📝 STEP 8: Joining final text...
INFO:root:🎉 Prescription OCR successful. Extracted 5 text lines
```

---

## 📊 Performance Expectations

### Processing Time
| Component | Time (CPU) | Time (GPU) |
|-----------|-----------|-----------|
| Image Normalization | 50ms | 50ms |
| Text Detection | 100-200ms | 100-200ms |
| TrOCR (per line) | 150-200ms | 30-50ms |
| Total (5 lines) | 1-2 sec | 500-800ms |

### Memory Usage
- Model loading: 500MB (one-time)
- Inference: 200-300MB per prescription
- Total: ~700-800MB

---

## ✅ Validation Checklist

Before going to production:

- [ ] All files created in correct locations
- [ ] Dependencies installed successfully
- [ ] FastAPI router integrated into main app
- [ ] Service info endpoint returns data
- [ ] OCR capabilities endpoint returns data
- [ ] Can upload and analyze test image
- [ ] Medicines extracted correctly
- [ ] Frontend displays results properly
- [ ] Error handling works for invalid images
- [ ] Logging shows expected debug info

---

## 🚀 Production Checklist

- [ ] Logging configured for production
- [ ] File upload size limits enforced
- [ ] Temporary files cleaned up properly
- [ ] GPU acceleration enabled (if available)
- [ ] Model caching working (loaded once)
- [ ] Error responses formatted correctly
- [ ] Rate limiting configured
- [ ] CORS properly configured (if needed)
- [ ] Documentation updated

---

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| ModuleNotFoundError: transformers | Run: `pip install transformers torch` |
| CUDA out of memory | Set `device = "cpu"` in code, or reduce batch size |
| "No text regions detected" | Use clearer image, better lighting |
| Slow processing | Enable GPU acceleration |
| Models not loading | Check internet connection for downloading models |
| 404 on API endpoint | Verify router is included in main app |

---

## 📞 Support

For issues or questions:
1. Check logs with debug logging enabled
2. Verify file upload is valid image format
3. Test with clear prescription image
4. Check documentation files
5. Review error messages in API response

---

**Date:** 2026-01-31
**Status:** ✅ Ready for Integration
