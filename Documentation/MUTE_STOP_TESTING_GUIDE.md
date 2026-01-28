# Mute & Stop Testing - Quick Start Guide 🧪

## 60-Second Test

### Step 1: Start Servers
```bash
# Terminal 1: Backend
cd backend
python main.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Step 2: Open Chatbot
- Go to http://localhost:5173
- Click green chat button (bottom right)

### Step 3: Test Mute
1. Type: `What is a fever?`
2. Send and wait for response (15-30 sec)
3. See response and hear audio (if TTS works)
4. **Click gray button 🔊** (mute)
   - ✅ Button turns red 🔇
   - ✅ Audio stops
5. Type: `What causes cold?`
6. Send and wait
7. See response but NO audio ✓

### Step 4: Test Stop
1. Type: `Describe all symptoms of diabetes with detailed explanation`
2. Send
3. **While it's processing (bouncing dots):**
   - See orange button ⏹️
   - **Click orange button**
   - ✅ Request stops immediately
   - ✅ Shows "⏹️ Request stopped"
   - ✅ Input re-enabled

### Step 5: Verify Console Logs
1. Press F12 (DevTools)
2. Go to Console tab
3. Should see:
   ```
   [ChatWidget] TTS muted
   [ChatWidget] Request stopped by user
   ```

**✅ Done!** Both features working!

---

## Detailed Test Suite

### Test 1: Mute Functionality (3 minutes)

#### Test 1A: Toggle Mute On
```
Steps:
1. Open chatbot
2. Ask: "What is a headache?"
3. Wait for response
4. Click mute button 🔊
   Expected: Button turns red 🔇, audio stops
Result: PASS / FAIL
```

#### Test 1B: Ask While Muted
```
Steps:
1. (From Test 1A, still muted)
2. Ask: "Describe fever treatment"
3. Wait for response
4. Response shows in text
   Expected: NO audio plays
Result: PASS / FAIL
```

#### Test 1C: Toggle Mute Off
```
Steps:
1. (From Test 1B, still muted)
2. Click mute button 🔇
   Expected: Button turns gray 🔊
3. Ask: "What are vitamins?"
4. Wait for response
   Expected: Audio plays normally
Result: PASS / FAIL
```

### Test 2: Stop Functionality (3 minutes)

#### Test 2A: Stop During Processing
```
Steps:
1. Open chatbot
2. Ask: "Describe all symptoms of all types of arthritis"
3. **Immediately after sending:**
   See bouncing dots and orange ⏹️ button
4. Click orange ⏹️ button
   Expected: 
   - Request stops
   - Message shows: "⏹️ Request stopped"
   - Input re-enabled
Result: PASS / FAIL
```

#### Test 2B: Continue After Stop
```
Steps:
1. (From Test 2A, just stopped a request)
2. Ask: "What is arthritis?"
3. Wait normally for response
   Expected: Works normally, full response
Result: PASS / FAIL
```

#### Test 2C: Stop With Speech Playing
```
Steps:
1. Ask: "What is blood pressure?"
2. Wait for response + audio to start
3. **While audio is playing:**
   Click orange ⏹️ button
   Expected: Audio stops immediately
   (Or ask another question first, which stops current audio)
Result: PASS / FAIL
```

### Test 3: Combination Scenarios (5 minutes)

#### Test 3A: Mute + Stop
```
Steps:
1. Mute (🔇 red)
2. Ask long question
3. While processing, click stop ⏹️
   Expected:
   - Request stops
   - Message shows "⏹️ Request stopped"
   - Still muted 🔇
4. Unmute (🔊 gray)
5. Ask normal question
   Expected: Works normally with audio
Result: PASS / FAIL
```

#### Test 3B: Multiple Rapid Requests
```
Steps:
1. Ask question 1, click stop before it finishes ⏹️
2. Ask question 2 immediately
3. Wait for response
   Expected: Handles gracefully
4. Ask question 3
5. Let it complete
   Expected: Full response
Result: PASS / FAIL
```

#### Test 3C: Mute During Response
```
Steps:
1. Ask: "What is diabetes?"
2. Wait for response
3. Audio starts playing
4. **While audio is playing:**
   Click mute 🔇
   Expected: Audio stops immediately
5. Ask another question
   Expected: No audio (still muted)
Result: PASS / FAIL
```

### Test 4: UI Responsiveness (2 minutes)

#### Test 4A: Input Disable During Processing
```
Steps:
1. Start typing in input
2. Send question
3. **While processing:**
   Try to type in input field
   Expected: Input disabled (grayed out)
4. Wait for response
   Expected: Input re-enabled, can type
