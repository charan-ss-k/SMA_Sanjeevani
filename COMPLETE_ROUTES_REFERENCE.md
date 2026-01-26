# Complete API Routes Reference

## Authentication Routes (`/api/auth`)

### 1. Sign Up
```
POST /api/auth/signup
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "full_name": "John Doe",
  "age": 30,
  "gender": "Male"
}

Response (201):
{
  "access_token": "eyJhbGc...",
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

### 2. Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}

Response (200):
{
  "access_token": "eyJhbGc...",
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

### 3. Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>

Response (200):
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

### 4. Change Password
```
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "old_password": "currentpassword",
  "new_password": "newpassword123"
}

Response (200):
{
  "message": "Password changed successfully"
}
```

### 5. Logout
```
POST /api/auth/logout
Authorization: Bearer <token>

Response (200):
{
  "message": "Logged out successfully"
}
```

---

## Medicine History Routes (`/api/medicine-history`)
**All routes require: Authorization: Bearer <token>**

### 1. Create Medicine History
```
POST /api/medicine-history/
Content-Type: application/json

{
  "symptoms": "headache, fever",
  "predicted_condition": "Common Cold",
  "medicines": "Paracetamol, Aspirin",
  "dosages": "500mg twice daily, 300mg thrice daily",
  "feedback": "Felt better within 2 days",
  "rating": 4
}

Response (200):
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

### 2. Get All Medicine History
```
GET /api/medicine-history/?skip=0&limit=10

Query Parameters:
- skip: number (default 0)
- limit: number (default 10)

Response (200):
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

### 3. Get Specific Medicine History
```
GET /api/medicine-history/{history_id}

Response (200):
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

### 4. Update Medicine History
```
PUT /api/medicine-history/{history_id}
Content-Type: application/json

{
  "feedback": "Improved significantly",
  "rating": 5
}

Response (200):
{
  "id": 1,
  "user_id": 1,
  "feedback": "Improved significantly",
  "rating": 5,
  "created_at": "2024-01-20T10:30:00"
}
```

### 5. Delete Medicine History
```
DELETE /api/medicine-history/{history_id}

Response (204): No content
```

---

## Prescription Routes (`/api/prescriptions`)
**All routes require: Authorization: Bearer <token>**

### 1. Create Prescription
```
POST /api/prescriptions/
Content-Type: application/json

{
  "medicine_name": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "duration": "7 days",
  "doctor_name": "Dr. Smith",
  "notes": "Take with food"
}

Response (200):
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

### 2. Get All Prescriptions
```
GET /api/prescriptions/?skip=0&limit=10

Response (200):
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

### 3. Get Specific Prescription
```
GET /api/prescriptions/{prescription_id}

Response (200):
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

### 4. Update Prescription
```
PUT /api/prescriptions/{prescription_id}
Content-Type: application/json

{
  "dosage": "250mg",
  "frequency": "Three times daily"
}

Response (200):
{
  "id": 1,
  "user_id": 1,
  "dosage": "250mg",
  "frequency": "Three times daily",
  "updated_at": "2024-01-20T11:00:00"
}
```

### 5. Delete Prescription
```
DELETE /api/prescriptions/{prescription_id}

Response (204): No content
```

---

## Reminder Routes (`/api/reminders`)
**All routes require: Authorization: Bearer <token>**

### 1. Create Reminder
```
POST /api/reminders/
Content-Type: application/json

{
  "prescription_id": 1,
  "medicine_name": "Amoxicillin",
  "reminder_time": "08:00",
  "frequency": "Daily",
  "days": "Monday,Wednesday,Friday"
}

Response (200):
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

### 2. Get All Reminders
```
GET /api/reminders/?skip=0&limit=10

Response (200):
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

### 3. Get Specific Reminder
```
GET /api/reminders/{reminder_id}

Response (200):
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

