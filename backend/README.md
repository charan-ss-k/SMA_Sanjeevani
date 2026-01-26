# Backend - SMA Sanjeevani

FastAPI backend application for the SMA Sanjeevani medical assistant.

## 📁 Directory Structure

```
backend/
├── features/              # Feature modules
│   ├── symptoms_recommendation/  # Symptom analysis feature
│   └── tts_service.py     # Text-to-speech service
│
├── scripts/               # Utility scripts
│   ├── create_database.py # Database creation script
│   └── sanjeevani_finaldb.sql  # Database schema
│
├── tests/                 # Test files
│   ├── test_api_endpoints.py
│   ├── test_db_connection.py
│   └── test_signup.py
│
├── config/                # Configuration files
│   └── .env.example      # Environment variables template
│
├── main.py               # Application entry point
├── models.py             # SQLAlchemy database models
├── database.py           # Database configuration
├── security.py           # Authentication & security
├── middleware.py         # Custom middleware
├── routes_auth.py       # Authentication routes
├── routes_dashboard.py  # Dashboard routes
├── routes_medicine_history.py  # Medicine history routes
├── routes_prescriptions.py    # Prescription routes
├── routes_reminders.py        # Reminder routes
├── routes_qa_history.py       # Q&A history routes
├── requirements.txt     # Python dependencies
└── .env                 # Environment variables (not in git)
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp config/.env.example .env
# Edit .env with your Azure PostgreSQL credentials
```

### 3. Initialize Database

```bash
# Option 1: Use the script
python scripts/create_database.py

# Option 2: Run directly
python database.py
```

### 4. Run the Application

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# JWT Secret Key
SECRET_KEY=your-super-secret-key-change-in-production

# LLM Provider Configuration
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=phi3.5
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=2048
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Features
- `POST /symptoms/recommend` - Get medicine recommendations
- `GET /api/dashboard` - Get dashboard data
- `POST /api/medicine-history` - Save medicine history
- `GET /api/prescriptions` - Get prescriptions
- `POST /api/prescriptions` - Create prescription
- `GET /api/reminders` - Get reminders
- `POST /api/reminders` - Create reminder
- `GET /api/qa-history` - Get Q&A history
- `POST /api/qa-history` - Save Q&A

For complete API documentation, see [docs/api/](../docs/api/)

## 🗄️ Database

The application uses Azure PostgreSQL. The database schema is defined in `models.py` and can be initialized using:

```bash
python scripts/create_database.py
python database.py
```

## 🧪 Testing

```bash
# Test database connection
python tests/test_db_connection.py

# Test API endpoints
python tests/test_api_endpoints.py

# Test signup
python tests/test_signup.py
```

## 📦 Dependencies

Key dependencies:
- `fastapi` - Web framework
- `sqlalchemy` - ORM
- `psycopg2-binary` - PostgreSQL adapter
- `bcrypt` - Password hashing
- `python-jose` - JWT tokens
- `uvicorn` - ASGI server

See `requirements.txt` for complete list.

## 🔐 Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- SSL required for Azure PostgreSQL connections
- Input validation using Pydantic models

## 📚 Additional Resources

- [Database Setup Guide](../docs/database/)
- [API Documentation](../docs/api/)
- [Architecture Documentation](../docs/architecture/)
