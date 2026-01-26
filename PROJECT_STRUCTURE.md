# 📁 Project Structure Guide

This document provides a comprehensive overview of the SMA Sanjeevani project structure.

## 🗂️ Root Directory

```
SMA_Sanjeevani/
├── backend/              # Backend application (FastAPI)
├── frontend/             # Frontend application (React)
├── docs/                 # All project documentation
├── README.md             # Main project README
├── PROJECT_STRUCTURE.md  # This file
└── .gitignore           # Git ignore rules
```

## 📂 Backend Structure

```
backend/
├── features/                    # Feature modules
│   ├── symptoms_recommendation/ # Symptom analysis feature
│   │   ├── __init__.py
│   │   ├── models.py           # Data models
│   │   ├── router.py           # API routes
│   │   ├── service.py          # Business logic
│   │   ├── utils.py            # Utility functions
│   │   ├── prompt_templates.py # LLM prompts
│   │   └── safety_rules.py     # Safety checks
│   └── tts_service.py          # Text-to-speech
│
├── scripts/                    # Utility scripts
│   ├── create_database.py      # Database creation
│   ├── setup_postgres.ps1      # PostgreSQL setup
│   └── sanjeevani_finaldb.sql  # Database schema
│
├── tests/                       # Test files
│   ├── test_api_endpoints.py   # API tests
│   ├── test_db_connection.py    # DB connection tests
│   ├── test_signup.py          # Signup tests
│   ├── check_schema.py         # Schema validation
│   └── debug_mistral.py        # Debug scripts
│
├── config/                      # Configuration
│   └── .env.example            # Environment template
│
├── main.py                      # Application entry point
├── models.py                    # Database models (SQLAlchemy)
├── database.py                  # Database configuration
├── security.py                  # Authentication & security
├── middleware.py                # Custom middleware
│
├── routes_*.py                  # API route modules
│   ├── routes_auth.py           # Authentication routes
│   ├── routes_dashboard.py      # Dashboard routes
│   ├── routes_medicine_history.py
│   ├── routes_prescriptions.py
│   ├── routes_reminders.py
│   └── routes_qa_history.py
│
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (local)
└── README.md                    # Backend README
```

## 📂 Frontend Structure

```
frontend/
├── public/                      # Static assets
│   ├── Sanjeevani Logo.png
│   ├── Sanjeevani Logo.ico
│   └── vite.svg
│
├── src/
│   ├── components/              # React components
│   │   ├── AuthModal.jsx        # Auth modal
│   │   ├── LoginSignup.jsx      # Auth page
│   │   ├── Dashboard.jsx        # Dashboard
│   │   ├── MedicineRecommendation.jsx
│   │   ├── ChatWidget.jsx        # Chat interface
│   │   ├── PrescriptionHandling.jsx
│   │   ├── SymptomChecker.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── *.css                # Component styles
│   │
│   ├── context/                 # React Context
│   │   └── AuthContext.jsx      # Auth state
│   │
│   ├── utils/                   # Utility functions
│   │   ├── formatMedicalResponse.js
│   │   └── tts.js               # Text-to-speech
│   │
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   └── *.css                    # Global styles
│
├── package.json                 # Dependencies
├── vite.config.js              # Vite config
├── tailwind.config.js          # Tailwind config
└── README.md                   # Frontend README
```

## 📂 Documentation Structure

```
docs/
├── setup/                       # Setup & installation
│   ├── QUICK_START.md
│   ├── SETUP_AND_TESTING_GUIDE.md
│   └── START_HERE.md
│
├── architecture/                # System architecture
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── ARCHITECTURE_DIAGRAM.md
│   └── DATABASE_ARCHITECTURE.md
│
├── api/                         # API documentation
│   ├── COMPLETE_ROUTES_REFERENCE.md
│   ├── API_DATA_STORAGE_EXAMPLES.md
│   └── README.md
│
├── database/                    # Database docs
│   ├── DATABASE_SETUP.md
│   ├── DATABASE_ARCHITECTURE.md
│   ├── POSTGRESQL_SETUP_GUIDE.md
│   └── README.md
│
├── guides/                      # User & developer guides
│   ├── Feature guides
│   ├── Testing guides
│   └── Implementation docs
│
├── features/                     # Feature documentation
│   ├── Medicine recommendation
│   ├── Chatbot features
│   ├── TTS integration
│   └── LLM integration
│
└── README.md                    # Documentation index
```

## 🔑 Key Files

### Backend
- `main.py` - FastAPI application entry point
- `models.py` - Database models (SQLAlchemy)
- `database.py` - Database connection & configuration
- `security.py` - Authentication & password hashing
- `routes_*.py` - API route handlers

### Frontend
- `src/App.jsx` - Main application component
- `src/main.jsx` - React entry point
- `src/components/` - All React components
- `package.json` - Node.js dependencies

### Configuration
- `backend/.env` - Backend environment variables
- `backend/requirements.txt` - Python dependencies
- `frontend/package.json` - Node.js dependencies

## 🎯 Best Practices

1. **Backend**: Keep routes, models, and business logic separated
2. **Frontend**: Organize components by feature/functionality
3. **Documentation**: Keep docs updated and organized by category
4. **Tests**: Place all tests in the `tests/` directory
5. **Scripts**: Utility scripts go in `scripts/` directory
6. **Config**: Configuration templates in `config/` directory

## 📝 File Naming Conventions

- **Python**: `snake_case.py`
- **React Components**: `PascalCase.jsx`
- **CSS Files**: `PascalCase.css` (matching component)
- **Documentation**: `UPPER_SNAKE_CASE.md`
- **Config Files**: `.env`, `.env.example`

## 🔄 Data Flow

```
Frontend (React)
    ↓ HTTP Requests
Backend API (FastAPI)
    ↓ SQLAlchemy ORM
Azure PostgreSQL Database
```

## 📚 Additional Resources

- [Main README](README.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Documentation Index](docs/README.md)