### 4. Update Reminder
```
PUT /api/reminders/{reminder_id}
Content-Type: application/json

{
  "reminder_time": "09:00",
  "frequency": "Twice Daily"
}

Response (200):
{
  "id": 1,
  "reminder_time": "09:00",
  "frequency": "Twice Daily",
  "updated_at": "2024-01-20T11:00:00"
}
```

### 5. Delete Reminder
```
DELETE /api/reminders/{reminder_id}

Response (204): No content
```

---

## Q&A History Routes (`/api/qa-history`)
**All routes require: Authorization: Bearer <token>**

### 1. Create Q&A Record
```
POST /api/qa-history/
Content-Type: application/json

{
  "question": "What are symptoms of flu?",
  "answer": "Common flu symptoms include fever, cough, body aches...",
  "category": "Symptoms",
  "helpful": true,
  "follow_up_questions": "How long does flu last?"
}

Response (200):
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

### 2. Get Q&A History
```
GET /api/qa-history/?skip=0&limit=10&category=Symptoms

Query Parameters:
- skip: number (default 0)
- limit: number (default 10)
- category: string (optional - Symptoms, Medicine, Prescription, General)

Response (200):
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

### 3. Get Specific Q&A Record
```
GET /api/qa-history/{qa_id}

Response (200):
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

### 4. Mark Q&A as Helpful
```
PUT /api/qa-history/{qa_id}/helpful?helpful=true

Query Parameters:
- helpful: boolean (true or false)

Response (200):
{
  "message": "Feedback recorded",
  "helpful": true
}
```

### 5. Delete Q&A Record
```
DELETE /api/qa-history/{qa_id}

Response (204): No content
```

---

## Dashboard Routes (`/api/dashboard`)
**All routes require: Authorization: Bearer <token>**

### 1. Get Dashboard Stats
```
GET /api/dashboard/stats

Response (200):
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

### 2. Get User Progress
```
GET /api/dashboard/progress?days=30

Query Parameters:
- days: number (default 30)

Response (200):
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

### 3. Get Health Insights
```
GET /api/dashboard/health-insights

Response (200):
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

## HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET/PUT/POST |
| 201 | Created | Successful POST (Sign up) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Invalid/expired token |
| 403 | Forbidden | Missing Authorization header |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Backend error |

---

## Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common Errors

**Invalid Token:**
```json
{
  "detail": "Invalid or expired token"
}
```

**Missing Authorization:**
```json
{
  "detail": "Authentication required"
}
```

**Resource Not Found:**
```json
{
  "detail": "Medicine history not found"
}
```

**Duplicate Username:**
```json
{
  "detail": "Username already exists"
}
```

**Invalid Credentials:**
```json
{
  "detail": "Invalid username or password"
}
```

---

## Request Headers

All requests should include:
```
Content-Type: application/json
```

Protected endpoints also require:
```
Authorization: Bearer {your_jwt_token}
```

---

## Response Format

### Success Response
```json
{
  "field1": "value1",
  "field2": "value2",
  "created_at": "2024-01-20T10:30:00"
}
```

### Array Response
```json
[
  {
    "id": 1,
    "field": "value"
  },
  {
    "id": 2,
    "field": "value"
  }
]
```

### Error Response
```json
{
  "detail": "Error description"
}
```

---

## Total Routes Summary

| Category | Count | Type |
|----------|-------|------|
| Authentication | 5 | 3 POST, 1 GET, 1 POST |
| Medicine History | 5 | 1 POST, 1 GET, 1 GET (by id), 1 PUT, 1 DELETE |
| Prescriptions | 5 | 1 POST, 1 GET, 1 GET (by id), 1 PUT, 1 DELETE |
| Reminders | 5 | 1 POST, 1 GET, 1 GET (by id), 1 PUT, 1 DELETE |
| Q&A History | 5 | 1 POST, 1 GET, 1 GET (by id), 1 PUT, 1 DELETE |
| Dashboard | 3 | 3 GET |
| **TOTAL** | **28** | |

---

**API Version:** 1.0.0  
**Last Updated:** January 2024  
**Status:** Production Ready
