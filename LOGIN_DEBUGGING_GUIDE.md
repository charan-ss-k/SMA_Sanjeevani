# Login Issue Debugging & Fix Guide

## Issue Summary
Backend authentication endpoints were not returning responses, preventing users from logging in or signing up.

## Root Cause Analysis

### Potential Issues Fixed:
1. **Token Storage Mismatch**: Frontend was storing as `'token'` but checking for `'access_token'`
2. **Missing Fallback Keys**: AuthContext didn't check both token storage keys
3. **Insufficient Logging**: No way to diagnose where the failure occurred

## Fixes Applied

### 1. Enhanced LoginSignup Component Logging
**File**: `frontend/src/components/LoginSignup.jsx`

**Changes**:
- Added comprehensive console logging at each step
- Logs authentication request URL and payload
- Logs response status and error details
- Logs successful token storage
- Added timeout before redirect to ensure state updates

**Logging Output**:
```javascript
🔐 Auth Request: { url, method, isLogin }
📤 Payload: { username, password, ... }
📥 Response Status: 200 OK
✅ Auth Success: { user: 'username', tokenLength: 500 }
💾 Stored: { token: ✓, user: ✓ }
```

**Benefits**:
- Easy diagnosis of API connection issues
- Identifies payload formatting problems
- Shows exact error messages from backend
- Tracks token storage confirmation

### 2. Dual Token Storage
**File**: `frontend/src/components/LoginSignup.jsx`

**Change**:
```javascript
// Store in BOTH keys for compatibility
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('token', data.access_token);
```

**Reason**: Ensures token is available regardless of which key the app checks

### 3. Updated AuthContext Initialization
**File**: `frontend/src/context/AuthContext.jsx`

**Changes**:
- Check both `'token'` and `'access_token'` keys on startup
- Added logging to show which token was found
- Updated `getCurrentToken()` to check both keys
- Added logging to all auth operations

**Initialization Logging**:
```javascript
🔐 AuthContext Initialization: { token: '...', user: 'present' }
✅ Auth restored from localStorage
```

### 4. Token Management Improvements
**File**: `frontend/src/context/AuthContext.jsx`

**Changes**:
- `setTokenWithStorage()` stores in both `'token'` and `'access_token'`
- `setUser()` logs when user is stored/cleared
- `logout()` clears both token keys

**Example Output**:
```javascript
🔐 Setting token: eyJhbGc...
✅ Token stored in localStorage
👤 Setting user: john_doe
✅ User stored in localStorage
```

## How to Debug Login Issues

### Step 1: Check Browser Console
When login fails:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs starting with 🔐, 📤, 📥, ✅, ❌

**Example Output**:
```
🔐 Auth Request: { 
  url: "http://127.0.0.1:8000/api/auth/login",
  method: "POST", 
  isLogin: true 
}
📤 Payload: { username: "testuser", password: "password123" }
📥 Response Status: 200 OK
✅ Auth Success: { user: "testuser", tokenLength: 543 }
💾 Stored: { token: ✓, user: ✓ }
```

### Step 2: Verify Backend is Running
Check if backend server is running:
```bash
# Terminal 1: Start backend
cd backend
python start.py

# Expected output:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# ✅ Database initialized successfully
```

### Step 3: Test API Endpoint Directly
Use curl or Postman to test login endpoint:
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# Expected Response:
# {
#   "access_token": "eyJhbGc...",
#   "token_type": "bearer",
#   "user": { "id": 1, "username": "testuser", ... },
#   "expires_in": 3600
# }
```

### Step 4: Check Network Tab
In DevTools Network tab:
1. Perform login action
2. Look for POST request to `/api/auth/login`
3. Check:
   - Status: Should be 200 OK
   - Response: Should have `access_token` field
   - Headers: Should show `Content-Type: application/json`

**If Status is 401**:
- Invalid username or password
- User account not found
- Check credentials

**If Status is 422**:
- Validation error (e.g., missing fields)
- Check error details in response

**If Status is 500**:
- Backend error
- Check backend logs
- Restart backend server

**If No Response (timeout)**:
- Backend not running
- Wrong API URL
- Network connectivity issue

### Step 5: Check localStorage
In DevTools Console, type:
```javascript
// Check if token is stored
localStorage.getItem('token')
localStorage.getItem('access_token')

// Check if user is stored
localStorage.getItem('user')

