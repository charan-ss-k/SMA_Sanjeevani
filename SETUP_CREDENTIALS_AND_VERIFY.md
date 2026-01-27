# Setting Up Google Cloud Credentials & Verifying Medicine Identification

## Current Status
```
✅ opencv-python-headless: Installed
❌ Google Cloud Credentials: Not found
⚠️ Translation Service: Using slow fallback
❌ Medicine Identification: Disabled (waiting for verification)
```

---

## Issue 1: Google Translator Credentials Not Found

### What This Means
The system is trying to use **Google Cloud Translation API** but can't find the credentials file. It's falling back to slower translation methods.

### Why You Need It
```
Translation Quality & Speed:
1. indic-trans2 (BEST - local, fast)     → Not installed
2. Google Cloud Translate (GOOD - cloud) → Credentials missing ⚠️
3. Fallback (SLOW)                       → Currently being used
```

### Solution: Set Up Google Cloud Credentials

#### Step 1: Create Google Cloud Project
1. Go to **Google Cloud Console**: https://console.cloud.google.com/
2. Click **"Create Project"** (top of page)
3. Name it: `SMA-Sanjeevani-Translation`
4. Click **"Create"**
5. Wait for project to be created (1-2 minutes)

#### Step 2: Enable Translation API
1. In Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for: **"Cloud Translation API"**
3. Click on it
4. Click **"Enable"** (blue button)
5. Wait for it to enable (30 seconds)

#### Step 3: Create Service Account
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"Service Account"**
3. Fill in:
   - **Service account name**: `sma-sanjeevani-translator`
   - **Service account ID**: *(auto-filled)*
   - **Description**: `Translation service for SMA Sanjeevani`
4. Click **"Create and Continue"**
5. Click **"Continue"** (skip optional steps)
6. Click **"Done"**

#### Step 4: Create JSON Key
1. You should see your service account listed in **"Service accounts"** section
2. Click on the service account you just created
3. Go to **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. Choose **"JSON"** format
6. Click **"Create"**
7. A JSON file will be **downloaded automatically**
   - Save it as: `google-cloud-credentials.json`
   - Keep it **safe and secret** (never commit to Git)

#### Step 5: Place Credentials File
```
Option A: In project root (easiest)
d:\GitHub 2\SMA_Sanjeevani\
    └── google-cloud-credentials.json

Option B: In backend config folder
d:\GitHub 2\SMA_Sanjeevani\backend\config\
    └── google-cloud-credentials.json

Option C: In system environment (most secure)
C:\Users\YourUsername\AppData\Local\
    └── google-cloud-credentials.json
```

#### Step 6: Configure Environment Variable

**Option A: Using PowerShell (Temporary - until terminal closes)**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "d:\GitHub 2\SMA_Sanjeevani\google-cloud-credentials.json"

# Verify it's set:
echo $env:GOOGLE_APPLICATION_CREDENTIALS
```

**Option B: Using .env file (Recommended - Permanent)**
1. Create file: `d:\GitHub 2\SMA_Sanjeevani\.env`
2. Add this line:
```
GOOGLE_APPLICATION_CREDENTIALS=d:\GitHub 2\SMA_Sanjeevani\google-cloud-credentials.json
```

3. Update `backend/start.py` to load it:
```python
from dotenv import load_dotenv
import os

load_dotenv()  # Add this at the top
```

**Option C: Set System Environment Variable (Most Permanent)**
1. Open **Environment Variables** in Windows:
   - Press `Win + R`
   - Type: `sysdm.cpl`
   - Press Enter
2. Go to **"Environment Variables"** button (bottom right)
3. Click **"New..."** (under System variables)
4. Variable name: `GOOGLE_APPLICATION_CREDENTIALS`
5. Variable value: `d:\GitHub 2\SMA_Sanjeevani\google-cloud-credentials.json`
6. Click **"OK"** three times
7. **Restart terminal and backend** for changes to take effect

#### Step 7: Verify Setup

```bash
# Test 1: Check environment variable is set
echo $env:GOOGLE_APPLICATION_CREDENTIALS

