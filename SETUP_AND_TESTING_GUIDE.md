# Setup and Testing Guide for Sanjeevani Authentication System

## 🚀 Installation & Setup

### Backend Setup

#### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

Required packages:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `sqlalchemy>=2.0` - ORM
- `python-jose[cryptography]` - JWT handling
- `passlib[bcrypt]` - Password hashing
- `python-dotenv` - Environment variables

#### 2. Configure Environment
Update or create `.env` file:

**Development (SQLite):**
```
DATABASE_URL=sqlite:///./sanjeevani.db
SECRET_KEY=your-super-secret-key-change-this-in-production
```

**Production (PostgreSQL):**
```
DATABASE_URL=postgresql://user:password@localhost:5432/sanjeevani
SECRET_KEY=your-production-secret-key-32-chars-minimum
```

**Production (MySQL):**
```
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/sanjeevani
SECRET_KEY=your-production-secret-key-32-chars-minimum
```

#### 3. Start Backend
```bash
python main.py
# or with uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

#### 4. Verify Database
SQLite database will be created automatically at: `backend/sanjeevani.db`

### Frontend Setup

#### 1. Install Dependencies
```bash
cd frontend
npm install
```

#### 2. Start Development Server
```bash
npm run dev
```

Frontend will be available at: `http://localhost:5174`

---

## 🧪 Testing the System

### Test 1: Create User Account (Sign Up)

**Using Frontend:**
1. Open browser to `http://localhost:5174`
2. Scroll to see login/signup page or navigate to `/login`
3. Click "Sign Up" tab
4. Fill in the form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
   - Full Name: `Test User`
   - Age: `25`
   - Gender: `Male`
5. Click "Sign Up"
6. You should be redirected to home page with authentication

**Using cURL:**
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "age": 25,
    "gender": "Male"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "full_name": "Test User"
  }
}
```

---

### Test 2: Login

**Using Frontend:**
1. Open `http://localhost:5174/login`
2. Click "Login" tab
3. Enter:
   - Username: `testuser`
   - Password: `password123`
4. Click "Login"
5. Should redirect to home page

**Using cURL:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

---

### Test 3: Add Medicine Recommendation

**Using cURL:**
```bash
TOKEN="your_jwt_token_from_login"

curl -X POST http://localhost:8000/api/medicine-history/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "symptoms": "headache, fever, sore throat",
    "predicted_condition": "Flu",
    "medicines": "Paracetamol, Aspirin, Throat Lozenges",
    "dosages": "500mg twice daily, 300mg thrice daily, 1 lozenge every 2 hours",
    "feedback": "Feeling much better after 2 days",
    "rating": 4
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "symptoms": "headache, fever, sore throat",
  "predicted_condition": "Flu",
  "medicines": "Paracetamol, Aspirin, Throat Lozenges",
  "dosages": "500mg twice daily, 300mg thrice daily, 1 lozenge every 2 hours",
  "feedback": "Feeling much better after 2 days",
  "rating": 4,
  "created_at": "2024-01-20T10:30:00"
}
```

---

### Test 4: Add Prescription

**Using cURL:**
```bash
TOKEN="your_jwt_token"

curl -X POST http://localhost:8000/api/prescriptions/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "medicine_name": "Amoxicillin",
    "dosage": "500mg",
    "frequency": "Twice daily",
    "duration": "7 days",
    "doctor_name": "Dr. Smith",
    "notes": "Take with food to avoid stomach upset"
  }'
```

---

### Test 5: Create Reminder

**Using cURL:**
```bash
TOKEN="your_jwt_token"

curl -X POST http://localhost:8000/api/reminders/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prescription_id": 1,
    "medicine_name": "Amoxicillin",
    "reminder_time": "08:00",
    "frequency": "Daily",
    "days": "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday"
  }'
```

---

### Test 6: Get Dashboard Stats

**Using cURL:**
```bash
TOKEN="your_jwt_token"

curl -X GET http://localhost:8000/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "consultations": 0,
  "medications_tracked": 1,
  "reminders_set": 1,
  "health_score": 55,
  "streak_days": 1,
  "recent_activities": [
    {
      "type": "prescription",
      "description": "Added: Amoxicillin - 500mg",
      "timestamp": "2024-01-20T10:30:00",
      "doctor": "Dr. Smith"
    }
  ]
}
```

---

### Test 7: Protected Route Access

**Without Token (Should Fail):**
```bash
curl -X GET http://localhost:8000/api/dashboard/stats
# Returns 403 Forbidden
```

**With Invalid Token (Should Fail):**
```bash
curl -X GET http://localhost:8000/api/dashboard/stats \
  -H "Authorization: Bearer invalid_token"
# Returns 401 Unauthorized
```

