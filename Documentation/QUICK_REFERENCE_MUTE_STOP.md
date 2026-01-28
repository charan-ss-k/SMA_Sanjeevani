# Quick Reference Card - Mute & Stop Features 🎯

## Button Reference

### 🔊 Mute Button (Unmuted State)
```
Color:    Gray background
Icon:     Speaker with sound waves
Tooltip:  "Mute TTS"
Action:   Click to mute audio
Result:   Button turns red, audio stops
```

### 🔇 Mute Button (Muted State)
```
Color:    Red background
Icon:     Speaker with X mark
Tooltip:  "Unmute TTS"
Action:   Click to unmute audio
Result:   Button turns gray, audio enabled
```

### ▶️ Send Button (Idle State)
```
Color:    Green background
Icon:     Forward/send arrow
Tooltip:  (none, self-explanatory)
Action:   Click to send question
Result:   Question sent to backend
```

### ⏹️ Stop Button (Processing State)
```
Color:    Orange background
Icon:     Stop square
Tooltip:  "Stop processing"
Action:   Click to cancel request
Result:   Request aborted, processing stops
```

---

## State Transitions

### Mute Button States
```
🔊 Unmuted ←→ 🔇 Muted
  (Gray)        (Red)
  
On Mute:    Stops current audio
On Unmute:  Ready for next audio
```

### Send/Stop Button Transitions
```
▶️ Idle ───→ ⏹️ Processing ───→ ▶️ Idle
 (Green)      (Orange)         (Green)
              (During wait)     (Response ready)
```

---

## Usage Scenarios

### Scenario A: Quick Mute
```
1. Response arrives
2. Audio starts playing
3. Click 🔊 → 🔇
4. Audio stops immediately ✓
5. Text still visible ✓
```

### Scenario B: Stop Slow Request
```
1. Ask complex question
2. Waiting for response...
3. Click ⏹️
4. Request cancelled ✓
5. Message: "⏹️ Request stopped"
6. Can ask new question ✓
```

### Scenario C: Persistent Mute
```
1. Click mute 🔊 → 🔇
2. Ask 5 questions
3. None have audio ✓
4. Click mute 🔇 → 🔊
5. Audio enabled again ✓
```

---

## Keyboard & Mouse

### Mouse Actions
```
Click Mute:         Toggle audio on/off
Click Stop:         Cancel current request
Click Send:         Submit question
Hover Button:       See color change
```

### Keyboard Navigation
```
TAB:   Move focus between buttons
ENTER: Activate focused button
       (In input) = Send message
```

---

## Visual Indicators

### Color Meanings
```
Gray  = Audio enabled (ready to play)
Red   = Audio disabled (muted)
Green = Ready to send
Orange = Processing (can stop)
```

### Button Positions
```
[Input Field] [🔊] [▶️]  ← Layout order
              ↑    ↑
              |    └─ Send/Stop (conditional)
              └────── Mute (always visible)
```

---

## Console Feedback

### Mute Logs
```
User Action          Console Output
────────────────────────────────────
Click mute 🔊 → 🔇   [ChatWidget] TTS muted
Click mute 🔇 → 🔊   [ChatWidget] TTS unmuted
```

### Stop Logs
```
User Action          Console Output
────────────────────────────────────
Click stop ⏹️        [ChatWidget] Request stopped by user
Request completes    [ChatWidget] Request was cancelled by user
```

---

## Troubleshooting

### Issue: Mute button not responding
```
Fix: Refresh page (Ctrl+R)
     Hard refresh (Ctrl+Shift+R)
     Check console for errors (F12)
```

### Issue: Stop button doesn't appear
```
Fix: Ensure isTyping state is correct
     Restart frontend (npm run dev)
     Check console logs
```

### Issue: Audio doesn't stop
```
Fix: Try different browser
     Check speaker volume
     Verify Web Speech API working
     Hard refresh browser
```

---

