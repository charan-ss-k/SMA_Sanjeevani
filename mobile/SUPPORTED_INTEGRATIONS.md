# Supported Mobile App Integrations

## Overview

This document outlines all third-party service integrations available in the Sanjeevani mobile app that are **synchronized with the backend**.

**Guideline**: Mobile integrations are only included if they have matching backend implementations.

---

## ✅ Implemented Integrations

### 1. Analytics & Event Tracking

**Service**: Firebase Analytics  
**File**: `services/analyticsService.js`  
**Status**: ✅ Implemented

**Capabilities**:
- Screen view tracking
- User login/signup event logging
- Custom event tracking for appointments, medicines, and chat
- Payment event tracking
- User property management

**Key Methods**:
```javascript
analyticsService.logScreenView(screenName)
analyticsService.logLogin(method)
analyticsService.logSignup(method)
analyticsService.logAppointmentBooked(appointmentDetails)
analyticsService.logMedicineIdentified(medicineData)
analyticsService.logChatMessage()
analyticsService.logPaymentCompleted(paymentData)
analyticsService.setUserProperty(key, value)
```

**Configuration**: 
```env
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
REACT_APP_FIREBASE_APP_ID=
```

---

### 2. Push Notifications

**Service**: Expo Push Notifications  
**File**: `services/notificationService.js`  
**Status**: ✅ Implemented

**Capabilities**:
- Local notifications
- Medicine reminders with scheduled times
- Appointment reminders with minutes-before configuration
- Device token management
- Notification response handling

**Key Methods**:
```javascript
notificationService.getPushToken()
notificationService.registerDeviceToken(userId, token)
notificationService.sendLocalNotification(title, body, data)
notificationService.scheduleNotification(triggerSeconds, title, body)
notificationService.scheduleMedicineReminder(medicineName, times, notes)
notificationService.scheduleAppointmentReminder(appointmentId, time, minutesBefore)
notificationService.getScheduledNotifications()
notificationService.cancelNotification(notificationId)
```

**Integration with Backend**:
- Device tokens registered via `POST /api/notifications/register`
- Reminder scheduling coordinated with backend appointments

---

### 3. Text-to-Speech

**Service**: Expo TTS  
**File**: `services/ttsService.js`  
**Status**: ✅ Implemented

**Capabilities**:
- Audio synthesis for prescriptions and medical information
- Multiple language support (via backend TTS service)
- Playback controls (play, pause, stop, resume)
- Configurable speech rate and pitch

**Key Methods**:
```javascript
ttsService.speak(text, options)
ttsService.stop()
ttsService.pause()
ttsService.resume()
ttsService.getAvailableVoices()
ttsService.setLanguage(language)
ttsService.setSpeechRate(rate)
```

**Backend Integration**:
- Uses backend `/api/tts` endpoint for multi-language support
- Supports all 9 Indian languages
- Fallback support for languages not available on device

---

### 4. Error Reporting & Crash Tracking

**Service**: Sentry  
**File**: `services/errorReportingService.js`  
**Status**: ✅ Implemented

**Capabilities**:
- Exception tracking
- Crash reporting
- Breadcrumb logging for debugging
- User context association
- Custom error tagging

**Key Methods**:
```javascript
errorReportingService.initialize(dsn, environment)
errorReportingService.captureException(error, context)
errorReportingService.captureMessage(message, level)
errorReportingService.setUserContext(userId, email, username)
errorReportingService.addBreadcrumb(message, category, level)
errorReportingService.reportApiError(error, endpoint, method)
errorReportingService.reportCustomError(errorType, details)
```

**Configuration**:
```env
REACT_APP_SENTRY_DSN=
```

---

### 5. Health Data Integration

**Service**: Apple HealthKit (iOS) & Google Fit (Android)  
**File**: `services/healthDataService.js`  
**Status**: ✅ Implemented

**Capabilities**:
- Step count retrieval
- Heart rate data access
- Blood pressure monitoring
- Body weight tracking
- Workout history
- Daily health summary aggregation
- Backend synchronization

**Key Methods**:
```javascript
healthDataService.requestHealthKitPermissions()
healthDataService.getStepCount(startDate, endDate)
healthDataService.getHeartRateData(startDate, endDate)
healthDataService.getBloodPressureData(startDate, endDate)
healthDataService.getBodyWeightData(startDate, endDate)
healthDataService.getWorkoutData(startDate, endDate)
healthDataService.syncHealthData(userId)
healthDataService.getDailySummary(date)
```

**Platform Requirements**:
- **iOS**: Apple HealthKit permissions via Info.plist
- **Android**: Google Fit API credentials

**Backend Integration**:
- Syncs health data via `POST /api/health/sync`
- User health profile accessible at `GET /api/health/data`

---

## ❌ Removed Integrations

The following integrations have been **removed** because they don't have backend implementations:

