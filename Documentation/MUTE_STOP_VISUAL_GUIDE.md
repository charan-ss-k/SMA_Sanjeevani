# Mute & Stop Features - Visual Overview 🎨

## ChatBot UI Before vs After

### **BEFORE: Basic Chat Interface**
```
┌─────────────────────────────────────────────┐
│ Sanjeevani AI   🏥                          │
│ Medical Assistant (24/7)                    │
├─────────────────────────────────────────────┤
│                                             │
│ 💬 Medical responses                        │
│    Professional formatting...               │
│                                             │
│ ⌚ Typing indicator...                      │
│                                             │
├─────────────────────────────────────────────┤
│ [Text Input Field] [Send Button ▶️]        │
└─────────────────────────────────────────────┘
```

### **AFTER: Enhanced with Mute & Stop**
```
┌─────────────────────────────────────────────┐
│ Sanjeevani AI   🏥                          │
│ Medical Assistant (24/7)                    │
├─────────────────────────────────────────────┤
│                                             │
│ 💬 Medical responses                        │
│    Professional formatting...               │
│                                             │
│ ⌚ Typing indicator...                      │
│                                             │
├─────────────────────────────────────────────┤
│ [Input] [Mute] [Stop]                      │
│         🔊    ⏹️                            │
│         or 🔇                               │
└─────────────────────────────────────────────┘

Legend:
🔊 = Unmuted (gray)
🔇 = Muted (red)
▶️ = Send (green)
⏹️ = Stop (orange, during processing)
```

---

## Button States & Interactions

### **Mute Button State Machine**
```
┌─────────────────────────────────────────────┐
│          MUTE BUTTON STATE FLOW              │
└─────────────────────────────────────────────┘

         ↓
    [UNMUTED]  🔊 Gray
         ↓
    Click mute
         ↓
    [MUTED]  🔇 Red
    • Audio stops
    • TTS disabled
    • State saved
         ↓
    Click mute
         ↓
    [UNMUTED]  🔊 Gray
    • TTS re-enabled
    • Ready for audio
```

### **Stop Button Flow**
```
┌─────────────────────────────────────────────┐
│        STOP BUTTON VISIBILITY FLOW            │
└─────────────────────────────────────────────┘

    User clicks SEND
         ↓
    isTyping = true
         ↓
    [STOP BUTTON] ⏹️ Appears (orange)
         ↓
    User clicks STOP
         ↓
    • Request aborted
    • Speech cancelled
    • isTyping = false
    • "Request stopped" message
         ↓
    [SEND BUTTON] ▶️ Reappears (green)
```

---

## Control Layout

### **Input Bar Anatomy**
```
┌────────────────────────────────────────────────────────┐
│  [         Input Field        ] [Mute] [Stop/Send]   │
│  ▲                              ▲      ▲              │
│  └─ Text input for question     │      │              │
│                                 │      └─ Conditional │
│                                 │         Send (green)│
│                                 │         or Stop(org)│
│                                 └─ Always visible    │
│                                    Toggle mute/unmute│
└────────────────────────────────────────────────────────┘
```

### **Button Spacing**
```
[Input: "What is fever?        "] [🔊] [▶️]
                                 2px  2px  gap-2 class
```

---

## Color Scheme

### **Button Colors**
```
MUTE BUTTON (Toggle):
├─ Unmuted: bg-gray-300 (Tailwind gray)
│  └─ Hover: bg-gray-400 (slightly darker)
│  └─ Icon: 🔊 Speaker with sound waves
│
└─ Muted: bg-red-500 (Tailwind red)
   └─ Hover: bg-red-600 (slightly darker)
   └─ Icon: 🔇 Speaker with X symbol

SEND BUTTON (Idle):
├─ bg-green-600 (Tailwind green)
├─ Hover: bg-green-700 (slightly darker)
├─ Disabled: bg-gray-400
└─ Icon: ▶️ Send/forward arrow

STOP BUTTON (Processing):
├─ bg-orange-500 (Tailwind orange)
├─ Hover: bg-orange-600 (slightly darker)
└─ Icon: ⏹️ Stop square
```

---

## User Interactions Timeline

### **Timeline 1: Mute Control**
```
Time  Event                    UI Change
────────────────────────────────────────────
T+0   Open chatbot            Mute button shows 🔊 (gray)
T+5   Ask question            (Mute button unchanged)
T+10  Response arrives        (Mute button unchanged)
T+12  Audio starts            (Mute button unchanged)
T+15  Click mute button       Mute button → 🔇 (red)
T+16  Audio stops             (Mute button stays red 🔇)
T+20  Ask new question        (Mute button stays red 🔇)
T+30  Response arrives        (No audio plays)
T+35  Click mute button       Mute button → 🔊 (gray)
T+40  Ask question            (Mute button unchanged)
T+50  Response arrives        Audio plays normally ✓
```

