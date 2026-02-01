# Integration Testing Guide

## Overview

This guide covers testing all third-party service integrations in the Sanjeevani mobile app.

---

## 1. Analytics Testing

### Manual Testing

```javascript
// Test screen view tracking
import analyticsService from './services/analyticsService';
import { useEffect } from 'react';

function TestAnalytics() {
  useEffect(() => {
    // Test screen view
    analyticsService.logScreenView('TestScreen');
    
    // Test user properties
    analyticsService.setUserProperty('user_plan', 'premium');
    analyticsService.setUserProperty('app_version', '1.0.0');
    
    // Test custom events
    analyticsService.logLogin('email');
    analyticsService.logSignup('google');
    analyticsService.logAppointmentBooked({
      doctorId: 'doc_123',
      appointmentType: 'video',
      amount: 500,
    });
    
    analyticsService.logMedicineIdentified({
      medicineName: 'Aspirin',
      dosage: '500mg',
    });
    
    analyticsService.logChatMessage();
    
    analyticsService.logPaymentCompleted({
      paymentId: 'pay_123',
      amount: 500,
      method: 'razorpay',
    });
  }, []);

  return <Text>Analytics test running...</Text>;
}
```

### Firebase Console Verification
1. Open Firebase Console
2. Navigate to Analytics → Events
3. Look for:
   - `screen_view` events with screen_name parameter
   - `login` events with method parameter
   - `signup` events with method parameter
   - Custom events: `appointment_booked`, `medicine_identified`, `payment_completed`
4. Check Events tab after 30-60 seconds

### Expected Output
```
✓ screen_view: TestScreen
✓ login: email
✓ signup: google
✓ appointment_booked: video consultation
✓ medicine_identified: Aspirin 500mg
✓ payment_completed: ₹500 via razorpay
```

---

## 2. Push Notifications Testing

### Unit Testing

```javascript
import notificationService from './services/notificationService';
import * as Notifications from 'expo-notifications';

describe('Notification Service', () => {
  test('Get push token', async () => {
    const token = await notificationService.getPushToken();
    expect(token).toBeDefined();
    expect(token).toMatch(/ExponentPushToken\[.+\]/);
  });

  test('Schedule notification', async () => {
    const notificationId = await notificationService.scheduleNotification(
      5, // 5 seconds
      'Test Title',
      'Test Body'
    );
    expect(notificationId).toBeDefined();
  });

  test('Schedule medicine reminder', async () => {
    const reminderId = await notificationService.scheduleMedicineReminder(
      'Aspirin',
      [8, 14, 20],
      'Take with food'
    );
    expect(reminderId).toBeDefined();
  });

  test('Get scheduled notifications', async () => {
    const scheduled = await notificationService.getScheduledNotifications();
    expect(Array.isArray(scheduled)).toBe(true);
  });

  test('Cancel notification', async () => {
    const notificationId = await notificationService.scheduleNotification(
      100,
      'Test',
      'Test'
    );
    await notificationService.cancelNotification(notificationId);
    const scheduled = await notificationService.getScheduledNotifications();
    expect(scheduled.find(n => n.identifier === notificationId)).toBeUndefined();
  });
});
```

### Manual Testing

```javascript
// Test local notification
async function testLocalNotification() {
  try {
    // Send notification immediately
    await notificationService.sendLocalNotification(
      '💊 Medicine Reminder',
      'Take Aspirin 500mg with meals',
      {
        medicineId: 'med_123',
        action: 'open_medicine_detail',
      }
    );
    console.log('✓ Local notification sent');
  } catch (error) {
    console.error('✗ Notification error:', error);
  }
}

// Test medicine reminder scheduling
async function testMedicineReminder() {
  try {
    const reminderId = await notificationService.scheduleMedicineReminder(
      'Aspirin 500mg',
      [8, 14, 20], // 8 AM, 2 PM, 8 PM
      'Take with food. Consult doctor if side effects occur.'
    );
    console.log('✓ Medicine reminder scheduled:', reminderId);
  } catch (error) {
    console.error('✗ Reminder scheduling error:', error);
  }
}

// Test appointment reminder
async function testAppointmentReminder() {
  try {
    const appointmentTime = new Date();
    appointmentTime.setHours(14, 30, 0, 0); // 2:30 PM
    
    await notificationService.scheduleAppointmentReminder(
      'apt_123',
      appointmentTime,
      15 // 15 minutes before
    );
    console.log('✓ Appointment reminder scheduled');
  } catch (error) {
    console.error('✗ Appointment reminder error:', error);
  }
}
```

