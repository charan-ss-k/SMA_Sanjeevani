# Backend Architecture - Visual Guide

## 📊 New Directory Structure

```
backend/
│
├── 🚀 START HERE
│   ├── start.py                    # Quick start script
│   ├── requirements.txt            # Dependencies
│   ├── .env                        # Configuration (create from .env.example)
│   └── README_NEW.md               # Documentation
│
├── 📦 app/                         # Main application package
│   │
│   ├── main.py                     # 🎯 Application entry point
│   │   ├── Creates FastAPI app
│   │   ├── Configures CORS
│   │   ├── Registers all routers
│   │   └── Initializes database
│   │
│   ├── 🔧 core/                    # Core functionality
│   │   ├── config.py               # ⚙️  Centralized settings (NEW!)
│   │   ├── database.py             # 🗄️  Database connection & session
│   │   ├── security.py             # 🔐 JWT tokens & password hashing
│   │   └── middleware.py           # 🛡️  Authentication middleware
│   │
│   ├── 🗃️ models/                  # Database models
│   │   └── models.py               # SQLAlchemy ORM models
│   │       ├── User
│   │       ├── Prescription
│   │       ├── Reminder
│   │       ├── MedicineHistory
│   │       ├── QAHistory
│   │       └── DashboardData
│   │
│   ├── 🌐 api/                     # API layer
│   │   └── routes/                 # API endpoints
│   │       ├── routes_auth.py              # POST /api/auth/login, /signup
│   │       ├── routes_dashboard.py         # GET /api/dashboard
│   │       ├── routes_medicine_history.py  # CRUD /api/medicine-history
│   │       ├── routes_prescriptions.py     # CRUD /api/prescriptions
│   │       ├── routes_qa_history.py        # CRUD /api/qa-history
│   │       └── routes_reminders.py         # CRUD /api/reminders
│   │
│   └── 🔨 services/                # Business logic & external services
│       ├── tts_service.py                  # Text-to-speech (basic)
│       ├── tts_service_enhanced.py         # Multi-language TTS
│       └── symptoms_recommendation/        # Symptom analysis AI
│           ├── router.py                   # POST /api/symptoms/recommend
│           ├── service.py                  # LLM integration logic
│           ├── models.py                   # Request/Response models
│           ├── prompt_templates.py         # AI prompts
│           ├── safety_rules.py             # Medical safety checks
│           └── utils.py                    # Helper functions
│
├── 🧪 tests/                       # Test suite
│   ├── test_api_endpoints.py
│   ├── test_db_connection.py
│   ├── test_ollama.py
│   └── test_signup.py
│
├── 🛠️ scripts/                     # Utility scripts
│   ├── create_database.py          # Initialize DB
│   ├── check_schema.py             # Verify schema
│   ├── debug_mistral.py            # Test LLM
│   ├── setup_postgres.ps1          # PostgreSQL setup
│   └── sanjeevani_finaldb.sql      # DB schema
│
└── 📚 docs/                        # Documentation
    ├── API_DOCUMENTATION.md
    ├── DATABASE_SETUP.md
    ├── POSTGRESQL_SETUP_GUIDE.md
    ├── SETUP_OLLAMA.md
    └── TTS_SETUP.md
```

## 🔄 Request Flow Diagram

```
┌─────────────┐
│   Client    │
│  (React)    │
└──────┬──────┘
       │
       │ HTTP Request
       ▼
┌─────────────────────────────────────────────┐
│           FastAPI Application               │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │         app/main.py                 │  │
│  │  • CORS Middleware                  │  │
│  │  • Router Registration              │  │
│  └──────────────┬──────────────────────┘  │
│                 │                          │
│                 ▼                          │
│  ┌─────────────────────────────────────┐  │
│  │      app/api/routes/               │  │
│  │  • Parse request                    │  │
│  │  • Validate data (Pydantic)        │  │
│  └──────────────┬──────────────────────┘  │
│                 │                          │
│                 ▼                          │
│  ┌─────────────────────────────────────┐  │
│  │   app/core/middleware.py           │  │
│  │  • Extract JWT token               │  │
│  │  • Verify authentication           │  │
│  └──────────────┬──────────────────────┘  │
│                 │                          │
│                 ▼                          │
│  ┌─────────────────────────────────────┐  │
│  │      app/services/                 │  │
│  │  • Business logic                  │  │
│  │  • External API calls              │  │
│  │  • LLM integration                 │  │
│  └──────────────┬──────────────────────┘  │
│                 │                          │
│                 ▼                          │
│  ┌─────────────────────────────────────┐  │
│  │   app/core/database.py             │  │
│  │  • Get DB session                  │  │
│  └──────────────┬──────────────────────┘  │
│                 │                          │
│                 ▼                          │
│  ┌─────────────────────────────────────┐  │
│  │     app/models/models.py           │  │
│  │  • SQLAlchemy ORM                  │  │
│  │  • Query database                  │  │
│  └──────────────┬──────────────────────┘  │
└─────────────────┼──────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │   PostgreSQL   │
         │    Database    │
         └────────────────┘
```

