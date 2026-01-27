# SMA Sanjeevani Backend

AI-powered medical assistant backend built with FastAPI and PostgreSQL.

## 🏗️ Project Structure

```
backend/
├── app/                          # Main application package
│   ├── __init__.py
│   ├── main.py                   # Application entry point
│   ├── api/                      # API layer
│   │   ├── __init__.py
│   │   └── routes/               # API route handlers
│   │       ├── __init__.py
│   │       ├── routes_auth.py              # Authentication endpoints
│   │       ├── routes_dashboard.py         # Dashboard data endpoints
│   │       ├── routes_medicine_history.py  # Medicine history endpoints
│   │       ├── routes_prescriptions.py     # Prescription management
│   │       ├── routes_qa_history.py        # Q&A history endpoints
│   │       └── routes_reminders.py         # Reminder management
│   ├── core/                     # Core functionality
│   │   ├── __init__.py
│   │   ├── config.py             # Application configuration
│   │   ├── database.py           # Database connection & session
│   │   ├── security.py           # Authentication & password hashing
│   │   └── middleware.py         # Custom middleware (auth, etc.)
│   ├── models/                   # Database models
│   │   ├── __init__.py
│   │   └── models.py             # SQLAlchemy ORM models
│   └── services/                 # Business logic services
│       ├── __init__.py
│       ├── tts_service.py                # Text-to-speech service
│       ├── tts_service_enhanced.py       # Enhanced TTS with multi-language
│       └── symptoms_recommendation/      # Symptom analysis service
│           ├── __init__.py
│           ├── models.py                 # Pydantic models
│           ├── router.py                 # API router
│           ├── service.py                # Business logic
│           ├── prompt_templates.py       # LLM prompts
│           ├── safety_rules.py           # Medical safety checks
│           └── utils.py                  # Utility functions
├── tests/                        # Test suite
│   ├── test_api_endpoints.py
│   ├── test_db_connection.py
│   ├── test_ollama.py
│   └── test_signup.py
├── scripts/                      # Utility scripts
│   ├── check_schema.py           # Verify database schema
│   ├── create_database.py        # Initialize database
│   ├── debug_mistral.py          # Debug LLM integration
│   ├── setup_postgres.ps1        # PostgreSQL setup script
│   └── sanjeevani_finaldb.sql    # Database schema
├── docs/                         # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SETUP.md
│   ├── POSTGRESQL_SETUP_GUIDE.md
│   ├── SETUP_OLLAMA.md
│   └── TTS_SETUP.md
├── .env                          # Environment variables (git-ignored)
├── .env.example                  # Environment template
├── requirements.txt              # Python dependencies
└── README.md                     # This file
```

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- PostgreSQL 14+ (Azure PostgreSQL Flexible Server recommended)
- Ollama (for local LLM) or Mistral API access

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database**
   ```bash
   python scripts/create_database.py
   ```

6. **Run the application**
   ```bash
   # Development mode (with auto-reload)
   python -m app.main
   
   # Production mode
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

## 📚 API Documentation

Once running, access the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🧪 Running Tests

```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_api_endpoints.py

# Run with coverage
pytest --cov=app tests/
```

## 🗃️ Database

The application uses PostgreSQL with SQLAlchemy ORM. See [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) for details.

### Models
- **User**: User accounts and authentication
- **Prescription**: Medicine prescriptions
- **Reminder**: Medicine reminders
- **MedicineHistory**: Symptom-medicine history
- **QAHistory**: Q&A conversation history
- **DashboardData**: User dashboard analytics

## 🔐 Authentication

JWT-based authentication with Bearer tokens. Token expiry: 30 minutes.

**Protected endpoints**: All `/api/*` routes except `/api/auth/login` and `/api/auth/signup`

## 🏥 Features

### 1. Symptom Analysis (`/api/symptoms/recommend`)
- AI-powered symptom analysis
- Medicine recommendations
- Safety checks and disclaimers
- Multi-language support

### 2. Prescription Management
- Create, read, update, delete prescriptions
- Track medicine intake
- Reminder management

### 3. Dashboard Analytics
- Health metrics tracking
- Medication adherence stats
- Recent consultations

### 4. Text-to-Speech
- Multi-language TTS support
- Bhashini API integration
- Google TTS fallback

## 🛠️ Development

### Code Structure

- **Routes** (`app/api/routes/`): Handle HTTP requests/responses
- **Services** (`app/services/`): Business logic and external integrations
- **Models** (`app/models/`): Database schema definitions
- **Core** (`app/core/`): Cross-cutting concerns (auth, config, db)

### Adding New Features

1. Create route in `app/api/routes/`
2. Add business logic in `app/services/`
3. Define models in `app/models/` (if needed)
4. Register router in `app/main.py`
5. Add tests in `tests/`

### Environment Variables

See `.env.example` for all configuration options:
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `OLLAMA_BASE_URL`: Ollama server URL
- `LLM_MODEL`: LLM model name

## 📖 Documentation

- [API Documentation](docs/API_DOCUMENTATION.md)
- [Database Setup](docs/DATABASE_SETUP.md)
- [PostgreSQL Guide](docs/POSTGRESQL_SETUP_GUIDE.md)
- [Ollama Setup](docs/SETUP_OLLAMA.md)
- [TTS Setup](docs/TTS_SETUP.md)

## 🤝 Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Update documentation
4. Use type hints
5. Follow PEP 8 style guide

## 📝 License

[Add your license here]

## 🆘 Support

For issues and questions, see the documentation in the `docs/` directory.
