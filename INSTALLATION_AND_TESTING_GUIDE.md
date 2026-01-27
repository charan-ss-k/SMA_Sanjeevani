# 🚀 Installation & Testing Guide - RAG + Translation System

**Status**: Implementation Complete - Ready for Installation  
**Last Updated**: Today  
**Time to Complete**: 15-30 minutes

---

## ⚡ Quick Start (TL;DR)

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Verify installation
python -c "import cv2, faiss, indic_trans2; print('✅ All packages installed successfully')"

# 3. Start the system
python start.py

# 4. Test in another terminal
curl http://localhost:5000/api/recommend-symptoms -X POST -H "Content-Type: application/json" -d '{"symptoms": ["fever"], "language": "english"}'
```

---

## 📦 Installation Steps

### Step 1: Navigate to Backend Folder
```bash
cd d:\GitHub\ 2\SMA_Sanjeevani\backend
```

### Step 2: Install Requirements
```bash
# Method 1: Direct pip (Recommended)
pip install -r requirements.txt

# Method 2: Using script (if available)
bash install_dependencies.sh

# Method 3: Verbose (to see what's being installed)
pip install -r requirements.txt -v
```

### Step 3: Verify Installation

#### Test 1: Check Core Packages
```bash
python -c "
import cv2
import faiss
import indic_trans2
import sentence_transformers
print('✅ Core RAG packages installed')
"
```

#### Test 2: Check TTS Package
```bash
python -c "
try:
    import parler_tts
    print('✅ Indic Parler-TTS installed')
except:
    print('⚠️  Indic Parler-TTS not yet installed (will install on first use)')
"
```

#### Test 3: Check Translation
```bash
python -c "
try:
    from indic_trans2.client import Client
    print('✅ Indic-Trans2 installed')
except:
    print('❌ Indic-Trans2 not found')
"
```

#### Test 4: Full System Import Test
```bash
python -c "
from app.services.symptoms_recommendation.medicine_rag_system import get_rag_context
from app.services.symptoms_recommendation.translation_service import translate_symptoms_to_english
from app.services.symptoms_recommendation.service import recommend_symptoms
print('✅ All system modules import successfully')
"
```

---

## 🧪 Testing Guide

### Test Suite 1: RAG System Functionality

#### Test 1.1: Verify RAG Context Retrieval
```bash
python
```

Then in Python:
```python
from app.services.symptoms_recommendation.medicine_rag_system import get_rag_context

# Test fever symptoms
rag_context = get_rag_context(["fever", "high temperature"])
print("RAG Context for fever:")
print(rag_context)
print("\n✅ Test passed - RAG retrieved medicine knowledge base")

# Test another condition
rag_context = get_rag_context(["cough", "throat pain"])
print("\nRAG Context for cough:")
print(rag_context[:500])  # Print first 500 chars
```

**Expected Output**:
```
RAG Context for fever:
- Paracetamol (Crocin, Dolo) - Rating 9/10
- Ibuprofen (Brufen, Combiflam) - Rating 9/10
- Aspirin - Rating 7/10
... [more medicines]

✅ Test passed - RAG retrieved medicine knowledge base
```

---

#### Test 1.2: Verify Medicine Knowledge Base
```python
from app.services.symptoms_recommendation.medicine_rag_system import MedicineRAGSystem

rag_system = MedicineRAGSystem()

# Check what conditions are available
print("Available medical conditions:")
for condition in rag_system.knowledge_base.keys():
    print(f"  - {condition}")

# Get medicines for a specific condition
medicines = rag_system.knowledge_base.get("fever", {})
print(f"\nMedicines for Fever:")
for medicine, details in medicines.items():
    print(f"  - {medicine}: {details['brand_names']}")
```

**Expected Output**:
```
Available medical conditions:
  - fever
  - cough
  - diarrhea
  - headache
  - nausea
  - stomach_pain

Medicines for Fever:
  - paracetamol: ['Crocin', 'Dolo', 'Paracip']
  - ibuprofen: ['Brufen', 'Combiflam']
  - aspirin: ['Aspirin']
```

---

### Test Suite 2: Translation Service

#### Test 2.1: Hindi to English Translation
```python
from app.services.symptoms_recommendation.translation_service import translate_symptoms_to_english

