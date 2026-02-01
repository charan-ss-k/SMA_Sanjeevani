# Mobile Development Quick Reference

## 🚀 Quick Commands

```bash
# Start development server
npm start

# Run on device/emulator
npm run android          # Android
npm run ios             # iOS
npm run web             # Web

# Install dependencies
npm install

# Clean cache
npm start -- --reset-cache

# Run tests
npm test
```

## 📱 Common Patterns

### Using Authentication

```javascript
import { useAuth } from '../context/AuthContext';

export function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return <App user={user} />;
}
```

### Streaming API Response

```javascript
import apiClient from '../api/client';

let fullText = '';

await apiClient.streamLLMResponse(
  [{ role: 'user', content: 'Hello' }],
  (chunk) => {
    fullText += chunk;
    setDisplayText(fullText);  // Update UI
  },
  (error) => alert(error.message),
  () => console.log('Done')
);
```

### Using Health Data

```javascript
import { useHealth } from '../context/HealthContext';

export function HealthScreen() {
  const {
    medicineHistory,
    fetchMedicineHistory,
    identifyMedicineFromImage,
    isLoading
  } = useHealth();

  React.useEffect(() => {
    fetchMedicineHistory();
  }, []);

  const handleImage = async (imageUri) => {
    const result = await identifyMedicineFromImage(imageUri);
    console.log(result);
  };

  return (
    <FlatList
      data={medicineHistory}
      renderItem={({ item }) => <MedicineCard {...item} />}
    />
  );
}
```

### TTS Playback

```javascript
import ttsService from '../services/ttsService';

// Simple
await ttsService.synthesizeAndPlay('Hello world', 'en');

// Stream
await ttsService.streamAndPlayTTS('Text', 'en', 'default', 
  (progress) => console.log(progress)
);

// Controls
await ttsService.pauseAudio();
await ttsService.resumeAudio();
await ttsService.stopAudio();
```

### Using Custom Hooks

```javascript
import { useForm, useStreaming, useAPICall } from '../hooks/useCustomHooks';

// Form handling
const { values, errors, handleChange, handleSubmit } = useForm(
  { email: '', password: '' },
  async (values) => {
    await apiClient.login(values.email, values.password);
  }
);

// API calls
const { data, isLoading, error, execute } = useAPICall(
  () => apiClient.get('/doctors')
);

// Streaming
const { stream, cancel } = useStreaming();

const handleStart = async () => {
  await stream(
    () => apiClient.streamLLMResponse(...),
    {
      onChunk: (chunk) => console.log(chunk),
      onError: (err) => console.error(err),
      retryOnFailure: true
    }
  );
};

const handleCancel = () => cancel();
```

## 🎨 Using Theme

```javascript
import { colors, spacing, typography, borderRadius } from '../utils/theme';
import { View, Text } from 'react-native';

<View style={{
  padding: spacing.md,
  backgroundColor: colors.background,
  borderRadius: borderRadius.md,
  borderColor: colors.border,
  borderWidth: 1
}}>
  <Text style={[typography.h3, { color: colors.text }]}>
    Title
  </Text>
  <Text style={[typography.body, { color: colors.textSecondary }]}>
    Description
  </Text>
</View>
```

## 🔧 Configuration

### Change Backend URL

**config/environment.js:**
```javascript
API_BASE_URL: 'http://192.168.1.100:8000'  // Your server
```

### Enable/Disable Features

**config/environment.js:**
```javascript
ENABLE_AI_STREAMING: true   // LLM streaming
ENABLE_TTS: true            // Audio
DEBUG: true                 // Console logs
```

## 📡 API Patterns

### Simple Request

```javascript
const data = await apiClient.get('/endpoint');
const result = await apiClient.post('/endpoint', { field: 'value' });
```

### Streaming Request

```javascript
await apiClient.streamLLMResponse(
  messages,
  onChunk,
  onError,
  onComplete
);
```

### Image Upload

```javascript
const result = await apiClient.identifyMedicineFromImage(imageUri);
const analysis = await apiClient.analyzePrescriptionImage(imageUri);
```

### Parallel Requests

```javascript
const [doctors, medicines] = await Promise.all([
  apiClient.get('/doctors'),
  apiClient.get('/medicine/history')
]);
```

