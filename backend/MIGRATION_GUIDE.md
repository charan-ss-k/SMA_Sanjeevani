# Migration Guide: Backend Restructuring

## Overview

The backend has been reorganized into a professional, maintainable structure following FastAPI best practices.

## Changes Summary

### Directory Structure

**Before:**
```
backend/
├── main.py
├── database.py
├── security.py
├── middleware.py
├── models.py
├── routes_*.py (6 files)
├── test_*.py (4 files)
├── features/
│   └── symptoms_recommendation/
└── [various docs and scripts]
```

**After:**
```
backend/
├── app/
│   ├── main.py                    # NEW: Entry point
│   ├── core/
│   │   ├── config.py             # NEW: Centralized configuration
│   │   ├── database.py           # MOVED from root
│   │   ├── security.py           # MOVED from root
│   │   └── middleware.py         # MOVED from root
│   ├── models/
│   │   └── models.py             # MOVED from root
│   ├── api/
│   │   └── routes/
│   │       ├── routes_auth.py              # MOVED from root
│   │       ├── routes_dashboard.py         # MOVED from root
│   │       ├── routes_medicine_history.py  # MOVED from root
│   │       ├── routes_prescriptions.py     # MOVED from root
│   │       ├── routes_qa_history.py        # MOVED from root
│   │       └── routes_reminders.py         # MOVED from root
│   └── services/
│       ├── tts_service.py                    # MOVED from features/
│       ├── tts_service_enhanced.py           # MOVED from features/
│       └── symptoms_recommendation/          # MOVED from features/
├── tests/                         # MOVED all test_*.py files
├── scripts/                       # MOVED setup and utility scripts
└── docs/                          # MOVED all documentation
```

## Migration Steps

### 1. Update Your Environment

No changes needed to `.env` file. All environment variables remain the same.

### 2. Running the Application

**Old way:**
```bash
python main.py
# or
uvicorn main:app --reload
```

**New way:**
```bash
# From backend/ directory
python -m app.main

# Or with uvicorn
uvicorn app.main:app --reload

# Or from app/ directory
cd app
python main.py
```

### 3. Import Changes

All imports have been updated automatically. If you have custom scripts:

**Old imports:**
```python
from database import get_db
from models import User
from security import verify_token
from middleware import get_current_user
```

**New imports:**
```python
from app.core.database import get_db
from app.models.models import User
from app.core.security import verify_token
from app.core.middleware import get_current_user
```

### 4. Running Tests

**Old way:**
```bash
python test_api_endpoints.py
```

**New way:**
```bash
# Run all tests
pytest tests/

# Run specific test
pytest tests/test_api_endpoints.py

# With coverage
pytest --cov=app tests/
```

### 5. Using Scripts

**Old way:**
```bash
python create_database.py
python check_schema.py
```

**New way:**
```bash
python scripts/create_database.py
python scripts/check_schema.py
```

## Benefits of New Structure

### 1. **Separation of Concerns**
- Core functionality (`core/`) separate from business logic (`services/`)
- API layer (`api/`) isolated from data models (`models/`)
- Clear boundaries between components

### 2. **Scalability**
- Easy to add new features without cluttering root directory
- Service layer allows for complex business logic
- Modular structure supports microservices migration if needed

### 3. **Maintainability**
- Intuitive file organization
- Clear import paths indicate dependencies
- Easier onboarding for new developers

### 4. **Testing**
- All tests in dedicated `tests/` directory
- Mirrors application structure
- Easy to run test suites

### 5. **Configuration**
- Centralized configuration in `core/config.py`
- Type-safe settings with Pydantic
- Environment-aware configuration

## Configuration Management

### New: `app/core/config.py`

Centralized configuration using Pydantic Settings:

```python
from app.core.config import settings

# Access configuration
print(settings.DATABASE_URL)
print(settings.SECRET_KEY)
print(settings.CORS_ORIGINS)
```

Benefits:
- Type safety
- Environment variable validation
- Auto-completion in IDEs
- Single source of truth

## Backward Compatibility

### Old Files Preserved

The original files remain in the root directory for reference. You can:

1. **Keep both** during transition period
2. **Remove old files** after verifying everything works:
   ```bash
   # Backup first!
   mkdir backup_old_structure
   mv routes_*.py backup_old_structure/
   mv test_*.py backup_old_structure/
   mv database.py security.py middleware.py models.py backup_old_structure/
   ```

3. **Create symbolic links** if you need temporary compatibility:
   ```bash
   # Windows (as Administrator)
   mklink main.py app\main.py
   
   # Linux/Mac
   ln -s app/main.py main.py
   ```

## Troubleshooting

### Import Errors

**Error:** `ModuleNotFoundError: No module named 'app'`

**Solution:** Run from `backend/` directory, not `backend/app/`:
```bash
cd backend
python -m app.main
```

### Database Connection Issues

**Error:** `Could not import database`

**Solution:** Ensure `app/core/database.py` exists and imports are updated:
```python
from app.core.database import engine, SessionLocal, get_db
```

### Route Registration Issues

**Error:** Routes not found or 404 errors

**Solution:** Check `app/main.py` - all routers should be registered:
```python
app.include_router(auth_router)
app.include_router(dashboard_router)
# ... etc
```

## Development Workflow

### Adding a New Feature

1. **Create route** in `app/api/routes/routes_newfeature.py`
2. **Add service logic** in `app/services/newfeature_service.py` (if needed)
3. **Define models** in `app/models/models.py` (if database tables needed)
4. **Register router** in `app/main.py`:
   ```python
   from app.api.routes.routes_newfeature import router as newfeature_router
   app.include_router(newfeature_router)
   ```
5. **Add tests** in `tests/test_newfeature.py`

### Code Style

Follow these conventions:
- Use absolute imports: `from app.core.database import get_db`
- Keep routes thin - move logic to services
- Use type hints
- Document functions with docstrings
- Follow PEP 8

## Rollback Plan

If you need to rollback to the old structure:

1. The original files are still in the root directory
2. Update `main.py` to use old imports
3. Remove or rename the `app/` directory

**Note:** It's recommended to test the new structure thoroughly before removing old files.

## Next Steps

1. ✅ Verify application starts: `python -m app.main`
2. ✅ Run tests: `pytest tests/`
3. ✅ Test all API endpoints
4. ✅ Update deployment scripts (if any)
5. ✅ Update CI/CD pipelines (if any)
6. ✅ Remove old files after successful migration

## Support

If you encounter issues:
1. Check this migration guide
2. Review the README in `backend/`
3. Check imports in modified files
4. Ensure you're running from correct directory

---

**Migration Date:** January 27, 2026  
**New Structure Version:** 1.0.0