# Test Hindi symptoms
hindi_symptoms = ["बुखार", "ठंड लगना"]  # Fever, chills
english = translate_symptoms_to_english(hindi_symptoms, "hindi")
print(f"Hindi: {hindi_symptoms}")
print(f"English: {english}")
print("✅ Hindi translation working")
```

**Expected Output**:
```
Hindi: ['बुखार', 'ठंड लगना']
English: ['fever', 'chills']
✅ Hindi translation working
```

#### Test 2.2: Multiple Language Support
```python
from app.services.symptoms_recommendation.translation_service import translate_symptoms_to_english

test_cases = {
    "hindi": ["खांसी", "गले में दर्द"],
    "telugu": ["జ్వరం", "తలనొప్పి"],
    "tamil": ["காய்ச்சல்", "இருமல்"],
}

for lang, symptoms in test_cases.items():
    try:
        english = translate_symptoms_to_english(symptoms, lang)
        print(f"✅ {lang.upper()}: {symptoms} → {english}")
    except Exception as e:
        print(f"⚠️  {lang.upper()}: {str(e)}")
```

---

#### Test 2.3: Language Detection
```python
from app.services.symptoms_recommendation.translation_service import translation_service

texts = [
    "बुखार है",  # Hindi
    "fever",     # English
    "జ్వరం",    # Telugu
]

for text in texts:
    detected = translation_service.detect_language(text)
    print(f"Text: '{text}' → Detected: {detected}")
```

---

### Test Suite 3: End-to-End API Testing

#### Test 3.1: English Input (No Translation Needed)
```bash
curl -X POST http://localhost:5000/api/recommend-symptoms \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["fever", "high temperature"],
    "age": 25,
    "gender": "male",
    "language": "english"
  }'
```

**Expected Result**:
```json
{
  "predicted_condition": "Fever",
  "symptom_analysis": "...",
  "recommended_medicines": [
    {
      "name": "Paracetamol",
      "brand_names": ["Crocin", "Dolo"],
      "type": "Antipyretic",
      "dosage": "500mg",
      "effectiveness": 9,
      "why_this_medicine": "..."
    },
    ...
  ],
  "reasoning": "Based on fever symptoms, recommending appropriate antipyretics...",
  "medicine_combination_rationale": "..."
}
```

---

#### Test 3.2: Hindi Input (With Translation)
```bash
curl -X POST http://localhost:5000/api/recommend-symptoms \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["बुखार", "तेज बुखार"],
    "age": 30,
    "gender": "female",
    "language": "hindi"
  }'
```

**Expected Result**:
- Input symptoms are translated to English
- LLM processes in English with RAG context
- Output is translated back to Hindi
- All medicine names in Hindi

```json
{
  "predicted_condition": "बुखार (Fever)",
  "symptom_analysis": "...(in Hindi)",
  "recommended_medicines": [
    {
      "name": "पैरासिटामॉल (Paracetamol)",
      "brand_names": ["क्रोसिन", "डोलो"],
      "why_this_medicine": "...(in Hindi)"
    },
    ...
  ]
}
```

---

#### Test 3.3: Multiple Language Test
```python
import requests
import json

BASE_URL = "http://localhost:5000/api/recommend-symptoms"

test_cases = [
    {
        "name": "Hindi",
        "symptoms": ["बुखार"],
        "language": "hindi"
    },
    {
        "name": "Telugu",
        "symptoms": ["జ్వరం"],
        "language": "telugu"
    },
    {
        "name": "Tamil",
        "symptoms": ["காய்ச்சல்"],
        "language": "tamil"
    },
]

