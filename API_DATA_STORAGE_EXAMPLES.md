# 🔌 Complete API Reference & Data Storage Examples

## 📋 **Table of Contents**
1. Authentication Endpoints (Public)
2. Medicine History Endpoints (Protected)
3. Prescriptions Endpoints (Protected)
4. Reminders Endpoints (Protected)
5. Q&A History Endpoints (Protected)
6. Dashboard Endpoints (Protected)

---

## 🔐 **Authentication Endpoints** (No Token Required)

### **1. Signup (Create User Account)**
```http
POST http://localhost:8000/api/auth/signup
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password123",
  "full_name": "John Doe",
  "age": 30,
  "gender": "Male"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "age": 30,
    "gender": "Male",
    "is_active": true
  },
  "expires_in": 1800
}
```

**Data Stored:**
- ✅ User record in `users` table
- ✅ Password hashed with bcrypt
- ✅ Timestamps set to current time
- ✅ JWT token valid for 30 minutes

---

### **2. Login (Get Auth Token)**
```http
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "secure_password123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "age": 30,
    "gender": "Male",
    "is_active": true
  },
  "expires_in": 1800
}
```

**Use the `access_token` in all subsequent requests:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 💊 **Medicine History Endpoints** (Requires JWT Token)

### **1. Save Medicine Recommendation**
```http
POST http://localhost:8000/api/medicine-history
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "symptoms": ["headache", "fever", "cough"],
  "predicted_condition": "Common Cold",
  "recommended_medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "Every 4-6 hours",
      "side_effects": "Generally well tolerated"
    },
    {
      "name": "Cough Syrup",
      "dosage": "10ml",
      "frequency": "Twice daily",
      "side_effects": "May cause drowsiness"
    }
  ],
  "home_care_advice": [
    "Get plenty of rest",
    "Stay hydrated",
    "Use humidifier"
  ],
  "doctor_consultation_advice": "Consult if symptoms persist for more than a week",
  "effectiveness_rating": 4.5,
  "feedback": "Helpful recommendations"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "user_id": 1,
  "symptoms": ["headache", "fever", "cough"],
  "predicted_condition": "Common Cold",
  "recommended_medicines": [...],
  "home_care_advice": [...],
  "doctor_consultation_advice": "Consult if symptoms persist...",
  "effectiveness_rating": 4.5,
  "feedback": "Helpful recommendations",
  "created_at": "2026-01-26T10:30:00",
  "updated_at": "2026-01-26T10:30:00"
}
```

**Data Stored:**
- ✅ Recommendation in `medicine_history` table
- ✅ Associated with user_id (automatic from JWT)
- ✅ Timestamps recorded
- ✅ User rating saved for analytics

---

### **2. Get User's Medicine History**
```http
GET http://localhost:8000/api/medicine-history
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "symptoms": ["headache", "fever", "cough"],
    "predicted_condition": "Common Cold",
    "recommended_medicines": [...],
    "created_at": "2026-01-26T10:30:00"
  },
  {
    "id": 2,
    "user_id": 1,
    "symptoms": ["sore throat"],
    "predicted_condition": "Pharyngitis",
    "recommended_medicines": [...],
    "created_at": "2026-01-26T11:45:00"
  }
]
```

**Data Retrieved:**
- ✅ Only this user's recommendations
- ✅ Ordered by most recent
- ✅ Includes all details for dashboard/history

---

## 📋 **Prescriptions Endpoints** (Requires JWT Token)

### **1. Add Prescription**
```http
POST http://localhost:8000/api/prescriptions
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "medicine_name": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "Three times daily",
  "duration": "7 days",
  "start_date": "2026-01-26T00:00:00",
  "end_date": "2026-02-02T00:00:00",
  "doctor_name": "Dr. Sharma",
  "notes": "Take with food. Complete the full course."
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "user_id": 1,
  "medicine_name": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "Three times daily",
  "duration": "7 days",
  "start_date": "2026-01-26T00:00:00",
  "end_date": "2026-02-02T00:00:00",
  "doctor_name": "Dr. Sharma",
  "notes": "Take with food...",
  "is_active": true,
  "created_at": "2026-01-26T10:30:00"
}
```

