# Sanjeevani API Documentation

## Base URL
`http://localhost:8000`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### 1. Sign Up
**POST** `/api/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "full_name": "John Doe",
  "age": 30,
  "gender": "Male"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "age": 30,
    "gender": "Male"
  }
}
```

---

### 2. Login
**POST** `/api/auth/login`

Authenticate user and get JWT token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe"
  }
}
```

---

### 3. Get Current User
**GET** `/api/auth/me`

Get logged-in user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "age": 30,
  "gender": "Male",
  "is_active": true
}
```

---

### 4. Change Password
**POST** `/api/auth/change-password`

Change user password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "old_password": "currentpassword",
  "new_password": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

### 5. Logout
**POST** `/api/auth/logout`

Clear client-side token (no server-side action needed for JWT).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## 💊 Medicine History Endpoints

### 1. Create Medicine History
**POST** `/api/medicine-history/`

Save a medicine recommendation to user's history.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "symptoms": "headache, fever",
  "predicted_condition": "Common Cold",
  "medicines": "Paracetamol, Aspirin",
  "dosages": "500mg twice daily, 300mg thrice daily",
  "feedback": "Felt better within 2 days",
  "rating": 4
}
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "symptoms": "headache, fever",
  "predicted_condition": "Common Cold",
  "medicines": "Paracetamol, Aspirin",
  "dosages": "500mg twice daily, 300mg thrice daily",
  "feedback": "Felt better within 2 days",
  "rating": 4,
  "created_at": "2024-01-20T10:30:00"
}
```

---

### 2. Get User's Medicine History
**GET** `/api/medicine-history/?skip=0&limit=10`

Retrieve all medicine recommendations for logged-in user.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 10)

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "symptoms": "headache, fever",
    "predicted_condition": "Common Cold",
    "medicines": "Paracetamol, Aspirin",
    "dosages": "500mg twice daily, 300mg thrice daily",
    "rating": 4,
    "created_at": "2024-01-20T10:30:00"
  }
]
```

---

### 3. Get Specific Medicine History
**GET** `/api/medicine-history/{history_id}`

Get details of a specific medicine history entry.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "symptoms": "headache, fever",
  "predicted_condition": "Common Cold",
  "medicines": "Paracetamol, Aspirin",
  "dosages": "500mg twice daily, 300mg thrice daily",
  "feedback": "Felt better within 2 days",
  "rating": 4,
  "created_at": "2024-01-20T10:30:00"
}
```

---

### 4. Update Medicine History
**PUT** `/api/medicine-history/{history_id}`

Update a medicine history entry.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "feedback": "Improved significantly",
  "rating": 5
}
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "feedback": "Improved significantly",
  "rating": 5,
  "created_at": "2024-01-20T10:30:00"
}
```

---

### 5. Delete Medicine History
**DELETE** `/api/medicine-history/{history_id}`

Delete a medicine history entry.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (204):** No content

---

## 📋 Prescription Endpoints

### 1. Create Prescription
**POST** `/api/prescriptions/`

Add a new prescription.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "medicine_name": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "duration": "7 days",
  "doctor_name": "Dr. Smith",
  "notes": "Take with food"
}
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "medicine_name": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "duration": "7 days",
  "doctor_name": "Dr. Smith",
  "notes": "Take with food",
  "created_at": "2024-01-20T10:30:00",
  "updated_at": "2024-01-20T10:30:00"
}
```

---

### 2. Get All Prescriptions
**GET** `/api/prescriptions/?skip=0&limit=10`

Get all prescriptions for logged-in user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "medicine_name": "Amoxicillin",
    "dosage": "500mg",
    "frequency": "Twice daily",
    "duration": "7 days",
    "doctor_name": "Dr. Smith",
    "created_at": "2024-01-20T10:30:00",
    "updated_at": "2024-01-20T10:30:00"
  }
]
```

---

### 3. Get Specific Prescription
**GET** `/api/prescriptions/{prescription_id}`

