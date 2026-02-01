# Mobile App Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Native Mobile App                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Navigation (React Navigation)               │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  AuthStack    │ AppTabs (MainApp)                  │  │  │
│  │  │  ┌──────────┐ │ ┌──────────────────────────────┐  │  │  │
│  │  │  │ Login    │ │ │ HomeTab │ HealthTab │ ChatTab│  │  │  │
│  │  │  │ Signup   │ │ │ BookTab │ SettingsTab         │  │  │  │
│  │  │  │ Onboard  │ │ └──────────────────────────────┘  │  │  │
│  │  │  └──────────┘ │                                    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             Context API (State Management)              │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │  │
│  │  │ AuthContext│  │ ChatContext│  │ HealthContext   │  │  │
│  │  │            │  │            │  │                │  │  │
│  │  │ user       │  │ chatHistory│  │ medicines      │  │  │
│  │  │ isAuth     │  │ messages   │  │ prescriptions  │  │  │
│  │  │ login()    │  │ send       │  │ reminders      │  │  │
│  │  │ logout()   │  │ clearHist()│  │ symptoms       │  │  │
│  │  └────────────┘  └────────────┘  └──────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               API Client Layer (Axios)                  │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  Core HTTP Client (axios instance)              │   │  │
│  │  │  ├─ Request Interceptor (Auth)                  │   │  │
│  │  │  ├─ Response Interceptor (401 Refresh)          │   │  │
│  │  │  └─ Error Handler                               │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │                      ↓                                   │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  Specialized Methods                            │   │  │
│  │  │  ├─ Streaming (SSE)                             │   │  │
│  │  │  │  └─ streamLLMResponse()                       │   │  │
│  │  │  │  └─ streamTTS()                              │   │  │
│  │  │  │  └─ streamSymptomRecommendation()            │   │  │
│  │  │  ├─ Image Upload                                │   │  │
│  │  │  │  └─ identifyMedicineFromImage()              │   │  │
│  │  │  │  └─ analyzePrescriptionImage()               │   │  │
│  │  │  └─ Auth Management                             │   │  │
│  │  │     └─ login/signup/logout/refresh              │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Services Layer                              │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │ TTSService (expo-av)                            │   │  │
│  │  │ ├─ initializeAudioSession()                     │   │  │
│  │  │ ├─ synthesizeAndPlay()                          │   │  │
│  │  │ ├─ streamAndPlayTTS()                           │   │  │
│  │  │ ├─ playAudio/pauseAudio/resumeAudio            │   │  │
│  │  │ └─ cleanup()                                    │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Utilities & Helpers                            │  │
│  │  ├─ Streaming Utils (parseSSE, CancellableStream)       │  │
│  │  ├─ Theme (colors, spacing, typography)                │  │
│  │  ├─ Helpers (formatDate, validate, truncate)            │  │
│  │  └─ Custom Hooks (useStreaming, useAPICall, etc)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓↑
                    Network Layer
                           ↓↑
┌─────────────────────────────────────────────────────────────────┐
│              Python Backend (FastAPI/Flask)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            REST API Endpoints                           │  │
│  │  ├─ Auth: /auth/login, /auth/signup, /auth/refresh      │  │
│  │  ├─ AI/LLM: /ai/chat/stream (SSE)                       │  │
│  │  ├─ Symptoms: /symptoms/recommend/stream (SSE)          │  │
│  │  ├─ TTS: /tts/generate, /tts/stream (Audio)             │  │
│  │  ├─ Medicine: /medicine/identify, /medicine/search      │  │
│  │  ├─ Prescriptions: /prescriptions/analyze               │  │
│  │  ├─ Doctors: /doctors, /doctors/search                  │  │
│  │  ├─ Appointments: /appointments, /appointments/:id      │  │
│  │  └─ Reminders: /reminders (CRUD)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓↑                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             Business Logic Layer                        │  │
│  │  ├─ Authentication (JWT)                               │  │
│  │  ├─ LLM Integration (Ollama)                            │  │
│  │  ├─ Text-to-Speech Generation                          │  │
│  │  ├─ Image Processing (Medicine ID, Prescription)       │  │
│  │  ├─ Medicine Database & Search                         │  │
│  │  └─ Appointment Management                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓↑                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Data Layer                                 │  │
│  │  └─ PostgreSQL Database                                 │  │
│  │     ├─ Users & Authentication                          │  │
│  │     ├─ Chat History                                    │  │
│  │     ├─ Medicine Data                                   │  │
│  │     ├─ Prescriptions                                   │  │
│  │     ├─ Appointments                                    │  │
│  │     └─ Reminders                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓↑                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           External Services                             │  │
│  │  ├─ Ollama (Local LLM)                                  │  │
│  │  ├─ Bhashini/TTS Service                                │  │
│  │  └─ Optional: Third-party APIs                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: AI Chat Streaming

