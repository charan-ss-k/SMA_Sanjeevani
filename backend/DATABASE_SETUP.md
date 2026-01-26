# Database Setup Guide for SMA Sanjeevani

This guide explains how to set up and configure both SQLite and PostgreSQL databases for the SMA Sanjeevani application to store chatbot conversations, medicine recommendations, and prescription data.

## Table of Contents
1. [Overview](#overview)
2. [SQLite Setup (Development)](#sqlite-setup-development)
3. [PostgreSQL Setup (Production)](#postgresql-setup-production)
4. [Database Schema](#database-schema)
5. [API Data Flow](#api-data-flow)
6. [Testing Database Storage](#testing-database-storage)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The application stores data across multiple tables:

| Table | Purpose | Data Stored |
|-------|---------|-------------|
| `users` | User accounts | Username, email, password, age, gender |
| `medicine_history` | Medicine recommendations | Symptoms, predicted condition, recommended medicines, dosage |
| `qa_history` | Chatbot conversations | Questions asked, answers provided, category, helpful feedback |
| `prescriptions` | Prescription details | Medicine name, dosage, frequency, duration, doctor name |
| `reminders` | Medicine reminders | Medicine name, reminder time, frequency, days |
| `dashboard_data` | User statistics | Consultations count, health score, streak days, total medications |

**Default Configuration**: SQLite (no setup required)
**Production Recommended**: PostgreSQL (better performance, concurrent access)

---

## SQLite Setup (Development)

### Quick Start
SQLite is already configured as the default. No additional setup needed!

1. The database file `sanjeevani.db` will be automatically created in the backend folder
2. Tables are created automatically on first run
3. Data persists between server restarts

### Verify Setup
```bash
cd backend
python -c "from database import init_db; init_db(); print('✅ Database initialized')"
```

### View SQLite Data
```bash
# Install SQLite viewer (optional)
pip install sqlite3

# Open database in terminal
sqlite3 sanjeevani.db

# View tables
.tables

# Query data
SELECT * FROM users;
SELECT * FROM qa_history LIMIT 10;
SELECT * FROM medicine_history LIMIT 10;
.exit
```

---

## PostgreSQL Setup (Production)

### Prerequisites
- PostgreSQL installed (version 12+)
- psql command-line tool
- psycopg2 Python driver

### Installation

#### Windows
1. Download from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer, note the password you set for `postgres` user
3. PostgreSQL starts automatically

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Create Database and User

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE sanjeevani;

# Create user for application
CREATE USER sanjeevani_user WITH PASSWORD 'secure_password_here';

# Grant privileges
ALTER ROLE sanjeevani_user SET client_encoding TO 'utf8';
ALTER ROLE sanjeevani_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE sanjeevani_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE sanjeevani TO sanjeevani_user;

# Exit
\q
```

### Initialize Schema

```bash
# Load the PostgreSQL schema
psql -U sanjeevani_user -d sanjeevani -f backend/schema_postgresql.sql

# Verify tables created
psql -U sanjeevani_user -d sanjeevani -c "\dt"
```

### Configure Backend

Update your `.env` file:

```env
# From:
DATABASE_URL=sqlite:///./sanjeevani.db

# To:
DATABASE_URL=postgresql://sanjeevani_user:secure_password_here@localhost:5432/sanjeevani
```

### Test Connection
```bash
cd backend
python -c "from database import init_db, engine; engine.connect(); print('✅ Connected to PostgreSQL')"
```

---

## Database Schema

### Tables Details

#### 1. Users Table
```sql
users (
  id INTEGER PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  full_name VARCHAR(100),
  hashed_password VARCHAR(255),
  age INTEGER,
  gender VARCHAR(20),
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### 2. Medicine History Table
```sql
medicine_history (
  id INTEGER PRIMARY KEY,
  user_id INTEGER FK,
  symptoms JSON,  -- Array of symptoms from SymptomChecker
  predicted_condition VARCHAR(255),
  recommended_medicines JSON,
  home_care_advice JSON,
  doctor_consultation_advice TEXT,
  dosage_info JSON,
  effectiveness_rating FLOAT,
  feedback TEXT,
  created_at TIMESTAMP
)
```

#### 3. QA History Table
```sql
qa_history (
  id INTEGER PRIMARY KEY,
  user_id INTEGER FK,
  question TEXT,  -- User question from ChatWidget
  answer TEXT,    -- AI-generated answer
  category VARCHAR(100),
  helpful BOOLEAN,
  follow_up_questions JSON,
  created_at TIMESTAMP
)
```

#### 4. Prescriptions Table
```sql
prescriptions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER FK,
  medicine_name VARCHAR(200),
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  doctor_name VARCHAR(200),
  notes TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP
)
```

#### 5. Reminders Table
```sql
reminders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER FK,
  prescription_id INTEGER FK,
  medicine_name VARCHAR(200),
  dosage VARCHAR(100),
  reminder_time VARCHAR(10),
  frequency VARCHAR(50),
  days JSON,
  is_active BOOLEAN,
  last_reminded TIMESTAMP,
  next_reminder TIMESTAMP,
  created_at TIMESTAMP
)
```

#### 6. Dashboard Data Table
```sql
dashboard_data (
  id INTEGER PRIMARY KEY,
  user_id INTEGER FK UNIQUE,
  total_consultations INTEGER,
  medications_tracked INTEGER,
  reminders_set INTEGER,
  questions_asked INTEGER,
  last_consultation TIMESTAMP,
  health_score FLOAT,
  streak_days INTEGER,
  custom_data JSON
)
```

---

## API Data Flow

### How Data Gets Stored

#### 1. Chatbot (ChatWidget.jsx)
```
User asks question → /api/medical-qa endpoint
    ↓
Backend: service.answer_medical_question() generates answer
    ↓
Backend: QAHistory record created and saved to database
    ↓
Response sent back with TTS payload
```

**Request Payload:**
```json
{
  "question": "What should I do for fever?",
  "category": "Symptoms",
  "language": "english"
}
```

**Database Entry:**
```json
{
  "user_id": 1,
  "question": "What should I do for fever?",
  "answer": "For fever, you should...",
  "category": "Symptoms",
  "created_at": "2026-01-26T10:30:00"
}
```

#### 2. Medicine Recommendation (SymptomChecker.jsx)
```
User selects symptoms → /api/symptoms/recommend endpoint
    ↓
Backend: service.recommend_symptoms() processes symptoms
    ↓
Backend: MedicineHistory record created with:
  - symptoms array
  - predicted condition
  - recommended medicines
  - dosage information
    ↓
Response sent back with recommendation data
```

**Request Payload:**
```json
{
  "age": 28,
  "gender": "male",
  "symptoms": ["fever", "headache", "cough"],
  "allergies": [],
  "existing_conditions": [],
  "pregnancy_status": false,
  "language": "english"
}
```

**Database Entry:**
```json
{
  "user_id": 1,
  "symptoms": ["fever", "headache", "cough"],
  "predicted_condition": "Common Cold",
  "recommended_medicines": ["Paracetamol 500mg", "Cough syrup"],
  "dosage_info": {
    "paracetamol": "500mg twice daily",
    "cough_syrup": "10ml twice daily"
  },
  "created_at": "2026-01-26T10:45:00"
}
```

#### 3. Prescriptions (PrescriptionHandling.jsx)
```
User uploads/adds prescription → /api/prescriptions endpoint
    ↓
Backend: Prescription record created with medicine details
    ↓
Backend: Optional Reminder records created for each medicine
    ↓
Response confirmation sent back
```

**Request Payload:**
```json
{
  "medicine_name": "Metformin 500mg",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "duration": "30 days",
  "doctor_name": "Dr. Smith",
  "notes": "Take with food"
}
```

**Database Entry:**
```json
{
  "user_id": 1,
  "medicine_name": "Metformin 500mg",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "duration": "30 days",
  "doctor_name": "Dr. Smith",
  "notes": "Take with food",
  "is_active": true,
  "start_date": "2026-01-26",
  "end_date": "2026-02-26"
}
```

---

## Testing Database Storage

### 1. Test with SQLite (Local Development)

```bash
cd backend
python

# In Python shell:
from database import SessionLocal, init_db
from models import QAHistory, MedicineHistory, Prescription

init_db()

# Create a session
db = SessionLocal()

# Test storing a Q&A
test_qa = QAHistory(
    user_id=1,
    question="How to treat fever?",
    answer="Fever can be treated with...",
    category="Symptoms"
)
db.add(test_qa)
db.commit()
print("✅ Q&A saved!")

# Verify it's in the database
qa_records = db.query(QAHistory).all()
print(f"Total Q&A records: {len(qa_records)}")

db.close()
```

### 2. Test with cURL

```bash
# Test medical Q&A endpoint
curl -X POST http://localhost:8000/api/medical-qa \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is diabetes?",
    "category": "General"
  }'

# Test symptom recommendation endpoint
curl -X POST http://localhost:8000/api/symptoms/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "age": 30,
    "gender": "male",
    "symptoms": ["fever", "cough"],
    "allergies": [],
    "existing_conditions": [],
    "pregnancy_status": false,
    "language": "english"
  }'
```

### 3. Verify Data in Database

**For SQLite:**
```bash
sqlite3 backend/sanjeevani.db

# View all Q&A records
SELECT user_id, question, category, created_at FROM qa_history LIMIT 10;

# View all medicine recommendations
SELECT user_id, predicted_condition, created_at FROM medicine_history LIMIT 10;

# View all prescriptions
SELECT user_id, medicine_name, frequency, created_at FROM prescriptions LIMIT 10;

.quit
```

**For PostgreSQL:**
```bash
psql -U sanjeevani_user -d sanjeevani

# View all Q&A records
SELECT user_id, question, category, created_at FROM qa_history LIMIT 10;

# View statistics
SELECT COUNT(*) as total_qa FROM qa_history;
SELECT COUNT(*) as total_medicines FROM medicine_history;
SELECT COUNT(*) as total_prescriptions FROM prescriptions;

\q
```

---

## Troubleshooting

### Issue: "No module named 'psycopg2'"
```bash
pip install psycopg2-binary
```

### Issue: "Database connection refused"
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL in .env file
- Ensure password is correct

### Issue: "Table already exists"
This is normal - SQLAlchemy checks for existing tables before creating them.

### Issue: "Permission denied" on SQLite file
```bash
# Fix permissions on Windows
# Or delete and recreate:
rm backend/sanjeevani.db
# Restart backend - it will recreate
```

### Issue: "Foreign key constraint failed"
Ensure user exists before trying to save data with that user_id:
```python
user = db.query(User).filter(User.id == user_id).first()
if not user:
    raise Exception("User not found")
```

### View All Stored Data

**SQLite:**
```bash
sqlite3 backend/sanjeevani.db ".mode column" "SELECT * FROM qa_history;"
```

**PostgreSQL:**
```bash
psql -U sanjeevani_user -d sanjeevani -c "SELECT * FROM qa_history;"
```

---

## Summary of Changes

✅ **Database Schemas Created:**
- `schema_postgresql.sql` - Full PostgreSQL schema with views and indexes
- `schema_sqlite.sql` - SQLite equivalent schema

✅ **Backend Updated:**
- `/api/medical-qa` now saves Q&A to database
- `/api/symptoms/recommend` now saves medicine recommendations to database
- `/api/prescriptions` already saves prescription data

✅ **Configuration:**
- `.env.example` updated with DATABASE_URL configuration
- Support for both SQLite (development) and PostgreSQL (production)

✅ **Frontend Updated:**
- SymptomChecker now uses searchable inputs instead of checkboxes
- Symptoms, allergies, and health conditions are filterable by typing
- Better UX with real-time search suggestions

---

## Next Steps

1. Choose SQLite (development) or PostgreSQL (production)
2. Run `python database.py` to initialize tables
3. Test endpoints with provided cURL commands
4. Verify data in database using provided SQL queries
5. Monitor database growth over time

---

For more help, check the backend README or contact support.
