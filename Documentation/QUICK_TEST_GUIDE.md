# Quick Testing Guide - Sanjeevani Phi-3.5 Integration

## 🚀 Quick Start (3 Steps)

### Step 1: Start Ollama (Terminal 1)
```bash
ollama serve
```
**Expected Output**:
```
Ollama is running on 127.0.0.1:11434
```

### Step 2: Verify Phi-3.5 is Installed
```bash
ollama list
```
**Expected Output**:
```
phi3.5    latest    3.8 GB    ...
```

If Phi-3.5 is not installed:
```bash
ollama pull phi3.5
```

### Step 3: Start Backend (Terminal 2)
```bash
cd backend
python main.py
```
**Expected Output**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### Step 4: Start Frontend (Terminal 3)
```bash
cd frontend
npm run dev
```
**Expected Output**:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## ✅ Test Cases

### Test 1: Backend Status Check
**URL**: http://127.0.0.1:8000/api/symptoms/status

**What to Expect**:
```json
{
  "status": "ok",
  "llm_provider": "ollama",
  "ollama_model": "phi3.5",
  "note": "If llm_provider is 'mock', change LLM_PROVIDER=ollama in .env file"
}
```

### Test 2: Test Ollama Connection
**URL**: http://127.0.0.1:8000/api/symptoms/test-ollama

**Expected Response**:
```json
{
  "status": "success",
  "ollama_running": true,
  "model": "phi3.5",
  "raw_response": "[Phi-3.5 generated response...]"
}
```

### Test 3: Chatbot Medical Q&A (Most Important)
**URL**: http://localhost:5173
1. Click the chat bubble (bottom right)
2. Type: "What are the symptoms of diabetes?"
3. Should see Phi-3.5 response (not error)

**Expected in Browser**:
```
Bot: "Diabetes is a metabolic disorder... [actual response]"
```

**If Broken** (Error message):
```
⚠️ I encountered an error while processing your question...
```

**Check Backend Logs for**:
- `MEDICAL Q&A: What are the symptoms of diabetes?`
- `✓ Phi-3.5 response received`
- Should NOT show `Neural-Chat` or `Mistral`

### Test 4: Medical Recommendation
**URL**: http://localhost:5173
1. Click "Dashboard" in navbar
2. Select symptoms: "headache", "fever"
3. Select age 28, gender "male"
4. Click "Get Recommendation"

**Expected Output**:
```
Predicted Condition: Common Viral Infection
Recommended Medicines:
- Ibuprofen: 400mg, take every 6 hours
Home Care Advice: Rest well and stay hydrated
```

### Test 5: Text-to-Speech
**After completing Test 3 or 4**:
1. Listen for audio playing automatically
2. Chatbot response should be read aloud
3. Check browser DevTools (F12) > Console for errors

**First TTS Call**: Takes 10-15 seconds (Coqui initialization)
**Subsequent Calls**: 2-5 seconds

### Test 6: Language Switching
1. Click language selector (top Navbar)
2. Select "Telugu" or "Hindi"
3. Ask chatbot: "చీకటి అంటే ఏమిటి?" (Telugu for "What is fever?")
4. Should get response in English (model default)
5. TTS should attempt to speak in selected language

---

## 🔍 Debug Checklist

### Backend Won't Start?
```bash
# Check Python version
python --version  # Should be 3.10+

# Check dependencies
pip list | grep fastapi

# Check .env exists
cat backend/.env
```

**Expected .env**:
```
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=phi3.5
LLM_TEMPERATURE=0.3
LOG_LEVEL=DEBUG
BACKEND_PORT=8000
```

### Ollama Connection Error?
```bash
# Check if Ollama is running
Get-Process ollama  # (Windows)
ps aux | grep ollama  # (Linux/Mac)

# Test Ollama directly
curl http://localhost:11434/api/models
```

**Expected Response**: JSON with list of models

### Chatbot Shows Error?
**Check Terminal 2 (Backend) for logs**:
```
✓ GOOD: "*** CALLING PHI-3.5 VIA OLLAMA ***"
✓ GOOD: "✓ Phi-3.5 response received"
✗ BAD: Any "Neural-Chat" references
✗ BAD: "Cannot parse JSON" errors
```

**If you see bad logs**, the model response format is wrong.

### No Audio Output?
1. Check browser volume
2. Check browser permissions (DevTools > Application > Permissions)
3. Look for TTS errors in backend logs:
   ```
   "Generating speech for language: english"
   "✓ Audio generated successfully"
   ```
4. First TTS call takes 10-15 seconds, give it time

---

## 📊 Performance Expectations