## 🏗️ Architecture Layers

### 1️⃣ **Presentation Layer** (`app/api/routes/`)
- Handle HTTP requests/responses
- Input validation with Pydantic
- Route registration
- **Responsibility:** Parse requests, return responses

### 2️⃣ **Business Logic Layer** (`app/services/`)
- Core business rules
- External API integration
- AI/ML model integration
- Data transformation
- **Responsibility:** Implement features, orchestrate operations

### 3️⃣ **Data Access Layer** (`app/models/` + `app/core/database.py`)
- Database models (ORM)
- Database session management
- Query execution
- **Responsibility:** Data persistence and retrieval

### 4️⃣ **Cross-Cutting Concerns** (`app/core/`)
- Configuration (`config.py`)
- Authentication & Security (`security.py`)
- Middleware (`middleware.py`)
- Database setup (`database.py`)
- **Responsibility:** Shared functionality across layers

## 🔐 Authentication Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. POST /api/auth/login
     │    {username, password}
     ▼
┌─────────────────┐
│  routes_auth.py │
└────┬────────────┘
     │
     │ 2. Verify credentials
     ▼
┌─────────────────┐
│   security.py   │
│  • verify_password()
│  • create_access_token()
└────┬────────────┘
     │
     │ 3. Return JWT token
     ▼
┌──────────┐
│  Client  │  Store token in localStorage
└────┬─────┘
     │
     │ 4. Subsequent requests
     │    Headers: {Authorization: Bearer <token>}
     ▼
┌─────────────────┐
│  middleware.py  │
│  • get_current_user()
│  • verify_token()
└────┬────────────┘
     │
     │ 5. Extract user_id
     ▼
┌─────────────────┐
│   Route Handler │  Access user data
└─────────────────┘
```

## 📝 Configuration Management

```
┌─────────────┐
│   .env      │  Environment variables
└──────┬──────┘
       │
       │ Loaded by
       ▼
┌─────────────────────┐
│  core/config.py     │
│                     │
│  class Settings:    │
│    DATABASE_URL     │
│    SECRET_KEY       │
│    CORS_ORIGINS     │
│    OLLAMA_BASE_URL  │
│    ...              │
│                     │
│  settings = Settings()
└──────┬──────────────┘
       │
       │ Used by all modules
       ▼
┌─────────────────────┐
│   Any module        │
│                     │
│   from app.core.config import settings
│   db_url = settings.DATABASE_URL
└─────────────────────┘
```

## 🎯 Key Benefits

### ✅ Clear Separation of Concerns
- Each layer has a single responsibility
- Easy to understand and navigate
- Changes isolated to specific modules

### ✅ Testability
- Mock external dependencies easily
- Test layers independently
- Service layer separate from routes

### ✅ Scalability
- Add new features without cluttering
- Scale services independently
- Easy to refactor into microservices

### ✅ Maintainability
- Intuitive file organization
- Clear import paths
- Self-documenting structure

### ✅ Developer Experience
- Fast onboarding
- IDE auto-completion works better
- Clear where to add new code

## 🚀 Quick Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run application
python start.py

# Run tests
pytest tests/

# Initialize database
python scripts/create_database.py

# Check database schema
python scripts/check_schema.py
```

## 📖 Import Examples

```python
# Configuration
from app.core.config import settings

# Database
from app.core.database import get_db, engine

# Models
from app.models.models import User, Prescription

# Security
from app.core.security import hash_password, verify_token

# Middleware
from app.core.middleware import get_current_user

# Services
from app.services.tts_service_enhanced import generate_tts
from app.services.symptoms_recommendation.service import analyze_symptoms
```

---

**Version:** 1.0.0  
**Date:** January 27, 2026  
**Status:** ✅ Production Ready