Result: PASS / FAIL
```

#### Test 4B: Button Transitions
```
Steps:
1. Watch input area
2. Send question
   Expected: Send button ▶️ → Stop button ⏹️
3. Wait or click stop
   Expected: Stop button ⏹️ → Send button ▶️
Result: PASS / FAIL
```

#### Test 4C: Mute Button Color
```
Steps:
1. Check mute button color (should be gray 🔊)
2. Click it
   Expected: Turns red 🔇
3. Click it again
   Expected: Turns gray 🔊
4. Hover over each state
   Expected: Hover effect visible
Result: PASS / FAIL
```

### Test 5: Console Logging (2 minutes)

#### Test 5A: Mute Logs
```
Steps:
1. Open DevTools (F12)
2. Go to Console tab
3. Mute button (🔊 → 🔇)
   Expected: See "[ChatWidget] TTS muted"
4. Unmute button (🔇 → 🔊)
   Expected: See "[ChatWidget] TTS unmuted"
Result: PASS / FAIL
```

#### Test 5B: Stop Logs
```
Steps:
1. DevTools Console open
2. Ask question
3. Click stop while processing
   Expected: See "[ChatWidget] Request stopped by user"
   Then: See "[ChatWidget] Request was cancelled by user"
Result: PASS / FAIL
```

### Test 6: Browser Compatibility (5 minutes)

#### Test 6A: Chrome/Chromium
```
Browser: Chrome / Edge / Brave
Steps: Run all tests 1-5
Result: PASS / FAIL
Notes: ________________
```

#### Test 6B: Firefox
```
Browser: Firefox
Steps: Run tests 1-5
Result: PASS / FAIL
Notes: ________________
```

#### Test 6C: Safari
```
Browser: Safari (if available)
Steps: Run tests 1-5
Result: PASS / FAIL
Notes: ________________
```

---

## Success Criteria

### Mute Feature ✅
- [ ] Button changes color (gray ↔ red)
- [ ] Audio stops when muted
- [ ] Audio doesn't play while muted
- [ ] Audio plays when unmuted
- [ ] Multiple mute/unmute cycles work
- [ ] Console shows mute/unmute logs

### Stop Feature ✅
- [ ] Stop button appears during processing
- [ ] Stop button disappears after response
- [ ] Stop cancels request immediately
- [ ] "Request stopped" message appears
- [ ] Input re-enabled after stop
- [ ] Can ask new question after stop
- [ ] Console shows stop logs

### UI/UX ✅
- [ ] Input disables during processing
- [ ] Input enables after response
- [ ] Button transitions smooth
- [ ] Colors clear and professional
- [ ] No layout shift or jank
- [ ] Mobile responsive (test zoom)

### Error Handling ✅
- [ ] No JavaScript errors in console
- [ ] Graceful degradation
- [ ] All error messages clear
- [ ] No 500 errors from backend

---

## Common Issues & Fixes

| Issue | Check | Fix |
|-------|-------|-----|
| Mute button not working | Browser console for errors | Refresh page, hard cache clear |
| Stop button not showing | isTyping state correct? | Restart frontend |
| Audio doesn't stop | Web Speech API working? | Try different browser |
| Input stays disabled | setIsTyping(false) called? | Check error handling |
| Red button stays after stop | State not updated? | Hard refresh browser |

---

## Testing Notes

```
Date: ____________
Tester: ____________
Browser: ____________
OS: ____________

Notes:
___________________________________
___________________________________
___________________________________

Issues Found:
___________________________________
___________________________________

Fixes Applied:
___________________________________
___________________________________

Final Status: ✅ PASS / ❌ FAIL
```

---

## Test Results Checklist

- [ ] Mute toggles correctly
- [ ] Stop cancels requests
- [ ] UI responsive
- [ ] Console logs appear
- [ ] No JavaScript errors
- [ ] All colors correct
- [ ] Buttons transition smoothly
- [ ] Multiple cycles work
- [ ] Mobile friendly
- [ ] Cross-browser compatible

**✅ ALL TESTS PASS?** Features ready for production! 🚀

---

## Quick Command Reference

```bash
# Start backend
cd backend && python main.py

# Start frontend (new terminal)
cd frontend && npm run dev

# Open browser
http://localhost:5173

# Open DevTools
F12

# Refresh page
Ctrl+R (or Cmd+R on Mac)

# Hard refresh (clear cache)
Ctrl+Shift+R (or Cmd+Shift+R on Mac)

# Console tab
F12 → Console
```

---

**Ready to test?** Start with the 60-second test above! 🎉