# Test 2: Verify file exists
Test-Path "d:\GitHub 2\SMA_Sanjeevani\google-cloud-credentials.json"

# Test 3: Run backend - should not show Google error
cd backend
python start.py

# Test 4: Check logs - look for this message:
# ✅ Google Cloud Translator initialized successfully
# (instead of: ⚠️ Google Translator not available)
```

#### Step 8: Test Translation Service
```bash
# In another terminal (while backend is running):
curl -X POST "http://localhost:8000/api/translation/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "बुखार",
    "source_language": "hi",
    "target_language": "en"
  }'

# Expected response:
# {"translated_text": "fever", "language": "hi"}
```

---

## Issue 2: Medicine Identification Disabled (OpenCV Missing)

### What This Means
```
⚠️ Medicine identification disabled: install opencv-python
```

This error appears in logs when `cv2` (OpenCV) import fails.

### Current Status
✅ We just installed `opencv-python-headless` - it should work now!

Let's verify:

#### Step 1: Verify OpenCV Installation
```bash
# In PowerShell:
python -c "import cv2; print(f'OpenCV version: {cv2.__version__}')"

# Expected output:
# OpenCV version: 4.8.0 (or similar)

# If you see error "No module named 'cv2'":
pip install opencv-python-headless>=4.8.0
```

#### Step 2: Verify Medicine OCR Service Works
```bash
# In PowerShell, in the backend directory:
python -c "from app.services.medicine_ocr_service import process_medicine_image; print('✅ Medicine OCR service loaded successfully')"

# Expected output:
# ✅ Medicine OCR service loaded successfully

# If error, run:
pip install pytesseract>=0.3.10
pip install pillow>=9.0.0
```

#### Step 3: Test File Upload Endpoint
```bash
# Upload a medicine/tablet image to test:
curl -X POST "http://localhost:8000/api/medicine-identification/analyze" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@C:\path\to\medicine.jpg"

# You should get medicine identification results
```

---

## Complete Verification Checklist

Run this to verify everything is working:

```bash
# 1. Check Python packages
pip list | findstr "opencv google-cloud-translate"

# 2. Test imports
python -c "import cv2; import google.cloud.translate_v2; print('✅ All imports OK')"

# 3. Check environment variable
echo $env:GOOGLE_APPLICATION_CREDENTIALS

# 4. Verify credentials file exists
Test-Path "d:\GitHub 2\SMA_Sanjeevani\google-cloud-credentials.json"

# 5. Check backend logs (should show):
# ✅ RAG System initialized
# ✅ TTS Service ready
# ✅ Google Cloud Translator initialized successfully  (no warning)
# ✅ Medicine OCR service ready                       (no warning)

# 6. Test translation
curl -X POST "http://localhost:8000/api/translation/translate" \
  -H "Content-Type: application/json" \
  -d '{"text": "बुखार", "source_language": "hi", "target_language": "en"}'

# 7. Test medicine identification
curl -X POST "http://localhost:8000/api/medicine-identification/analyze" \
  -F "file=@test_medicine.jpg"
```

---

## What To Do If Google Credentials Setup Fails

### Option 1: Use Fallback Translation (System Still Works)
```
If you can't set up Google Cloud:
- System will use slower fallback translation
- Still works, just slower (2-5 seconds per translation)
- Medicine recommendations will still work
- Acceptable for testing/demo
```

### Option 2: Use Free Tier Limits
```
Google Cloud Translation includes:
- 500,000 words/month FREE
- Perfect for testing and small deployments
- No credit card required initially
- Only charge after free tier exceeded
```

### Option 3: Skip Google Translation (Not Recommended)
```
Edit: backend/app/services/translation_service.py

# Comment out lines that use Google:
# google_translator = translate_client.get_translation(...)