// View full localStorage
console.table(localStorage)
```

**Expected Output**:
```javascript
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Token
'{"id":1,"username":"testuser","email":"..."}'  // User
```

## Common Issues & Solutions

### Issue 1: Login Button Does Nothing
**Symptom**: Click login, page doesn't change, no errors

**Solutions**:
1. Check Console for errors (F12 → Console)
2. Verify backend is running
3. Check if form validation is failing (look for error message above form)

**Check**:
```javascript
// In console, verify API_BASE is correct
console.log(window.__API_BASE__)  // Should be 'http://127.0.0.1:8000' or empty
```

### Issue 2: "Authentication failed" Error
**Symptom**: Login shows error message, won't accept credentials

**Solutions**:
1. Verify username/password are correct
2. Check if user account exists (try signup instead)
3. Check console for detailed error message

**Debug**:
```bash
# Check if user exists in database
# Backend logs should show:
# "User not found" → User doesn't exist
# "Invalid username or password" → Check credentials
```

### Issue 3: Token Stored but Not Logged In
**Symptom**: Token appears in localStorage but still shows login page

**Solutions**:
1. Hard refresh page (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear cookies and cache
3. Check if AuthContext is properly initialized

**Check**:
```javascript
// In console, verify auth context
// Open Home.jsx and check isAuthenticated prop
console.log(document.querySelector('body').innerText)  // Should show home content if logged in
```

### Issue 4: Login Works Once, Then Fails
**Symptom**: First login successful, but logout then login fails

**Solutions**:
1. Clear localStorage manually:
```javascript
localStorage.clear()
location.reload()
```

2. Check if token is being properly cleared on logout:
```javascript
// After logout, verify:
localStorage.getItem('token')      // Should be null
localStorage.getItem('access_token')  // Should be null
localStorage.getItem('user')       // Should be null
```

## Testing Checklist

### Backend Login Endpoint
- [ ] Backend running on port 8000
- [ ] `/api/auth/login` endpoint responds with 200 OK
- [ ] Response includes `access_token` field
- [ ] Response includes `user` object
- [ ] Token is valid JWT format

### Frontend Login Form
- [ ] Form validates required fields
- [ ] Submit button triggers fetch request
- [ ] Console shows request URL and payload
- [ ] Console shows response status
- [ ] Token stored in localStorage (both keys)
- [ ] User stored in localStorage

### Authentication Flow
- [ ] Token retrieved from localStorage on app load
- [ ] AuthContext initialized with token
- [ ] isAuthenticated flag set to true
- [ ] User redirected to /home after login
- [ ] Logout clears both token keys
- [ ] After logout, login form shows again

## Advanced Troubleshooting

### Enable Backend Logging
Add detailed logging to backend login endpoint:

**File**: `backend/app/api/routes/routes_auth.py`

```python
@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    print(f"🔐 Login Request: username={request.username}")
    
    user = db.query(User).filter(
        (User.username == request.username) | (User.email == request.username)
    ).first()
    
    if not user:
        print(f"❌ User not found: {request.username}")
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    print(f"✅ User found: {user.username}")
    
    if not verify_password(request.password, user.password_hash):
        print(f"❌ Password verification failed")
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    print(f"✅ Password verified")
    
    # ... rest of function
```

### Check CORS Settings
If you see CORS error in console:
```javascript
// CORS Error: Response to preflight request doesn't pass access control check
```

**Solution**: Verify backend CORS configuration in `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Network Analysis
Use Chrome DevTools Network tab to inspect:

1. Request Headers:
   - Content-Type: application/json
   - Method: POST
   - URL: http://127.0.0.1:8000/api/auth/login

2. Request Body:
   ```json
   {"username": "testuser", "password": "password123"}
   ```

3. Response Headers:
   - Content-Type: application/json
   - Status: 200 OK

4. Response Body:
   ```json
   {
     "access_token": "eyJ...",
     "token_type": "bearer",
     "user": {...},
     "expires_in": 3600
   }
   ```

## Success Indicators

After login, check for these indicators:

1. **Console Logs**:
   - ✅ See "Auth Success" message
   - ✅ See "Token stored" message
   - ✅ No error messages in red

2. **Page Content**:
   - ✅ Redirected to /home
   - ✅ See dashboard content
   - ✅ User name displayed in navbar

3. **Browser Storage**:
   - ✅ localStorage has 'token' key
   - ✅ localStorage has 'access_token' key
   - ✅ localStorage has 'user' key

4. **Network**:
   - ✅ POST /api/auth/login returns 200
   - ✅ Response includes valid access_token

## Additional Resources

- **JWT Format**: https://jwt.io/ (paste token to decode)
- **API Testing**: Use Postman or Insomnia
- **Browser DevTools**: F12 for debugging
- **Backend Logs**: Check terminal running `python start.py`

## Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| LoginSignup.jsx | Added comprehensive logging | Easy diagnosis of login failures |
| LoginSignup.jsx | Store token in both keys | Token accessible regardless of key used |
| AuthContext.jsx | Check both token keys | Compatible with old and new storage |
| AuthContext.jsx | Added initialization logging | Confirm auth state on app load |
| AuthContext.jsx | Enhanced setToken/setUser | Clear visibility of auth operations |

---

**Status**: ✅ Ready for Testing
**Last Updated**: January 29, 2025
