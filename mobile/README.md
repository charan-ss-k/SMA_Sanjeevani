# Sanjeevani Mobile App - React Native

A comprehensive React Native mobile application that mirrors the Sanjeevani web frontend while integrating with the Python/FastAPI backend. Features AI-powered chatbot, medicine identification, prescription analysis, TTS, and appointment booking.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- Android/iOS development environment (optional for native builds)

### Installation

```bash
# Clone and enter directory
cd mobile

# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS  
npm run ios
```

## 🔧 Configuration

### 1. Backend Server Setup

Edit `config/environment.js`:

```javascript
// Development (local network)
API_BASE_URL: 'http://192.168.1.100:8000'  // Your server IP:port

// Production
API_BASE_URL: 'https://api.sanjeevani.app'
```

**Finding your server IP:**
- Linux/Mac: `ifconfig | grep "inet "`
- Windows: `ipconfig` (look for IPv4 Address)
- Must be on same WiFi as mobile device

### 2. Initialize TTS & Audio

TTS is automatically initialized in `App.js`. No additional setup needed.

## 📱 Core Features

### 1. AI Chat with Streaming
- Real-time LLM responses via SSE streaming
- Multi-turn conversation history
- Supports Ollama local models

**Implementation:**
```javascript
import { useChat } from './src/context/ChatContext';

export const ChatScreen = () => {
  const { sendMessage, chatHistory } = useChat();

  const handleSend = async (message) => {
    let fullResponse = '';
    await sendMessage(message, 
      (chunk) => {
        fullResponse += chunk;
        // Update UI with streaming text
      },
      () => console.log('Done'),
      (err) => console.error(err)
    );
  };
};
```

### 2. Text-to-Speech
- Streaming TTS from Python backend
- Audio playback with controls
- Support for multiple languages

**Implementation:**
```javascript
import ttsService from './src/services/ttsService';

// Generate and play
await ttsService.synthesizeAndPlay(
  'Your medical advice',
  'en'
);

// Playback controls
await ttsService.pauseAudio();
await ttsService.resumeAudio();
await ttsService.stopAudio();
```

### 3. Medicine Identification
- Image-based medicine recognition
- Detailed medicine information
- History tracking

**Implementation:**
```javascript
import { useHealth } from './src/context/HealthContext';

export const MedicineIdentificationScreen = () => {
  const { identifyMedicineFromImage } = useHealth();

  const handleCapture = async (imageUri) => {
    const result = await identifyMedicineFromImage(imageUri);
    console.log(result); // Medicine details
  };
};
```

### 4. Prescription Analysis
- Upload and analyze prescription images
- Extract medicine details
- Store in database

**Implementation:**
```javascript
const { uploadPrescription } = useHealth();

const prescription = await uploadPrescription(imageUri);
// Returns: { medicines: [...], extracted_text: "..." }
```

### 5. Appointment Booking
- Find doctors by specialty
- Book appointments
- Manage appointment history

**Implementation:**
```javascript
import { useAuth } from './src/context/AuthContext';

// Uses authenticated API calls
const appointment = await apiClient.post('/appointments', {
  doctor_id: 123,
  date: '2026-02-15',
  time: '10:00'
});
```

### 6. Medication Reminders
- Set reminders for medicines
- Push notifications
- Manage reminder schedule

**Implementation:**
```javascript
const { createReminder } = useHealth();

await createReminder({
  medication: 'Aspirin',
  frequency: 'twice_daily',
  time: '08:00'
});
```

## 📁 Project Structure

```
mobile/
├── App.js                           # Root app with navigation
├── package.json                     # Dependencies
├── app.json                         # Expo configuration
├── config/
│   └── environment.js              # Environment config
├── src/
│   ├── api/
│   │   ├── client.js               # Core API client (main hub)
│   │   └── routes.js               # Endpoint constants
│   ├── components/                 # Reusable components (to be created)
│   ├── context/                    # State management
│   │   ├── AuthContext.js          # Authentication state
│   │   ├── ChatContext.js          # Chat/LLM history
│   │   └── HealthContext.js        # Health data
│   ├── hooks/                      # Custom React hooks
│   │   └── useCustomHooks.js       # useStreaming, useAPICall, etc.
│   ├── screens/                    # Screen components (to be created)
│   │   ├── auth/                   # Login, signup, onboarding
│   │   ├── home/                   # Dashboard
│   │   ├── chat/                   # AI chat
│   │   ├── health/                 # Medicine, prescription, symptoms
│   │   ├── doctors/                # Find & book doctors
│   │   ├── appointments/           # Appointment management
│   │   ├── reminders/              # Medication reminders
│   │   └── dashboard/              # User dashboard
│   ├── services/
│   │   └── ttsService.js           # Text-to-Speech service
│   └── utils/
│       ├── streamingUtils.js       # SSE & streaming utilities
│       ├── helpers.js              # Common functions
│       └── theme.js                # Colors, spacing, typography
├── docs/
│   └── API_CLIENT.md              # Detailed API documentation
└── SETUP.md                        # Setup guide
```

## 🔌 Backend Requirements

### Required Endpoints

The Python backend must support these endpoints:

```
# Auth
POST   /auth/login
POST   /auth/signup
POST   /auth/logout
GET    /auth/profile

# LLM/Chat (Streaming)
POST   /ai/chat/stream              (Server-Sent Events)
GET    /ai/chat/history

# Symptoms
POST   /symptoms/recommend/stream   (Server-Sent Events)

# TTS
POST   /tts/generate
POST   /tts/stream                  (Audio stream)
GET    /tts/voices

# Medicine
POST   /medicine/identify           (Image)
GET    /medicine/search
POST   /medicine/history

# Prescriptions
POST   /prescriptions/analyze       (Image)
GET    /prescriptions
POST   /prescriptions

# Doctors
GET    /doctors
GET    /doctors/search

# Appointments
POST   /appointments
GET    /appointments
DELETE /appointments/:id

# Reminders
POST   /reminders
GET    /reminders
PUT    /reminders/:id
DELETE /reminders/:id
```

