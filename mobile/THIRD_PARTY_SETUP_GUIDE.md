# Third-Party Service Implementation & Setup Guide

## Quick Start Checklist

This guide walks through setting up each third-party service in the Sanjeevani mobile app.

---

## 1. Firebase Analytics Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a new project"
3. Name it "Sanjeevani-Mobile"
4. Accept default settings
5. Click "Create project"

### Step 2: Register React Native App
1. Click iOS/Android icon
2. For iOS:
   - Bundle ID: `com.sanjeevani.mobile`
   - App Name: "Sanjeevani Mobile"
3. Download `GoogleService-Info.plist`
4. Add to Xcode project at root

### Step 3: Install Firebase SDK
```bash
npm install @react-native-firebase/analytics @react-native-firebase/app

# or with expo
expo install @react-native-firebase/analytics @react-native-firebase/app
```

### Step 4: Configure in app.json
```json
{
  "plugins": [
    [
      "@react-native-firebase/analytics",
      {
        "googleServicesFile": "./GoogleService-Info.plist"
      }
    ]
  ]
}
```

### Step 5: Initialize in App.js
```javascript
import firebaseAnalytics from '@react-native-firebase/analytics';
import analyticsService from './services/analyticsService';

useEffect(() => {
  analyticsService.initialize(userId, {
    plan: 'free',
    joinDate: new Date().toISOString(),
  });
}, [userId]);
```

### Verify Installation
- Open Firebase Console
- Navigate to Analytics
- Trigger app event (login, signup)
- Check Events tab after 30-60 seconds

**Estimated Setup Time**: 10 minutes

---

## 2. Expo Push Notifications Setup

### Step 1: Install Notifications Package
```bash
expo install expo-notifications
```

### Step 2: Enable Notifications in EAS

First, configure EAS in your project:

```bash
npm install --global eas-cli
eas init --id <project-id>
```

### Step 3: Configure app.json
```json
{
  "plugins": [
    "expo-notifications"
  ],
  "ios": {
    "bundleIdentifier": "com.sanjeevani.mobile"
  },
  "android": {
    "package": "com.sanjeevani.mobile"
  }
}
```

### Step 4: Request Permissions
```javascript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function requestNotificationPermissions() {
  if (!Device.isDevice) {
    alert('Must use physical device for push notifications');
    return false;
  }

  const { status: existingStatus } = 
    await Notifications.getPermissionsAsync();
  
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}
```

### Step 5: Get Device Token
```javascript
async function getPushToken() {
  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
  }
}
```

### Step 6: Test Notifications

Use Expo Notifications API:

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
    "sound": "default",
    "title": "Test Notification",
    "body": "Test from backend",
    "data": { "test": true }
  }'
```

**Estimated Setup Time**: 15 minutes

---

## 3. Google Sign-In Setup

### Step 1: Create OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "Sanjeevani"
3. Enable Google+ API
4. Go to OAuth 2.0 Credentials
5. Create credentials → OAuth 2.0 Client ID

### Step 2: iOS Configuration
1. Select "iOS" as application type
2. Bundle ID: `com.sanjeevani.mobile`
3. Get the **iOS Client ID**
4. Download configuration

### Step 3: Android Configuration
1. Create new credential → Android
2. Package name: `com.sanjeevani.mobile`
3. Get SHA-1 fingerprint:
   ```bash
   # Debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
4. Add SHA-1 to Google Console
5. Get the **Android Client ID**

### Step 4: Install SDK
```bash
npm install @react-native-google-signin/google-signin
# or with Expo
expo install expo-google-app-auth
```

### Step 5: Configure app.json
```json
{
  "ios": {
    "googleSignIn": {
      "clientId": "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com"
    }
  },
  "android": {
    "googleSignIn": {
      "apiKey": "YOUR_ANDROID_API_KEY"
    }
  }
}
```

### Step 6: Test Sign-In
```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
});

async function signIn() {
  try {
    const data = await GoogleSignin.signIn();
    console.log('Signed in as:', data.user.name);
    return data;
  } catch (error) {
    console.error('Sign-in error:', error);
  }
}
```

**Estimated Setup Time**: 20 minutes

---

## 4. Apple Sign-In Setup

