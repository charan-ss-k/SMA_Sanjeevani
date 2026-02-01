# Mobile App API Client Documentation

## Overview

The API client (`src/api/client.js`) is a comprehensive HTTP client built on Axios with specialized support for:

- **Server-Sent Events (SSE)** streaming from Ollama LLM backends
- **Text-to-Speech (TTS)** audio streaming and playback
- **Authentication** with JWT tokens and auto-refresh
- **Secure token storage** using Expo's SecureStore
- **Comprehensive error handling** with retry logic

## Architecture

### Core Components

```
APIClient (Singleton)
├── Axios Instance
│   ├── Request Interceptor (Auth)
│   └── Response Interceptor (Token Refresh)
├── Secure Storage (Token/User Data)
├── Streaming Methods (SSE/WebSocket)
└── API Endpoints (Auth, AI, Health, etc.)
```

## Authentication Flow

### 1. Login/Signup

```javascript
const response = await apiClient.login('email@example.com', 'password');
// Returns: { access_token, refresh_token, user_id, ... }
```

Token stored securely:
```
SecureStore:
  ├── authToken (JWT)
  ├── refreshToken (JWT)
  └── userId (User ID)
```

### 2. Token Lifecycle

```
Request
  ↓
[Interceptor] Add Auth Header
  ↓
Backend Response
  ↓
If 401 Unauthorized:
  → [Interceptor] Refresh Token
  → Retry Original Request
  ↓
Return Response
```

### 3. Logout

```javascript
await apiClient.logout();
// Clears all secure storage and local tokens
```

## Streaming Implementation

### Server-Sent Events (SSE)

The backend must send responses in SSE format:

```
POST /ai/chat/stream
Accept: text/event-stream

Response:
data: {"chunk": "Hello "}
data: {"chunk": "world"}
data: {"chunk": "!"}
```

### Client-Side Streaming

```javascript
await apiClient.streamLLMResponse(
  messages,
  (chunk) => {
    // Called for each chunk
    console.log('Chunk:', chunk);
  },
  (error) => {
    // Called on error
    console.error('Error:', error);
  },
  () => {
    // Called when complete
    console.log('Stream finished');
  }
);
```

### Implementation Details

The streaming implementation:

1. **Opens fetch stream** with SSE MIME type
2. **Reads response body** incrementally
3. **Buffers partial lines** (SSE lines split across chunks)
4. **Parses JSON** from `data: {...}` lines
5. **Invokes callbacks** for each chunk
6. **Handles errors** gracefully

## TTS Integration

### Generate and Play

```javascript
// Simple generation
const { audio_url } = await apiClient.generateTTS(
  'Take medication with water',
  'en'
);

// Play from URL
await ttsService.playAudio(audio_url);
```

### Stream TTS

```javascript
const response = await apiClient.streamTTS(
  'Medical advice here',
  'en',
  'voice_id'
);

// Blob is the audio data
const blob = await response.blob();
// Process blob (e.g., play directly)
```

## API Endpoints Reference

### Authentication

```javascript
// Login
await apiClient.login(email, password)
// Returns: { access_token, refresh_token, user_id, full_name }

// Sign up
await apiClient.signup(email, password, fullName)
// Returns: { access_token, refresh_token, user_id, full_name }

// Refresh token
await apiClient.refreshAuthToken()
// Returns: new access_token

// Logout
await apiClient.logout()

// Get profile
const profile = await apiClient.get('/auth/profile')
```

### LLM/Chat

```javascript
// Stream chat response
await apiClient.streamLLMResponse(
  messages,           // Array of { role, content }
  onChunk,           // Callback for each chunk
  onError,           // Error callback
  onComplete         // Completion callback
)

// Get chat history
const history = await apiClient.get('/ai/chat/history')

// Delete chat
await apiClient.delete('/ai/chat/123')
```

### Symptoms & Recommendations

```javascript
// Stream symptom recommendation
await apiClient.streamSymptomRecommendation(
  ['fever', 'cough'],
  onChunk,
  onError,
  onComplete
)

// Get history
const history = await apiClient.get('/symptoms/history')
```

### Text-to-Speech

```javascript
// Generate TTS
const result = await apiClient.generateTTS(
  text,      // String to synthesize
  language,  // 'en', 'hi', 'ta', etc.
  voiceId    // Voice identifier
)

// Stream TTS
const response = await apiClient.streamTTS(
  text,
  language,
  voiceId
)

// Get available voices
const voices = await apiClient.get('/tts/voices')
```

### Medicine & Health