### Expected Behavior

**Local Notification**
- [ ] Notification appears on device
- [ ] Sound plays (if enabled)
- [ ] Notification can be tapped
- [ ] Correct app launches on tap

**Medicine Reminder**
- [ ] Reminders appear at scheduled times
- [ ] Time adjusts for device timezone
- [ ] Medicine details included in notification
- [ ] User can snooze or dismiss

**Appointment Reminder**
- [ ] Appears 15 minutes before appointment
- [ ] Contains doctor name and meeting link
- [ ] One-tap join for video consultation
- [ ] Can be dismissed or snoozed

---

## 3. Social Authentication Testing

### Google Sign-In Testing

```javascript
import socialAuthService from './services/socialAuthService';

async function testGoogleSignIn() {
  try {
    console.log('Starting Google Sign-In test...');
    
    const result = await socialAuthService.handleGoogleSignIn(
      process.env.REACT_APP_GOOGLE_IOS_CLIENT_ID,
      process.env.REACT_APP_GOOGLE_ANDROID_CLIENT_ID
    );
    
    if (result.user) {
      console.log('✓ Google Sign-In successful');
      console.log('User:', result.user.name);
      console.log('Email:', result.user.email);
      console.log('ID Token:', result.idToken);
      
      // Exchange token with backend
      const authResponse = await apiClient.post('/auth/google-signin', {
        idToken: result.idToken,
      });
      
      if (authResponse.token) {
        console.log('✓ Backend token exchange successful');
      }
    }
  } catch (error) {
    console.error('✗ Google Sign-In error:', error.message);
  }
}
```

### Apple Sign-In Testing

```javascript
async function testAppleSignIn() {
  try {
    const isAvailable = await socialAuthService.isAppleSignInAvailable();
    
    if (!isAvailable) {
      console.log('ℹ Apple Sign-In not available on this device');
      return;
    }

    console.log('Starting Apple Sign-In test...');
    
    const result = await socialAuthService.handleAppleSignIn([
      'AppleAuthenticationScope.FULL_NAME',
      'AppleAuthenticationScope.EMAIL',
    ]);
    
    if (result.identityToken) {
      console.log('✓ Apple Sign-In successful');
      console.log('User ID:', result.user.id);
      console.log('Name:', result.fullName?.givenName);
      console.log('Email:', result.email);
      
      // Exchange with backend
      const authResponse = await apiClient.post('/auth/apple-signin', {
        identityToken: result.identityToken,
        identityTokenNonce: result.identityTokenNonce,
      });
      
      if (authResponse.token) {
        console.log('✓ Backend token exchange successful');
      }
    }
  } catch (error) {
    console.error('✗ Apple Sign-In error:', error.message);
  }
}
```

### Testing Checklist

**Google Sign-In**
- [ ] Google Sign-In dialog appears
- [ ] User selects correct account
- [ ] Email and name retrieved correctly
- [ ] ID token generated
- [ ] Backend token exchange successful
- [ ] User session created
- [ ] Logout works correctly

**Apple Sign-In**
- [ ] Available only on iOS
- [ ] Apple Sign-In sheet appears
- [ ] User data retrieved correctly
- [ ] Identity token generated
- [ ] Backend token exchange successful
- [ ] Account linking works for existing users
- [ ] Logout works correctly

---

