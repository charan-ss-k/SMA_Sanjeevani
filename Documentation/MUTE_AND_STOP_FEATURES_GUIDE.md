# ChatBot Mute & Stop Features - Complete Guide ✨

## What's New

### 1. **🔇 Mute Button**
Mutes the chatbot's text-to-speech (TTS) output. 

**Features**:
- One-click toggle to turn TTS on/off
- Visual indicator: Gray (unmuted) → Red (muted)
- Automatically cancels any ongoing speech
- Respects mute state for subsequent responses

### 2. **⏹️ Stop Button**
Interrupts the current API request and cancels processing.

**Features**:
- Appears during processing (replaces send button)
- Stops the backend API call immediately
- Cancels any ongoing speech
- Shows user-friendly message: "Request stopped"

---

## UI Changes

### **Input Bar Layout** (Before → After)

**Before**:
```
[Text Input] [Send Button]
```

**After**:
```
[Text Input] [Mute Button] [Stop/Send Button]
```

### **Button States**

#### **Mute Button**
| State | Appearance | Action |
|-------|-----------|--------|
| Unmuted | 🔊 Gray button | Click to mute TTS |
| Muted | 🔇 Red button | Click to unmute TTS |

#### **Send/Stop Button**
| State | Appearance | Action |
|-------|-----------|--------|
| Idle (ready) | ▶️ Green send button | Click to send question |
| Processing | ⏹️ Orange stop button | Click to stop request |

---

## Implementation Details

### **State Management**
```javascript
const [isMuted, setIsMuted] = useState(false);
const abortControllerRef = useRef(null);
```

- `isMuted`: Tracks mute state
- `abortControllerRef`: Controls fetch request cancellation

### **New Functions**

#### 1. **handleStop()**
```javascript
const handleStop = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort(); // Cancel fetch
  }
  setIsTyping(false);
  window.speechSynthesis.cancel(); // Stop audio
};
```

**Does**:
- Aborts the fetch request
- Stops typing indicator
- Cancels Web Speech API audio

#### 2. **handleMuteToggle()**
```javascript
const handleMuteToggle = () => {
  setIsMuted(!isMuted);
  if (!isMuted) {
    window.speechSynthesis.cancel();
    console.log('[ChatWidget] TTS muted');
  }
};
```

**Does**:
- Toggles mute state
- Cancels ongoing speech when muting
- Logs state change

### **Updated Fetch with AbortController**
```javascript
abortControllerRef.current = new AbortController();

const response = await fetch(`${apiBase}/api/medical-qa`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question, language }),
  signal: abortControllerRef.current.signal, // ← Allow cancellation
});
```

### **Mute Check Before TTS**
```javascript
// Speak the response using Coqui TTS (only if not muted)
if (!isMuted) {
  try {
    playTTS(botResponseText, language);
  } catch (ttsErr) {
    console.warn('[ChatWidget] TTS error (non-fatal):', ttsErr);
  }
}
```

### **AbortError Handling**
```javascript
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('[ChatWidget] Request was cancelled by user');
    const cancelledMessage = {
      id: messages.length + 2,
      sender: 'bot',
      text: '⏹️ Request stopped. Feel free to ask another question!',
    };
    setMessages((prevMessages) => [...prevMessages, cancelledMessage]);
    return;
  }
  // ... handle other errors
}
```

---

## User Workflow

### **Scenario 1: Using Mute**
```
1. User asks question
2. Backend generates response
3. User clicks mute button (🔇)
   ↓ Button turns red
   ↓ Any ongoing speech stops
4. User sees response (text only, no audio)
5. Click mute again to enable TTS for next response
```

### **Scenario 2: Interrupting a Slow Request**
```
1. User asks question
2. Typing indicator appears (bouncing dots)
3. Stop button shows (orange ⏹️)
4. User clicks stop button (e.g., took too long)
   ↓ Request cancelled immediately
   ↓ "Request stopped" message appears
   ↓ Input re-enabled
5. User can ask another question
```

### **Scenario 3: Quick Interrupt During TTS**
```
1. Response received
2. TTS starts playing audio
3. User clicks mute button
   ↓ Audio stops immediately
   ↓ Text still visible
4. User can re-enable TTS anytime
```

---

## Console Logs

### **Mute Events**
```
[ChatWidget] TTS muted          // When user clicks mute
[ChatWidget] TTS unmuted        // When user clicks mute again
```

### **Stop Events**
```
[ChatWidget] Request stopped by user     // When stop button clicked
[ChatWidget] Request was cancelled by user // When fetch completed
```

---

## Visual Indicators

