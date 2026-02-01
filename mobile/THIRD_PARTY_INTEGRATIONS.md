# Third-Party Integrations & Services Guide

## Overview

This document outlines all third-party integrations available in the Sanjeevani mobile app, organized by category.

## 1. Analytics & Event Tracking

### Firebase Analytics
**Service File**: `services/analyticsService.js`

**Purpose**: Track user behavior, app usage, and key metrics.

**Key Methods**:
- `initialize(userId, userProperties)` - Initialize Firebase Analytics
- `logScreenView(screenName)` - Track screen navigation
- `logLogin(method, userId)` - Log login events
- `logSignup(method)` - Log signup events
- `logAppointmentBooked(appointmentDetails)` - Track appointment booking
- `logMedicineIdentified(medicineData)` - Track medicine identification
- `logChatMessage()` - Track chatbot interactions
- `logPaymentCompleted(paymentData)` - Track payment events
- `setUserProperty(key, value)` - Set custom user properties
- `setUserId(userId)` - Associate analytics with user ID

**Configuration**:
```javascript
import analyticsService from './services/analyticsService';

// Initialize in App.js
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```

**Events Tracked**:
- Screen views with screen names
- User authentication (signup, login)
- Appointment bookings
- Medicine identification
- Chat interactions
- Payment completions
- Custom user properties

---

## 2. Push Notifications

### Expo Push Notifications
**Service File**: `services/notificationService.js`

**Purpose**: Send timely reminders for medications and appointments.

**Key Methods**:
- `getPushToken()` - Get device's push notification token
- `registerDeviceToken(userId, token)` - Register token with backend
- `sendLocalNotification(title, body, data)` - Send local notification
- `scheduleNotification(triggerSeconds, title, body)` - Schedule notification
- `scheduleMedicineReminder(medicineName, times, doctorNotes)` - Schedule medicine reminders
- `scheduleAppointmentReminder(appointmentId, appointmentTime, minutesBefore)` - Appointment reminder
- `getScheduledNotifications()` - List all scheduled notifications
- `addNotificationResponseListener(handler)` - Handle notification taps
- `cancelNotification(notificationId)` - Cancel specific notification
- `cancelAllNotifications()` - Cancel all notifications

**Configuration**:
```javascript
import * as Notifications from 'expo-notifications';

// In App.js, set default notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

**Usage Examples**:
```javascript
// Schedule medicine reminder
import notificationService from './services/notificationService';

await notificationService.scheduleMedicineReminder(
  'Aspirin',
  [8, 14, 20], // 8 AM, 2 PM, 8 PM
  'Take with food'
);

// Schedule appointment reminder
await notificationService.scheduleAppointmentReminder(
  'apt_123',
  new Date('2024-12-20T10:00:00'),
  15 // 15 minutes before
);
```

**Notification Channels** (Android):
- Reminders: Medium importance for medicine/appointment reminders
- Urgent: High importance for critical alerts
- Chat: High importance for new messages

---

## 3. Authentication & Social Login

### Google Sign-In & Apple Sign-In
**Service File**: `services/socialAuthService.js`

**Purpose**: Provide OAuth authentication for quick signup/login.

**Key Methods**:
- `useGoogleSignIn(iosClientId, androidClientId)` - Configure Google Sign-In
- `handleGoogleSignIn()` - Trigger Google Sign-In flow
- `handleAppleSignIn(scopes)` - Trigger Apple Sign-In flow
- `isAppleSignInAvailable()` - Check if Apple Sign-In is available

**Configuration**:
```javascript
import socialAuthService from './services/socialAuthService';

// Google Sign-In
const result = await socialAuthService.handleGoogleSignIn(
  process.env.REACT_APP_GOOGLE_IOS_CLIENT_ID,
  process.env.REACT_APP_GOOGLE_ANDROID_CLIENT_ID
);

if (result.user) {
  // Send to backend for token exchange
  const response = await apiClient.post('/auth/google-signin', {
    idToken: result.idToken,
  });
}

