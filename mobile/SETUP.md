# Sanjeevani Mobile App - Setup & Configuration Guide

## Overview
This is a React Native mobile application that mirrors the Sanjeevani web frontend while integrating with the Python/FastAPI backend. The app features AI streaming, Text-to-Speech (TTS), medicine identification, prescription analysis, and appointment booking.

## Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install
# or
yarn install
```

### 2. Configure Backend URL

Edit `config/environment.js` and update the `API_BASE_URL` to your Python backend server:

```javascript
// For development (replace with your server IP)
API_BASE_URL: 'http://192.168.1.100:8000'  // Change to your server's IP address
```

Alternatively, create a `.env` file:

```bash
cp .env.example .env
```

Then edit `.env`:

```
REACT_APP_API_BASE_URL=http://192.168.1.100:8000
REACT_APP_API_TIMEOUT=30000
REACT_APP_DEBUG_LOGS=true
```

### 3. Run the App

**Start the development server:**
```bash
npm start
```

**Run on Android:**
```bash
npm run android
# or
expo start --android
```

**Run on iOS:**
```bash
npm run ios
# or
expo start --ios
```

**Run on Web:**
```bash
npm run web
```

## Project Structure

```
mobile/
├── App.js                    # Root app component with navigation
├── package.json              # Dependencies
├── app.json                  # Expo config
├── babel.config.js           # Babel configuration
├── config/
│   └── environment.js        # Environment variables and config
├── src/
│   ├── api/
│   │   ├── client.js         # Core API client with streaming support
│   │   └── routes.js         # API endpoint constants
│   ├── components/           # Reusable UI components
│   ├── context/
│   │   ├── AuthContext.js    # Authentication state management
│   │   ├── ChatContext.js    # Chat/LLM history state
│   │   └── HealthContext.js  # Medicine and health data state
│   ├── hooks/
│   │   └── useCustomHooks.js # Custom React hooks
│   ├── screens/              # Screen components by feature
│   │   ├── auth/
│   │   ├── home/
│   │   ├── chat/
│   │   ├── health/
│   │   ├── doctors/
│   │   ├── appointments/
│   │   ├── reminders/
│   │   └── dashboard/
│   ├── services/
│   │   └── ttsService.js     # Text-to-Speech service
│   ├── utils/
│   │   ├── streamingUtils.js # Streaming and SSE utilities
│   │   ├── helpers.js        # Common utility functions
│   │   └── theme.js          # Colors, spacing, typography
│   └── assets/               # Images, icons, fonts
└── docs/                     # Documentation
```

## Key Features & Implementation

### 1. API Client with Streaming Support

The `src/api/client.js` provides:

- **Axios-based HTTP client** with interceptors for auth token handling
- **Server-Sent Events (SSE) streaming** for LLM chat responses
- **TTS endpoint streaming** for audio generation
- **Automatic token refresh** on 401 errors
- **Secure token storage** using Expo's SecureStore
- **Error handling** with detailed error messages

**Usage Example:**

```javascript
import apiClient from './src/api/client';

// Non-streaming request
const response = await apiClient.post('/medicine/search', { query: 'aspirin' });

// Streaming LLM response
await apiClient.streamLLMResponse(
  messages,
  (chunk) => console.log(chunk),     // onChunk callback
  (error) => console.error(error),   // onError callback
  () => console.log('Complete')      // onComplete callback
);

// TTS generation
const tts = await apiClient.generateTTS('Hello world', 'en');

// Login
const user = await apiClient.login('user@example.com', 'password123');
```

### 2. Text-to-Speech Integration

Located in `src/services/ttsService.js`:

- **Audio session initialization** with proper iOS/Android settings
- **TTS generation and playback** from backend
- **Streaming TTS** with chunked responses
- **Playback controls**: play, pause, resume, stop
- **File caching** for offline playback

**Usage Example:**

```javascript
import ttsService from './src/services/ttsService';

// Simple synthesis and play
await ttsService.synthesizeAndPlay('Take aspirin for headache', 'en');

// Stream and play with progress
await ttsService.streamAndPlayTTS(
  'Medical advice here',
  'en',
  'default',
  (progress) => console.log(progress)
);

// Playback controls
await ttsService.pauseAudio();
await ttsService.resumeAudio();
await ttsService.stopAudio();
```

### 3. Streaming Utilities

Located in `src/utils/streamingUtils.js`:

- **`parseSSEStream()`** - Parse Server-Sent Events from backend
- **`StreamAccumulator`** - Buffer streamed text chunks
- **`retryStreamingRequest()`** - Retry with exponential backoff
- **`CancellableStream`** - Cancel long-running requests
- **`safeStreamingHandler`** - Safe error handling for streams

**Usage Example:**

```javascript
import { CancellableStream, parseSSEStream } from './src/utils/streamingUtils';

const stream = new CancellableStream();
const response = await fetch(url, { signal: stream.getSignal() });

await parseSSEStream(
  response,
  (chunk) => { /* onChunk */ },
  (error) => { /* onError */ },
  () => { /* onComplete */ }
);

