# 🏥 SMA Sanjeevani - AI Medical Assistant

A comprehensive AI-powered medical assistant application with symptom analysis, medicine recommendations, prescription management, and health tracking features.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Contributing](#-contributing)

## ✨ Features

- 🔍 **Symptom Analysis** - AI-powered symptom checking and condition prediction
- 💊 **Medicine Recommendations** - Personalized medicine suggestions based on symptoms
- 📋 **Prescription Management** - Track and manage your prescriptions
- 🔔 **Medicine Reminders** - Smart reminders for medication schedules
- 💬 **Medical Q&A** - Interactive chatbot for health-related questions
- 📊 **Health Dashboard** - Comprehensive health analytics and tracking
- 🔐 **Secure Authentication** - JWT-based user authentication
- 🌐 **Multi-language Support** - Support for multiple languages

## 🛠 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Azure PostgreSQL database
- **SQLAlchemy** - ORM for database operations
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Ollama/LLM** - AI model integration

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Axios/Fetch** - API communication

## 📁 Project Structure

```
SMA_Sanjeevani/
├── backend/                 # FastAPI backend application
│   ├── features/           # Feature modules
│   ├── scripts/            # Utility scripts
│   ├── tests/              # Test files
│   ├── config/             # Configuration files
│   ├── main.py             # Application entry point
│   ├── models.py           # Database models
│   ├── database.py         # Database configuration
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Context providers
│   │   └── utils/         # Utility functions
│   └── package.json       # Node dependencies
│
├── docs/                   # Project documentation
│   ├── setup/             # Setup guides
│   ├── architecture/      # Architecture docs
│   ├── api/               # API documentation
│   ├── database/          # Database docs
│   ├── guides/            # User guides
│   └── features/          # Feature documentation
│
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (Azure PostgreSQL configured)
- Ollama (for AI features)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp config/.env.example .env
# Edit .env with your database credentials
python main.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

For detailed setup instructions, see [docs/setup/README.md](docs/setup/README.md)

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Setup Guides](docs/setup/)** - Installation and configuration
- **[Architecture](docs/architecture/)** - System design and architecture
- **[API Documentation](docs/api/)** - API endpoints and usage
- **[Database](docs/database/)** - Database schema and setup
- **[User Guides](docs/guides/)** - Feature guides and tutorials
- **[Features](docs/features/)** - Individual feature documentation

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-secret-key
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
```

### Frontend Configuration

The frontend API base URL can be configured in `frontend/src/components/` files or via environment variables.

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests
cd frontend
npm test
```

## 📝 License

[Your License Here]

## 👥 Contributors

[Your Name/Team]

## 🔗 Links

- [API Documentation](docs/api/)
- [Database Schema](docs/database/)
- [Architecture Overview](docs/architecture/)

---

**Note**: Make sure to configure your Azure PostgreSQL database connection before running the application.
