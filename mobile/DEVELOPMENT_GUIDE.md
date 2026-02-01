# React Native Mobile App - Development Guide

## 📁 Project Structure

```
mobile/
├── src/
│   ├── screens/              # All app screens
│   │   ├── auth/             # Authentication screens
│   │   │   ├── LoginScreen.js
│   │   │   ├── SignupScreen.js
│   │   │   └── OnboardingScreen.js
│   │   ├── home/             # Home/Dashboard
│   │   │   └── HomeScreen.js
│   │   ├── chat/             # AI Chat
│   │   │   └── ChatScreen.js
│   │   ├── health/           # Health features
│   │   │   ├── SymptomCheckerScreen.js
│   │   │   ├── MedicineIdentificationScreen.js
│   │   │   └── RemindersScreen.js
│   │   ├── appointments/     # Doctor & appointments
│   │   │   ├── DoctorFindScreen.js
│   │   │   └── AppointmentBookingScreen.js
│   │   ├── settings/         # User settings
│   │   │   └── SettingsScreen.js
│   │   └── index.js          # Screens barrel export
│   ├── components/           # Reusable UI components
│   │   ├── Button.js
│   │   ├── Input.js
│   │   ├── Card.js
│   │   ├── Loading.js
│   │   ├── Alert.js
│   │   ├── Avatar.js
│   │   ├── Badge.js
│   │   └── index.js
│   ├── context/              # State management
│   │   ├── AuthContext.js
│   │   ├── ChatContext.js
│   │   └── HealthContext.js
│   ├── api/                  # API integration
│   │   └── client.js
│   ├── services/             # Business logic services
│   │   └── ttsService.js
│   ├── utils/                # Utilities
│   │   ├── theme.js
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── hooks/                # Custom React hooks
│   │   └── useForm.js
│   ├── App.js                # Main app component
│   └── index.js              # Entry point
├── app.json                  # Expo configuration
├── package.json              # Dependencies
└── .env.example              # Environment template
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and update with your API URL:

```env
REACT_APP_API_URL=http://your-backend-url
REACT_APP_ENV=development
DEBUG=true
```

### 3. Start Development Server

```bash
npm start
```

Then choose your platform:
- `i` for iOS Simulator
- `a` for Android Emulator
- `w` for Web
- `j` for just open Expo DevTools

## 📱 Available Screens

### Authentication Flow
- **OnboardingScreen**: Feature showcase with carousel
- **LoginScreen**: Email/password authentication
- **SignupScreen**: New user registration

### Main App
- **HomeScreen**: Dashboard with quick access to features
- **ChatScreen**: AI conversation with streaming responses and TTS
- **SymptomCheckerScreen**: Symptom selection and AI analysis
- **MedicineIdentificationScreen**: Image-based medicine identification
- **DoctorFindScreen**: Search and filter doctors
- **AppointmentBookingScreen**: Schedule appointments
- **RemindersScreen**: Medication reminder management
- **SettingsScreen**: User preferences and account settings

## 🔧 Development Patterns

### Using Components

```javascript
import { Button, Input, Card, Alert } from '../components';

// Button
<Button
  title="Click me"
  onPress={() => {}}
  variant="primary"     // primary, secondary, outline, danger
  size="md"             // sm, md, lg
  isLoading={false}
  fullWidth={true}
/>

// Input
<Input
  label="Email"
  placeholder="you@example.com"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  error={errors.email}
/>

// Card
<Card variant="elevated" padding="md">
  <Text>Card content</Text>
</Card>

// Alert
<Alert
  type="success"     // info, success, error, warning
  message="Success!"
  onDismiss={() => {}}
  dismissAfter={3000}
/>
```

### Using Contexts

```javascript
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useHealth } from '../context/HealthContext';

// In your component
const { user, login, logout } = useAuth();
const { sendMessage, chatHistory } = useChat();
const { identifyMedicineFromImage } = useHealth();
```

### Creating New Screens

```javascript
import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button, Card } from '../components';
import { colors, spacing, typography } from '../utils/theme';

export default function MyNewScreen() {
  const [state, setState] = useState(null);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[typography.h3, { color: colors.text }]}>
        My Screen
      </Text>
      
      <Card variant="elevated" padding="md">
        <Text style={[typography.body, { color: colors.text }]}>
          Content here
        </Text>
      </Card>

      <Button title="Action" onPress={() => {}} fullWidth />
    </ScrollView>
  );
}
```

## 🎨 Theming System

All colors, spacing, and typography are centralized in `src/utils/theme.js`:

```javascript
import { colors, spacing, typography } from '../utils/theme';

// Colors
colors.primary        // Main brand color
colors.secondary      // Secondary brand color
colors.text          // Primary text
colors.textSecondary // Secondary text
colors.background    // Screen background
colors.white         // Pure white
colors.border        // Border color
colors.success       // Success color
colors.warning       // Warning color
colors.error         // Error color

// Spacing
spacing.xs           // 4px
spacing.sm           // 8px
spacing.md           // 12px
spacing.lg           // 16px
spacing.xl           // 24px

// Typography
typography.h1        // Large heading
typography.h3        // Heading
typography.h4        // Subheading
typography.body      // Regular text
typography.caption   // Small text
```

## 🔌 API Integration

The API client (`src/api/client.js`) handles all backend communication:

```javascript
import { apiClient } from '../api/client';

// Regular API calls
const response = await apiClient.post('/api/endpoint', data);

// Streaming LLM responses (with Server-Sent Events)
await apiClient.streamLLMResponse(
  prompt,
  (chunk) => {
    console.log('Received chunk:', chunk);
    // Update UI with chunk
  },
  () => {
    console.log('Stream complete');
  },
  (error) => {
    console.error('Stream error:', error);
  }
);

// TTS Streaming
await apiClient.streamTTS(
  text,
  (audioChunk) => {
    // Handle audio chunk
  }
);
```

## 🔐 Authentication

The auth system uses JWT tokens stored securely:

```javascript
const { user, login, signup, logout, isLoading } = useAuth();

// Login
await login(email, password);

// Signup
await signup({
  fullName: 'John Doe',
  email: 'john@example.com',
  password: 'password',
});

// Logout
await logout();
```

## 🧪 Testing

Run tests with:

```bash
npm test
```

## 📚 Key Dependencies

- **expo**: React Native framework
- **@react-navigation**: Navigation library
- **axios**: HTTP client
- **expo-secure-store**: Secure token storage
- **expo-av**: Audio playback and recording
- **expo-file-system**: File system access

## 🐛 Debugging

Enable debug mode by setting `DEBUG=true` in `.env`. Debug logs will appear in console.

## ✅ Checklist Before Release

- [ ] Update app version in `app.json`
- [ ] Update API endpoint to production
- [ ] Remove all `TODO` comments
- [ ] Test all screens on both iOS and Android
- [ ] Test offline behavior
- [ ] Verify all images load correctly
- [ ] Test with different screen sizes
- [ ] Update privacy policy and terms links
- [ ] Add analytics tracking
- [ ] Set up error reporting (Sentry, etc.)

## 📞 Support

For issues or questions:
1. Check the documentation in `/docs`
2. Review existing screens for patterns
3. Check API client for communication patterns
4. Review contexts for state management patterns

## 🚀 Deployment

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

### Web
```bash
expo export:web
```

---

**Last Updated**: $(date)
**Version**: 1.0.0
**React Native**: 0.73.0
**Expo**: 50.0.0