```
User Input
   ↓
[ChatScreen Component]
   ↓
useChat() → sendMessage()
   ↓
[ChatContext]
   ↓
apiClient.streamLLMResponse()
   ↓
[Fetch with SSE Reader]
   ↓
Network Request
   ↓
Backend: POST /ai/chat/stream
   ↓
Ollama LLM Processing
   ↓
Server-Sent Events
   data: {"chunk": "text..."}
   ↓
[Mobile App SSE Parser]
   ↓
parseSSEStream()
   ↓
onChunk Callback
   ↓
Update UI with streaming text
   ↓
Display in ChatScreen
```

## Data Flow: TTS Audio

```
Text to Synthesize
   ↓
[Component] → ttsService.synthesizeAndPlay()
   ↓
apiClient.generateTTS()
   ↓
Network Request
   ↓
Backend: POST /tts/generate
   ↓
Bhashini/TTS Service
   ↓
Audio File Generated
   ↓
Network Response (audio_url)
   ↓
ttsService.playAudio()
   ↓
[expo-av Audio Player]
   ↓
Device Speaker Output
```

## Authentication Flow

```
User Input: Email + Password
   ↓
[LoginScreen]
   ↓
useAuth() → login()
   ↓
apiClient.login()
   ↓
Network Request: POST /auth/login
   ↓
Backend Authentication
   ↓
Response: { access_token, refresh_token, user_id }
   ↓
apiClient.setAuthToken()
   ↓
[expo-secure-store]
   ↓
Tokens Stored Securely
   ↓
AuthContext Updated
   ↓
Navigation → AppTabs
   ↓
[App Ready]

Auto-Refresh Flow:
─────────────────
API Request
   ↓
[Request Interceptor] Add Authorization Header
   ↓
Request sent
   ↓
Response: 401 Unauthorized
   ↓
[Response Interceptor]
   ↓
apiClient.refreshAuthToken()
   ↓
POST /auth/refresh with refresh_token
   ↓
New Access Token Received
   ↓
Retry Original Request with new token
   ↓
Success OR Logout if refresh fails
```

## Component Hierarchy

```
App (Root)
├── SafeAreaProvider
├── AuthProvider
│   ├── AuthContext
│   └── useAuth()
├── ChatProvider
│   ├── ChatContext
│   └── useChat()
├── HealthProvider
│   ├── HealthContext
│   └── useHealth()
└── NavigationContainer
    ├── AuthStack (if not authenticated)
    │   ├── OnboardingScreen
    │   ├── LoginScreen
    │   └── SignupScreen
    └── AppTabs (if authenticated)
        ├── HomeTab
        │   └── HomeStack
        │       └── HomeScreen
        ├── HealthTab
        │   └── HealthStack
        │       ├── SymptomCheckerScreen
        │       ├── MedicineIdentificationScreen
        │       └── PrescriptionAnalyzerScreen
        ├── ChatTab
        │   └── ChatStack
        │       └── ChatScreen
        ├── BookTab
        │   └── AppointmentStack
        │       ├── DoctorFindScreen
        │       └── AppointmentBookingScreen
        └── SettingsTab
            └── SettingsScreen
```