**Data Stored:**
- ✅ Prescription in `prescriptions` table
- ✅ Links to user via user_id
- ✅ Status marked as active
- ✅ Dates tracked for duration

---

### **2. Get User's Prescriptions**
```http
GET http://localhost:8000/api/prescriptions
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "medicine_name": "Amoxicillin",
    "dosage": "500mg",
    "frequency": "Three times daily",
    "duration": "7 days",
    "is_active": true,
    "created_at": "2026-01-26T10:30:00"
  }
]
```

---

### **3. Update Prescription**
```http
PUT http://localhost:8000/api/prescriptions/1
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "medicine_name": "Amoxicillin",
  "dosage": "250mg",
  "frequency": "Twice daily",
  "duration": "5 days",
  "notes": "Reduced dosage per doctor's advice"
}
```

**Data Updated:**
- ✅ Prescription record modified
- ✅ updated_at timestamp refreshed
- ✅ Only by prescription owner (user_id matches)

---

### **4. Delete Prescription**
```http
DELETE http://localhost:8000/api/prescriptions/1
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "message": "Prescription deleted successfully"
}
```

**Data Deleted:**
- ✅ Prescription removed from database
- ✅ Associated reminders also deleted (cascade delete)

---

## ⏰ **Reminders Endpoints** (Requires JWT Token)

### **1. Create Reminder**
```http
POST http://localhost:8000/api/reminders
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "prescription_id": 1,
  "medicine_name": "Amoxicillin",
  "dosage": "500mg",
  "reminder_time": "08:00",
  "frequency": "Daily",
  "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "user_id": 1,
  "prescription_id": 1,
  "medicine_name": "Amoxicillin",
  "dosage": "500mg",
  "reminder_time": "08:00",
  "frequency": "Daily",
  "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "is_active": true,
  "next_reminder": "2026-01-27T08:00:00",
  "created_at": "2026-01-26T10:30:00"
}
```

**Data Stored:**
- ✅ Reminder in `reminders` table
- ✅ Linked to prescription and user
- ✅ Schedule calculated for next reminder time
- ✅ Status active by default

---

### **2. Get Upcoming Reminders**
```http
GET http://localhost:8000/api/reminders
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "medicine_name": "Amoxicillin",
    "dosage": "500mg",
    "reminder_time": "08:00",
    "frequency": "Daily",
    "next_reminder": "2026-01-27T08:00:00",
    "is_active": true
  }
]
```

---

### **3. Mark Reminder as Done**
```http
PUT http://localhost:8000/api/reminders/1/done
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "message": "Reminder marked as completed",
  "last_reminded": "2026-01-26T08:00:00",
  "next_reminder": "2026-01-27T08:00:00"
}
```

**Data Updated:**
- ✅ last_reminded timestamp updated
- ✅ next_reminder calculated
- ✅ Used for streak tracking on dashboard

---

## 💬 **Q&A History Endpoints** (Requires JWT Token)

### **1. Save Q&A Conversation**
```http
POST http://localhost:8000/api/qa-history
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "question": "What are the symptoms of diabetes?",
  "answer": "Symptoms include excessive thirst, frequent urination, fatigue, and blurred vision. Consult a doctor if you experience these.",
  "category": "Symptoms",
  "follow_up_questions": [
    "What is the treatment for diabetes?",
    "How can I prevent diabetes?",
    "What are the risk factors?"
  ]
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "user_id": 1,
  "question": "What are the symptoms of diabetes?",
  "answer": "Symptoms include excessive thirst...",
  "category": "Symptoms",
  "helpful": null,
  "follow_up_questions": [...],
  "created_at": "2026-01-26T10:30:00"
}
```

**Data Stored:**
- ✅ Q&A in `qa_history` table
- ✅ Associated with user
- ✅ Category for organization
- ✅ Follow-up suggestions for UX

---

### **2. Get Q&A History**
```http
GET http://localhost:8000/api/qa-history
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "question": "What are the symptoms of diabetes?",
    "answer": "Symptoms include excessive thirst...",
    "category": "Symptoms",
    "created_at": "2026-01-26T10:30:00"
  },
  {
    "id": 2,
    "question": "What is treatment?",
    "answer": "Treatment depends on the type...",
    "category": "Treatment",
    "created_at": "2026-01-26T11:00:00"
  }
]
```

---