### Step 1: Enable in Apple Developer Account
1. Go to [Apple Developer](https://developer.apple.com)
2. Select your app in "App IDs"
3. Enable "Sign in with Apple" capability
4. Return to Xcode and enable in Signing & Capabilities

### Step 2: Install SDK
```bash
npm install expo-apple-authentication
```

### Step 3: Configure app.json
```json
{
  "ios": {
    "bundleIdentifier": "com.sanjeevani.mobile"
  },
  "plugins": [
    "expo-apple-authentication"
  ]
}
```

### Step 4: Implement Sign-In
```javascript
import * as AppleAuthentication from 'expo-apple-authentication';

async function signInWithApple() {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    console.log('Apple Sign-In:', credential);
    return credential;
  } catch (error) {
    if (error.code !== 'ERR_CANCELED') {
      console.error('Apple Sign-In error:', error);
    }
  }
}
```

**Estimated Setup Time**: 10 minutes

---

## 5. Sentry Error Reporting Setup

### Step 1: Create Sentry Account
1. Go to [Sentry.io](https://sentry.io)
2. Sign up for free account
3. Create new organization: "Sanjeevani"
4. Create project → React Native

### Step 2: Get Project DSN
1. Go to Project Settings
2. Copy **DSN** value
3. Add to `.env`: `REACT_APP_SENTRY_DSN=YOUR_DSN`

### Step 3: Install Sentry SDK
```bash
npm install @sentry/react-native

# or with Expo
expo install @sentry/react-native
```

### Step 4: Initialize in App.js
```javascript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 1.0,
  maxBreadcrumbs: 50,
  enableAutoSessionTracking: true,
});

// Wrap your main component
const AppWithSentry = Sentry.wrap(App);
```

### Step 5: Test Error Reporting
```javascript
// Test error capture
import { captureException, captureMessage } from '@sentry/react-native';

// Capture exception
try {
  throw new Error('Test error');
} catch (error) {
  captureException(error);
}

// Capture message
captureMessage('Test message', 'info');
```

### Step 6: Verify in Sentry Dashboard
1. Trigger test error in app
2. Check Sentry Issues dashboard
3. View error details, breadcrumbs, context

**Estimated Setup Time**: 10 minutes

---

## 6. Agora Video Conferencing Setup

### Step 1: Create Agora Account
1. Go to [Agora.io](https://agora.io)
2. Sign up for free account
3. Create new project
4. Get **App ID**
5. Enable App Certificate for security

### Step 2: Install SDK
```bash
npm install react-native-agora
# or
expo install react-native-agora
```

### Step 3: Configure app.json
```json
{
  "plugins": [
    [
      "react-native-agora",
      {
        "ios": {
          "cameraPermission": "Allow Sanjeevani to access camera?",
          "microphonePermission": "Allow Sanjeevani to access microphone?"
        },
        "android": {
          "cameraPermission": "Allow Sanjeevani to access camera?",
          "microphonePermission": "Allow Sanjeevani to access microphone?"
        }
      }
    ]
  ]
}
```

### Step 4: Generate Access Token (Server-Side)
```javascript
// Backend endpoint: POST /api/video/agora-token
const { AccessToken } = require('agora-access-token');

app.post('/api/video/agora-token', (req, res) => {
  const { appointmentId, uid } = req.body;
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  const token = AccessToken.AccessToken(
    appID,
    appointmentId,
    appCertificate,
    uid,
    AccessToken.RoleEnum.PUBLISHER
  ).build();

  res.json({ token });
});
```

### Step 5: Implement Video Call
```javascript
import RtcEngine from 'react-native-agora';

const rtcEngine = new RtcEngine();

async function initializeVideoCall(appointmentId, uid) {
  await rtcEngine.create(process.env.REACT_APP_AGORA_APP_ID);
  
  const token = await apiClient.post('/api/video/agora-token', {
    appointmentId,
    uid,
  });
  
  await rtcEngine.joinChannel(
    token.data.token,
    appointmentId,
    null,
    uid
  );
}
```

### Step 6: Test Video Call
1. Join channel from two devices/simulators
2. Verify video and audio working
3. Test screen sharing
4. Test recording feature

**Estimated Setup Time**: 25 minutes

---

## 7. Payment Gateway Setup

### Razorpay (Primary for India)

**Step 1: Create Account**
1. Go to [Razorpay.com](https://razorpay.com)
2. Sign up
3. Verify business details
4. Get **Key ID** and **Key Secret**

**Step 2: Install SDK**
```bash
npm install razorpay react-native-razorpay
```

**Step 3: Configure**
```env
REACT_APP_RAZORPAY_KEY_ID=your_key_id
REACT_APP_RAZORPAY_KEY_SECRET=your_key_secret_backend_only
```

**Step 4: Initiate Payment**
```javascript
import RazorpayCheckout from 'react-native-razorpay';

async function initiateRazorpayPayment(amount, orderId) {
  const options = {
    description: 'Doctor Consultation',
    image: 'https://sanjeevani.com/logo.png',
    currency: 'INR',
    key: process.env.REACT_APP_RAZORPAY_KEY_ID,
    amount: amount * 100, // Convert to paise
    name: 'Sanjeevani',
    order_id: orderId,
    prefill: {
      email: currentUser.email,
      contact: currentUser.phone,
    },
    theme: { color: '#7C3AED' },
  };

  RazorpayCheckout.open(options)
    .then((data) => {
      handlePaymentSuccess(data);
    })
    .catch((error) => {
      handlePaymentError(error);
    });
}
```

### Stripe (International)

**Step 1: Create Account**
1. Go to [Stripe.com](https://stripe.com)
2. Sign up
3. Verify business
4. Get **Publishable Key** and **Secret Key**

**Step 2: Install SDK**
```bash
npm install @react-native-stripe-sdk/stripe-react-native
```

**Step 3: Configure**
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
REACT_APP_STRIPE_SECRET_KEY=sk_live_xxx  # Backend only
```

**Step 4: Initiate Payment**
```javascript
import Stripe from '@react-native-stripe-sdk/stripe-react-native';

async function initiateStripePayment(amount, orderId) {
  const { paymentIntent, error } = await Stripe.createPaymentMethod({
    paymentMethodType: 'Card',
  });

  if (error) {
    console.error('Payment method error:', error);
    return;
  }

  // Send to backend for confirmation
  const result = await apiClient.post('/api/payments/stripe', {
    paymentMethodId: paymentIntent.id,
    amount,
    orderId,
  });

  if (result.success) {
    handlePaymentSuccess(result);
  }
}
```

### PayPal (International)

**Step 1: Create Account**
1. Go to [PayPal Developer](https://developer.paypal.com)
2. Create app
3. Get **Client ID**

**Step 2: Install SDK**
```bash
npm install react-native-paypal
```

**Step 3: Configure**
```env
REACT_APP_PAYPAL_CLIENT_ID=your_client_id
```

**Step 4: Initiate Payment**
```javascript
import PayPal from 'react-native-paypal';

async function initiatePayPalPayment(amount, orderId) {
  PayPal.requestOneTimePayment(
    process.env.REACT_APP_PAYPAL_CLIENT_ID,
    {
      description: 'Doctor Consultation - Sanjeevani',
      amount: amount.toString(),
      currency: 'USD',
      shortDescription: 'Consultation',
      items: [
        {
          name: 'Consultation Fee',
          quantity: 1,
          price: amount.toString(),
        },
      ],
    },
    (response) => {
      handlePaymentSuccess(response);
    },
    (error) => {
      handlePaymentError(error);
    }
  );
}
```

### UPI (India Direct Transfer)

**Step 1: Configure UPI**
```env
REACT_APP_UPI_MERCHANT_ID=your_upi_id
REACT_APP_UPI_MERCHANT_NAME=Sanjeevani
```

**Step 2: Implement UPI Payment**
```javascript
import { Linking } from 'react-native';

async function initiateUPIPayment(amount, orderId) {
  const upiString = `upi://pay?pa=${process.env.REACT_APP_UPI_MERCHANT_ID}&pn=Sanjeevani&am=${amount}&tr=${orderId}&tn=Consultation`;

  try {
    const canOpen = await Linking.canOpenURL(upiString);
    if (canOpen) {
      await Linking.openURL(upiString);
    }
  } catch (error) {
    console.error('UPI Error:', error);
  }
}
```

**Estimated Setup Time**: 30 minutes (varies by gateway)

---

## 8. Health Data Integration

### iOS (Apple HealthKit)

**Step 1: Install SDK**
```bash
npm install react-native-health
```

**Step 2: Configure app.json**
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

**Step 3: Request Permissions**
```javascript
import AppleHealthKit from 'react-native-health';

AppleHealthKit.initHealthKit(
  {
    permissions: {
      read: [
        AppleHealthKit.Constants.Permissions.StepCount,
        AppleHealthKit.Constants.Permissions.HeartRate,
      ],
      write: [
        AppleHealthKit.Constants.Permissions.StepCount,
      ],
    },
  },
  (error) => {
    if (error) {
      console.error('HealthKit permission error:', error);
    } else {
      console.log('HealthKit permissions granted');
    }
  }
);
```

### Android (Google Fit)

**Step 1: Setup Google Fit**
1. Enable Google Fit API in Google Cloud Console
2. Create OAuth 2.0 credentials (Android)
3. Add SHA-1 fingerprint

**Step 2: Install SDK**
```bash
npm install react-native-google-fit
```

**Step 3: Request Permissions**
```javascript
import GoogleFit from 'react-native-google-fit';

GoogleFit.checkAndObtainPermission()
  .then((authorized) => {
    if (authorized) {
      console.log('Google Fit permissions granted');
    }
  })
  .catch((error) => {
    console.error('Google Fit error:', error);
  });
```

**Estimated Setup Time**: 20 minutes

---

## Environment Variables Reference

Create `.env` file:

```env
# App Configuration
REACT_APP_ENV=development
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_API_TIMEOUT=30000

# Firebase
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Sign-In
REACT_APP_GOOGLE_IOS_CLIENT_ID=xxx.apps.googleusercontent.com
REACT_APP_GOOGLE_ANDROID_CLIENT_ID=xxx.apps.googleusercontent.com

# Sentry
REACT_APP_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Agora
REACT_APP_AGORA_APP_ID=your_app_id
REACT_APP_AGORA_TEMP_TOKEN=your_temp_token

# Razorpay
REACT_APP_RAZORPAY_KEY_ID=key_xxx
REACT_APP_RAZORPAY_KEY_SECRET=key_xxx  # Backend only!

# Stripe
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
REACT_APP_STRIPE_SECRET_KEY=sk_live_xxx  # Backend only!

# PayPal
REACT_APP_PAYPAL_CLIENT_ID=your_client_id

# UPI
REACT_APP_UPI_MERCHANT_ID=your_upi@bank
REACT_APP_UPI_MERCHANT_NAME=Sanjeevani

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_VIDEO_CALLS=true
REACT_APP_ENABLE_HEALTH_DATA=true
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All API keys configured in environment variables
- [ ] No API keys committed to Git
- [ ] Firebase Analytics events tested
- [ ] Push notifications working end-to-end
- [ ] Payment gateways tested with test cards
- [ ] Social logins tested on real devices
- [ ] Video calls tested with multiple users
- [ ] Error reporting capturing errors
- [ ] Health data permissions working
- [ ] All services initialized in App.js
- [ ] Network requests use HTTPS only
- [ ] User consent obtained for data collection
- [ ] Privacy policy updated
- [ ] Terms of service updated

---

## Support & Troubleshooting

### Common Issues

**Firebase Analytics not tracking events**
- Solution: Ensure Firebase app is initialized before user interactions
- Verify: Check Firebase Console → Events tab after 1-2 minutes

**Push notifications not received**
- Solution: Ensure device token is registered with backend
- Verify: Test with local notifications first

**Payment verification failing**
- Solution: Verify payment on backend, don't trust client-side
- Verify: Check payment gateway webhook logs

**Video call connection issues**
- Solution: Check network connectivity and firewall
- Verify: Test with Agora sample app first

---

## Support Links

- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo Notifications](https://docs.expo.dev/guides/push-notifications/)
- [Google Sign-In](https://developers.google.com/identity/sign-in)
- [Apple Sign-In](https://developer.apple.com/sign-in-with-apple/)
- [Sentry Documentation](https://docs.sentry.io/platforms/react-native/)
- [Agora Documentation](https://docs.agora.io/en/)
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Stripe Documentation](https://stripe.com/docs)

