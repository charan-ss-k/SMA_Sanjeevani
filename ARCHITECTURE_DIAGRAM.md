# System Architecture Diagram

## Complete Data Flow

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    SMA SANJEEVANI SYSTEM ARCHITECTURE                      ║
╚════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ChatWidget.jsx                                                       │  │
│  │ ────────────────────────────────────────────────────────────────────│  │
│  │ • Medical Q&A Chatbot                                              │  │
│  │ • User asks: "What is fever?"                                      │  │
│  │ • API Call: POST /api/medical-qa                                   │  │
│  │ • Sends: { question, category, language }                          │  │
│  │ • Features: Mute, Stop, TTS                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   ↓                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SymptomChecker.jsx                                                   │  │
│  │ ────────────────────────────────────────────────────────────────────│  │
│  │ • Medicine Recommendation Form                                      │  │
│  │ • SearchableInput for Symptoms, Allergies, Conditions             │  │
│  │ • User selects: fever, headache, cough                            │  │
│  │ • API Call: POST /api/symptoms/recommend                          │  │
│  │ • Sends: { age, gender, symptoms, allergies, conditions }        │  │
│  │ • Features: Mute, Stop, TTS                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   ↓                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SearchableInput.jsx (NEW)                                            │  │
│  │ ────────────────────────────────────────────────────────────────────│  │
│  │ • Searchable dropdown component                                     │  │
│  │ • User types: "f" → finds "fever", "fatigue"                      │  │
│  │ • Real-time filtering, keyboard support                            │  │
│  │ • Returns: array of selected items                                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                   ↓                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ PrescriptionHandling.jsx                                             │  │
│  │ ────────────────────────────────────────────────────────────────────│  │
│  │ • Prescription Management                                           │  │
│  │ • User adds: "Metformin 500mg"                                     │  │
│  │ • API Call: POST /api/prescriptions                                │  │
│  │ • Sends: { medicine, dosage, frequency, duration, doctor }        │  │
│  │ • Features: Mute TTS                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ HTTPS Requests
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (FastAPI)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ API Endpoints                                                        │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ POST /api/medical-qa                                                │  │
│  │   ├─ Input: { question, category }                                 │  │
│  │   ├─ Process: service.answer_medical_question()                    │  │
│  │   ├─ Save: QAHistory(user_id, question, answer, category)         │  │
│  │   └─ Output: { answer, tts_payload }                               │  │
│  │                                                                      │  │
│  │ POST /api/symptoms/recommend                                        │  │
│  │   ├─ Input: { age, gender, symptoms, allergies, conditions }      │  │
│  │   ├─ Process: service.recommend_symptoms()                         │  │
│  │   ├─ Save: MedicineHistory(user_id, symptoms, condition, meds)    │  │
│  │   └─ Output: { condition, medicines, dosage, advice }              │  │
│  │                                                                      │  │
│  │ POST /api/prescriptions                                             │  │
│  │   ├─ Input: { medicine, dosage, frequency, doctor }               │  │
│  │   ├─ Process: Create prescription record                           │  │
│  │   ├─ Save: Prescription(user_id, medicine_name, dosage...)        │  │
│  │   └─ Output: { id, created_at }                                    │  │
│  │                                                                      │  │
│  │ GET /api/qa-history                                                 │  │
│  │ GET /api/medicine-history                                           │  │
│  │ GET /api/prescriptions                                              │  │
│  │   └─ Retrieve stored data for user                                 │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Models & Database Layer                                              │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ from database.py:                                                    │  │
│  │   ├─ SessionLocal - Database session manager                        │  │
│  │   ├─ engine - SQLAlchemy engine                                     │  │
│  │   └─ get_db() - Dependency injection                                │  │
│  │                                                                      │  │
│  │ from models.py (SQLAlchemy ORM):                                    │  │
│  │   ├─ User                                                            │  │
│  │   ├─ QAHistory         ← Saves chatbot conversations                │  │
│  │   ├─ MedicineHistory   ← Saves recommendations                      │  │
│  │   ├─ Prescription      ← Saves prescriptions                        │  │
│  │   ├─ Reminder          ← Saves reminders                            │  │
│  │   └─ DashboardData     ← Analytics                                  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Configuration (database.py)                                          │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ DATABASE_URL from .env:                                              │  │
│  │                                                                      │  │
│  │ Development (default):                                               │  │
│  │   sqlite:///./sanjeevani.db                                         │  │
│  │   └─ Auto-creates on startup                                        │  │
│  │                                                                      │  │
│  │ Production (recommended):                                            │  │
│  │   postgresql://user:pass@localhost:5432/sanjeevani                  │  │
│  │   └─ Setup required (see DATABASE_SETUP.md)                        │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SQLite (Development)               │  PostgreSQL (Production)      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ File: sanjeevani.db                │  Server: localhost:5432       │   │
│  │ No setup needed                    │  Database: sanjeevani         │   │
│  │ Auto-creates tables                │  Schema: schema_postgresql.sql │   │
│  │                                    │  User: sanjeevani_user        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Schema (Both SQLite & PostgreSQL)                                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │ users (PK: id)                                               │  │   │
│  │  │ ┌──────────────────────────────────────────────────────────┐ │  │   │
│  │  │ │ id, username, email, password, age, gender,              │ │  │   │
│  │  │ │ is_active, created_at, updated_at                        │ │  │   │
│  │  │ └──────────────────────────────────────────────────────────┘ │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  │                              ↑ 1:N                                 │   │
│  │  ┌──────────────────────────┴──────────────────────────────────┐  │   │
│  │  │                          │                                  │  │   │
│  │  ▼ N                         │                                  ▼  │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │   │
│  │  │ qa_history       │  │medicine_history  │  │ prescriptions     │  │   │
│  │  │ (PK: id)         │  │ (PK: id)         │  │ (PK: id)          │  │   │
│  │  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤  │   │
│  │  │ ✓ user_id (FK)  │  │ ✓ user_id (FK)  │  │ ✓ user_id (FK)   │  │   │
│  │  │ • question       │  │ • symptoms       │  │ • medicine_name  │  │   │
│  │  │ • answer         │  │ • condition      │  │ • dosage         │  │   │
│  │  │ • category       │  │ • medicines      │  │ • frequency      │  │   │
│  │  │ • helpful        │  │ • dosage_info    │  │ • duration       │  │   │
│  │  │ • created_at     │  │ • created_at     │  │ • doctor_name    │  │   │
│  │  │ (Indexed)        │  │ (Indexed)        │  │ • created_at     │  │   │
│  │  │ Records: 100s    │  │ Records: 100s    │  │ Records: 100s    │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  │   │
│  │                                                                     │   │
│  │  ┌──────────────────────┐        ┌──────────────────────────────┐  │   │
│  │  │ reminders            │        │ dashboard_data               │  │   │
│  │  │ (PK: id)             │        │ (PK: id)                     │  │   │
│  │  ├──────────────────────┤        ├──────────────────────────────┤  │   │
│  │  │ ✓ user_id (FK)      │        │ ✓ user_id (FK, UNIQUE)      │  │   │
│  │  │ • medicine_name      │        │ • total_consultations       │  │   │
│  │  │ • reminder_time      │        │ • medications_tracked       │  │   │
│  │  │ • frequency          │        │ • questions_asked           │  │   │
│  │  │ • is_active          │        │ • health_score              │  │   │
│  │  │ • created_at         │        │ • updated_at                │  │   │
│  │  └──────────────────────┘        └──────────────────────────────┘  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: One Complete Request

