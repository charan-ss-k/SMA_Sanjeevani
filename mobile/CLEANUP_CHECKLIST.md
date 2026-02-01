# Frontend Code Cleanup Checklist

**Date**: January 31, 2026  
**Status**: Service Files Removed ✅ | Code References Need Cleanup ⏳

---

## Overview

Services and screen components have been deleted from the mobile app. Now you need to remove any imports and navigation references to these deleted files to complete the cleanup.

---

## 🎯 Cleanup Tasks

### Task 1: Remove Payment References

**Find & Remove These Imports**:
```javascript
// ❌ DELETE THESE LINES:
import PaymentService from '../services/paymentService';
import paymentService from '../services/paymentService';
import PaymentScreen from '../screens/payments/PaymentScreen';
import PaymentSuccessScreen from '../screens/payments/PaymentSuccessScreen';
```

**Files to Check**:
- [ ] `src/navigation/RootNavigator.js` (or navigation config)
- [ ] `src/screens/appointments/AppointmentBookingScreen.js`
- [ ] `src/screens/appointments/DoctorFindScreen.js`
- [ ] `src/App.js` (if payment screen registered there)
- [ ] Any context files that manage payment state

**Actions to Take**:
1. Search for `PaymentScreen` usage
2. Search for `paymentService` imports
3. Remove any navigation stack/routes that reference payments
4. Remove payment-related state management
5. Update appointment booking to skip payment step

---

### Task 2: Remove Video Conferencing References

**Find & Remove These Imports**:
```javascript
// ❌ DELETE THESE LINES:
import VideoConferencingService from '../services/videoConferencingService';
import videoConferencingService from '../services/videoConferencingService';
import VideoConsultationScreen from '../screens/consultations/VideoConsultationScreen';
```

**Files to Check**:
- [ ] `src/navigation/RootNavigator.js`
- [ ] `src/screens/appointments/AppointmentBookingScreen.js`
- [ ] `src/App.js`
- [ ] Any context that manages video calls
- [ ] Settings or profile screens with video call buttons

**Actions to Take**:
1. Search for `VideoConsultationScreen` usage
2. Search for `videoConferencingService` imports
3. Search for `video call` or `consultation type: video`
4. Remove navigation routes for video calls
5. Update appointment booking UI (remove video option if present)

---

### Task 3: Remove Social Authentication References

**Find & Remove These Imports**:
```javascript
// ❌ DELETE THESE LINES:
import SocialAuthService from '../services/socialAuthService';
import socialAuthService from '../services/socialAuthService';
import { handleGoogleSignIn, handleAppleSignIn } from '../services/socialAuthService';
```

**Files to Check**:
- [ ] `src/screens/auth/LoginScreen.js`
- [ ] `src/screens/auth/SignupScreen.js`
- [ ] `src/screens/auth/OnboardingScreen.js`
- [ ] `src/App.js`
- [ ] `src/contexts/AuthContext.js`

**Actions to Take**:
1. Search for `GoogleSignIn` button/logic
2. Search for `AppleSignIn` button/logic
3. Search for social auth imports
4. Remove social auth buttons from login/signup screens
5. Keep only email/password authentication UI
6. Update auth context to remove social auth methods

---

### Task 4: Check Navigation Configuration

**Files to Review**:
- [ ] `src/navigation/RootNavigator.js`
- [ ] `src/navigation/AppNavigator.js`
- [ ] `src/navigation/AuthNavigator.js`
- [ ] Any other navigation files

**Look For & Delete**:
```javascript
// ❌ DELETE THESE:
Stack.Screen name="Payment" component={PaymentScreen}
Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen}
Stack.Screen name="VideoConsultation" component={VideoConsultationScreen}
Tab.Screen name="VideoCall" ...
```

---

### Task 5: Update AppointmentBooking Screen

**Current Flow** (needs change):
```
1. Select Doctor
2. Choose Date/Time
3. Process Payment ❌ (DELETE THIS STEP)
4. Confirm Appointment
```