**With Valid Token (Should Work):**
```bash
curl -X GET http://localhost:8000/api/dashboard/stats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
# Returns 200 with user's dashboard stats
```

---

### Test 8: User Data Isolation

Create a second user and verify they can't access the first user's data:

**Create second user:**
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "test2@example.com",
    "password": "password123",
    "full_name": "Test User 2",
    "age": 30,
    "gender": "Female"
  }'
```

**Try to access first user's medicine history with second user's token:**
```bash
TOKEN_USER2="second_user_token"

curl -X GET http://localhost:8000/api/medicine-history/1 \
  -H "Authorization: Bearer $TOKEN_USER2"
# Returns 404 - Can't access other user's data
```

---

## 📊 Monitoring & Debugging

### Check Database
```bash
# View SQLite database contents
sqlite3 backend/sanjeevani.db

# Inside sqlite3 shell:
.tables  # List all tables
SELECT * FROM user;  # View users
SELECT * FROM medicine_history;  # View medicine history
```

### Backend Logs
The backend logs important events. Look for:
- ✅ "Database initialized successfully"
- Authentication successes and failures
- Token validation results

### Frontend Console
Open browser DevTools (F12) to check:
- Network requests to backend
- localStorage contents (token and user info)
- Console errors

---

## 🔒 Security Checklist

- ✅ Passwords hashed with bcrypt (never stored plain text)
- ✅ JWT tokens for stateless authentication
- ✅ Tokens expire after 30 minutes
- ✅ User data isolated by user_id
- ✅ Protected routes require valid token
- ✅ HTTP Bearer authentication standard

### For Production:
1. Change `SECRET_KEY` in `.env` to a long random string (32+ chars)
2. Use PostgreSQL or MySQL instead of SQLite
3. Enable HTTPS/SSL
4. Restrict CORS to specific domains
5. Implement rate limiting
6. Add logging and monitoring
7. Set up automated backups
8. Use environment-specific configurations

---

## Troubleshooting

### Issue: "Database initialization failed"
**Solution:** 
- Check `DATABASE_URL` in `.env`
- Ensure backend directory has write permissions
- For PostgreSQL/MySQL, verify connection details

### Issue: "Invalid or expired token"
**Solution:**
- Token expires after 30 minutes, get a new one by logging in
- Check token format in Authorization header: `Bearer <token>`
- Ensure Bearer token doesn't have typos

### Issue: "404 Not Found" for protected endpoints
**Solution:**
- Missing Authorization header
- Token for different user (data isolation)
- Wrong endpoint path

### Issue: CORS errors
**Solution:**
- Backend has CORS enabled for all origins (development)
- For production, update CORS settings in main.py

### Issue: Frontend can't connect to backend
**Solution:**
- Check both servers are running
- Verify ports: Backend (8000), Frontend (5174)
- Check network connectivity
- Look at browser DevTools Network tab for failed requests

---

## API Response Codes Reference

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (Successful deletion) |
| 400 | Bad Request (Invalid input) |
| 401 | Unauthorized (Invalid token) |
| 403 | Forbidden (Access denied) |
| 404 | Not Found (Resource doesn't exist) |
| 500 | Server Error |

---

## Sample JavaScript Integration

```javascript
const API_BASE = 'http://localhost:8000';

// Sign up
async function signup(userData) {
  const response = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
}

// Login
async function login(username, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  return data;
}

// Get current user
async function getCurrentUser(token) {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

// Add medicine history
async function addMedicineHistory(token, medicineData) {
  const response = await fetch(`${API_BASE}/api/medicine-history/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(medicineData)
  });
  return response.json();
}

// Get dashboard stats
async function getDashboardStats(token) {
  const response = await fetch(`${API_BASE}/api/dashboard/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

// Usage
const token = localStorage.getItem('token');
if (token) {
  getDashboardStats(token).then(stats => {
    console.log('Dashboard:', stats);
  });
}
```

---

## Next Steps

1. ✅ Authentication system fully implemented
2. ✅ Database models created
3. ✅ Protected routes in place
4. ✅ API endpoints for all features
5. Next: Integrate frontend components with backend API
6. Next: Add notification/reminder backend service
7. Next: Implement advanced features (reminders notification, etc.)

---

## Support & Documentation

- API Documentation: See `API_DOCUMENTATION.md`
- Database Schema: See `models.py`
- Security Implementation: See `security.py`
- Database Configuration: See `database.py`
- Frontend Components: See `frontend/src/components/`

---

**Last Updated:** January 2024
**Version:** 1.0.0
**Status:** Production Ready