```
1. USER ACTION (Frontend)
   └─ User selects symptoms using SearchableInput
      • fever ✓
      • headache ✓
      • cough ✓

2. API REQUEST
   └─ fetch('/api/symptoms/recommend')
      body: {
        age: 28,
        gender: 'male',
        symptoms: ['fever', 'headache', 'cough'],
        allergies: [],
        existing_conditions: [],
        pregnancy_status: false,
        language: 'english'
      }

3. BACKEND PROCESSING
   ├─ Route: router.py → recommend()
   ├─ LLM Processing: service.recommend_symptoms()
   └─ Returns: {
        predicted_condition: 'Common Cold',
        recommended_medicines: ['Paracetamol 500mg', 'Cough Syrup'],
        dosage_info: {...},
        tts_payload: 'You appear to have...'
      }

4. DATABASE SAVE
   └─ db.add(MedicineHistory(
        user_id=1,
        symptoms=['fever', 'headache', 'cough'],
        predicted_condition='Common Cold',
        recommended_medicines=['Paracetamol', 'Cough Syrup'],
        created_at=datetime.now()
      ))
      db.commit()

5. DATABASE STORAGE
   └─ medicine_history table:
      id  | user_id | symptoms              | predicted_condition | created_at
      42  | 1       | ['fever'...]          | 'Common Cold'       | 2026-01-26...

6. API RESPONSE
   └─ return {
        predicted_condition: 'Common Cold',
        recommended_medicines: [...],
        dosage_info: {...},
        tts_payload: '...'
      }

7. FRONTEND DISPLAY
   ├─ Show recommendations
   ├─ Play TTS (if not muted)
   └─ Update UI with results

8. USER SEES
   └─ Disease: Common Cold
      Medicines: Paracetamol, Cough Syrup
      Dosage: ...
```

