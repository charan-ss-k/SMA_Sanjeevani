# Login Quick Start Guide

## For Users

### How to Login

1. **Navigate to Login Page**
   - Open http://localhost:5174 (or your deployment URL)
   - Click "Login" button in navbar

2. **Enter Your Credentials**
   - Enter your username
   - Enter your password
   - Click "Login" button

3. **What to Expect**
   - Page should redirect to Dashboard
   - You should see "Welcome back, [Your Name]!"
   - Appointments and reminders should be visible

### Sign Up (New Account)

1. **Click Sign Up Tab**
   - On Login page, click "Sign Up" tab
   - Fill in all required fields:
     - Username (3-50 characters)
     - Email address
     - Full name
     - Password (at least 6 characters)
     - Confirm password
   - Age and gender are optional

2. **Create Account**
   - Click "Sign Up" button
   - Should redirect to Dashboard
   - Account is immediately active

### Forgot Password?

Currently not implemented. Contact administrator if you forget your password.

### Having Issues?

**Login Button Does Nothing?**
- Check internet connection
- Make sure backend server is running
- Try refreshing page (Ctrl+R)
- Clear browser cache (Ctrl+Shift+Delete)

**Getting Error Message?**
- Read error message carefully
- Common errors:
  - "Invalid username or password" → Check spelling
  - "Username already registered" → Account exists, use login instead
  - "Email already registered" → Email used for another account

**Still Can't Login?**
- Check browser console (F12 → Console)
- Look for error messages
- Contact support with the error message

---

## For Developers

### How Authentication Works

```
User Input
    ↓
Frontend validates input
    ↓
Sends POST /api/auth/login
    ↓
Backend verifies credentials
    ↓
Returns JWT token + user data
    ↓
Frontend stores token in localStorage
    ↓
Frontend redirects to /home
    ↓
AuthContext reads token from localStorage
    ↓
User authenticated!
```

### Key Files

| File | Purpose |
|------|---------|
| `frontend/src/components/LoginSignup.jsx` | Login/signup form + API calls |
| `frontend/src/context/AuthContext.jsx` | Manages authentication state |
| `backend/app/api/routes/routes_auth.py` | Backend auth endpoints |
| `backend/app/core/security.py` | Password hashing + JWT tokens |
| `backend/app/core/middleware.py` | Verifies tokens in requests |

### Testing Login

**Manual Test**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Enter credentials and submit
4. Watch console for logs:
   - 🔐 Auth Request
   - 📤 Payload
   - 📥 Response Status  
   - ✅ Auth Success
   - 💾 Stored

**Automated Test**:
```bash
# Linux/Mac
bash test_login.sh

# Windows
.\test_login.ps1
```

### Debugging Failed Login

**Check Backend Running**:
```bash
curl http://127.0.0.1:8000/health
```

**Test Login Endpoint**:
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

**Check Browser Storage**:
```javascript
// In browser console:
localStorage.getItem('token')
localStorage.getItem('access_token')
localStorage.getItem('user')
```

### API Endpoints

#### Login
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "username": "john_doe",
  "password": "password123"
}

Response (200):
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": true
  },
  "expires_in": 3600
}

Error (401):
{
  "detail": "Invalid username or password"
}
```

#### Sign Up
```
POST /api/auth/signup
Content-Type: application/json

Request:
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "age": 30,
  "gender": "Male"
}

Response (201):
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {...},
  "expires_in": 3600
}

Error (400):
{
  "detail": "Username already registered"
}
```

#### Logout
```
POST /api/auth/logout
Authorization: Bearer <token>

Response (200):
{
  "message": "Logged out successfully"
}
```

### Token Storage

Tokens are stored in localStorage with two keys for compatibility:
```javascript
localStorage.getItem('token')        // Primary key
localStorage.getItem('access_token')  // Fallback key
localStorage.getItem('user')          // User object as JSON
```

### Security Notes

- Tokens are stored in localStorage (not a secure cookie)
- For production, consider:
  - Using secure HTTP-only cookies
  - Implementing token refresh
  - Adding CSRF protection
  - Rate limiting login attempts

### Common Tasks

**Check if User is Logged In**:
```javascript
const token = localStorage.getItem('token') || localStorage.getItem('access_token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
const isLoggedIn = !!token && !!user.id;
```

**Get Current Token**:
```javascript
// In any component with AuthContext
const { token } = useContext(AuthContext);
```

**Logout**:
```javascript
const { logout } = useContext(AuthContext);
logout();
// Token and user cleared from localStorage
// Redirect to login page manually if needed
```

**Make Authenticated Request**:
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:8000/api/doctors', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Troubleshooting Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5174
- [ ] Can curl backend health endpoint
- [ ] Can POST to /api/auth/login successfully
- [ ] Response includes access_token
- [ ] Response includes user object
- [ ] Token is stored in localStorage
- [ ] User object is stored in localStorage
- [ ] AuthContext initialized with token
- [ ] isAuthenticated returns true
- [ ] Can access protected routes

### Performance Tips

- Tokens expire after 60 minutes (configurable)
- Refresh page to reload auth state
- Use React.memo for auth-dependent components
- Cache user data after login

### Security Best Practices

1. **Never commit tokens** to version control
2. **Use HTTPS** in production
3. **Validate input** on both frontend and backend
4. **Hash passwords** in database (already done)
5. **Implement rate limiting** on login endpoint
6. **Log security events** for auditing
7. **Rotate secrets** regularly
8. **Use strong passwords** in production

---

## Checklist Before Going Live

### Backend
- [ ] Database migrations applied
- [ ] Auth routes registered
- [ ] CORS configured correctly
- [ ] Hashing algorithm working
- [ ] JWT token creation working
- [ ] Backend tests passing

### Frontend
- [ ] API_BASE URL set correctly
- [ ] Login form validation working
- [ ] Token stored properly
- [ ] AuthContext initializes correctly
- [ ] Protected routes work
- [ ] Logout clears storage
- [ ] Console logs are working

### Testing
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials fails
- [ ] Signup creates new account
- [ ] Cannot signup with existing username
- [ ] Token expires correctly
- [ ] Logout clears session
- [ ] Refresh page maintains login

### Deployment
- [ ] HTTPS enabled
- [ ] CORS configured for production domain
- [ ] Database backed up
- [ ] Error logging enabled
- [ ] Rate limiting configured
- [ ] Monitoring set up

---

**Last Updated**: January 29, 2025
**Status**: Ready for Use ✅
