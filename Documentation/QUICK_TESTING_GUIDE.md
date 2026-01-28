# Quick Testing Guide - Immediate Tests You Can Run

## 🚀 Quick Start (5-10 minutes)

### Step 1: Restart Backend Service
```bash
# Navigate to backend directory
cd backend

# Stop current service (if running)
Ctrl+C

# Start fresh
python start.py
```

Check backend output:
```
✅ Should see: "Meditron app starting..."
✅ Should see: "Uvicorn running on http://localhost:8000"
```

### Step 2: Restart Frontend
```bash
# In frontend directory
npm start

# Or if running in production mode
npm run build
npm run serve
```

---

## 🧪 Test 1: Medicine Recommendation Accuracy (5 min)

### Test with COUGH Symptoms:
1. Open application
2. Fill symptom form:
   - Age: Any (e.g., 30)
   - Gender: Any
   - **Symptoms**: Select only "Cough"
   - Allergies: None
   - Conditions: None
   
3. Click "Get Recommendations"

**Expected Result**:
```
Condition: "Cough" (not "Common illness")
Recommended Medicines:
  - Cough Syrup (Dextromethorphan)  ← NOT Paracetamol!
  - Throat Lozenges with benzocaine
Home Advice: Rest, hydration, avoid irritants
```

**If you see "Paracetamol" as the ONLY medicine**: 
- Check backend logs for errors
- Restart Meditron-7B: Check it's running

---

### Test with DIARRHEA Symptoms:
1. Fill form with:
   - **Symptoms**: Select "Diarrhea" or "Loose stools"
   - Other fields: Any values

2. Click "Get Recommendations"

**Expected Result**:
```
Condition: "Diarrhea"
Recommended Medicines:
  - Oral Rehydration Salts (ORS)  ← Specific for diarrhea!
  - Loperamide 2mg
NOT: Paracetamol
```

---

### Test with STOMACH PAIN:
1. Fill form with:
   - **Symptoms**: Select "Stomach pain" or "Acidity"

2. Click "Get Recommendations"

**Expected Result**:
```
Condition: "Acidity/Heartburn" (or "Stomach Pain")
Recommended Medicines:
  - Antacid (Magnesium Hydroxide)
  - Omeprazole 20mg
NOT: Paracetamol
```

---

### Test with MIXED Symptoms:
1. Fill form with:
   - **Symptoms**: Select BOTH "Fever" AND "Cough"

2. Click "Get Recommendations"

**Expected Result**:
```
Condition: Related to both fever and cough
Recommended Medicines:
  - Paracetamol 500mg (for fever - appropriate here)
  - Cough Syrup (for cough)
Both medicines address the reported symptoms
```

---

## 🔊 Test 2: TTS Sequential Playback (3 min)

### Normal Playback Test:
1. Complete a symptom recommendation (from Test 1)
2. **Listen carefully** to the TTS output

**Expected Audio Sequence**:
```
1. "Processing your symptoms..." 
   [Complete message, clear audio]
   
2. [300ms silence/gap]

3. "Analysis complete"
   [Complete message, clear audio]
   
4. [300ms silence/gap]

5. Full recommendation text (one clear voice)
   [All medicines listed clearly]
   
NOT EXPECTED:
   - Multiple voices at same time
   - Garbled audio
   - Overlapping messages
   - Incomplete sentences
```

### Queue Test (Technical):
1. Open browser developer console: F12
2. Go to Console tab
3. Complete a symptom check
4. **Observe console messages**:

```
Expected Console Output:
📝 TTS queued: "Processing..." (Queue length: 1)
🔊 Processing TTS: "Processing..." (0 remaining)
✅ TTS completed: "Processing..."
📝 TTS queued: "Analysis..." (Queue length: 1)
🔊 Processing TTS: "Analysis..." (0 remaining)
✅ TTS completed: "Analysis..."
📝 TTS queued: "Your medicines..." (Queue length: 1)
🔊 Processing TTS: "Your medicines..." (0 remaining)
✅ TTS completed: "Your medicines..."
```

This shows sequential processing (no overlapping).

---

## 🧪 Test 3: Language Support (2 min)

### Test Different Languages:
1. Change language dropdown to **Hindi**
2. Fill symptom form with any symptoms
3. Click "Get Recommendations"
4. **Listen to TTS output** in Hindi

**Expected**:
- Medicine recommendation in Hindi ✓
- Clear, sequential TTS audio ✓
- NO overlapping voices ✓

**Repeat for**: Telugu, Marathi, Tamil, etc.

---

## 🔧 Test 4: Error Handling (2 min)

### Stop Meditron-7B (Simulate LLM Failure):
1. Stop the Ollama service or Meditron-7B
2. Try to get a recommendation
3. **Expected Behavior**:
   - Backend uses intelligent fallback
   - Still recommends symptom-specific medicines (not just Paracetamol)
   - Response arrives (may be slower)
   - TTS still plays sequentially

---

## 📊 Expected Improvements Summary

| Issue | Before | After |
|-------|--------|-------|
| **Fever symptoms** | Paracetamol | Paracetamol + appropriate medicine |
| **Cough symptoms** | Paracetamol | Cough Syrup + Throat Lozenges |
| **Diarrhea** | Paracetamol | ORS + Loperamide |
| **TTS playback** | Overlapping voices | Sequential, clear audio |
| **TTS timing** | Unpredictable | Consistent 300ms gaps |

---

## 🆘 Troubleshooting

### ❌ Still Getting Only Paracetamol?
```bash
# Check if Meditron-7B is running:
# Windows PowerShell:
curl http://localhost:11434/api/tags

# Should return: {"models":[...Meditron...]}
```

**If not running**:
```bash
# Start Ollama and Meditron-7B
ollama run meditron
```

**If still not working**:
- Clear backend cache: Delete `backend/__pycache__`
- Restart backend: `python start.py`
- Restart frontend: `npm start`

### ❌ TTS Still Overlapping?
```javascript
// In browser console (F12):
console.log(ttsQueue);  // Should be empty
console.log(ttsPlaying); // Should be false

// Try clearing everything:
window.location.reload();  // Refresh page
```

**If still overlapping**:
- Check that SymptomChecker.jsx has `await` keyword before playTTS()
- Verify tts.js is version with queue system
- Clear browser cache: Ctrl+Shift+Delete

### ❌ No TTS Audio at All?
```javascript
// In console:
window.speechSynthesis.getVoices();  // Check Web Speech voices available
```

**Fallback working**? Check:
1. Volume is not muted
2. Browser speaker icon enabled
3. System volume is on
4. Try different browser (Chrome, Firefox, Edge)

---

## ✅ Final Verification

After running all tests, you should have:

- [ ] **Paracetamol Fix**: ✓ Different symptoms get different medicines
- [ ] **TTS Fix**: ✓ Clear, sequential audio without overlapping
- [ ] **Multiple Languages**: ✓ Works in multiple Indian languages
- [ ] **Error Handling**: ✓ Graceful fallback when Meditron unavailable
- [ ] **No Errors**: ✓ Console shows no errors/warnings

---

## 🎯 Success Indicators

When both fixes are working:

1. **Medicine recommendations** change based on symptoms ✓
2. **TTS sounds clear** - you can understand everything ✓
3. **No voice conflicts** - only one voice plays at a time ✓
4. **Messages complete** - don't cut off mid-sentence ✓
5. **All languages work** smoothly ✓

If you see all these, you're good to go! 🚀
