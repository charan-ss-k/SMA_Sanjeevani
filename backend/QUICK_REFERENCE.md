# 🚀 Backend Quick Reference

## 📁 File Locations (Where Everything Is)

### 🔍 Where to Find Things

| What You Need | Location |
|---------------|----------|
| **Start the app** | `python start.py` |
| **Main app code** | `app/main.py` |
| **Add new API route** | `app/api/routes/routes_*.py` |
| **Database models** | `app/models/models.py` |
| **Authentication** | `app/core/security.py` |
| **Database setup** | `app/core/database.py` |
| **Configuration** | `app/core/config.py` |
| **Business logic** | `app/services/` |
| **Tests** | `tests/` |
| **Setup scripts** | `scripts/` |
| **Documentation** | `docs/` |

### 🎯 Common Tasks

#### Start Application
```bash
cd backend
python start.py
```

#### Run Tests
```bash
pytest tests/
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Initialize Database
```bash
python scripts/create_database.py
```

#### Check Database Schema
```bash
python scripts/check_schema.py
```

### 📦 Import Paths

```python
# Configuration
from app.core.config import settings

# Database
from app.core.database import get_db, engine

# Models
from app.models.models import User, Prescription, Reminder

# Security
from app.core.security import hash_password, verify_token, create_access_token

# Middleware
from app.core.middleware import get_current_user

# Services
from app.services.tts_service_enhanced import generate_tts
```

### 🗂️ Structure at a Glance

```
backend/
├── app/                    ← All code here
│   ├── main.py            ← Start here
│   ├── core/              ← Core functionality
│   ├── api/routes/        ← API endpoints
│   ├── models/            ← Database models
│   └── services/          ← Business logic
├── tests/                 ← All tests
├── scripts/               ← Utility scripts
├── docs/                  ← Documentation
└── start.py               ← Quick start
```

### 🔗 Useful URLs

| Service | URL |
|---------|-----|
| **API Docs (Swagger)** | http://localhost:8000/docs |
| **API Docs (ReDoc)** | http://localhost:8000/redoc |
| **Health Check** | http://localhost:8000/health |
| **Frontend** | http://localhost:5173 |

### 📝 Environment Variables

Key variables in `.env`:
```bash
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=phi3.5:latest
```

### 🧹 Cleanup Commands

```bash
# Remove Python cache
Get-ChildItem -Recurse -Directory -Filter __pycache__ | Remove-Item -Recurse -Force

# Remove .pyc files
Get-ChildItem -Recurse -Filter "*.pyc" | Remove-Item -Force
```

### ✅ Status

- ✅ Structure organized
- ✅ Duplicates removed
- ✅ Documentation complete
- ✅ Ready to use

**Last Updated:** January 27, 2026