// Apple Sign-In (iOS only)
if (await socialAuthService.isAppleSignInAvailable()) {
  const result = await socialAuthService.handleAppleSignIn([
    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    AppleAuthentication.AppleAuthenticationScope.EMAIL,
  ]);
}
```

**Configuration Keys**:
- `REACT_APP_GOOGLE_IOS_CLIENT_ID`
- `REACT_APP_GOOGLE_ANDROID_CLIENT_ID`

---

## 4. Video Conferencing

### Agora Video SDK
**Service File**: `services/videoConferencingService.js`

**Purpose**: Enable real-time video consultations between patients and doctors.

**Key Methods**:
- `generateAgoraToken(appointmentId)` - Get token for video session
- `initializeVideoCall(appointmentId)` - Start video call
- `endVideoCall(appointmentId)` - End video call
- `startRecording(appointmentId)` - Start recording consultation
- `stopRecording(appointmentId)` - Stop recording
- `startScreenShare(appointmentId)` - Share screen
- `stopScreenShare(appointmentId)` - Stop screen sharing
- `sendChatMessage(appointmentId, message)` - In-call messaging
- `getCallStatistics(appointmentId)` - Get call quality metrics

**Configuration**:
```javascript
import videoConferencingService from './services/videoConferencingService';

// Initialize video call
try {
  await videoConferencingService.initializeVideoCall('apt_123');
  
  // Start recording
  await videoConferencingService.startRecording('apt_123');
  
  // Share prescription document
  await videoConferencingService.startScreenShare('apt_123');
} catch (error) {
  console.error('Video call error:', error);
}
```

**Backend Endpoints Required**:
- `POST /api/video/agora-token` - Generate Agora token
- `POST /api/video/initialize` - Initialize call
- `POST /api/video/end` - End call
- `POST /api/video/recording/start` - Start recording
- `POST /api/video/recording/stop` - Stop recording
- `POST /api/video/screen-share/start` - Start screen share
- `POST /api/video/screen-share/stop` - Stop screen share

**Configuration Keys**:
- `REACT_APP_AGORA_APP_ID`
- `REACT_APP_AGORA_TEMP_TOKEN` (for testing)

---

## 5. Error Reporting & Crash Tracking

### Sentry
**Service File**: `services/errorReportingService.js`

**Purpose**: Track and report application errors and crashes.

**Key Methods**:
- `initialize(environment)` - Initialize Sentry
- `captureException(error, context)` - Report exceptions
- `captureMessage(message, level)` - Report messages
- `setUserContext(userId, email, username)` - Associate errors with user
- `addBreadcrumb(message, category, level)` - Add debug breadcrumbs
- `reportApiError(error, endpoint, method)` - Report API errors
- `reportCustomError(errorType, details)` - Report custom errors
- `setTag(key, value)` - Add error tags

**Configuration**:
```javascript
import errorReportingService from './services/errorReportingService';

// Initialize in App.js
errorReportingService.initialize(
  process.env.REACT_APP_SENTRY_DSN,
  __DEV__ ? 'development' : 'production'
);

// Capture errors
try {
  // risky operation
} catch (error) {
  errorReportingService.captureException(error, {
    userId: currentUser.id,
    action: 'appointment_booking',
  });
}

// Add breadcrumbs for debugging
errorReportingService.addBreadcrumb(
  'User clicked payment button',
  'user-action',
  'info'
);
```

**Configuration Keys**:
- `REACT_APP_SENTRY_DSN`

---

## 6. Health Data Integration

### Apple HealthKit (iOS) & Google Fit (Android)
**Service File**: `services/healthDataService.js`

**Purpose**: Access user's health data for comprehensive health tracking.

**Key Methods**:
- `requestHealthKitPermissions()` - Request health data access
- `getStepCount(startDate, endDate)` - Retrieve step count
- `getHeartRateData(startDate, endDate)` - Get heart rate data
- `getBloodPressureData(startDate, endDate)` - Get blood pressure
- `getBodyWeightData(startDate, endDate)` - Get weight data
- `getWorkoutData(startDate, endDate)` - Get workout history
- `syncHealthData(userId)` - Sync with backend
- `getDailySummary(date)` - Get day's health summary

**Configuration**:
```javascript
import healthDataService from './services/healthDataService';