### **3. Mark Q&A as Helpful**
```http
PUT http://localhost:8000/api/qa-history/1/helpful
Authorization: Bearer YOUR_JWT_TOKEN

{
  "helpful": true
}
```

**Response (200 OK):**
```json
{
  "message": "Feedback recorded",
  "helpful": true
}
```

**Data Updated:**
- ✅ Helpful flag updated (used for AI training)
- ✅ Improves future recommendations

---

## 📊 **Dashboard Endpoints** (Requires JWT Token)

### **1. Get Dashboard Statistics**
```http
GET http://localhost:8000/api/dashboard
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "id": 1,
  "user_id": 1,
  "total_consultations": 5,
  "medications_tracked": 12,
  "reminders_set": 8,
  "questions_asked": 15,
  "last_consultation": "2026-01-26T10:30:00",
  "health_score": 78.5,
  "streak_days": 12,
  "total_medications": 3,
  "active_reminders": 2,
  "custom_data": {
    "favorite_conditions": ["cold", "headache"],
    "most_used_medicine": "Paracetamol"
  },
  "created_at": "2026-01-26T00:00:00",
  "updated_at": "2026-01-26T10:30:00"
}
```

**Data Retrieved:**
- ✅ All user statistics in one call
- ✅ Calculated from related tables
- ✅ Used to display health dashboard
- ✅ Shows compliance metrics

---

### **2. Update Dashboard (System Automatic)**
*(Triggered automatically when user takes actions)*

```
When user:
├─ Gets medicine recommendation → total_consultations += 1
├─ Completes reminder → streak_days += 1, health_score recalculated
├─ Adds prescription → medications_tracked += 1
├─ Asks question → questions_asked += 1
└─ Any action → updated_at timestamp refreshed
```

**Data Updated Automatically:**
- ✅ Real-time statistics
- ✅ Compliance tracking
- ✅ Health score calculation
- ✅ No manual update needed

---

## 🔄 **Common Data Flow Examples**

### **Example 1: Complete User Journey**

```
1. Frontend: User fills signup form
   ├─ POST /api/auth/signup
   └─ Backend: Creates User record + returns token

2. Frontend: User logs in (data persists!)
   ├─ POST /api/auth/login
   └─ Backend: Retrieves User record + returns token

3. Frontend: User searches symptoms
   ├─ Gets AI recommendation
   ├─ POST /api/medicine-history (saves to database)
   └─ Dashboard dashboard updates automatically

4. Frontend: User adds prescription
   ├─ POST /api/prescriptions
   └─ Saved in database

5. Frontend: User creates reminder
   ├─ POST /api/reminders
   └─ Saved in database

6. Frontend: User checks dashboard
   ├─ GET /api/dashboard
   └─ Shows all consolidated statistics

7. Weeks later: User logs back in
   ├─ All data still exists!
   ├─ All recommendations, prescriptions, reminders visible
   └─ Health score and streak calculated
```

### **Example 2: Data Isolation**

```
User A (user_id = 1):
├─ GET /api/medicine-history
│  └─ Returns ONLY User A's medicine history
├─ GET /api/prescriptions
│  └─ Returns ONLY User A's prescriptions
└─ GET /api/dashboard
   └─ Returns ONLY User A's stats

User B (user_id = 2):
├─ GET /api/medicine-history
│  └─ Returns ONLY User B's medicine history
├─ GET /api/prescriptions
│  └─ Returns ONLY User B's prescriptions
└─ GET /api/dashboard
   └─ Returns ONLY User B's stats

User A cannot access User B's data even with valid token!
(Middleware verifies user_id before returning any data)
```

---

## ✅ **Summary: How Data Storage Works**

| Step | What Happens | Where Stored |
|------|--------------|--------------|
| **1. Signup** | User created, password hashed | `users` table |
| **2. Login** | JWT token generated | Sent to frontend |
| **3. Use Feature** | Data collected (medicine, prescription, etc.) | Feature-specific table |
| **4. Close App** | Data remains in database | `sanjeevani.db` file |
| **5. Reopen App** | Login with same credentials | All data retrieved from database |
| **6. Check Stats** | Dashboard calculated from all tables | `dashboard_data` table |

**Result**: User data persists indefinitely until explicitly deleted! ✨

