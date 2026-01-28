# 🗄️ Database Setup & Configuration Guide

## ✅ **Database Status: FULLY SETUP**

Your Sanjeevani application has a **complete database configuration** with proper models, relationships, and data persistence.

---

## 📋 **Database Overview**

### **Database Type**: SQLite (Development)
- **File Location**: `backend/sanjeevani.db`
- **Auto-created**: Yes, on first backend startup
- **No setup required**: Works out of the box!

### **Production Database Options** (when ready)
- **PostgreSQL**: `postgresql://user:password@localhost/sanjeevani`
- **MySQL**: `mysql+pymysql://user:password@localhost/sanjeevani`

---

## 📊 **Database Schema (6 Tables)**

### **1. Users Table** 👤
Stores user account information
```
- id (Primary Key)
- username (Unique)
- email (Unique)
- full_name
- hashed_password (Bcrypt encrypted)
- age
- gender
- is_active
- created_at
- updated_at
```

### **2. Medicine History** 💊
Tracks all medicine recommendations
```
- id
- user_id (Foreign Key)
- symptoms (JSON array)
- predicted_condition
- recommended_medicines (JSON)
- home_care_advice (JSON)
- doctor_consultation_advice
- effectiveness_rating (1-5)
- feedback
- created_at
```

### **3. Prescriptions** 📋
Manages user prescriptions
```
- id
- user_id (Foreign Key)
- medicine_name
- dosage (e.g., "500mg")
- frequency (e.g., "Twice daily")
- duration (e.g., "7 days")
- start_date
- end_date
- doctor_name
- notes
- is_active
```

### **4. Reminders** ⏰
Medicine reminder alarms
```
- id
- user_id (Foreign Key)
- prescription_id (Foreign Key)
- medicine_name
- dosage
- reminder_time (HH:MM format)
- frequency (Daily/Weekly/Custom)
- days (JSON - days of week)
- is_active
- last_reminded
- next_reminder
```

### **5. QA History** 💬
Medical Q&A conversation history
```
- id
- user_id (Foreign Key)
- question
- answer
- category (Symptoms/Treatment/Prevention)
- helpful (Yes/No)
- follow_up_questions (JSON)
- created_at
```

### **6. Dashboard Data** 📊
User health analytics
```
- id
- user_id (Foreign Key)
- total_consultations
- medications_tracked
- reminders_set
- questions_asked
- health_score (0-100)
- streak_days
- active_reminders
- created_at
- updated_at
```

---

## 🚀 **How to Run & Data Storage**

### **Step 1: Start Backend (Already Running)**
```bash
cd backend
python main.py
```
✅ Backend runs on `http://localhost:8000`
✅ Database auto-initializes on startup
✅ SQLite file `sanjeevani.db` is created automatically

### **Step 2: Start Frontend**
```bash
cd frontend
npm run dev
```
✅ Frontend runs on `http://localhost:5173` (or shown in terminal)

### **Step 3: Data Flow**
```
Frontend (React)
    ↓
User Login/Signup
    ↓
Backend Auth API (/api/auth/signup, /api/auth/login)
    ↓
SQLite Database (sanjeevani.db)
    ↓
User Data Stored with JWT Token
    ↓
Protected Features Access
    ↓
Data Persisted Across Sessions
```

---

## 💾 **Data Persistence Verification**

### **What Gets Stored:**

1. **Signup/Login** → User record in `users` table
2. **Medicine Recommendations** → Stored in `medicine_history` table
3. **Prescriptions Added** → Stored in `prescriptions` table
4. **Reminders Set** → Stored in `reminders` table
5. **Q&A Conversations** → Stored in `qa_history` table
6. **Dashboard Stats** → Stored in `dashboard_data` table

### **Data Isolation:**
- Each user can only access their own data
- JWT tokens ensure authentication
- Foreign Keys maintain referential integrity
- Cascade deletes prevent orphaned records

---

## 🔐 **Security Features**

✅ **Password Hashing**: bcrypt (industry standard)
✅ **JWT Tokens**: Secure token-based authentication
✅ **CORS Protection**: Cross-Origin Resource Sharing configured
✅ **Database Encryption**: Ready for production encryption
✅ **User Isolation**: Data is user-specific, not shared

---

## 📁 **Key Files**

| File | Purpose |
|------|---------|
| `backend/database.py` | Database connection & configuration |
| `backend/models.py` | SQLAlchemy ORM models (table definitions) |
| `backend/routes_auth.py` | Login/Signup endpoints |
| `backend/routes_medicine_history.py` | Medicine history endpoints |
| `backend/routes_prescriptions.py` | Prescription management endpoints |
| `backend/routes_reminders.py` | Reminder endpoints |
| `backend/routes_qa_history.py` | Q&A history endpoints |
| `backend/routes_dashboard.py` | Dashboard statistics endpoints |
| `sanjeevani.db` | Actual database file (auto-created) |

---

## 🧪 **Testing Data Persistence**

### **Manual Test (Using Postman/Thunder Client):**

1. **Signup**
```bash
POST http://localhost:8000/api/auth/signup
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "full_name": "Test User",
  "age": 30,
  "gender": "Male"
}
```

2. **Login** (data persists!)
```bash
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

3. **Verify Data** (check database)
- Stop backend
- Delete `sanjeevani.db`
- Restart backend
- Try to login with same credentials → Should fail (data was persistent until deletion)

---

## 🔄 **Environment Configuration**

### **Current Setup** (.env file)
```bash
DATABASE_URL=sqlite:///./sanjeevani.db
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### **For Production** (when ready)
```bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@prod-db:5432/sanjeevani

# MySQL
DATABASE_URL=mysql+pymysql://user:password@prod-db:3306/sanjeevani
```

---

## ⚠️ **Important Notes**

1. **SQLite Limitations**: 
   - Single-user in production
   - Not suitable for high concurrency
   - **Switch to PostgreSQL for production**

2. **Data Backup**:
   - Keep regular backups of `sanjeevani.db`
   - In production, use automated database backups

3. **Database Migrations** (if schema changes):
   - Use Alembic (already installed)
   - Initialize: `alembic init alembic`
   - Create migration: `alembic revision --autogenerate -m "message"`
   - Apply migration: `alembic upgrade head`

4. **Testing**:
   - Data persists across server restarts
   - User data is isolated
   - Delete `sanjeevani.db` to reset everything

---

## ✨ **Summary**

✅ **Database is fully configured**
✅ **All tables are defined with relationships**
✅ **Data persistence is automatic**
✅ **User data isolation is enforced**
✅ **Ready for production migration**
✅ **No manual setup required**

Just run:
```bash
# Terminal 1: Backend
cd backend
python main.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

Your data will be stored automatically in `sanjeevani.db`! 🎉

---

## 🆘 **Troubleshooting**

| Issue | Solution |
|-------|----------|
| "Database initialization failed" | Delete `sanjeevani.db` and restart backend |
| "Username already exists" | Use a different username or delete database |
| "Cannot find database file" | Run backend once to auto-create it |
| Data not persisting | Check that backend is running |
| User can access other user's data | This shouldn't happen (user_id is enforced) |