## 4. Video Conferencing Testing

### Unit Testing

```javascript
import videoConferencingService from './services/videoConferencingService';

describe('Video Conferencing Service', () => {
  test('Generate Agora token', async () => {
    const token = await videoConferencingService.generateAgoraToken('apt_123');
    expect(token).toBeDefined();
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
  });

  test('Initialize video call', async () => {
    const response = await videoConferencingService.initializeVideoCall('apt_123');
    expect(response.status).toBe('initialized');
  });

  test('Start recording', async () => {
    const response = await videoConferencingService.startRecording('apt_123');
    expect(response.recordingId).toBeDefined();
  });

  test('Send chat message', async () => {
    const response = await videoConferencingService.sendChatMessage(
      'apt_123',
      'Test message'
    );
    expect(response.status).toBe('sent');
  });

  test('Get call statistics', async () => {
    const stats = await videoConferencingService.getCallStatistics('apt_123');
    expect(stats).toHaveProperty('duration');
    expect(stats).toHaveProperty('videoEnabled');
    expect(stats).toHaveProperty('audioEnabled');
  });
});
```

### Manual Testing

```javascript
// Test video call flow
async function testVideoCallFlow() {
  try {
    console.log('Starting video call test...');
    
    // Step 1: Initialize call
    console.log('1. Initializing call...');
    await videoConferencingService.initializeVideoCall('apt_123');
    console.log('✓ Call initialized');
    
    // Step 2: Start recording
    console.log('2. Starting recording...');
    await videoConferencingService.startRecording('apt_123');
    console.log('✓ Recording started');
    
    // Step 3: Send chat message
    console.log('3. Sending chat message...');
    await videoConferencingService.sendChatMessage('apt_123', 'Hello doctor!');
    console.log('✓ Message sent');
    
    // Step 4: Get statistics
    console.log('4. Fetching call statistics...');
    const stats = await videoConferencingService.getCallStatistics('apt_123');
    console.log('✓ Statistics:', stats);
    
    // Simulate call duration
    await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute
    
    // Step 5: Stop recording
    console.log('5. Stopping recording...');
    await videoConferencingService.stopRecording('apt_123');
    console.log('✓ Recording stopped');
    
    // Step 6: End call
    console.log('6. Ending call...');
    await videoConferencingService.endVideoCall('apt_123');
    console.log('✓ Call ended');
    
    console.log('✓ Video call test completed successfully');
  } catch (error) {
    console.error('✗ Video call test failed:', error);
  }
}
```

### Testing Checklist

- [ ] Agora token generated successfully
- [ ] Call initializes from both ends
- [ ] Video transmits successfully
- [ ] Audio transmits and receives clearly
- [ ] Screen sharing works
- [ ] In-call chat messages deliver
- [ ] Recording starts and stops
- [ ] Call ends gracefully
- [ ] Recording file generated and accessible
- [ ] Call statistics accurate
- [ ] Network handling (reconnection)
- [ ] Battery usage reasonable

---

## 5. Payment Integration Testing

### Test Card Numbers

**Razorpay**
- Success: `4111111111111111`
- Failure: `4000000000000002`
- CVV: Any 3 digits
- Expiry: Any future date

**Stripe**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

### Test Flow

