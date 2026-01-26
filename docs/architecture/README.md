# Architecture Documentation

System architecture and design documentation.

## 📚 Available Documentation

- **SYSTEM_ARCHITECTURE.md** - Overall system architecture
- **ARCHITECTURE_DIAGRAM.md** - Visual architecture diagrams
- **DATABASE_ARCHITECTURE.md** - Database architecture details

## 🏗️ System Overview

### Components
- **Backend**: FastAPI application
- **Frontend**: React application
- **Database**: Azure PostgreSQL
- **AI/LLM**: Ollama integration

### Data Flow
```
User → Frontend (React) → Backend API (FastAPI) → Database (PostgreSQL)
                                    ↓
                              AI/LLM Service
```

## 📖 Related Documentation

- [Setup Guides](../setup/)
- [API Documentation](../api/)
- [Database Documentation](../database/)