**New Flow** (after cleanup):
```
1. Select Doctor
2. Choose Date/Time
3. Confirm Appointment (direct - no payment)
```

**File**: `src/screens/appointments/AppointmentBookingScreen.js`

**Changes**:
- [ ] Remove payment form from booking flow
- [ ] Remove `paymentService` imports
- [ ] Remove payment processing logic
- [ ] Update UI to skip payment step
- [ ] Update backend API call to not expect payment

---

### Task 6: Check Context Files

**Files to Review**:
- [ ] `src/contexts/AuthContext.js`
- [ ] `src/contexts/ChatContext.js`
- [ ] `src/contexts/HealthContext.js`
- [ ] Any payment context (probably delete entire file)
- [ ] Any video context (probably delete entire file)

**Look For & Delete**:
```javascript
// ❌ DELETE FROM CONTEXT:
// Payment-related state
const [paymentMethods, setPaymentMethods] = useState([]);
const processPayment = async () => { ... }

// Video-related state
const [callActive, setCallActive] = useState(false);
const startVideoCall = async () => { ... }

// Social auth-related state
const signInWithGoogle = async () => { ... }
const signInWithApple = async () => { ... }
```

---

### Task 7: Remove from App.json Plugins

**File**: `app.json`

**Remove These Plugins** (if present):
```json
// ❌ DELETE THESE:
"react-native-razorpay"
"react-native-agora"
"@react-native-google-signin/google-signin"
"expo-apple-authentication"
"@stripe/stripe-react-native"
"react-native-paypal"
```

**Keep These Plugins**:
```json
// ✅ KEEP THESE:
"expo-notifications"
"@react-native-firebase/analytics"
"@sentry/react-native"
"react-native-health"
"react-native-google-fit"
```

---

### Task 8: Update Authentication Flows

**Login Screen** (`src/screens/auth/LoginScreen.js`):
- [ ] Remove "Sign in with Google" button
- [ ] Remove "Sign in with Apple" button
- [ ] Keep only email/password form
- [ ] Keep "Sign up" link

**Signup Screen** (`src/screens/auth/SignupScreen.js`):
- [ ] Remove "Sign up with Google" button
- [ ] Remove "Sign up with Apple" button
- [ ] Keep only email/password form
- [ ] Keep "Already have account? Login" link

**Expected UI** (after cleanup):
```
Email/Password Form Only
├── Email input
├── Password input
└── Login/Signup button

(No social auth buttons)
```

---

### Task 9: Check for Analytics Events

**Files to Review**:
- [ ] Components that log analytics

**Verify These Still Work** (no removal needed):
```javascript
// ✅ THESE ARE FINE:
analyticsService.logLogin('email')
analyticsService.logSignup('email')
analyticsService.logAppointmentBooked(...)
analyticsService.logMedicineIdentified(...)
analyticsService.logChatMessage()

// ❌ DELETE THESE:
analyticsService.logPaymentCompleted(...)  // No payments
```

---

### Task 10: Verify Imports in All Screens

**Quick Check** (in each screen file):
```bash
# Search for deleted service imports
grep -r "paymentService" src/
grep -r "videoConferencingService" src/
grep -r "socialAuthService" src/
```

**Expected Result**: No matches ✅

---

## 🔍 Search Commands to Use

Run these in your project root to find all references:

```bash
# Find payment references
grep -r "paymentService" src/
grep -r "PaymentScreen" src/
grep -r "payment" src/ --include="*.js" | grep -i "screen\|import"

# Find video references
grep -r "videoConferencingService" src/
grep -r "VideoConsultationScreen" src/
grep -r "agora" src/ --include="*.js" -i

# Find social auth references
grep -r "socialAuthService" src/
grep -r "GoogleSignIn\|AppleSignIn" src/
grep -r "oauth\|social.*auth" src/ --include="*.js" -i
```

---

## 📋 Completion Checklist