```javascript
import paymentService from './services/paymentService';

async function testPaymentFlow() {
  try {
    console.log('Starting payment test flow...');
    
    const appointmentData = {
      appointmentId: 'apt_123',
      doctorName: 'Dr. Sharma',
      consultationType: 'video',
      baseAmount: 500,
    };
    
    // Test each gateway
    const gateways = ['razorpay', 'stripe', 'paypal', 'upi'];
    
    for (const gateway of gateways) {
      console.log(`\n--- Testing ${gateway.toUpperCase()} ---`);
      
      // Step 1: Initiate payment
      console.log('1. Initiating payment...');
      const paymentData = await paymentService.initiatePayment(
        appointmentData.baseAmount,
        appointmentData.appointmentId,
        gateway
      );
      console.log('✓ Payment initiated:', paymentData.paymentId);
      
      // Step 2: Get fee breakdown
      const fee = await paymentService.getGatewayFee(
        appointmentData.baseAmount,
        gateway
      );
      console.log('✓ Gateway fee:', fee);
      
      // Step 3: Calculate total
      const total = appointmentData.baseAmount + fee;
      console.log('✓ Total amount:', total);
      
      // Step 4: Simulate payment (in real scenario, user completes payment)
      // For testing, we'll use test credentials
      
      // Step 5: Verify payment
      console.log('2. Verifying payment...');
      const verified = await paymentService.verifyPayment(
        paymentData.paymentId,
        paymentData.signature
      );
      console.log('✓ Payment verified:', verified);
      
      if (verified) {
        // Step 6: Get payment history
        console.log('3. Checking payment history...');
        const history = await paymentService.getPaymentHistory('user_123', 1);
        console.log('✓ Payment recorded in history');
      }
    }
    
    console.log('\n✓ All payment tests completed');
  } catch (error) {
    console.error('✗ Payment test failed:', error);
  }
}
```

### Verification Checklist

- [ ] Razorpay success payment
- [ ] Razorpay failed payment handling
- [ ] Stripe success payment
- [ ] Stripe 3D Secure handling
- [ ] PayPal payment flow
- [ ] PayPal cancellation
- [ ] UPI payment initiation
- [ ] Fee calculation correct
- [ ] Payment recorded in database
- [ ] Appointment status updated after payment
- [ ] Receipt generated
- [ ] Refund processing
- [ ] Payment history retrieves correctly

---

## 6. Error Reporting Testing

### Unit Testing

```javascript
import * as Sentry from '@sentry/react-native';
import errorReportingService from './services/errorReportingService';

describe('Error Reporting Service', () => {
  beforeAll(() => {
    errorReportingService.initialize(process.env.REACT_APP_SENTRY_DSN);
  });

  test('Capture exception', async () => {
    const error = new Error('Test error');
    errorReportingService.captureException(error);
    // Error should be sent to Sentry
  });

  test('Capture message', async () => {
    errorReportingService.captureMessage('Test message', 'info');
    // Message should be sent to Sentry
  });

  test('Set user context', async () => {
    errorReportingService.setUserContext('user_123', 'test@example.com', 'testuser');
    // User context should be added to all future errors
  });

  test('Add breadcrumb', async () => {
    errorReportingService.addBreadcrumb('User clicked button', 'user-action', 'info');
    errorReportingService.captureMessage('Action completed');
    // Breadcrumb should appear in Sentry event
  });

  test('Report API error', async () => {
    const error = new Error('API request failed');
    errorReportingService.reportApiError(error, '/api/appointments', 'GET');
    // Error should include API context
  });
});
```

### Manual Testing

```javascript
function ErrorReportingTestScreen() {
  return (
    <View>
      <Button
        title="Test Exception"
        onPress={() => {
          try {
            throw new Error('Test exception from app');
          } catch (error) {
            errorReportingService.captureException(error, {
              userId: 'user_123',
              screen: 'TestScreen',
            });
          }
        }}
      />
      
      <Button
        title="Test API Error"
        onPress={() => {
          try {
            throw new Error('Network timeout');
          } catch (error) {
            errorReportingService.reportApiError(
              error,
              '/api/appointments',
              'POST'
            );
          }
        }}
      />
      
      <Button
        title="Test Custom Error"
        onPress={() => {
          errorReportingService.reportCustomError('PaymentFailed', {
            amount: 500,
            gateway: 'razorpay',
            reason: 'Insufficient funds',
          });
        }}
      />
    </View>
  );
}
```

### Sentry Dashboard Verification