### Streaming Response Format

Backend must send SSE format for streaming endpoints:

```
POST /ai/chat/stream
Accept: text/event-stream
Content-Type: application/x-ndjson

Response:
data: {"chunk": "Hello "}
data: {"chunk": "from "}
data: {"chunk": "Ollama"}
```

## 🔐 Authentication

### Token Management

Tokens automatically stored in secure storage:

```javascript
// Login automatically stores tokens
const { user } = await apiClient.login(email, password);

// Tokens auto-refresh on 401
// Cleared on logout
await apiClient.logout();
```

### Using Auth Context

```javascript
import { useAuth } from './src/context/AuthContext';

export const Component = () => {
  const {
    user,
    isAuthenticated,
    login,
    logout,
    isLoading,
    error
  } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <AppContent user={user} />;
};
```

## 🎨 UI Components

### Base Components (To Be Implemented)

```javascript
// Create in src/components/
- Button.js         (Pressable wrapper)
- Input.js          (TextInput wrapper)
- Card.js           (Container with styling)
- Modal.js          (Dialog/modal)
- Loading.js        (Spinner)
- Toast.js          (Notifications)
- Avatar.js         (User profile pic)
- Badge.js          (Status badge)
```

### Using Theme

```javascript
import { colors, spacing, typography } from './src/utils/theme';

<View style={{ padding: spacing.md, backgroundColor: colors.primary }}>
  <Text style={typography.h2}>Heading</Text>
</View>
```

## 🔊 TTS Audio System

### Architecture

```
Backend (Python)           Mobile App
    ↓                          ↓
[Ollama/TTS]           [Expo-AV Audio]
    ↓                          ↓
[FastAPI Streaming] ←→ [React Native]
    ↓                          ↓
[Audio Stream]         [Playback]
```

### Usage

```javascript
import ttsService from './src/services/ttsService';

// Initialize (auto in App.js)
await ttsService.initializeAudioSession();

// Generate and play
await ttsService.synthesizeAndPlay('Text', 'en');

// Stream and play
await ttsService.streamAndPlayTTS('Text', 'en');

// Controls
await ttsService.pauseAudio();
await ttsService.resumeAudio();
await ttsService.stopAudio();

// Cleanup
await ttsService.cleanup();
```

## 📊 State Management

### Context Hierarchy

```
App
├── AuthProvider
│   ├── user
│   ├── isAuthenticated
│   └── login/logout/signup
├── ChatProvider
│   ├── chatHistory
│   └── sendMessage
└── HealthProvider
    ├── medicineHistory
    ├── prescriptions
    └── reminders
```

## 🚨 Error Handling

### API Errors

```javascript
try {
  await apiClient.post('/endpoint', data);
} catch (error) {
  if (error.status === 401) {
    // Token expired, auto-refresh attempted
  } else if (error.status === 422) {
    // Validation error
    console.log(error.response.data);
  } else {
    // Generic error
    console.error(error.message);
  }
}
```

### Streaming Errors

```javascript
await apiClient.streamLLMResponse(
  messages,
  (chunk) => console.log(chunk),
  (error) => {
    // Handle error
    console.error('Stream failed:', error);
  },
  () => console.log('Complete')
);
```

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Mock API Client

```javascript
jest.mock('./src/api/client', () => ({
  login: jest.fn(() => ({ access_token: 'token' })),
  streamLLMResponse: jest.fn()
}));
```

## 📝 Development Workflow

### Creating a New Screen

1. Create screen file in `src/screens/feature/ScreenName.js`
2. Import context hooks if needed
3. Import theme and components
4. Add to navigation in `App.js`
5. Test on device/emulator

### Example Screen

```javascript
import React from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../utils/theme';

export default function MyScreen() {
  const { user } = useAuth();

  return (
    <View style={{ padding: spacing.md, backgroundColor: colors.background }}>
      <Text>Hello, {user.fullName}</Text>
    </View>
  );
}
```

## 🚀 Deployment

### Android

```bash
eas build --platform android
```

### iOS

```bash
eas build --platform ios
```

### Environment

Update `config/environment.js` for production:

```javascript
prod: {
  API_BASE_URL: 'https://api.sanjeevani.app',
  DEBUG: false,
  ENABLE_TTS: true,
}
```

## 📚 Documentation

- [SETUP.md](./SETUP.md) - Installation and configuration
- [docs/API_CLIENT.md](./docs/API_CLIENT.md) - API client details
- [Backend Integration](../backend/README.md) - Python backend guide

## 🤝 Contributing

1. Follow existing code structure
2. Use TypeScript/JSDoc for type safety
3. Test on both Android and iOS
4. Update documentation

## 📞 Support

For issues related to:
- **Backend**: See [Backend README](../backend/README.md)
- **Web Frontend**: See [Frontend README](../frontend/README.md)
- **Deployment**: See SETUP.md

## 📄 License

Part of Sanjeevani project. See LICENSE for details.

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: In Active Development

### Next Steps

1. ✅ Project structure created
2. ✅ API client with streaming support implemented
3. ⏳ Screen components to be implemented
4. ⏳ UI components library to be created
5. ⏳ Navigation integration testing
6. ⏳ Device-specific optimizations