```javascript
// Identify from image
const result = await apiClient.identifyMedicineFromImage(imageUri)

// Search medicines
const results = await apiClient.get('/medicine/search?q=aspirin')

// Analyze prescription
const analysis = await apiClient.analyzePrescriptionImage(imageUri)

// Medicine history
const history = await apiClient.get('/medicine/history')
```

### Appointments

```javascript
// Create appointment
const apt = await apiClient.post('/appointments', {
  doctor_id: 123,
  date: '2026-02-15',
  time: '10:00'
})

// List appointments
const list = await apiClient.get('/appointments')

// Cancel appointment
await apiClient.delete('/appointments/456')
```

### Reminders

```javascript
// Create
const reminder = await apiClient.post('/reminders', {
  medication: 'Aspirin',
  frequency: 'twice_daily',
  time: '08:00'
})

// List
const all = await apiClient.get('/reminders')

// Update
await apiClient.put('/reminders/789', { status: 'active' })

// Delete
await apiClient.delete('/reminders/789')
```

## Error Handling

### Error Structure

```javascript
try {
  await apiClient.post('/auth/login', { ... });
} catch (error) {
  error.message      // 'User not found'
  error.status       // 404
  error.code         // 'ERR_NOT_FOUND'
  error.originalError // Original Axios error
}
```

### Common Error Codes

```
401  - Unauthorized (invalid/expired token)
403  - Forbidden (insufficient permissions)
404  - Not found
422  - Validation error
500  - Server error
```

### Error Recovery

```javascript
try {
  await apiClient.post('/api/endpoint', data);
} catch (error) {
  if (error.status === 401) {
    // Token expired - already auto-refreshed
    // If refresh failed, user is logged out
  } else if (error.status === 422) {
    // Validation error
    console.log(error.response.data.detail);
  } else {
    // Generic error
    showToast(error.message);
  }
}
```

## Configuration

### Environment Variables

```javascript
// config/environment.js
{
  API_BASE_URL: 'http://192.168.1.100:8000',
  API_TIMEOUT: 30000,
  ENABLE_AI_STREAMING: true,
  ENABLE_TTS: true,
  DEBUG: true
}
```

### Runtime Configuration

```javascript
// Change base URL at runtime
apiClient.baseURL = 'http://new-server:8000';

// Create new client
apiClient.createClient();
```

## Performance Optimization

### Request Caching

```javascript
// Cache responses manually
const cacheMap = new Map();

async function getCachedData(key, fetchFn) {
  if (cacheMap.has(key)) {
    return cacheMap.get(key);
  }
  const data = await fetchFn();
  cacheMap.set(key, data);
  return data;
}

const doctors = await getCachedData(
  'doctors-list',
  () => apiClient.get('/doctors')
);
```

### Batch Requests

```javascript
// Parallel requests
const [doctors, medicines, appointments] = await Promise.all([
  apiClient.get('/doctors'),
  apiClient.get('/medicine/history'),
  apiClient.get('/appointments')
]);
```

### Streaming Best Practices

```javascript
// 1. Create accumulator for large responses
let fullText = '';
await apiClient.streamLLMResponse(
  messages,
  (chunk) => {
    fullText += chunk;
    // Update UI incrementally
    setStreamingText(fullText);
  },
  onError,
  onComplete
);

// 2. Use cancellation for long operations
const stream = new CancellableStream();
// Start streaming...
// If user cancels
stream.cancel();
```

## Debugging

### Enable Debug Logs

```javascript
// config/environment.js
DEBUG: true

// Logs all API calls:
// [API] POST /auth/login
// [API Error] 401 Unauthorized
// [TTS] Generating speech...
```

### Monitor Network

```javascript
// Add custom interceptor for logging
apiClient.client.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
      duration: Date.now() - startTime
    });
    return response;
  }
);
```

## Security Considerations

1. **Token Storage**: Uses Expo SecureStore (hardware-encrypted)
2. **HTTPS Only**: Production should use HTTPS
3. **Request Signing**: Add signature validation if needed
4. **Input Validation**: Validate before sending
5. **Error Messages**: Don't expose sensitive info

## Testing

### Mock API Client

```javascript
// For testing components
const mockApiClient = {
  streamLLMResponse: jest.fn((msgs, onChunk) => {
    onChunk('Hello ');
    onChunk('world');
  }),
  login: jest.fn(() => ({ access_token: 'token' }))
};

// Use in tests
jest.mock('../api/client', () => mockApiClient);
```

---

**Version**: 1.0.0  
**Last Updated**: January 2026