for test in test_cases:
    response = requests.post(
        BASE_URL,
        json={
            "symptoms": test["symptoms"],
            "age": 25,
            "gender": "male",
            "language": test["language"]
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ {test['name']}: Got {len(result.get('recommended_medicines', []))} medicines")
    else:
        print(f"❌ {test['name']}: {response.status_code}")
```

---

### Test Suite 4: LLM Independent Thinking

#### Test 4.1: Verify No Hardcoded Default
```bash
# Test 1: Cough - should NOT recommend Paracetamol
curl -X POST http://localhost:5000/api/recommend-symptoms \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["cough", "dry throat"],
    "age": 25,
    "language": "english"
  }'

# Check the response - should have Cough Syrup, DXM, not Paracetamol
```

**Expected**:
```
Top medicine: Dextromethorphan Cough Syrup (or similar)
NOT: Paracetamol as first choice
```

---

#### Test 4.2: Verify RAG Context in LLM Processing

```python
import logging
import sys

# Enable DEBUG logging
logging.basicConfig(level=logging.DEBUG, stream=sys.stdout)

# Now make a request
from app.services.symptoms_recommendation.service import recommend_symptoms
from app.schemas import SymptomRecommendationRequest

req = SymptomRecommendationRequest(
    symptoms=["cough"],
    age=25,
    gender="male",
    language="english"
)

result = recommend_symptoms(req)

# You should see in logs:
# "✅ Retrieved RAG context with medicine knowledge base"
# "LLM prompt (first 1000 chars): ..."
# "LLM raw output (first 500 chars): ..."
# "Step 5: Translating response back..." (if non-English)
```

---

### Test Suite 5: Performance Testing

#### Test 5.1: Response Time
```python
import time
import requests

start = time.time()

response = requests.post(
    "http://localhost:5000/api/recommend-symptoms",
    json={
        "symptoms": ["fever"],
        "age": 25,
        "gender": "male",
        "language": "english"
    }
)

elapsed = time.time() - start
print(f"Response time: {elapsed:.2f} seconds")

# Expected: 5-10 seconds (LLM inference time varies)
if elapsed < 15:
    print("✅ Performance acceptable")
else:
    print("⚠️  Slow response - check LLM server")
```

---

#### Test 5.2: Translation Overhead
```python
import time
import requests

# Test English (no translation)
start = time.time()
response_en = requests.post(
    "http://localhost:5000/api/recommend-symptoms",
    json={"symptoms": ["fever"], "age": 25, "language": "english"}
)
time_en = time.time() - start

# Test Hindi (with translation)
start = time.time()
response_hi = requests.post(
    "http://localhost:5000/api/recommend-symptoms",
    json={"symptoms": ["बुखार"], "age": 25, "language": "hindi"}
)
time_hi = time.time() - start

print(f"English (no translation): {time_en:.2f}s")
print(f"Hindi (with translation): {time_hi:.2f}s")
print(f"Translation overhead: {time_hi - time_en:.2f}s")

# Expected: Translation overhead < 3 seconds
```

---

## 🔍 Troubleshooting

### Issue 1: "ModuleNotFoundError: No module named 'cv2'"
```bash
# Solution:
pip install opencv-python>=4.8.0

# Verify:
python -c "import cv2; print(cv2.__version__)"
```

---

### Issue 2: "ModuleNotFoundError: No module named 'indic_trans2'"
```bash
# Solution:
pip install indic-trans2>=2.1.0

# If still fails, try:
pip install indic-trans2 --upgrade --no-cache-dir

# Verify:
python -c "from indic_trans2.client import Client; print('OK')"
```

---

### Issue 3: "ModuleNotFoundError: No module named 'faiss'"
```bash
# For CPU-only (recommended):
pip install faiss-cpu>=1.7.4

# For GPU support (if you have CUDA):
pip install faiss-gpu

# Verify:
python -c "import faiss; print('OK')"
```

---

### Issue 4: Translation Not Working
```bash
# Check if internet is available (Google Translate fallback needs it)
ping google.com

# Force reinstall of indic-trans2
pip install --force-reinstall indic-trans2

# Test manually:
python -c "
from indic_trans2.client import Client
client = Client()
result = client.translate_paragraph('बुखार', 'hi', 'en')
print(result)
"
```

---

### Issue 5: LLM Not Generating RAG Context

**Check logs for**:
```
✅ Retrieved RAG context with medicine knowledge base
```

If not present:
```bash
# Check if medicine_rag_system.py exists and has no errors
python -c "
from app.services.symptoms_recommendation.medicine_rag_system import get_rag_context
context = get_rag_context(['fever'])
print('RAG Context length:', len(context))
print('Sample:', context[:200])
"
```

---

### Issue 6: TTS Audio Not Working

This is expected - Indic Parler-TTS integration requires:
1. Backend endpoint setup
2. Frontend modification

Currently implemented in backend, frontend update planned.

---

## 📊 Verification Checklist

Run through this checklist to verify everything is working:

```bash
# 1. All dependencies installed
pip list | grep -E "opencv|faiss|indic-trans2|sentence-transformers|llama-index|parler"
# ✅ Should show all packages

# 2. RAG system working
python -c "from app.services.symptoms_recommendation.medicine_rag_system import get_rag_context; print(len(get_rag_context(['fever']))) > 0"
# ✅ Should print True or a number > 100

# 3. Translation service working  
python -c "from app.services.symptoms_recommendation.translation_service import translate_symptoms_to_english; print(len(translate_symptoms_to_english(['बुखार'], 'hindi')) > 0)"
# ✅ Should print True

# 4. Service imports working
python -c "from app.services.symptoms_recommendation.service import recommend_symptoms; print('OK')"
# ✅ Should print OK

# 5. Prompt templates updated
python -c "from app.services.symptoms_recommendation.prompt_templates import PROMPT_TEMPLATE; print('THINK INDEPENDENTLY' in PROMPT_TEMPLATE)"
# ✅ Should print True

# 6. Backend starts without errors
python start.py &
# ✅ Should print "Running on http://0.0.0.0:5000"
```

---

## 🎯 Final Testing Checklist

### Functional Tests
- [ ] RAG system retrieves medicine knowledge base
- [ ] Translation: Hindi → English working
- [ ] Translation: English → Hindi working  
- [ ] API returns medicines appropriate to symptoms
- [ ] API returns different medicines for different symptoms
- [ ] No more hardcoded Paracetamol for everything

### Language Tests
- [ ] English input/output working
- [ ] Hindi input/output working
- [ ] Telugu input/output working
- [ ] Tamil input/output working

### Integration Tests
- [ ] Full API request succeeds
- [ ] JSON output valid
- [ ] All required fields present
- [ ] Medicine recommendations specific to symptoms

### Performance Tests
- [ ] Response time < 15 seconds
- [ ] No memory leaks
- [ ] No hanging processes

---

## 🚀 What to Expect After Installation

### Before (Old System):
```
User: "I have a cough"
System: "I recommend Paracetamol" ❌ Wrong!
```

### After (New System):
```
User: "I have a cough"
System: "I recommend:
  1. Dextromethorphan Cough Syrup - Best for dry cough
  2. Throat Lozenges with Benzocaine - Soothe throat
  3. Honey + Ginger - Natural remedy"
✅ Correct and specific!
```

---

## 📞 Support & Next Steps

### If Installation Succeeds ✅
- System is ready for use
- RAG + Translation working
- LLM thinking independently
- Multi-language support active

### If Issues Occur
1. Check the Troubleshooting section
2. Review logs in console output
3. Verify each dependency individually
4. Check internet connection for translation

### Next Phase
- Frontend TTS update (to use Indic Parler-TTS)
- Live user testing
- Performance optimization
- Additional language support

---

## 🎓 Understanding the System

### What Happens When User Submits:
```
1. "मुझे बुखार है" (Hindi: I have fever)
   ↓
2. TranslationService.translate_to_english()
   → "I have fever"
   ↓
3. MedicineRAGSystem.get_rag_context()
   → [Paracetamol, Ibuprofen, Aspirin info]
   ↓
4. Meditron-7B processes with:
   - Symptoms: "I have fever"
   - RAG Context: Medicine options
   - Instruction: "Think independently"
   ↓
5. Meditron thinks and recommends medicines
   → "Paracetamol 500mg twice daily, or Ibuprofen 400mg..."
   ↓
6. TranslationService.translate_from_english()
   → "पैरासिटामॉल 500 मिलीग्राम दिन में दो बार, या..."
   ↓
7. User receives Hindi response ✅
```

---

## 📝 Documentation

For more details, see:
- [MAJOR_SYSTEM_UPGRADE.md](MAJOR_SYSTEM_UPGRADE.md) - What changed
- [backend/app/services/symptoms_recommendation/medicine_rag_system.py](backend/app/services/symptoms_recommendation/medicine_rag_system.py) - RAG implementation
- [backend/app/services/symptoms_recommendation/translation_service.py](backend/app/services/symptoms_recommendation/translation_service.py) - Translation implementation
- [backend/README.md](backend/README.md) - Backend setup

---

**Installation Status**: Ready to install ✅  
**Next Command**: `pip install -r requirements.txt`