# System will fall back to slower methods
# Not recommended - translation will be very slow
```

---

## Environment Variable Location Chart

| Method | Location | Persistence | Scope |
|--------|----------|-------------|-------|
| PowerShell `$env:` | Terminal only | Temporary | Current session |
| `.env` file | Project root | Until deleted | Application only |
| System Environment | Control Panel | Permanent | All applications |
| Backend config | Code | Permanent | Application only |

**Recommended**: Use `.env` file + backend load (Option B)

---

## Summary: What You Need To Do

### To Get Google Translator Working:
```
1. Create Google Cloud project (10 minutes)
2. Enable Translation API (2 minutes)
3. Create service account (3 minutes)
4. Download JSON key (1 minute)
5. Place credentials file in project folder (1 minute)
6. Set GOOGLE_APPLICATION_CREDENTIALS environment variable (2 minutes)
7. Restart backend (1 minute)
Total: ~20 minutes
```

### To Get Medicine Identification Working:
```
✅ opencv-python-headless already installed
1. Verify import: python -c "import cv2" (1 minute)
2. Test upload endpoint (2 minutes)
3. Verify no errors in logs (1 minute)
Total: ~4 minutes
```

---

## Quick Reference: File Locations

```
Project Root:
d:\GitHub 2\SMA_Sanjeevani\
├── google-cloud-credentials.json      ← PUT CREDENTIALS HERE
├── .env                               ← CREATE THIS FILE
└── backend/
    ├── start.py                       ← Update to load .env
    └── app/
        └── services/
            ├── translation_service.py ← Uses Google credentials
            └── medicine_ocr_service.py ← Uses opencv
```

---

## Content: .env File Template

Create file: `d:\GitHub 2\SMA_Sanjeevani\.env`

```env
# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=d:\GitHub 2\SMA_Sanjeevani\google-cloud-credentials.json

# Backend Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# Ollama LLM
OLLAMA_URL=http://localhost:11434

# Database
DATABASE_URL=postgresql://user:password@localhost/sanjeevani_finaldb

# TTS Configuration
TTS_SERVICE=google  # or gtts for fallback

# Translation Configuration
TRANSLATION_SERVICE=google  # Primary service
TRANSLATION_FALLBACK=gtts   # Fallback service
```

---

## Troubleshooting

### Problem: "Google Translator not available: invalid credentials"
```
Solution:
1. Check file path in GOOGLE_APPLICATION_CREDENTIALS
2. Verify JSON file isn't corrupted
3. Verify service account has permissions
4. Delete and regenerate credentials file
```

### Problem: "OpenCV not found" or "cv2 import error"
```
Solution:
pip uninstall opencv-python opencv-python-headless
pip install opencv-python-headless>=4.8.0
python -c "import cv2; print(cv2.__version__)"
```

### Problem: "Translation taking too long (5+ seconds)"
```
Solution:
1. Verify Google credentials are loaded
2. Check internet connection
3. Consider using indic-trans2 instead (faster, local)
4. Implement response caching
```

### Problem: "Tesseract not found" (when uploading medicine images)
```
Solution:
# Install Tesseract OCR:
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
# Or install via package manager

# Then install Python wrapper:
pip install pytesseract>=0.3.10
```

---

## Next Steps

1. **Set up Google Cloud credentials** (20 minutes)
   - Follow steps 1-7 above
   - Test with Step 8 verification

2. **Verify OpenCV works** (5 minutes)
   - Run verification commands
   - Test medicine upload endpoint

3. **Restart backend** (2 minutes)
   - Backend should show no warnings now
   - All services should be initialized

4. **Test full pipeline** (10 minutes)
   - Test symptom recommendation
   - Test file upload
   - Test translation in different languages

**Total time: ~40 minutes to get everything working properly! 🎉**

---

## Support Resources

**Google Cloud:**
- Console: https://console.cloud.google.com/
- Translation API docs: https://cloud.google.com/translate/docs
- Service account guide: https://cloud.google.com/docs/authentication/production

**OpenCV:**
- Documentation: https://docs.opencv.org/
- Python bindings: https://pypi.org/project/opencv-python-headless/

**Tesseract OCR:**
- GitHub: https://github.com/UB-Mannheim/tesseract/wiki
- Python wrapper: https://pypi.org/project/pytesseract/