## 🎯 Component Structure

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth, useHealth, useChat } from '../context/...';
import { colors, spacing } from '../utils/theme';

export default function ComponentName() {
  // 1. Get context/state
  const { user } = useAuth();
  const { data, isLoading, fetchData } = useHealth();
  const [localState, setLocalState] = useState('');

  // 2. Initialize/fetch data
  useEffect(() => {
    fetchData();
  }, []);

  // 3. Event handlers
  const handlePress = async () => {
    try {
      // Do something
    } catch (error) {
      alert(error.message);
    }
  };

  // 4. Loading state
  if (isLoading) return <ActivityIndicator />;

  // 5. Render
  return (
    <ScrollView style={{ padding: spacing.md }}>
      <Text style={{ color: colors.text }}>Content</Text>
    </ScrollView>
  );
}
```

## 🧭 Navigation

### Navigate to Screen

```javascript
import { useNavigation } from '@react-navigation/native';

export function MyComponent() {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('ChatTab', { screen: 'ChatMain' });
  };

  return <Button onPress={handlePress} />;
}
```

### Pass Parameters

```javascript
// Navigate with params
navigation.navigate('Screen', { paramName: value });

// Read params
const { paramName } = route.params;
```

## 🐛 Debugging

### Enable Logs

```javascript
// config/environment.js
DEBUG: true
```

### Console Logging

```javascript
if (DEBUG) console.log('[Feature] Message', data);
```

### Error Debugging

```javascript
try {
  await apiCall();
} catch (error) {
  console.error('Error details:', {
    message: error.message,
    status: error.status,
    code: error.code,
    response: error.response?.data
  });
}
```

## ✅ Checklist for New Feature

- [ ] Create context hook if managing state
- [ ] Create API methods in `client.js`
- [ ] Create screen component in `screens/`
- [ ] Add route to navigation in `App.js`
- [ ] Import and use appropriate contexts
- [ ] Handle loading/error states
- [ ] Test on Android and iOS
- [ ] Update documentation

## 🔐 Authentication

### Token Auto-Refresh

Handled automatically by interceptors. If token expires:

1. Request returns 401
2. Interceptor attempts refresh
3. Original request retried
4. Or user logged out on failure

### Manual Login

```javascript
const { login } = useAuth();

const handleLogin = async () => {
  try {
    await login(email, password);
    // User is now authenticated
  } catch (error) {
    alert(error.message);
  }
};
```

## 🎬 Performance Tips

1. **Use React.memo** for expensive components
2. **Debounce inputs** with `useDebouncedValue`
3. **Cancel streams** if component unmounts
4. **Cache API responses** when appropriate
5. **Lazy load images** with appropriate dimensions
6. **Use FlatList** instead of ScrollView for long lists

## 📚 File Imports

```javascript
// Contexts
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useHealth } from '../context/HealthContext';

// API & Services
import apiClient from '../api/client';
import ttsService from '../services/ttsService';
import API_ROUTES from '../api/routes';

// Hooks
import { useStreaming, useAPICall, useForm } from '../hooks/useCustomHooks';

// Utilities
import { formatDate, validateEmail } from '../utils/helpers';
import { colors, spacing, typography } from '../utils/theme';
import { parseSSEStream, CancellableStream } from '../utils/streamingUtils';

// React Native
import { View, Text, ScrollView, FlatList, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
```

## 🚨 Common Issues

### Connection Refused
- Backend not running
- Wrong IP address in config
- Firewall blocking port

**Fix:** Check backend URL in `config/environment.js`

### Timeout on Streaming
- Network too slow
- Backend processing slow
- Increase timeout in `config/environment.js`

### Audio Not Playing
- Audio session not initialized
- Wrong audio permissions
- Media player not working

**Fix:** Check TTS initialization in App.js

### Token Issues
- Token expired and refresh failed
- Secure storage cleared
- Need to login again

**Fix:** Call `logout()` and have user login

## 📖 Resources

- React Native Docs: https://reactnative.dev/
- Expo Docs: https://docs.expo.dev/
- React Navigation: https://reactnavigation.org/
- Axios: https://axios-http.com/

---

**Version**: 1.0.0  
**Last Updated**: January 2026