// Cancel if needed
stream.cancel();
```

### 4. State Management (Context API)

**AuthContext** (`src/context/AuthContext.js`):
```javascript
const { user, isAuthenticated, login, signup, logout } = useAuth();
```

**ChatContext** (`src/context/ChatContext.js`):
```javascript
const { chatHistory, sendMessage, clearHistory } = useChat();
```

**HealthContext** (`src/context/HealthContext.js`):
```javascript
const {
  medicineHistory,
  prescriptions,
  reminders,
  fetchPrescriptions,
  identifyMedicineFromImage,
  createReminder,
} = useHealth();
```

### 5. Custom Hooks

Located in `src/hooks/useCustomHooks.js`:

- **`useStreaming()`** - Manage streaming requests with cancellation
- **`useAPICall()`** - Handle API calls with loading states
- **`useDebouncedValue()`** - Debounce input values
- **`useForm()`** - Manage form state and validation

### 6. Navigation Structure

Uses `@react-navigation/native` with:

- **Auth Stack** - Login, signup, onboarding screens
- **App Tabs** - Bottom tab navigation for main app
- **Nested Stacks** - Each tab has its own navigation stack

## Backend Integration

### Required Backend Endpoints

The backend must support these endpoints:

```
Authentication:
  POST   /auth/login
  POST   /auth/signup
  POST   /auth/logout
  POST   /auth/refresh
  GET    /auth/profile

AI/LLM:
  POST   /ai/chat/stream              (SSE streaming)
  GET    /ai/chat/history

Health/Symptoms:
  POST   /symptoms/recommend/stream   (SSE streaming)
  GET    /symptoms/history

Text-to-Speech:
  POST   /tts/generate
  POST   /tts/stream                  (Audio streaming)
  GET    /tts/voices

Medicine:
  POST   /medicine/identify           (Image upload)
  GET    /medicine/search
  GET    /medicine/history

Prescriptions:
  POST   /prescriptions/analyze       (Image upload)
  GET    /prescriptions
  GET    /prescriptions/:id

Doctors:
  GET    /doctors
  GET    /doctors/search
  GET    /doctors/:id

Appointments:
  POST   /appointments
  GET    /appointments
  GET    /appointments/:id
  POST   /appointments/:id/cancel

Reminders:
  POST   /reminders
  GET    /reminders
  PUT    /reminders/:id
  DELETE /reminders/:id
```

### API Response Format

**Streaming responses (SSE):**
```json
data: {"chunk": "text portion"}
data: {"chunk": " more text"}
data: {"error": "optional error message"}
```

**Regular responses:**
```json
{
  "user_id": 123,
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "full_name": "John Doe"
}
```

### Authentication

- Tokens stored securely using `expo-secure-store`
- Bearer token sent in `Authorization: Bearer <token>` header
- Auto-refresh on 401 errors
- Tokens cleared on logout

## Networking Configuration

### Update Backend IP Address

The app must connect to your Python backend server. Update in `config/environment.js`:

```javascript
// Development - Local Network
API_BASE_URL: 'http://192.168.1.100:8000'  // Your server IP

// Production - Remote Server
API_BASE_URL: 'https://api.sanjeevani.app'
```

### Network Troubleshooting

**Connection Refused:**
- Verify Python backend is running
- Check firewall allows connections on port 8000
- Ensure mobile device is on same network as backend

**Timeout Issues:**
- Increase `API_TIMEOUT` in `config/environment.js`
- Check network latency
- Verify backend is not overloaded

**CORS/Permission Issues:**
- Backend must have proper CORS headers
- Check backend logs for errors

## Debugging & Logging

### Enable Debug Logs

Set in `config/environment.js`:
```javascript
DEBUG: true
```

Logs include:
- API requests/responses
- Streaming progress
- Auth state changes
- Error details

### VS Code Debugging

Install Expo and use VS Code debugger to debug React Native code directly.

## Building for Production

### Android APK/AAB

```bash
eas build --platform android --auto-submit
```

### iOS Build

```bash
eas build --platform ios
```

## Dependencies

### Core
- `react` - UI framework
- `react-native` - Mobile framework
- `expo` - Development platform
- `axios` - HTTP client

### Navigation
- `@react-navigation/native`
- `@react-navigation/stack`
- `@react-navigation/bottom-tabs`

### Features
- `expo-av` - Audio/video playback
- `expo-file-system` - File system access
- `expo-secure-store` - Secure token storage
- `expo-task-manager` - Background tasks

### State
- `zustand` - State management (optional)

### Utilities
- `moment` - Date/time handling
- `lodash.debounce` - Debouncing

## Troubleshooting

### Module not found errors
```bash
npm install
npm start -- --reset-cache
```

### Audio not playing
- Check `expo-av` permissions in `app.json`
- Verify audio session initialized in `App.js`
- Check Android audio permissions

### Streaming not working
- Verify backend supports SSE
- Check network connectivity
- Review browser/app network tab for response format

### Token expired
- App automatically refreshes on 401
- If refresh fails, user is logged out
- Check backend token expiry times

## Performance Tips

1. **Lazy load screens** - Use React.lazy and Suspense
2. **Memoize components** - Use React.memo for optimization
3. **Optimize images** - Use appropriately sized images
4. **Batch API calls** - Use Promise.all for parallel requests
5. **Cache responses** - Store frequently accessed data locally

## Security Best Practices

1. **Never hardcode credentials** - Use .env files
2. **Use HTTPS in production** - Only http for development
3. **Validate input** - Check all user inputs before sending
4. **Handle errors gracefully** - Don't expose sensitive info in errors
5. **Keep dependencies updated** - Regularly update packages

## Support & Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [Backend Integration Guide](../backend/README.md)

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Maintainer**: Sanjeevani Team
