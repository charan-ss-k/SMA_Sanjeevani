# Quick Testing Checklist ✅

## Pre-Test Setup

```bash
# Terminal 1: Backend
cd backend
python main.py

# Terminal 2: Frontend (new terminal)
cd frontend
npm run dev
```

## Quick Test (5 minutes)

### 1. Navigate to Chat ✓
- [ ] Open http://localhost:5173 in browser
- [ ] See green chat button at bottom-right
- [ ] Click to open chat window

### 2. Send Test Question ✓
- [ ] Type: `What medicine should I take for a headache?`
- [ ] Click send button or press Enter
- [ ] See typing indicator (bouncing dots)

### 3. Wait for Response ✓
- [ ] Wait 10-30 seconds
- [ ] Response appears (NOT error message)
- [ ] Response text is visible and readable

### 4. Check Professional Formatting ✓
- [ ] Bold section headings (green text)
- [ ] Bullet points (- or • symbols converted)
- [ ] Medication names highlighted (blue background)
- [ ] Clear paragraph spacing
- [ ] Warning/precautions section (if present)

### 5. Test TTS (Optional) ✓
- [ ] Check browser speaker volume
- [ ] Computer might speak the response
- [ ] Or Web Speech API voice plays automatically
- [ ] If no audio, that's OK - Web Speech fallback works

### 6. Check Backend Terminal ✓
Look for logs like:
```
✅ Medical QA response generated: XXXX chars
🎤 Generating speech for language: english
✅ TTS generated successfully
📤 Sending response: {answer: "..."}
```

**IMPORTANT**: Should NOT show:
```
500 Internal Server Error
```

## Quick Diagnostic

If response doesn't show:

**Step 1: Browser Console (F12)**
```
- Should see: [ChatWidget] Response data: {...}
- Should NOT see: red error messages
- May see: orange TTS warnings (normal)
```

**Step 2: Backend Terminal**
```
- Should see: "✅ Medical QA response generated"
- Should see: "📤 Sending response"
- Should NOT see: 500 Error
```

**Step 3: Network Tab (F12 → Network)**
```
- POST /api/medical-qa should return 200
- Response should have {"answer": "..."}
```

## Test Cases

### Test 1: Simple Question ✓
```
Q: How to treat fever?
Expected: Formatted response with medications, precautions
```

### Test 2: Long Question ✓
```
Q: Give me medicine prescription for fever and cough with other treatments
Expected: Detailed formatted response with multiple sections
```

### Test 3: Language (if supported) ✓
```
Q: Tell me about high blood pressure (change language in dropdown)
Expected: Response in selected language with formatting
```

## Formatting Verification

Your response should look like:

```
📋 MAIN POINTS
• Point 1: medication name (highlighted in blue)
• Point 2: description
• Point 3: important keyword (red bold)

⚠️ PRECAUTIONS:
Description of what to be careful about

Safety Disclaimer:
Yellow background box with disclaimer text
```

## Success Indicators

✅ Chat opens and closes
✅ Message sends successfully
✅ Response displays (no error)
✅ Formatting looks professional
✅ Backend logs show success
✅ No 500 errors in terminal
✅ TTS works (audio plays) or falls back gracefully

## If Something's Wrong

1. **Clear Browser Cache** (Ctrl+Shift+Delete)
2. **Restart Frontend** (Stop npm, run again)
3. **Restart Backend** (Stop python, run again)
4. **Check 3 Terminals**:
   - ✅ Backend running (`http://0.0.0.0:8000`)
   - ✅ Frontend running (`http://localhost:5173`)
   - ✅ No red errors in either terminal

## Time Estimate

- Chat opening: <1 second
- Message sending: Instant
- Response generation: 10-30 seconds (LLM processing)
- Total test: ~5-10 minutes

---

**Ready?** Start backend, start frontend, test chatbot! 🚀