---

## File Structure

```
SMA_Sanjeevani/
├── backend/
│   ├── database.py                    ← Database configuration
│   ├── models.py                      ← SQLAlchemy ORM models
│   ├── main.py                        ← FastAPI app
│   ├── .env.example                   ← Configuration template
│   ├── schema_postgresql.sql          ← PostgreSQL schema (NEW)
│   ├── schema_sqlite.sql              ← SQLite schema (NEW)
│   ├── DATABASE_SETUP.md              ← Setup guide (NEW)
│   ├── routes_qa_history.py           ← Q&A CRUD operations
│   ├── routes_medicine_history.py     ← Medicine history CRUD
│   ├── routes_prescriptions.py        ← Prescriptions CRUD
│   └── features/
│       └── symptoms_recommendation/
│           └── router.py              ← Updated: saves to DB
│
├── frontend/
│   └── src/
│       └── components/
│           ├── ChatWidget.jsx         ← Chatbot with mute/stop
│           ├── SymptomChecker.jsx     ← Updated: uses SearchableInput
│           ├── SearchableInput.jsx    ← NEW: reusable search component
│           ├── PrescriptionHandling.jsx ← With mute support
│           └── SEARCHABLE_INPUT_DOCS.md ← Component docs (NEW)
│
├── DATABASE_AND_UI_SUMMARY.md         ← Implementation summary (NEW)
└── QUICK_REFERENCE.md                 ← Quick reference (NEW)
```

---

## API Endpoints Summary

```
CHATBOT Q&A
POST   /api/medical-qa
       Request:  { question, category, language }
       Response: { answer }
       Stores:   QAHistory (question, answer, category, user_id, timestamp)

MEDICINE RECOMMENDATION
POST   /api/symptoms/recommend
       Request:  { age, gender, symptoms, allergies, conditions, pregnancy, language }
       Response: { condition, medicines, dosage, advice, tts_payload }
       Stores:   MedicineHistory (symptoms, condition, medicines, dosage, user_id, timestamp)

PRESCRIPTION MANAGEMENT
POST   /api/prescriptions
       Request:  { medicine_name, dosage, frequency, duration, doctor_name, notes }
       Response: { id, created_at }
       Stores:   Prescription (medicine, dosage, frequency, doctor, user_id, timestamp)

GET    /api/qa-history?limit=10&category=Symptoms
GET    /api/medicine-history?limit=10
GET    /api/prescriptions?limit=10
```

---

## Technology Stack

```
Frontend                Backend              Database
─────────────────      ─────────────────    ─────────────────
React 19               FastAPI              SQLite (Dev)
Vite                   Python 3.8+          PostgreSQL (Prod)
Tailwind CSS           SQLAlchemy ORM
                       Pydantic             
                       
SearchableInput        /api/medical-qa      qa_history
SymptomChecker         /api/symptoms        medicine_history
ChatWidget             /api/prescriptions   prescriptions
                       /api/reminders       reminders
                       /api/dashboard       dashboard_data
```

---

**Created:** January 26, 2026  
**Status:** ✅ Complete and Ready