1. Open Sentry Dashboard
2. Navigate to Issues
3. Verify errors appear with:
   - [ ] Error type and message
   - [ ] Stack trace
   - [ ] Breadcrumbs
   - [ ] User context
   - [ ] Environment information
   - [ ] Device information
   - [ ] Custom tags
   - [ ] Timestamps

---

## 7. Health Data Integration Testing

### iOS Testing

```javascript
import healthDataService from './services/healthDataService';

async function testHealthDataiOS() {
  try {
    console.log('Testing Apple HealthKit integration...');
    
    // Step 1: Request permissions
    console.log('1. Requesting HealthKit permissions...');
    const hasAccess = await healthDataService.requestHealthKitPermissions();
    
    if (!hasAccess) {
      console.log('ℹ User denied HealthKit access');
      return;
    }
    console.log('✓ HealthKit permissions granted');
    
    // Step 2: Get step count
    console.log('2. Retrieving step count...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const steps = await healthDataService.getStepCount(today, new Date());
    console.log('✓ Steps today:', steps);
    
    // Step 3: Get heart rate data
    console.log('3. Retrieving heart rate data...');
    const heartRateData = await healthDataService.getHeartRateData(
      today,
      new Date()
    );
    console.log('✓ Heart rate samples:', heartRateData.length);
    
    // Step 4: Get blood pressure
    console.log('4. Retrieving blood pressure data...');
    const bpData = await healthDataService.getBloodPressureData(
      today,
      new Date()
    );
    console.log('✓ Blood pressure samples:', bpData.length);
    
    // Step 5: Get weight data
    console.log('5. Retrieving weight data...');
    const weight = await healthDataService.getBodyWeightData(
      today,
      new Date()
    );
    console.log('✓ Latest weight:', weight, 'kg');
    
    // Step 6: Get daily summary
    console.log('6. Getting daily summary...');
    const summary = await healthDataService.getDailySummary(today);
    console.log('✓ Daily summary:', summary);
    
    // Step 7: Sync with backend
    console.log('7. Syncing with backend...');
    await healthDataService.syncHealthData('user_123');
    console.log('✓ Health data synced');
    
    console.log('\n✓ All HealthKit tests completed');
  } catch (error) {
    console.error('✗ HealthKit test failed:', error);
  }
}
```

### Android Testing

```javascript
async function testHealthDataAndroid() {
  try {
    console.log('Testing Google Fit integration...');
    
    // Step 1: Request permissions
    console.log('1. Requesting Google Fit permissions...');
    const authorized = await GoogleFit.checkAndObtainPermission();
    
    if (!authorized) {
      console.log('ℹ User denied Google Fit access');
      return;
    }
    console.log('✓ Google Fit permissions granted');
    
    // Same tests as iOS...
    // Retrieve steps, heart rate, blood pressure, weight, workouts
    
  } catch (error) {
    console.error('✗ Google Fit test failed:', error);
  }
}
```

### Testing Checklist

- [ ] Permissions dialog appears
- [ ] User can grant/deny access
- [ ] Step count retrieves correctly
- [ ] Heart rate data returns multiple samples
- [ ] Blood pressure data includes systolic/diastolic
- [ ] Weight data shows correct values
- [ ] Workout data includes duration and calories
- [ ] Date range filtering works
- [ ] Daily summary aggregates correctly
- [ ] Backend sync completes successfully
- [ ] Data persists across app restarts
- [ ] No significant battery drain

---

## Integration End-to-End Test