### Response Times
- Status check: < 100ms
- Ollama connectivity test: 2-5 seconds
- Medical Q&A: 2-5 seconds
- Medicine recommendation: 2-5 seconds
- TTS generation:
  - First call: 10-15 seconds (Coqui initialization)
  - Subsequent: 2-5 seconds

### System Requirements
- RAM: 2GB minimum (1GB for Ollama + 1GB for Python)
- CPU: Any modern processor
- Network: Localhost only (no external calls)

---

## 🎯 What Each Test Tells You

| Test | What It Tests | If It Fails |
|------|---------------|-----------|
| Status endpoint | Backend running | Backend crashed |
| Ollama test | Ollama connectivity | Ollama not running |
| Chatbot Q&A | Phi-3.5 + API integration | LLM not responding |
| Medicine rec | JSON parsing | JSON format wrong |
| TTS | Audio generation | Coqui not initializing |
| Language switch | Multilingual support | Language not supported |

---

## 🔧 Common Issues & Fixes

### Issue: "Cannot connect to LLM service"
**Cause**: Ollama not running
**Fix**: Run `ollama serve` in Terminal 1

### Issue: "Phi-3.5 did not return valid JSON"
**Cause**: LLM returned non-JSON for recommendation endpoint
**Fix**: Model may be overloaded, wait and retry

### Issue: Chatbot stuck "typing" forever
**Cause**: Ollama request timed out
**Fix**: Check Ollama is running; may be too slow on your system

### Issue: TTS audio not playing
**Cause**: Browser permission or audio element issue
**Fix**: Check browser console (F12) for errors; wait 10-15s for first init

### Issue: Nothing shows in logs
**Cause**: LOG_LEVEL not set to DEBUG
**Fix**: Add `LOG_LEVEL=DEBUG` to `.env` and restart backend

---

## 📋 Full Test Scenario

**Time**: ~2 minutes per full test cycle

```
1. Start Ollama (Terminal 1)
   Wait for: "Ollama is running on 127.0.0.1:11434"

2. Start Backend (Terminal 2)
   Wait for: "Application startup complete"

3. Start Frontend (Terminal 3)
   Wait for: "VITE ready"

4. Open http://localhost:5173
   Check: Page loads without blank white screen

5. Click ChatWidget
   Check: Can see chat interface

6. Type: "What is aspirin?"
   Check: Get response (not error)
   Check: Backend shows "✓ Phi-3.5 response received"
   Check: After response, hear audio (may take 10-15s)

7. Try another question in different language
   Type: Ask in multiple languages
   Check: Gets response (language support)

8. Navigate to Dashboard
   Check: Page loads properly

9. Enter symptoms and get recommendation
   Check: Get JSON response with medicines

✅ ALL TESTS PASS = System ready for production
```

---

## 📞 Support / Debugging

### Check Backend Logs for Key Phrases
```bash
# Look for these patterns in Terminal 2 output

✓ "*** CALLING PHI-3.5 VIA OLLAMA ***"    # Good - model initialized
✓ "Phi-3.5 response received"             # Good - got response
✓ "✓ Phi-3.5 response received"           # Good - parsing successful

✗ "Neural-Chat" or "Mistral"              # Bad - wrong model
✗ "Cannot connect to LLM"                 # Bad - Ollama not running
✗ "Timeout"                               # Bad - LLM too slow
```

### Enable More Debugging
In `.env`:
```
LOG_LEVEL=DEBUG
```

In browser DevTools (F12):
```javascript
// Check network requests
Open DevTools > Network tab
Make request > Look for /api/medical-qa
Check Response body
```

---

## ✨ Success Criteria

**You know everything works when**:

✅ Backend starts without errors
✅ Frontend loads (no blank page)
✅ Chatbot responds to questions (not error)
✅ Backend logs show "PHI-3.5" (not Neural-Chat or Mistral)
✅ Medical recommendations return JSON
✅ TTS audio plays after responses
✅ Language switching works
✅ All responses are fast (2-5 seconds)

---

## Next Steps After Testing

Once all tests pass:

1. **Monitor Performance**
   - Measure actual response times
   - Check error rates
   - Monitor memory usage

2. **Scale Testing**
   - Test with multiple concurrent users
   - Test with rapid-fire requests
   - Test error scenarios

3. **Production Deployment**
   - Deploy backend to server
   - Configure CORS for production domain
   - Set up monitoring/logging
   - Backup Phi-3.5 model

4. **User Acceptance Testing**
   - Real medical questions from domain experts
   - Verify accuracy of recommendations
   - Gather user feedback

---

**Ready to test? Start with `ollama serve` in Terminal 1! 🚀**

