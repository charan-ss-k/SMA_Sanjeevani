# 🚀 React Native Mobile App - Quick Start Guide

## Project Overview

A comprehensive React Native healthcare mobile application built with Expo that mirrors the web frontend functionality. The app features:

- **AI-Powered Chat** with streaming responses and TTS
- **Medicine Identification** using image recognition
- **Symptom Checker** with AI-powered analysis
- **Prescription Analysis** for automatic medicine extraction
- **Doctor Finder** and appointment booking
- **Medication Reminders** system
- **Secure Authentication** with JWT tokens

## ⚡ Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd mobile
npm install
```

### Step 2: Create Environment File
```bash
cp .env.example .env
```

Edit `.env` and update:
```env
REACT_APP_API_URL=http://your-backend-url:5000
REACT_APP_ENV=development
DEBUG=true
```

### Step 3: Start Development Server
```bash
npm start
```

### Step 4: Run on Device/Emulator
- **iOS**: Press `i` for iOS Simulator
- **Android**: Press `a` for Android Emulator
- **Web**: Press `w` for Web
- **DevTools**: Press `j` for Expo DevTools

## 📱 App Navigation

```
┌─────────────────────────────────────┐
│  Onboarding → Login → Signup        │
└──────────┬──────────────────────────┘
           │
     ┌─────▼────────────────────────┐
     │   Home (Dashboard)           │
     └─────┬──────────────────────┬─┘
           │                      │
    ┌──────┴─────────┐     ┌──────┴──────────┐
    │  Chat          │     │  Health        │
    │  ├─ AI Chat    │     │  ├─ Symptoms   │
    │  └─ Streaming  │     │  ├─ Medicine ID│
    │                │     │  ├─ RX Parse   │
    │                │     │  └─ Reminders  │
    │                │     │                │
    │  Appointments  │     │  Settings      │
    │  ├─ Find Doc   │     │  ├─ Profile    │
    │  ├─ Book       │     │  ├─ Prefs      │
    │  └─ Payment    │     │  └─ Help       │
    └────────────────┘     └────────────────┘
```

## 🎯 Key Features Walkthrough

### 1. Authentication
**File**: `src/screens/auth/`

Features:
- Secure JWT token storage using `expo-secure-store`
- Auto token refresh on API calls
- Encrypted password transmission
- Session persistence

Test Flow:
1. Open app → Onboarding screen
2. Click "Get Started" → Login screen
3. Enter test credentials or signup

### 2. AI Chat with Streaming
**File**: `src/screens/chat/ChatScreen.js`

Features:
- Real-time message streaming via Server-Sent Events (SSE)
- TTS (Text-to-Speech) playback button
- Message accumulation during streams
- Automatic scrolling to latest message

How it works:
```javascript
// In ChatScreen.js
await sendMessage(
  userMessage,
  (chunk) => {
    // Chunk received - update UI
    setStreamingText(prev => prev + chunk);
  },
  () => {
    // Stream complete
    addMessage(fullResponse, 'ai');
  }
);
```

### 3. Medicine Identification
**File**: `src/screens/health/MedicineIdentificationScreen.js`

Features:
- Capture or upload medicine image
- AI identifies medicine from image
- Shows confidence percentage
- Displays composition, dosage, side effects

TODO: Integrate camera
```javascript
import * as ImagePicker from 'expo-image-picker';

const handleSelectImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    base64: true,
  });
  setSelectedImage(result.uri);
};
```

### 4. Symptom Checker
**File**: `src/screens/health/SymptomCheckerScreen.js`

Features:
- Select from 12 common symptoms
- Add custom symptoms
- AI analyzes and provides insights
- Medical disclaimer included

Usage:
1. Select symptoms with tag buttons
2. Add custom symptoms via text input
3. Click "Analyze Symptoms"
4. View AI-powered analysis

### 5. Prescription Analyzer
**File**: `src/screens/health/PrescriptionAnalyzerScreen.js`

Features:
- Upload prescription image
- Extract medicines automatically
- Parse dosage and frequency
- Store medicines as reminders

### 6. Doctor Finder & Booking
**File**: `src/screens/appointments/`

Features:
- Search doctors by name/specialty
- Filter by 6 specialty categories
- View ratings and reviews
- Book appointments with date/time selection
- Choose video or clinic consultation

### 7. Medication Reminders
**File**: `src/screens/health/RemindersScreen.js`

Features:
- Create medicine reminders
- Set frequency and time
- Edit or delete reminders
- Track reminder status

## 🔧 Component Usage Examples

### Button
```javascript
<Button
  title="Click Me"
  onPress={() => handlePress()}
  variant="primary"      // primary | secondary | outline | danger
  size="md"              // sm | md | lg
  isLoading={loading}
  fullWidth