### 1. ~~Payment Processing~~
**Reason**: No payment endpoints in backend  
**Removed Files**:
- `services/paymentService.js`
- `screens/payments/PaymentScreen.js`
- `screens/payments/PaymentSuccessScreen.js`

### 2. ~~Video Conferencing~~
**Reason**: No Agora/video endpoints in backend  
**Removed Files**:
- `services/videoConferencingService.js`
- `screens/consultations/VideoConsultationScreen.js`

### 3. ~~Social Authentication~~
**Reason**: Backend only supports email/password JWT authentication  
**Removed Files**:
- `services/socialAuthService.js`

---

## Environment Variables

Create `.env` in mobile root with these variables:

```env
# API
REACT_APP_API_URL=http://localhost:8000/api

# Firebase Analytics
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Sentry Error Tracking
REACT_APP_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_HEALTH_DATA=true
```

---

## Backend API Endpoints Used

### Notifications
- `POST /api/notifications/register` - Register device token
- `POST /api/notifications/send` - Send manual notification
- `GET /api/notifications/scheduled` - Get scheduled notifications

### Health Data
- `POST /api/health/sync` - Sync health data
- `GET /api/health/data` - Retrieve synced health data
- `GET /api/health/summary/:date` - Daily health summary

### Text-to-Speech
- `POST /api/tts` - Generate speech audio

### Authentication (Built-in)
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

---

## Synchronization Status

| Service | Mobile | Backend | Sync |
|---------|--------|---------|------|
| Analytics | ✅ | ✅ | ✅ Client-side |
| Notifications | ✅ | ✅ | ✅ Bidirectional |
| TTS | ✅ | ✅ | ✅ API calls |
| Error Reporting | ✅ | ✅ | ✅ Event logging |
| Health Data | ✅ | ✅ | ✅ Sync endpoint |
| Payment | ❌ Removed | ❌ Not implemented | N/A |
| Video | ❌ Removed | ❌ Not implemented | N/A |
| Social Auth | ❌ Removed | ❌ Not implemented | N/A |

---

## Setup Instructions

### 1. Firebase Analytics Setup
```bash
# Install Firebase packages
npm install @react-native-firebase/analytics @react-native-firebase/app

# Configure in app.json
# Add GoogleService-Info.plist to iOS project
# Download google-services.json for Android
```

### 2. Sentry Setup
```bash
# Install Sentry
npm install @sentry/react-native

# Set REACT_APP_SENTRY_DSN in .env
# Initialize in App.js
```

### 3. Health Data Setup
```bash
# iOS (HealthKit)
npm install react-native-health

# Android (Google Fit)
npm install react-native-google-fit

# Configure permissions in app.json
```

### 4. Notifications Setup
```bash
# Already included with Expo
npm install expo-notifications

# Request permissions in app
# Register device token with backend
```

---

## Verification Checklist

Before deployment:

- [ ] All environment variables configured in `.env`
- [ ] Firebase Analytics project created and app registered
- [ ] Sentry project created and DSN added
- [ ] Health data permissions configured in app.json
- [ ] Backend running and accessible at `REACT_APP_API_URL`
- [ ] All required backend endpoints implemented
- [ ] Push notification permissions working on device
- [ ] Health data syncing enabled in settings
- [ ] Error reporting captures exceptions
- [ ] Analytics events appear in Firebase console

---

## Troubleshooting

### Analytics not tracking events
**Solution**: Ensure Firebase app is initialized before user interactions
- Check: `analyticsService.initialize()` called in App.js
- Verify: Firebase console shows events after 1-2 minutes

### Push notifications not received
**Solution**: Ensure device token registered with backend
- Check: Device token printed to console
- Verify: Token sent to `POST /api/notifications/register`
- Test: Send test notification from backend

### Health data not syncing
**Solution**: Verify permissions and backend endpoint
- Check: User granted health data permissions
- Verify: `POST /api/health/sync` endpoint exists in backend
- Test: Manual sync call returns data

### Error reporting not capturing crashes
**Solution**: Ensure Sentry is initialized correctly
- Check: `REACT_APP_SENTRY_DSN` is set
- Verify: `errorReportingService.initialize()` called early in App.js
- Test: Trigger test error, check Sentry dashboard

---

## Performance Optimization

1. **Analytics**: Batch events for transmission to reduce network calls
2. **Notifications**: Cancel old reminders before scheduling new ones
3. **Health Data**: Cache data locally with configurable sync intervals
4. **Error Reporting**: Don't log sensitive user data in Sentry

---

## Security Considerations

1. **API Keys**: Never commit API keys to repository
2. **User Data**: Encrypt sensitive health information
3. **Token Management**: Implement JWT refresh on 401 responses
4. **HTTPS**: Always use HTTPS for API calls
5. **Error Logging**: Don't log passwords or tokens

---

**Last Updated**: January 31, 2026  
**Status**: Synced with Backend ✅