Get details of a specific prescription.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "medicine_name": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "duration": "7 days",
  "doctor_name": "Dr. Smith",
  "notes": "Take with food",
  "created_at": "2024-01-20T10:30:00",
  "updated_at": "2024-01-20T10:30:00"
}
```

---

### 4. Update Prescription
**PUT** `/api/prescriptions/{prescription_id}`

Update a prescription.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "dosage": "250mg",
  "frequency": "Three times daily"
}
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "dosage": "250mg",
  "frequency": "Three times daily",
  "updated_at": "2024-01-20T11:00:00"
}
```

---

### 5. Delete Prescription
**DELETE** `/api/prescriptions/{prescription_id}`

Delete a prescription.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (204):** No content

---

## ⏰ Reminder Endpoints

### 1. Create Reminder
**POST** `/api/reminders/`

Set up a medicine reminder.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "prescription_id": 1,
  "medicine_name": "Amoxicillin",
  "reminder_time": "08:00",
  "frequency": "Daily",
  "days": "Monday,Wednesday,Friday"
}
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "prescription_id": 1,
  "medicine_name": "Amoxicillin",
  "reminder_time": "08:00",
  "frequency": "Daily",
  "days": "Monday,Wednesday,Friday",
  "created_at": "2024-01-20T10:30:00",
  "updated_at": "2024-01-20T10:30:00"
}
```

---

### 2. Get All Reminders
**GET** `/api/reminders/?skip=0&limit=10`

Get all reminders for logged-in user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "prescription_id": 1,
    "medicine_name": "Amoxicillin",
    "reminder_time": "08:00",
    "frequency": "Daily",
    "created_at": "2024-01-20T10:30:00",
    "updated_at": "2024-01-20T10:30:00"
  }
]
```

---

### 3. Update Reminder
**PUT** `/api/reminders/{reminder_id}`

Update a reminder.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reminder_time": "09:00",
  "frequency": "Twice Daily"
}
```

**Response (200):**
```json
{
  "id": 1,
  "reminder_time": "09:00",
  "frequency": "Twice Daily",
  "updated_at": "2024-01-20T11:00:00"
}
```

---

### 4. Delete Reminder
**DELETE** `/api/reminders/{reminder_id}`

Delete a reminder.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (204):** No content

---

## 💬 Q&A History Endpoints

### 1. Create Q&A Record
**POST** `/api/qa-history/`

Save a medical question and answer.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "question": "What are symptoms of flu?",
  "answer": "Common flu symptoms include fever, cough, body aches...",
  "category": "Symptoms",
  "helpful": true,
  "follow_up_questions": "How long does flu last?"
}
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "question": "What are symptoms of flu?",
  "answer": "Common flu symptoms include fever, cough, body aches...",
  "category": "Symptoms",
  "helpful": true,
  "follow_up_questions": "How long does flu last?",
  "created_at": "2024-01-20T10:30:00"
}
```

---

### 2. Get Q&A History
**GET** `/api/qa-history/?skip=0&limit=10&category=Symptoms`

Get Q&A history for logged-in user.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `skip` (optional): Number of records to skip
- `limit` (optional): Number of records to return
- `category` (optional): Filter by category (Symptoms, Medicine, Prescription, General)

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "question": "What are symptoms of flu?",
    "answer": "Common flu symptoms include fever, cough, body aches...",
    "category": "Symptoms",
    "helpful": true,
    "created_at": "2024-01-20T10:30:00"
  }
]
```

---

### 3. Mark Q&A as Helpful
**PUT** `/api/qa-history/{qa_id}/helpful?helpful=true`

Mark Q&A answer as helpful or not helpful.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `helpful` (required): true or false

**Response (200):**
```json
{
  "message": "Feedback recorded",
  "helpful": true
}
```

---

### 4. Delete Q&A Record
**DELETE** `/api/qa-history/{qa_id}`

Delete a Q&A history entry.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (204):** No content

---

## 📊 Dashboard Endpoints

### 1. Get Dashboard Stats
**GET** `/api/dashboard/stats`

Get user's health dashboard statistics and metrics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "consultations": 5,
  "medications_tracked": 12,
  "reminders_set": 3,
  "health_score": 75,
  "streak_days": 4,
  "recent_activities": [
    {
      "type": "consultation",
      "description": "Asked: What are symptoms of...",
      "timestamp": "2024-01-20T10:30:00",
      "category": "Symptoms"
    },
    {
      "type": "prescription",
      "description": "Added: Paracetamol - 500mg",
      "timestamp": "2024-01-20T09:15:00",
      "doctor": "Dr. Smith"
    }
  ]
}
```