// Request permissions
const hasAccess = await healthDataService.requestHealthKitPermissions();

if (hasAccess) {
  // Get step count for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stepData = await healthDataService.getStepCount(
    today,
    new Date()
  );
  
  // Get daily summary
  const summary = await healthDataService.getDailySummary(today);
  
  // Sync with backend
  await healthDataService.syncHealthData(userId);
}
```

**iOS HealthKit Permissions** (in `app.json`):
```json
{
  "plugins": [
    [
      "react-native-health",
      {
        "permissions": [
          "HKQuantityTypeIdentifierStepCount",
          "HKQuantityTypeIdentifierHeartRate",
          "HKQuantityTypeIdentifierBloodPressure",
          "HKQuantityTypeIdentifierBodyMass",
          "HKWorkoutTypeIdentifier"
        ]
      }
    ]
  ]
}
```

**Android Google Fit Scope**:
```javascript
// Scopes requested automatically
[
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
]
```

---

## 7. Payment Processing

### Multiple Payment Gateways
**Service File**: `services/paymentService.js`

**Purpose**: Process payments for appointments and services.

**Supported Gateways**:
1. **Razorpay** - Primary for India
2. **Stripe** - International
3. **PayPal** - Alternative international
4. **UPI** - India direct bank transfers

**Key Methods**:
- `initiatePayment(amount, orderId, gateway)` - Start payment
- `verifyPayment(paymentId, signature)` - Verify transaction
- `getPaymentHistory(userId, limit)` - Get payment records
- `getSupportedPaymentMethods()` - List available methods
- `getGatewayFee(amount, gateway)` - Calculate fee
- `refundPayment(paymentId, amount)` - Process refund

**Configuration**:
```javascript
import paymentService from './services/paymentService';

// Initiate payment
const order = await paymentService.initiatePayment(
  1000, // Amount in INR/USD
  'apt_123',
  'razorpay'
);

// Verify payment after successful payment
const verified = await paymentService.verifyPayment(
  order.payment_id,
  order.signature
);

if (verified) {
  // Update appointment status
}
```

**Gateway Fee Breakdown**:
- Razorpay: 2% of amount
- Stripe: 2.9% + $0.30 per transaction
- PayPal: 3.4% + $0.30 per transaction
- UPI: 0% (direct transfer)

**Configuration Keys**:
- `REACT_APP_RAZORPAY_KEY_ID`
- `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- `REACT_APP_PAYPAL_CLIENT_ID`
- `REACT_APP_UPI_MERCHANT_ID`

---

## 8. Text-to-Speech

### Expo TTS
**Service File**: `services/ttsService.js`

**Purpose**: Convert medical information to speech for accessibility.

**Key Methods**:
- `speak(text, options)` - Play text as speech
- `stop()` - Stop current speech
- `pause()` - Pause playback
- `resume()` - Resume playback
- `getAvailableVoices()` - List available voices
- `setLanguage(language)` - Change speech language
- `setSpeechRate(rate)` - Control speech speed (0.5-2.0)

**Configuration**:
```javascript
import ttsService from './services/ttsService';

// Speak prescription
await ttsService.speak(
  'Take Aspirin 500mg twice daily with meals',
  {
    language: 'en',
    rate: 0.9,
    pitch: 1.0,
  }
);

// Get available voices
const voices = await ttsService.getAvailableVoices();

// Set language
await ttsService.setLanguage('en-IN');
```

---

## Environment Configuration Template

Create `.env` file with the following keys:

```env
# API
REACT_APP_API_URL=http://localhost:8000/api

# Firebase Analytics
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
REACT_APP_FIREBASE_APP_ID=

# Google Sign-In
REACT_APP_GOOGLE_IOS_CLIENT_ID=
REACT_APP_GOOGLE_ANDROID_CLIENT_ID=

# Sentry Error Tracking
REACT_APP_SENTRY_DSN=

# Agora Video Conferencing
REACT_APP_AGORA_APP_ID=
REACT_APP_AGORA_TEMP_TOKEN=

# Payment Gateways
REACT_APP_RAZORPAY_KEY_ID=
REACT_APP_STRIPE_PUBLISHABLE_KEY=
REACT_APP_PAYPAL_CLIENT_ID=
REACT_APP_UPI_MERCHANT_ID=
```

---

## Backend API Endpoints

### Analytics
- `POST /api/analytics/sync` - Sync analytics data

### Notifications
- `POST /api/notifications/register` - Register device token
- `POST /api/notifications/send` - Send manual notification
- `GET /api/notifications/scheduled` - Get scheduled notifications

### Video Conferencing
- `POST /api/video/agora-token` - Generate Agora token
- `POST /api/video/initialize` - Initialize call
- `POST /api/video/end` - End call
- `POST /api/video/recording/start` - Start recording
- `POST /api/video/recording/stop` - Stop recording
- `POST /api/video/screen-share/start` - Start screen share
- `POST /api/video/screen-share/stop` - Stop screen share
- `GET /api/video/statistics/:appointmentId` - Get call stats

### Health Data
- `POST /api/health/sync` - Sync health data
- `GET /api/health/data` - Retrieve synced health data
- `GET /api/health/summary/:date` - Daily health summary

### Payments
- `POST /api/payments/initiate` - Start payment
- `POST /api/payments/verify` - Verify transaction
- `GET /api/payments/history` - Payment records
- `POST /api/payments/refund` - Process refund

### Authentication
- `POST /api/auth/google-signin` - Exchange Google token
- `POST /api/auth/apple-signin` - Exchange Apple token

---

## Integration Checklist

- [ ] Firebase Analytics configured and initialized
- [ ] Firebase app.json updated with Sentry plugin
- [ ] Google Sign-In client IDs obtained from Google Cloud Console
- [ ] Apple Sign-In configured in Apple Developer account
- [ ] Agora AppID created and configured
- [ ] Payment gateway accounts created (Razorpay/Stripe/PayPal)
- [ ] Sentry project created and DSN configured
- [ ] Backend endpoints implemented for all integrations
- [ ] .env file created with all keys
- [ ] Permissions configured in app.json (iOS/Android)
- [ ] Notification channels configured
- [ ] Health data permissions added to Info.plist (iOS)

---

## Troubleshooting

### Firebase Analytics Not Tracking
- Verify Firebase app ID in environment
- Check Analytics is initialized before use
- Ensure user is authenticated
- Check Firebase console for data

### Push Notifications Not Working
- Verify device token is registered with backend
- Check notification permissions granted
- Test with local notifications first
- Review notification channel configuration

### Google Sign-In Failed
- Verify correct client ID for platform
- Check Google Cloud Console OAuth settings
- Ensure SHA-1 fingerprint correct (Android)
- Test with debug keystore

### Agora Video Call Issues
- Verify AppID and token generation
- Check network connectivity
- Review Agora console for call logs
- Ensure permissions granted

### Payment Integration Issues
- Verify gateway credentials in .env
- Test with sandbox/test mode first
- Check backend verification endpoint
- Review payment gateway logs

---

## Security Considerations

1. **API Keys**: Never commit API keys to repository
2. **Payment Data**: Always verify payments server-side
3. **User Data**: Encrypt sensitive health data
4. **Authentication**: Use HTTPS for all API calls
5. **Error Logging**: Don't log sensitive user data in Sentry
6. **Health Data**: Request minimal required permissions
7. **Token Expiry**: Implement token refresh logic

---

## Performance Optimization

1. **Analytics**: Batch events for transmission
2. **Notifications**: Cancel old reminders before scheduling new ones
3. **Video**: Adaptive bitrate based on network
4. **Health Data**: Cache data locally with sync intervals
5. **Payments**: Pre-validate amount before initiating