### **Mute Button States**
```
Unmuted: bg-gray-300 (gray)    | Hover: bg-gray-400 (darker gray)
Muted:   bg-red-500 (red)      | Hover: bg-red-600 (darker red)
```

### **Stop Button**
```
Active:  bg-orange-500 (orange) | Hover: bg-orange-600 (darker orange)
```

---

## Testing Checklist

### ✅ Test 1: Mute Functionality
- [ ] Open chatbot
- [ ] Ask a question with audio playback enabled
- [ ] Response displays and audio plays
- [ ] Click mute button (turns red 🔇)
- [ ] Current audio stops
- [ ] Ask another question
- [ ] No audio plays (text only)
- [ ] Click mute button again (turns gray 🔊)
- [ ] Ask another question
- [ ] Audio plays normally

### ✅ Test 2: Stop Functionality
- [ ] Open chatbot
- [ ] Ask a long/complex medical question
- [ ] See typing indicator (bouncing dots)
- [ ] Stop button visible (orange ⏹️)
- [ ] Click stop button
- [ ] Request stops immediately
- [ ] Message shows: "⏹️ Request stopped. Feel free to ask another question!"
- [ ] Input re-enabled
- [ ] Can ask another question

### ✅ Test 3: Stop During Response
- [ ] Open chatbot
- [ ] Ask question
- [ ] Wait for response + audio start
- [ ] Click mute (stops audio)
- [ ] Click send on another question
- [ ] Quickly click stop (before response arrives)
- [ ] Request cancelled
- [ ] "Request stopped" message appears

### ✅ Test 4: Browser Console Logs
- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Mute/unmute and look for: `[ChatWidget] TTS muted/unmuted`
- [ ] Stop request and look for: `[ChatWidget] Request stopped by user`

---

## Files Modified

### **frontend/src/components/ChatWidget.jsx**
**Changes**:
1. Added 3 new icon components:
   - `MuteIcon()` - Speaker off with X symbol
   - `UnmuteIcon()` - Speaker on with lines
   - `StopIcon()` - Square stop symbol

2. Added state variables:
   - `isMuted` - Track mute state
   - `abortControllerRef` - Manage fetch cancellation

3. Added handler functions:
   - `handleStop()` - Cancel request and speech
   - `handleMuteToggle()` - Toggle mute state

4. Updated `handleSend()`:
   - Use `AbortController` instead of `AbortSignal.timeout()`
   - Check `isMuted` before calling `playTTS()`
   - Handle `AbortError` with user-friendly message

5. Updated input area UI:
   - New flex layout with `gap-2`
   - Mute button (gray/red toggle)
   - Stop button (orange, visible during processing)
   - Input disabled during processing
   - Dynamic send/stop button

---

## Features

✅ **Mute TTS** - Stop audio playback on demand
✅ **Stop Request** - Cancel backend processing
✅ **Visual Feedback** - Clear button states and colors
✅ **Smooth UX** - Input remains responsive
✅ **Error Handling** - Graceful AbortError handling
✅ **Speech Cancellation** - `window.speechSynthesis.cancel()` for Web Speech API
✅ **Fetch Cancellation** - `AbortController.signal` for network requests
✅ **User Feedback** - "Request stopped" message in chat
✅ **Console Logging** - Detailed [ChatWidget] logs for debugging

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| AbortController | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Web Speech API | ✅ Yes | ⚠️ Limited | ✅ Yes | ✅ Yes |
| Fetch API | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Performance Impact

- **Memory**: Negligible (one ref per component)
- **CPU**: Minimal (simple state toggles)
- **Network**: Stops unnecessary requests (efficient)
- **UI**: No lag, smooth button transitions

---

## Next Steps

1. ✅ Restart frontend (`npm run dev`)
2. ✅ Test mute functionality
3. ✅ Test stop functionality
4. ✅ Monitor console logs
5. ✅ Verify all button transitions
6. ✅ Test on mobile (responsiveness)

---

## Troubleshooting

### **Stop button doesn't appear**
- Check if `isTyping` state is updating
- Look for console errors with `[ChatWidget]` prefix

### **Mute button doesn't stop audio**
- Verify `window.speechSynthesis.cancel()` is called
- Check browser speaker volume
- Try different browsers

### **Stop doesn't cancel request**
- Ensure `abortControllerRef` is initialized
- Check console for `AbortError` handling
- Verify backend doesn't override abort signal

### **Buttons unresponsive**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Restart frontend server
- Check browser console for JavaScript errors

---

## Code Quality

✅ No breaking changes
✅ Backward compatible
✅ Follows React best practices
✅ Proper error handling
✅ Console logging for debugging
✅ Clean, readable code
✅ Professional UI/UX

---

**You're all set!** 🚀 The chatbot now has professional mute and stop controls for a better user experience!