---

### 2. Get User Progress
**GET** `/api/dashboard/progress?days=30`

Get user's activity progress over specified days.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `days` (optional): Number of days to include (default: 30)

**Response (200):**
```json
{
  "period_days": 30,
  "daily_progress": [
    {
      "date": "2024-01-15",
      "consultations": 2,
      "medications": 1
    },
    {
      "date": "2024-01-16",
      "consultations": 1,
      "medications": 0
    }
  ]
}
```

---

### 3. Get Health Insights
**GET** `/api/dashboard/health-insights`

Get personalized health insights based on user's history.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "top_conditions": [
    {
      "condition": "Common Cold",
      "frequency": 3
    },
    {
      "condition": "Headache",
      "frequency": 2
    }
  ],
  "common_medicines": [
    {
      "medicine": "Paracetamol",
      "frequency": 5
    }
  ],
  "helpful_qa_categories": [
    {
      "category": "Symptoms",
      "helpful_count": 4
    }
  ],
  "recommendations": [
    "Consider scheduling a regular check-up for Common Cold",
    "You're taking multiple medicines. Ensure there are no interactions."
  ]
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "detail": "Account is inactive"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 400 Bad Request
```json
{
  "detail": "Username already exists"
}
```

---

## Testing the API

### Using cURL:
```bash
# Sign up
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123",
    "full_name": "Test User",
    "age": 25,
    "gender": "Male"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123"
  }'

# Get current user
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using JavaScript/Fetch:
```javascript
// Sign up
const response = await fetch('http://localhost:8000/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'test123',
    full_name: 'Test User',
    age: 25,
    gender: 'Male'
  })
});

const data = await response.json();
const token = data.access_token;

// Use token for protected endpoints
const userResponse = await fetch('http://localhost:8000/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Database Schema

```
User
├── id (Primary Key)
├── username (Unique)
├── email (Unique)
├── password_hash
├── full_name
├── age
├── gender
├── is_active
├── created_at
└── updated_at

MedicineHistory
├── id (Primary Key)
├── user_id (Foreign Key)
├── symptoms
├── predicted_condition
├── medicines
├── dosages
├── feedback
├── rating
├── created_at
└── updated_at

Prescription
├── id (Primary Key)
├── user_id (Foreign Key)
├── medicine_name
├── dosage
├── frequency
├── duration
├── doctor_name
├── notes
├── created_at
└── updated_at

Reminder
├── id (Primary Key)
├── user_id (Foreign Key)
├── prescription_id (Foreign Key)
├── medicine_name
├── reminder_time
├── frequency
├── days
├── created_at
└── updated_at

QAHistory
├── id (Primary Key)
├── user_id (Foreign Key)
├── question
├── answer
├── category
├── helpful
├── follow_up_questions
├── created_at
└── updated_at

DashboardData
├── id (Primary Key)
├── user_id (Foreign Key)
├── consultations
├── medications_tracked
├── reminders_set
├── health_score
├── streak_days
├── created_at
└── updated_at
```

---

## Rate Limiting
Currently no rate limiting is applied. For production, implement rate limiting using tools like `slowapi`.

## CORS
CORS is enabled for all origins. For production, restrict to specific domains:
```python
allow_origins=["https://yourdomain.com", "https://app.yourdomain.com"]
```