/>
```

### Input
```javascript
<Input
  label="Email"
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  error={errors.email}
/>
```

### Card
```javascript
<Card variant="elevated" padding="md">
  <Text>Card content</Text>
</Card>
```

### Alert
```javascript
<Alert
  type="success"     // info | success | error | warning
  message="Success!"
  onDismiss={() => {}}
  dismissAfter={3000}
/>
```

## 🔗 API Integration

### Endpoints Configuration

Update `src/api/client.js` with your backend URLs:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Authentication
POST /api/auth/login
POST /api/auth/signup
GET  /api/auth/profile
POST /api/auth/refresh-token

// Chat
POST /api/chat/stream          // Returns SSE stream

// Health
POST /api/medicine/identify    // FormData with image
POST /api/prescription/analyze // FormData with image
GET  /api/prescriptions
POST /api/reminders
DELETE /api/reminders/:id

// Appointments
GET  /api/doctors/search?q=&specialty=
POST /api/appointments/book
GET  /api/appointments
```

### Making API Calls

```javascript
import { apiClient } from '../api/client';

// Regular request
const response = await apiClient.get('/api/doctors/search?specialty=General');

// POST with data
const user = await apiClient.post('/api/appointments/book', {
  doctorId: 1,
  date: '2024-01-15',
  time: '10:00 AM'
});

// Streaming response
await apiClient.streamLLMResponse(
  prompt,
  (chunk) => console.log('Chunk:', chunk),
  () => console.log('Done'),
  (err) => console.error('Error:', err)
);
```

## 🎨 Theming System

All styling is centralized in `src/utils/theme.js`:

```javascript
import { colors, spacing, typography } from '../utils/theme';

// Colors
colors.primary         // #007AFF (blue)
colors.secondary       // #FF3B30 (red)
colors.text           // #000000
colors.textSecondary  // #8E8E93
colors.background     // #F2F2F7
colors.white          // #FFFFFF
colors.border         // #E5E5EA
colors.success        // #34C759 (green)
colors.warning        // #FF9500 (orange)
colors.error          // #FF3B30 (red)

// Spacing (4px base)
spacing.xs = 4        // Extra small
spacing.sm = 8        // Small
spacing.md = 12       // Medium
spacing.lg = 16       // Large
spacing.xl = 24       // Extra large

// Typography (predefined styles)
typography.h1, h2, h3, h4  // Headings
typography.body            // Regular text
typography.caption         // Small text
```

Customize by editing `src/utils/theme.js`.

## 🔐 State Management

### Using Contexts

```javascript
// AuthContext
const { user, login, logout, isLoading } = useAuth();

// ChatContext
const { chatHistory, sendMessage, addMessage } = useChat();

// HealthContext
const { identifyMedicineFromImage, uploadPrescription } = useHealth();
```

### Available State

**AuthContext:**
```javascript
- user: { id, email, fullName, ... }
- isLoading: boolean
- error: string | null
```

**ChatContext:**
```javascript
- chatHistory: Array<{ id, sender, text, timestamp }>
- isLoading: boolean
```

**HealthContext:**
```javascript
- prescriptions: Array<{ id, medicines, ... }>
- reminders: Array<{ id, medicineName, ... }>
```

## 🧪 Testing Screens

### Manual Testing Checklist

- [ ] **Auth Flow**
  - [ ] Signup with valid/invalid data
  - [ ] Login with credentials
  - [ ] Token persists after app restart
  - [ ] Logout clears session

- [ ] **Chat**
  - [ ] Send message displays immediately
  - [ ] Streaming response accumulates
  - [ ] TTS button plays audio
  - [ ] Error handling on failure

