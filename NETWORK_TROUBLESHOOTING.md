# Mobile Network Diagnostics Helper

## Network Request Failed - Troubleshooting Guide

The error "Network request failed" means the mobile app cannot reach the backend server.

### Quick Fix:

**For Android Emulator:**
1. Backend is running at http://192.168.29.195:8000
2. But Android emulator needs `10.0.2.2` to reach host machine
3. Update `mobile/src/config/environment.js`:
   ```javascript
   API_BASE_URL: 'http://10.0.2.2:8000/api'
   ```

**For Physical Android Device:**
1. Ensure phone and computer are on SAME WiFi network
2. Keep using: `http://192.168.29.195:8000/api`
3. Check Windows Firewall allows connections on port 8000

**For iOS Simulator:**
- Use `http://localhost:8000/api` (iOS simulator can reach localhost)

### Test from Mobile:
Open browser on your mobile device and visit:
- http://192.168.29.195:8000/docs (Physical device)
- http://10.0.2.2:8000/docs (Android emulator)

If docs page loads, network is good but app config needs updating.

### Current Configuration:
- Backend running on: 192.168.29.195:8000 ✓
- Mobile app trying: 192.168.29.195:8000
- Device type: ?

### Changes Made:
Added retry logic and offline fallback to ConsultDoctorScreen:
- Auto-retries once after 2 seconds
- Shows helpful error message with troubleshooting steps
- Loads cached data if available
- Saves successful responses to cache