## Browser Compatibility

| Browser | Mute | Stop | Status |
|---------|------|------|--------|
| Chrome  | ✅   | ✅   | ✅ Full |
| Firefox | ✅   | ✅   | ✅ Full |
| Safari  | ✅   | ✅   | ✅ Full |
| Edge    | ✅   | ✅   | ✅ Full |

---

## Hot Tips 💡

1. **Keyboard Shortcut**: Currently no hotkey, but Tab+Enter works
2. **Mobile**: Buttons responsive at all sizes
3. **Mute Persists**: Once muted, stays muted across requests
4. **Stop Immediate**: Cancels instantly (no delay)
5. **Error Safe**: Won't break if TTS fails
6. **Feedback Clear**: "Request stopped" message always shown

---

## Code Snippets

### For Developers

#### Check if Muted
```javascript
if (isMuted) {
  // TTS is disabled
  console.log("TTS is currently muted");
}
```

#### Trigger Stop
```javascript
handleStop();
// Equivalent to user clicking stop button
```

#### Toggle Mute
```javascript
handleMuteToggle();
// Toggles between muted and unmuted
```

---

## Common Questions

**Q: Does mute persist after refresh?**
A: No, state resets. It's per-session only.

**Q: Can I use stop and mute together?**
A: Yes! They work independently.

**Q: Will stop delete my message?**
A: No, message stays visible. Just stops processing.

**Q: Does mute affect future responses?**
A: Yes, stays muted until you click mute again.

**Q: Is stop dangerous?**
A: No, it's completely safe. Just stops current request.

**Q: Works on mobile?**
A: Yes, fully responsive and touch-friendly.

**Q: Any performance impact?**
A: None. Features are lightweight.

---

## Testing Checklist

Quick verification that everything works:

- [ ] Mute button toggles color (gray ↔ red)
- [ ] Stop button appears during processing
- [ ] Audio stops when muted
- [ ] Stop cancels request immediately
- [ ] "Request stopped" message shows
- [ ] Console logs appear correctly
- [ ] Input disables during processing
- [ ] Buttons have hover effects
- [ ] Mobile view responsive
- [ ] No JavaScript errors

---

## Feature Comparison

| Feature | Before | After |
|---------|--------|-------|
| Stop requests | ❌ | ✅ |
| Mute audio | ❌ | ✅ |
| Visual feedback | Basic | 🎨 Pro |
| Button states | Static | Dynamic |
| User control | Limited | ✅ Full |

---

## File Modified

- **`frontend/src/components/ChatWidget.jsx`**
  - Added 3 new icons
  - Added 2 new state variables
  - Added 2 new handler functions
  - Updated fetch with AbortController
  - Updated UI with new buttons

---

## Start Using

### 1. Restart Frontend
```bash
cd frontend && npm run dev
```

### 2. Open Browser
```
http://localhost:5173
```

### 3. Click Chat
```
Bottom right green button
```

### 4. Test Features
```
Mute: 🔊 → 🔇
Stop: ⏹️ during processing
```

---

## Documentation

- **Full Guide**: [MUTE_AND_STOP_FEATURES_GUIDE.md](MUTE_AND_STOP_FEATURES_GUIDE.md)
- **Visual Guide**: [MUTE_STOP_VISUAL_GUIDE.md](MUTE_STOP_VISUAL_GUIDE.md)
- **Testing Guide**: [MUTE_STOP_TESTING_GUIDE.md](MUTE_STOP_TESTING_GUIDE.md)

---

## Summary

```
🔇 MUTE:  Click to toggle TTS on/off
          Gray (unmuted) ↔ Red (muted)

⏹️ STOP:   Click during processing to cancel
           Orange button ⏹️ appears while waiting

✨ RESULT: Full user control over chatbot behavior
```

---

**Status**: ✅ Ready to Use
**Date**: January 26, 2026
**Version**: 1.0

Enjoy! 🎉