### **Timeline 2: Stop Control**
```
Time  Event                    UI Change
────────────────────────────────────────────
T+0   Ask question            Send button ▶️ active
T+1   Click send              Stop button ⏹️ appears
T+2   (Processing...)         (Stop button visible)
T+8   User clicks stop        Request cancelled
T+9   Response shows:         Stop button → Send button ▶️
      "⏹️ Request stopped"
T+10  Input re-enabled        Input field active
T+11  Ask new question        (Normal workflow)
```

---

## Feature Comparison

### **Before vs After**

| Feature | Before | After |
|---------|--------|-------|
| **Mute TTS** | ❌ No | ✅ Yes (🔊/🔇) |
| **Stop Request** | ❌ No | ✅ Yes (⏹️) |
| **Mute State** | — | ✅ Persistent |
| **Visual Feedback** | Basic | 🎨 Color coded |
| **Interrupt Processing** | ❌ No | ✅ Yes (AbortController) |
| **Cancel Speech** | ❌ No | ✅ Yes |
| **Input Disable** | Only during request | ✅ Enhanced |
| **Button Transitions** | Static | ✅ Dynamic |
| **User Messages** | Standard | ✅ "Request stopped" |

---

## Keyboard & Accessibility

### **Keyboard Navigation**
```
TAB Key:  Input → Mute Button → Send/Stop Button → (wrap)
ENTER Key: In input field → Send message
          (Only if not typing)
CLICK:     Any button → Immediate action
```

### **Accessibility**
```
Title Attributes:
├─ Mute Button: "Mute TTS" or "Unmute TTS"
├─ Stop Button: "Stop processing"
└─ Send Button: (implied from context)

ARIA Labels: (to be added if needed)
├─ Role: button
├─ State: aria-pressed (for toggle)
└─ Label: aria-label for screen readers
```

---

## Icon Details

### **MuteIcon (Speaker Off)**
```
SVG: Speaker symbol with X or slash
Color: White (on red background when muted)
Size: h-5 w-5 (Tailwind classes)
Fill: Solid fill
```

### **UnmuteIcon (Speaker On)**
```
SVG: Speaker symbol with sound waves
Color: Gray/White depending on context
Size: h-5 w-5 (Tailwind classes)
Fill: Solid fill
```

### **StopIcon (Square Stop)**
```
SVG: Filled square shape
Color: White (on orange background)
Size: h-5 w-5 (Tailwind classes)
Fill: Solid fill
```

---

## Responsive Behavior

### **Desktop (1024px+)**
```
[Input: 100% width - buttons] [Mute] [Stop/Send]
  ↑                            Visible, normal size
```

### **Tablet (768px - 1023px)**
```
[Input: flexible] [Mute] [Stop/Send]
  ↑               Visible, normal size
```

### **Mobile (< 768px)**
```
[Input] [🔊] [▶️/⏹️]
  ↑      ↑     ↑
  Narrow Full height buttons
```

---

## Data Flow Diagram

### **Stop Request Flow**
```
User clicks STOP
        ↓
handleStop() called
        ↓
    ┌───────────────────────────────┐
    │ 1. abortController.abort()   │
    │ 2. setIsTyping(false)        │
    │ 3. speechSynthesis.cancel()  │
    └───────────────────────────────┘
        ↓
Fetch promise rejects
        ↓
catch (err) block
        ↓
if (err.name === 'AbortError')
        ↓
Show "Request stopped" message
        ↓
UI updates, input re-enabled
```

### **Mute State Flow**
```
User clicks MUTE
        ↓
handleMuteToggle() called
        ↓
setIsMuted(!isMuted)
        ↓
if (!isMuted) {
  speechSynthesis.cancel()  // Stop current audio
  console.log(...)
}
        ↓
New response arrives
        ↓
if (!isMuted) {
  playTTS(response) ← Check mute state
}
```

---

## Console Logging

### **Sample Console Output**
```javascript
// When muting
[ChatWidget] TTS muted

// When unmuting
[ChatWidget] TTS unmuted

// When stopping
[ChatWidget] Request stopped by user
[ChatWidget] Request was cancelled by user

// During normal operation
[ChatWidget] Calling API: http://localhost:8000/api/medical-qa
[ChatWidget] Response data: {answer: "..."}
```

---

## Quick Reference

```
MUTE BUTTON:
├─ Purpose: Toggle TTS on/off
├─ Color Unmuted: Gray (🔊)
├─ Color Muted: Red (🔇)
├─ Action: Click to toggle
└─ Result: Affects all future responses

STOP BUTTON:
├─ Purpose: Cancel current request
├─ Color: Orange (⏹️)
├─ Visible: Only during processing
├─ Action: Click to stop
└─ Result: Aborts fetch and speech

SEND BUTTON:
├─ Purpose: Submit question
├─ Color: Green (▶️)
├─ Visible: When idle
├─ Action: Click to send
└─ Result: Starts new request
```

---

**All visual elements are now in place!** 🎉 The chatbot has professional mute and stop controls.