### Code References Removed
- [ ] No imports of deleted services
- [ ] No navigation routes for deleted screens
- [ ] No payment processing code
- [ ] No video call code
- [ ] No social auth code
- [ ] No deleted context files imported

### UI Updates Complete
- [ ] Login screen shows only email/password
- [ ] Signup screen shows only email/password
- [ ] Appointment booking skips payment
- [ ] No video call buttons
- [ ] No social auth buttons

### Navigation Updated
- [ ] Payment navigation removed
- [ ] Video call navigation removed
- [ ] Social auth navigation removed
- [ ] App loads without navigation errors

### Build Verification
- [ ] Run `npm install` successfully
- [ ] `npm start` runs without errors
- [ ] No "module not found" errors
- [ ] App loads on simulator/device
- [ ] Can login with email/password
- [ ] Can book appointment (without payment)

---

## 🚀 Testing After Cleanup

### Local Testing
1. Install dependencies: `npm install`
2. Start app: `npm start`
3. Test login/signup with email/password
4. Test appointment booking (skip payment step)
5. Test other features (chat, health, etc.)

### Device Testing
1. Build for iOS: `npm run ios`
2. Build for Android: `npm run android`
3. Full feature testing on real device
4. Push notification permissions
5. Health data access

---

## 📝 Files to Modify (Summary)

**High Priority** (likely need changes):
- [ ] `src/screens/auth/LoginScreen.js`
- [ ] `src/screens/auth/SignupScreen.js`
- [ ] `src/screens/appointments/AppointmentBookingScreen.js`
- [ ] `src/navigation/RootNavigator.js` (or similar)
- [ ] `src/contexts/AuthContext.js`
- [ ] `app.json` (remove plugins)

**Medium Priority** (may need changes):
- [ ] `src/App.js` (remove screen registrations)
- [ ] `src/screens/appointments/DoctorFindScreen.js`
- [ ] Any screen showing appointment details

**Low Priority** (probably okay):
- [ ] Utility files
- [ ] Component library files
- [ ] Constants/config files

---

## 💡 Tips for Cleanup

1. **Use Find & Replace**: Many editors have "Find in Files" + "Replace"
2. **Commit Before**: Git commit before making large changes
3. **Test Incrementally**: Make changes, test, commit
4. **Group Deletions**: Delete all payment references, then test, then video, then social auth
5. **Read Error Messages**: Build errors will point to remaining references

---

## 🎯 Success Criteria

When cleanup is complete, ALL of these should be true:

✅ No imports from deleted services  
✅ No navigation routes to deleted screens  
✅ No social auth buttons in UI  
✅ No payment processing code  
✅ No video conferencing code  
✅ `npm install` succeeds  
✅ `npm start` runs without errors  
✅ App builds and runs on device  
✅ Login/signup works with email/password  
✅ Appointment booking works (no payment)  

---

## ❓ Common Issues & Solutions

**Problem**: "Module not found: Can't resolve 'paymentService'"
**Solution**: Search for `import ... from '..../paymentService'` and delete the line

**Problem**: "VideoConsultationScreen is not defined"
**Solution**: Search for `VideoConsultationScreen` in navigation and delete the route

**Problem**: "GoogleSignIn is not defined"
**Solution**: Remove social auth buttons from login/signup screens

**Problem**: App loads but login page has extra buttons
**Solution**: Check LoginScreen.js and remove Google/Apple sign-in buttons

---

## 📞 Questions?

- Check `SUPPORTED_INTEGRATIONS.md` for what's still available
- Check `CLEANUP_SUMMARY.md` for what was removed
- Read error messages carefully - they usually point to the problem
- Use grep/search to find all references to a deleted service

---

**This Checklist**: Ensures complete code cleanup  
**Status**: Ready for your review and implementation  
**Estimated Time**: 30-60 minutes depending on codebase complexity  
**Difficulty**: Low (mostly find & delete operations)

Once this checklist is complete, your mobile app will be fully synchronized with the backend! ✅
