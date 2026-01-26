# Database Documentation

Complete database documentation for SMA Sanjeevani.

## 📚 Available Documentation

- **DATABASE_SETUP.md** - Database setup instructions
- **DATABASE_ARCHITECTURE.md** - Database architecture and design
- **POSTGRESQL_SETUP_GUIDE.md** - PostgreSQL-specific setup guide
- **DATABASE_CONNECTION_STATUS.md** - Connection troubleshooting

## 🗄️ Database Information

- **Type**: Azure PostgreSQL
- **Database Name**: `sanjeevani_finaldb`
- **Connection**: SSL required

## 📋 Schema Overview

### Main Tables
- `users` - User accounts and profiles
- `medicine_history` - Medicine recommendation history
- `prescriptions` - User prescriptions
- `reminders` - Medicine reminders
- `qa_history` - Q&A conversation history
- `dashboard_data` - Dashboard statistics

## 🔧 Setup

1. **Create Database**
   ```bash
   python backend/scripts/create_database.py
   ```

2. **Initialize Tables**
   ```bash
   python backend/database.py
   ```

3. **Configure Connection**
   - Update `backend/.env` with your Azure PostgreSQL credentials
   - Ensure SSL is enabled

## 📖 Related Documentation

- [Backend README](../../backend/README.md)
- [Setup Guides](../setup/)
- [Architecture Documentation](../architecture/)