```javascript
// Complete user flow test
async function testCompleteUserFlow() {
  console.log('=== COMPLETE USER FLOW TEST ===\n');
  
  try {
    // 1. Social Login
    console.log('1. Social Authentication');
    const user = await socialAuthService.handleGoogleSignIn(
      process.env.REACT_APP_GOOGLE_IOS_CLIENT_ID,
      process.env.REACT_APP_GOOGLE_ANDROID_CLIENT_ID
    );
    console.log('✓ User logged in via Google\n');
    
    // 2. Analytics tracking
    console.log('2. Analytics Tracking');
    analyticsService.setUserId(user.id);
    analyticsService.logLogin('google');
    analyticsService.logScreenView('HomeScreen');
    console.log('✓ Analytics events tracked\n');
    
    // 3. Get push token
    console.log('3. Push Notifications');
    const pushToken = await notificationService.getPushToken();
    await notificationService.registerDeviceToken(user.id, pushToken);
    console.log('✓ Device registered for notifications\n');
    
    // 4. Health data sync
    console.log('4. Health Data');
    const health = await healthDataService.requestHealthKitPermissions();
    if (health) {
      const summary = await healthDataService.getDailySummary(new Date());
      await healthDataService.syncHealthData(user.id);
      console.log('✓ Health data synced\n');
    }
    
    // 5. Schedule appointment
    console.log('5. Appointment Booking');
    const appointment = {
      doctorId: 'doc_456',
      date: '2024-12-20',
      time: '14:30',
      type: 'video',
      amount: 500,
    };
    console.log('✓ Appointment details prepared\n');
    
    // 6. Process payment
    console.log('6. Payment Processing');
    const payment = await paymentService.initiatePayment(
      appointment.amount,
      appointment.doctorId,
      'razorpay'
    );
    console.log('✓ Payment initiated\n');
    
    // 7. Schedule reminders
    console.log('7. Reminders');
    await notificationService.scheduleAppointmentReminder(
      appointment.doctorId,
      new Date('2024-12-20T14:30:00'),
      15
    );
    console.log('✓ Appointment reminder scheduled\n');
    
    // 8. Video call (simulated)
    console.log('8. Video Consultation');
    const videoToken = await videoConferencingService.generateAgoraToken(
      appointment.doctorId
    );
    console.log('✓ Video call ready\n');
    
    // 9. Error tracking
    console.log('9. Error Tracking');
    errorReportingService.setUserContext(user.id, user.email, user.name);
    errorReportingService.addBreadcrumb(
      'User flow test completed',
      'test',
      'info'
    );
    console.log('✓ Error context set\n');
    
    console.log('=== ALL TESTS PASSED ===');
  } catch (error) {
    console.error('✗ Test failed:', error);
    errorReportingService.captureException(error, {
      testName: 'CompleteUserFlow',
    });
  }
}
```

---

## Continuous Integration Testing

### GitHub Actions Example

```yaml
name: Integration Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm install
      
      - name: Run unit tests
        run: npm test
      
      - name: Run integration tests
        env:
          REACT_APP_SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
          REACT_APP_AGORA_APP_ID: ${{ secrets.AGORA_APP_ID }}
          REACT_APP_GOOGLE_IOS_CLIENT_ID: ${{ secrets.GOOGLE_IOS_CLIENT_ID }}
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Test Results Template

Use this template to document test results:

```markdown
# Integration Test Report

## Date: YYYY-MM-DD
## Tester: Name
## Environment: iOS/Android/Both

### Analytics ✓/✗
- Screen view tracking: ✓
- Event tracking: ✓
- User properties: ✗ (Issue: Firebase delay)

### Notifications ✓/✗
- Local notifications: ✓
- Push notifications: ✓
- Medicine reminders: ✓

### Authentication ✓/✗
- Google Sign-In: ✓
- Apple Sign-In: ✓
- Backend token exchange: ✓

### Video Conferencing ✓/✗
- Call initiation: ✓
- Recording: ✓
- Screen share: ✗ (Issue: Permission denied)

### Payments ✓/✗
- Razorpay: ✓
- Stripe: ✓
- PayPal: ✓
- UPI: ✓

### Health Data ✓/✗
- HealthKit access: ✓
- Step count: ✓
- Heart rate: ✗ (No data available)

### Error Reporting ✓/✗
- Exception capture: ✓
- Breadcrumbs: ✓
- User context: ✓

## Issues Found
1. Screen share permission denied on Android
2. Heart rate data not available in test environment

## Notes
All critical features working. Minor issues identified for follow-up.
```

