# Setup & Installation Guides

This directory contains all setup and installation documentation.

## 📚 Available Guides

- **QUICK_START.md** - Quick start guide for getting the application running
- **SETUP_AND_TESTING_GUIDE.md** - Comprehensive setup and testing instructions
- **START_HERE.md** - Getting started guide for new users

## 🚀 Quick Setup

1. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp config/.env.example .env
   # Edit .env with your credentials
   python main.py
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Database Setup**
   - See [Database Setup Guide](../database/README.md)

## 📖 Next Steps

- [Architecture Documentation](../architecture/)
- [API Documentation](../api/)
- [Feature Guides](../features/)
