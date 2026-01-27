# 🚀 START PHI-4 BACKEND - QUICK GUIDE

## ✅ SYSTEM IS READY FOR PHI-4

All code has been converted from Meditron-7B to Phi-4. The backend is ready to run!

---

## 🎯 QUICK START (3 STEPS)

### Step 1: Verify Phi-4 Downloaded
```powershell
ollama list
```

You should see:
```
NAME          ID              SIZE
phi4          abcdef123456    14GB
```

**If Phi-4 is not listed**, download it first:
```powershell
ollama pull phi4
# Wait for download to complete (~5-10 minutes depending on internet)
```

---

### Step 2: Verify Configuration
The `.env` file already has the correct configuration:

```env
OLLAMA_MODEL=phi4  ✅ CORRECT
OLLAMA_URL=http://localhost:11434  ✅ CORRECT
```

No changes needed! ✅

---

### Step 3: Start Backend
```powershell
cd "d:\GitHub 2\SMA_Sanjeevani\backend"
python start.py
```

Expected output:
```
2026-01-27 14:30:45 - INFO - 🚀 FastAPI app starting...
2026-01-27 14:30:46 - INFO - 📊 Database connected
2026-01-27 14:30:47 - INFO - 🤖 LLM Provider: ollama
2026-01-27 14:30:47 - INFO - 📡 Ollama Model: phi4  ⭐ PHI-4 ACTIVE
2026-01-27 14:30:47 - INFO - ✅ All services initialized
```

---

## 🧪 TEST PHI-4 IS WORKING

### Test 1: API Status
```bash
curl http://localhost:8000/api/symptoms/status
```

Should return:
```json
{
  "status": "ok",
  "llm_provider": "ollama",
  "ollama_model": "phi4"
}
```

### Test 2: Phi-4 Direct Test
```bash
curl http://localhost:8000/api/symptoms/test-ollama
```

Should show:
```json
{
  "status": "success",
  "ollama_running": true,
  "model": "phi4",
  "raw_response": "..."
}
```

### Test 3: Upload Medicine Image (Frontend)
1. Open http://localhost:5174
2. Click "Upload Medicine"
3. Select a clear medicine image
4. Wait for Phi-4 analysis (20-60 seconds)
5. View 7 tabs with Phi-4 data

---

## 📊 WHAT CHANGED - MEDITRON → PHI-4

| Component | Before | After |
|-----------|--------|-------|
| LLM Model | Meditron-7B | Phi-4 (Microsoft) |
| Configuration | meditron | phi4 |
| Timeout | 45s | 60s |
| Memory | 3.8GB | ~14GB |
| Quality | Good | Excellent ⭐ |
| Response Time | 10-30s | 20-60s |

---

## 🎯 FEATURES NOW WITH PHI-4

✅ Medicine Identification (OCR → Phi-4 → 7 Tabs)
✅ Symptom Analysis (Symptoms → Phi-4 → Recommendations)
✅ Medical Q&A (Questions → Phi-4 → Answers)
✅ Prescription Management (Save Phi-4 data)
✅ Drug Interaction Checking (Phi-4 powered)
✅ Dosage Recommendations (Age-specific, pregnancy-safe)

---

## 🔑 FILES UPDATED FOR PHI-4

✅ `.env` - OLLAMA_MODEL=phi4
✅ `config.py` - LLM_MODEL="microsoft/phi-4"
✅ `medicine_llm_generator.py` - MODEL="phi4"
✅ `enhanced_medicine_llm_generator.py` - MODEL="phi4", TIMEOUT=60
✅ `medicine_ocr_service.py` - analyze_medicine_with_phi4()
✅ `symptoms_recommendation/service.py` - ollama_model="phi4"
✅ `symptoms_recommendation/router.py` - phi4 defaults ⬅️ JUST FIXED
✅ `routes_medicine_identification.py` - Phi-4 docs
✅ `routes_prescriptions.py` - Stores Phi-4 data
✅ And 4 more... (13+ files total)

---

## ⚠️ IMPORTANT

- **Phi-4 Size**: ~14GB RAM required
- **Response Time**: 20-60 seconds per medicine (normal)
- **Timeout**: 60 seconds (don't interrupt)
- **Quality**: Much better medical accuracy than Meditron

---

## 📞 TROUBLESHOOTING

### Issue: "phi4 model not found"
**Solution**: Run `ollama pull phi4`

### Issue: Backend won't start
**Solution**: Check if port 8000 is in use: `netstat -ano | findstr :8000`

### Issue: Phi-4 response is slow
**Solution**: Normal! Phi-4 is more powerful, needs more time. Wait up to 60 seconds.

### Issue: "Connection refused" to Ollama
**Solution**: Make sure Ollama is running: `ollama serve`

---

## ✅ READY TO GO!

All backend services are now using **Phi-4** for medical analysis!

**Start backend with**: `python start.py`

**Access frontend at**: http://localhost:5174

**Upload medicine image** → Phi-4 analyzes it → See professional medical information

🎊 **System is ready for Phi-4!**