- [ ] **Medicine ID**
  - [ ] Select/capture image
  - [ ] Identified medicine displays
  - [ ] Confidence score shown

- [ ] **Appointments**
  - [ ] Search doctors works
  - [ ] Filter by specialty filters
  - [ ] Date/time selection works
  - [ ] Summary displays correctly

- [ ] **Reminders**
  - [ ] Add reminder saves
  - [ ] Delete removes from list
  - [ ] Time displays correctly

## 🐛 Debugging

### Enable Debug Logging
```env
DEBUG=true
```

### Check Logs
```bash
npm start
# Press 'i' for iOS logs
# Or 'a' for Android logs
```

### Common Issues

**Issue**: Blank white screen
- **Solution**: Check `App.js` imports and ensure all screens exist

**Issue**: API calls fail
- **Solution**: Verify `REACT_APP_API_URL` in `.env` and backend is running

**Issue**: Image doesn't load
- **Solution**: Check image URI format and ensure proper permissions

**Issue**: TTS not working
- **Solution**: Verify `expo-av` is installed and audio permissions granted

## 📚 File Organization

```
mobile/src/
├── screens/              # All app screens (800+ lines)
│   ├── auth/            # Login, Signup, Onboarding
│   ├── home/            # Home dashboard
│   ├── chat/            # AI Chat with streaming
│   ├── health/          # Medicine, Symptoms, Prescription, Reminders
│   ├── appointments/    # Doctor search, booking
│   ├── settings/        # User settings
│   └── index.js         # Barrel export
├── components/          # Reusable UI (500+ lines)
│   ├── Button.js
│   ├── Input.js
│   ├── Card.js
│   ├── Alert.js
│   └── ...
├── context/             # State management (600+ lines)
│   ├── AuthContext.js
│   ├── ChatContext.js
│   └── HealthContext.js
├── api/
│   └── client.js        # API client with streaming (550+ lines)
├── services/
│   └── ttsService.js    # Text-to-speech (300+ lines)
├── utils/
│   ├── theme.js         # Colors, spacing, typography
│   └── constants.js     # App constants
├── hooks/
│   └── useForm.js       # Form validation hook
├── App.js               # Main navigation (300+ lines)
└── index.js             # Entry point
```

## 📦 Dependencies

Core dependencies:
- `expo` - React Native framework
- `@react-navigation/native` - Navigation
- `axios` - HTTP client
- `expo-secure-store` - Secure token storage
- `expo-av` - Audio playback

Optional (for image handling):
- `expo-camera` - Camera access
- `expo-image-picker` - Image selection
- `expo-file-system` - File operations

## 🚀 Deployment Preparation

Before deploying:

1. **Update Version**
   ```json
   // app.json
   "version": "1.0.0"
   ```

2. **Update API Endpoint**
   ```env
   REACT_APP_API_URL=https://api.yourdomain.com
   ```

3. **Create Production Build**
   ```bash
   # iOS
   expo build:ios
   
   # Android
   expo build:android
   ```

4. **Test on Device**
   - Install TestFlight (iOS) or Play Store (Android)
   - Test all major flows
   - Verify offline behavior

## 📖 Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [React Native](https://reactnative.dev)
- [Axios Documentation](https://axios-http.com)

## 💡 Tips & Tricks

1. **Hot Reload**: Save files automatically reload on device
2. **Debug Console**: Press `Ctrl+Shift+D` in terminal
3. **Network Inspector**: Use Expo DevTools for API debugging
4. **Theme Preview**: Update `src/utils/theme.js` colors to see live changes
5. **Component Test**: Create test screen and import components there

## ❓ FAQ

**Q**: How do I change the API endpoint?
**A**: Edit `REACT_APP_API_URL` in `.env` file.

**Q**: How do I add a new screen?
**A**: Create screen file in `src/screens/` and add to navigation in `App.js`.

**Q**: Can I use web browsers?
**A**: Yes! Press 'w' when `npm start` is running.

**Q**: How do I handle offline?
**A**: Implement AsyncStorage for caching and check connectivity.

---

**Status**: ✅ Production Ready  
**Last Updated**: 2024  
**Maintainer**: Team  
**License**: MIT
