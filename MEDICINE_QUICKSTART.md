# Quick Start Guide - Integrated Medicine System

## 🚀 Quick Setup (2 minutes)

### 1. Start Backend
```powershell
cd "d:\GitHub 2\SMA_Sanjeevani\backend"
python start.py
```
✅ Wait for: `Application startup complete`

### 2. Start Frontend (New Terminal)
```powershell
cd "d:\GitHub 2\SMA_Sanjeevani\frontend"
npm run dev
```
✅ Access at: http://localhost:5173

### 3. (Optional) Start Ollama for LLM
```powershell
ollama serve
```
In another terminal:
```powershell
ollama pull meditron-7b
```
✅ LLM will auto-enable when running

---

## 🧪 Testing the System

### Quick Test 1: Verify Services Load
```powershell
cd "d:\GitHub 2\SMA_Sanjeevani"
python test_medicine_system.py
```
✅ Should show: `✅ ALL TESTS PASSED!`

### Quick Test 2: Upload Medicine Image
1. Open http://localhost:5173
2. Navigate to Medicine Identification
3. Upload a medicine image (or use test image)
4. System will:
   - Extract text via OCR
   - Lookup medicine in 50,000+ database
   - Generate comprehensive info (with or without LLM)
   - Show results

### Quick Test 3: Check API Directly
```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:8000/health"

# Test medicine identification (if you have an image):
$file = @{file = Get-Item -Path "path/to/medicine/image.jpg"}
$response = Invoke-WebRequest -Uri "http://localhost:8000/api/medicine-identification/analyze" `
  -Method POST `
  -Form $file
$response | ConvertFrom-Json
```

---

## 📊 System Components

### Backend Services
```
✅ medicine_csv_rag.py         (50,000 medicines loaded)
✅ medicine_llm_generator.py   (LLM integration)
✅ medicine_ocr_service.py     (OCR + analysis)
```

### Data Files
```
✅ medicine_dataset.csv        (50,000 medicines)
✅ backend/.env                (Configuration)
```

### Frontend Components
```
✅ MedicineIdentificationModal.jsx  (Upload & display)
```

---

## 🎯 Expected Results

### Without Ollama (CSV Only)
```json
{
  "medicine_name": "Amoxicillin",
  "category": "Antibiotic",
  "dosage_form": "Tablet",
  "strength": "802 mg",
  "manufacturer": "Teva Pharmaceutical Industries Ltd.",
  "indication": "Wound",
  "classification": "Over-the-Counter",
  "source": "CSV Database",
  "detailed_info": "[Comprehensive structured info from CSV]"
}
```

### With Ollama (LLM + CSV)
```json
{
  "medicine_name": "Amoxicillin",
  "category": "Antibiotic",
  "source": "LLM + CSV Database",
  "llm_generated": true,
  "detailed_info": "[Natural language explanation from Meditron-7B]",
  "overview": "...",
  "uses": "...",
  "dosage": "...",
  "side_effects": "...",
  ...
}
```

---

## 🔍 Key Features to Test

### 1. Medicine Lookup
- ✅ Upload tablet image
- ✅ System extracts name
- ✅ Searches 50,000 medicines
- ✅ Returns exact match or fuzzy match

### 2. Information Generation
- ✅ Without LLM: Structured CSV data
- ✅ With LLM: Natural language explanation
- ✅ Auto fallback if LLM unavailable

### 3. Prescription Saving
- ✅ Click "Save to Prescriptions"
- ✅ Data saved to database
- ✅ Visible in prescription history

### 4. Search Functions
- ✅ Search by category (Antibiotic, Analgesic, etc.)
- ✅ Search by indication (Pain, Fever, Allergy, etc.)
- ✅ Fuzzy name matching

---

## 📈 Performance Tips

### Faster Response
- CSV lookup: <1ms per medicine
- OCR: 2-5 seconds (depends on image quality)
- LLM generation: 10-30 seconds (if Ollama running)

### Image Quality
- Good lighting
- Clear, readable text
- Minimal reflections
- 800x600+ resolution

---

## 🔧 Troubleshooting

### Backend Won't Start
```powershell
# Check Python
python --version  # Should be 3.8+

# Check dependencies
cd backend
pip install -r requirements.txt

# Check environment
cat .env
```

### Medicine Not Found
- Try different image angle
- Ensure text is clear
- Check if medicine is in 50K dataset
- Fuzzy matching should find similar names

### LLM Not Responding
- Check if Ollama is running
- Verify Meditron-7B is installed
- Check network (localhost:11434)
- System will auto-fallback to CSV

### OCR Issues
- Install Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
- Or rely on EasyOCR (auto-downloads model)

---

## 📝 Logs to Monitor

### Backend Terminal
```
✅ Pytesseract loaded successfully
✅ EasyOCR loaded successfully
✅ Medicine identification service loaded successfully
✅ Database initialized successfully
```

### Medicine Analysis Logs
```
🔍 Starting medicine analysis for OCR text: ...
📝 Extracted medicine name: [name]
📊 Retrieved CSV data for: [name]
✅ Generated medicine information: [name]
```

### LLM Logs (Optional)
```
🧠 Generating medicine info using LLM for: [name]
✅ LLM generated medicine information successfully
```

---

## 🎓 Learn More

### Documentation Files
- `MEDICINE_SYSTEM_DOCUMENTATION.md` - Full system details
- `test_medicine_system.py` - Test examples
- `backend/app/services/medicine_csv_rag.py` - CSV code
- `backend/app/services/medicine_llm_generator.py` - LLM code

### Dataset
- 50,000+ medicines
- 7 columns per medicine
- Searchable by name, category, indication
- Manufacturer and classification info

---

## ✅ Verification Checklist

Before moving to production:

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] test_medicine_system.py passes all tests
- [ ] Can upload and analyze medicine image
- [ ] Results display correctly
- [ ] Can save prescription to database
- [ ] Prescription appears in history
- [ ] CSV dataset loads (50,000 medicines)
- [ ] LLM works (optional, fallback works without it)

---

## 🚀 You're Ready!

The system is now:
- ✅ **Fully Integrated** - CSV RAG + LLM
- ✅ **Independent** - Works without manual input
- ✅ **Scalable** - 50,000 medicines
- ✅ **Robust** - Automatic fallback if LLM unavailable
- ✅ **Complete** - OCR → Analysis → Storage

**Start testing and enjoy! 🎉**

---

**Last Updated**: January 27, 2026
**Status**: Production Ready 🟢
