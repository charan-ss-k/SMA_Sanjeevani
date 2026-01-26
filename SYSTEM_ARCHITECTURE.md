# Sanjeevani System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React Frontend (5174)                                  │   │
│  │  - LoginSignup Component                                │   │
│  │  - AuthContext (Global State)                           │   │
│  │  - ProtectedRoute Wrapper                               │   │
│  │  - Components: Dashboard, Medicine, Prescription        │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/JSON
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (FastAPI)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Authentication                                         │   │
│  │  - POST   /api/auth/signup                             │   │
│  │  - POST   /api/auth/login                              │   │
│  │  - GET    /api/auth/me                                 │   │
│  │  - POST   /api/auth/change-password                    │   │
│  │  - POST   /api/auth/logout                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Protected Resources (Require JWT Token)               │   │
│  │  - Medicine History        /api/medicine-history/      │   │
│  │  - Prescriptions           /api/prescriptions/         │   │
│  │  - Reminders               /api/reminders/            │   │
│  │  - Q&A History             /api/qa-history/           │   │
│  │  - Dashboard               /api/dashboard/            │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ SQLAlchemy ORM
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SQLite (Development) / PostgreSQL/MySQL (Production)  │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  user (Authentication)                          │   │   │
│  │  │  - id, username*, email*, password_hash         │   │   │
│  │  │  - full_name, age, gender, is_active            │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  medicine_history (Tracked Recommendations)    │   │   │
│  │  │  - user_id* (FK), symptoms, condition           │   │   │
│  │  │  - medicines, dosages, feedback, rating         │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  prescription (Doctor Prescriptions)             │   │   │
│  │  │  - user_id* (FK), medicine_name, dosage         │   │   │
│  │  │  - frequency, duration, doctor_name, notes       │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  reminder (Medicine Reminders)                   │   │   │
│  │  │  - user_id* (FK), prescription_id*, medicine     │   │   │
│  │  │  - reminder_time, frequency, days               │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  qa_history (Medical Q&A Tracking)              │   │   │
│  │  │  - user_id* (FK), question, answer              │   │   │
│  │  │  - category, helpful, follow_up_questions       │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  dashboard_data (Analytics)                     │   │   │
│  │  │  - user_id* (FK), consultations, medications    │   │   │
│  │  │  - reminders_set, health_score, streak_days     │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             ▲
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
      ┌──────────────┐             ┌──────────────────┐
      │  SQLite      │             │  PostgreSQL/     │
      │  (Dev DB)    │             │  MySQL (Prod DB) │
      │ sanjeevani   │             │ Connection Pool  │
      │  .db         │             │ Health Checks    │
      └──────────────┘             └──────────────────┘
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SIGNUP FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User enters: username, email, password, details        │
│     ↓                                                       │
│  2. Frontend validates input (email format, password len)   │
│     ↓                                                       │
│  3. POST /api/auth/signup with JSON                         │
│     ↓                                                       │
│  4. Backend validates uniqueness (username, email)          │
│     ↓                                                       │
│  5. Password hashed with bcrypt                             │
│     ↓                                                       │
│  6. User record created in database                         │
│     ↓                                                       │
│  7. JWT token generated (30-min expiry)                     │
│     ↓                                                       │
│  8. Response: { token, user_info }                          │
│     ↓                                                       │
│  9. Frontend stores token in localStorage                   │
│     ↓                                                       │
│  10. Redirect to home page (authenticated)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     LOGIN FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User enters: username, password                         │
│     ↓                                                       │
│  2. POST /api/auth/login with credentials                   │
│     ↓                                                       │
│  3. Backend looks up user by username                       │
│     ↓                                                       │
│  4. Verify password with bcrypt.verify()                    │
│     ↓                                                       │
│  5. Check user.is_active status                             │
│     ↓                                                       │
│  6. JWT token generated                                     │
│     ↓                                                       │
│  7. Response: { token, user_info }                          │
│     ↓                                                       │
│  8. Frontend stores in localStorage                         │
│     ↓                                                       │
│  9. Redirect to home (authenticated)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           PROTECTED ENDPOINT ACCESS FLOW                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Frontend request with Authorization header              │
│     Authorization: Bearer <jwt_token>                       │
│     ↓                                                       │
│  2. Backend middleware extracts token                       │
│     ↓                                                       │
│  3. verify_token() validates:                               │
│     - JWT signature matches SECRET_KEY                      │
│     - Token not expired                                     │
│     - Contains valid user_id                                │
│     ↓                                                       │
│  4. user_id injected into route handler                     │
│     ↓                                                       │
│  5. Query database filtered by user_id                      │
│     (User can only access their own data)                   │
│     ↓                                                       │
│  6. Response with user-specific data                        │
│                                                             │
│  On Error:                                                  │
│  - Missing token → 403 Forbidden                            │
│  - Invalid token → 401 Unauthorized                         │
│  - Expired token → 401 Unauthorized                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
SMA_Sanjeevani/
│
├── backend/
│   ├── main.py                      # FastAPI app entry point
│   ├── database.py                  # SQLAlchemy config
│   ├── models.py                    # ORM models (6 tables)
│   ├── security.py                  # JWT & password hashing
│   ├── middleware.py                # Protected route logic
│   ├── routes_auth.py               # Auth endpoints
│   ├── routes_medicine_history.py   # Medicine history CRUD
│   ├── routes_prescriptions.py      # Prescription CRUD
│   ├── routes_reminders.py          # Reminder CRUD
│   ├── routes_qa_history.py         # Q&A history CRUD
│   ├── routes_dashboard.py          # Dashboard stats
│   ├── requirements.txt             # Python dependencies
│   ├── .env                         # Configuration
│   ├── sanjeevani.db                # SQLite database
│   ├── API_DOCUMENTATION.md         # API reference
│   └── features/                    # Existing features
│       └── symptoms_recommendation.py
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx                 # App entry with routing
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── LoginSignup.jsx      # Auth UI
│   │   │   ├── Auth.css             # Auth styling
│   │   │   ├── Navbar.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx        # Protected
│   │   │   ├── MedicineRecommendation.jsx  # Protected
│   │   │   ├── PrescriptionHandling.jsx    # Protected
│   │   │   └── ...
│   │   └── context/
│   │       └── AuthContext.jsx      # Global auth state
│   │   └── components/
│   │       └── ProtectedRoute.jsx   # Route guard
│   ├── package.json
│   └── vite.config.js
│
├── SETUP_AND_TESTING_GUIDE.md       # Testing instructions
├── README.md
└── ...existing files...
```

---

## 🔄 Data Flow Examples

### Example 1: User Gets Medicine History

```
Frontend                              Backend                         Database
   │                                     │                               │
   │─ GET /api/medicine-history/ ────→  │                               │
   │  + Authorization: Bearer <token>   │                               │
   │                                     │─ Extract token               │
   │                                     │─ Verify signature             │
   │                                     │─ Get user_id = 1             │
   │                                     │                               │
   │                                     │─ Query: SELECT * FROM        │
   │                                     │  medicine_history WHERE       │
   │                                     │  user_id = 1 ────────────────→ │
   │                                     │                               │
   │                                     │  ← [3 records found]          │
   │                                     │                               │
   │  ← [MedicineHistory Array] ────    │                               │
   │  + Status: 200                      │                               │
   │                                     │                               │
   Display Medicine History              │                               │