## State Flow: Example - Symptom Check

```
[SymptomCheckerScreen]
       ↓ (user selects symptoms)
       ↓
  [useHealth()]
       ↓
  healthContext.streamSymptomRecommendation()
       ↓
  [apiClient]
       ↓
  fetch with SSE reader
       ↓
  Backend: POST /symptoms/recommend/stream
       ↓
  Ollama processes symptoms
       ↓
  Backend streams recommendations
       ↓
  data: {"recommendation": "Consider aspirin..."}
       ↓
  onChunk callback called
       ↓
  [HealthContext]
  addSymptomRecord()
       ↓
  symptomHistory updated
       ↓
  Component re-renders
       ↓
  Display streaming recommendation
       ↓
  [TTS Service]
  Optionally: synthesizeAndPlay()
       ↓
  [Audio Output]
  Play recommendation aloud
```

## Error Handling Flow

```
API Request
   ↓
Error Occurs
   ↓
[Response Interceptor]
   ↓
Error Status Check
   ├─ 401 Unauthorized
   │  └─ Attempt Token Refresh
   │     ├─ Success → Retry Request
   │     └─ Failure → Logout
   ├─ 422 Validation Error
   │  └─ Extract Error Details
   │     └─ Show to User
   ├─ 500 Server Error
   │  └─ Log & Notify User
   └─ Network Error
      └─ Show Connection Error
         └─ Offer Retry
         
Exception Handling
   ↓
[try/catch] in component
   ↓
Error caught
   ├─ Display Toast/Alert
   ├─ Log to Debug Console
   └─ Update UI state
```

## File Organization

```
mobile/
├── Core
│   ├── App.js                    (Root + Navigation)
│   ├── package.json              (Dependencies)
│   ├── app.json                  (Expo config)
│   └── babel.config.js
│
├── Configuration
│   ├── config/
│   │   └── environment.js        (API URL, flags)
│   └── .env.example
│
├── API Layer
│   └── src/api/
│       ├── client.js             (Axios + Streaming)
│       └── routes.js             (Endpoint constants)
│
├── State Management
│   └── src/context/
│       ├── AuthContext.js        (User auth)
│       ├── ChatContext.js        (Chat history)
│       └── HealthContext.js      (Health data)
│
├── Services
│   └── src/services/
│       └── ttsService.js         (Audio playback)
│
├── UI Logic
│   ├── src/hooks/                (Custom React hooks)
│   └── src/screens/              (Screen components)
│
├── Utilities
│   └── src/utils/
│       ├── streamingUtils.js     (SSE parsing)
│       ├── helpers.js            (General utils)
│       └── theme.js              (Design tokens)
│
├── UI Components (To Create)
│   └── src/components/           (Reusable components)
│
├── Assets
│   └── src/assets/               (Images, icons)
│
└── Documentation
    ├── README.md                 (Main guide)
    ├── SETUP.md                  (Setup instructions)
    ├── QUICK_REFERENCE.md        (Developer guide)
    ├── DELIVERY_SUMMARY.md       (What was built)
    └── docs/API_CLIENT.md        (API details)
```

## Technology Stack Summary

```
Frontend Framework
└─ React Native 0.73.0

Development Platform
└─ Expo 50.0.0

State Management
├─ React Context API
└─ Custom Hooks

Navigation
├─ @react-navigation/native
├─ @react-navigation/stack
└─ @react-navigation/bottom-tabs

HTTP Client
└─ Axios 1.6.2

Audio/Media
└─ expo-av

File System
└─ expo-file-system

Secure Storage
└─ expo-secure-store

Notifications
└─ expo-notifications

Utilities
├─ lodash.debounce
├─ moment
└─ zustand (optional)

Backend Integration
├─ REST API (HTTP/HTTPS)
├─ Server-Sent Events (SSE)
└─ WebSocket (optional future)
```

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Architecture Pattern**: Layered (Presentation → State → API → Services → Data)