```

### Example 2: Unauthorized Access Attempt

```
Frontend                              Backend                         Database
   │                                     │                               │
   │─ GET /api/medicine-history/ ────→  │                               │
   │  (NO Authorization header)         │                               │
   │                                     │─ Check for token             │
   │                                     │─ Token not present           │
   │                                     │─ Raise 403 Forbidden         │
   │                                     │                               │
   │  ← 403 Forbidden Error ────────── │                               │
   │  "Authentication required"          │                               │
   │                                     │                               │
   Redirect to login page                │                               │
```

### Example 3: Cross-User Access Prevention

```
User A (id=1)                       Backend                         Database
   │
   │ Logs in → Token A (user_id=1)
   │
   │─ GET /api/medicine-history/5 ──→  │                               │
   │  (Trying to access User B's data)  │  Query: SELECT * FROM         │
   │  + Bearer Token A                  │   medicine_history WHERE       │
   │                                     │   id = 5 AND user_id = 1      │
   │                                     │   ────────────────────────────→ │
   │                                     │                               │
   │                                     │  ← No record found            │
   │                                     │  (User B's data not visible)  │
   │  ← 404 Not Found ────────────── │                               │
   │  "Medicine history not found"       │                               │
   │                                     │                               │
   Cannot access other user's data!     │                               │

User B (id=2)
   │
   │ Logs in → Token B (user_id=2)
   │
   │─ GET /api/medicine-history/5 ──→  │                               │
   │  (Same request, different token)   │  Query: SELECT * FROM         │
   │  + Bearer Token B                  │   medicine_history WHERE       │
   │                                     │   id = 5 AND user_id = 2      │
   │                                     │   ────────────────────────────→ │
   │                                     │                               │
   │                                     │  ← Record found!              │
   │  ← 200 OK + Data ────────────── │  (User B created this)        │
   │  [Medicine History Record 5]        │                               │
   │                                     │                               │
   User B can access their own data!    │                               │
```

---

## 🔒 Security Features

### 1. Password Security
```python
# Passwords are NEVER stored plain text
# Instead, bcrypt hash is stored

User Input: "mypassword123"
    ↓ (bcrypt.hashpw)
Stored Hash: $2b$12$R9h/cIPz0gi.URNNX3kh2OPST9EB5/0DXAq3dJ6z5S/z4RCDKpAWG
    ↓ (On login, bcrypt.verify)
Match Check: ✓ VALID ✓
```

### 2. JWT Token Security
```
Token Contains:
{
  "user_id": 1,
  "exp": 1705772400,  // Expires in 30 mins
  "iat": 1705770600   // Issued at
}
Signed with: SECRET_KEY (32+ chars)
Verified on: Every protected endpoint

Tampered token → Invalid signature → 401 Unauthorized
Expired token → Timestamp check fails → 401 Unauthorized
```

### 3. User Data Isolation
```
GET /api/medicine-history/
Authorization: Bearer eyJ...user_id=1...

Backend Query:
SELECT * FROM medicine_history 
WHERE user_id = 1  ← Only gets this user's data

User 1 cannot see User 2's data
User 2 cannot see User 1's data
```

---

## 🚀 Performance Considerations

### Database Optimization
- ✅ Indexes on frequently queried fields (user_id, created_at)
- ✅ Connection pooling for production databases
- ✅ Query pagination (skip/limit parameters)

### Caching (Future Enhancement)
- Token validation caching
- User lookup caching
- Dashboard stats caching

### Scalability (Production)
- PostgreSQL/MySQL with connection pooling
- Load balancing for multiple backend instances
- Redis for token validation
- CDN for static assets

---

## 🧪 Testing Coverage

| Component | Tests | Status |
|-----------|-------|--------|
| Authentication | Sign up, Login, Token verify | ✅ Manual |
| Medicine History | CRUD operations | ✅ Manual |
| Prescriptions | CRUD operations | ✅ Manual |
| Reminders | CRUD operations | ✅ Manual |
| Q&A History | Create, Get, Mark helpful | ✅ Manual |
| Dashboard | Stats, Progress, Insights | ✅ Manual |
| Protected Routes | Valid/Invalid/Expired token | ✅ Manual |
| Data Isolation | Cross-user access prevention | ✅ Manual |

---

## 📈 Monitoring & Observability

### Logging
- Backend logs authentication events
- Database initialization status
- Error logging on failed operations

### Metrics (Future)
- API response times
- Database query performance
- User signup/login rates
- Error rates by endpoint

### Health Check
```bash
curl http://localhost:8000/health
# Response: {"status": "ok"}
```

---

## 🔧 Configuration

### Environment Variables
```
DATABASE_URL          # Connection string
SECRET_KEY           # JWT signing key
TOKEN_EXPIRE_MINUTES # Token lifetime (30)
```

### Database Configuration
```python
# SQLite (Development)
DATABASE_URL = "sqlite:///./sanjeevani.db"

# PostgreSQL (Production)
DATABASE_URL = "postgresql://user:pass@host:5432/db"

# MySQL (Production)
DATABASE_URL = "mysql+pymysql://user:pass@host:3306/db"
```

---

## 📞 Support & Documentation

- **API Reference**: [API_DOCUMENTATION.md](../backend/API_DOCUMENTATION.md)
- **Setup Guide**: [SETUP_AND_TESTING_GUIDE.md](../SETUP_AND_TESTING_GUIDE.md)
- **Database Models**: [models.py](../backend/models.py)
- **Security**: [security.py](../backend/security.py)
- **Backend Middleware**: [middleware.py](../backend/middleware.py)

---

**Created:** January 2024  
**Version:** 1.0  
**Status:** Production Ready
