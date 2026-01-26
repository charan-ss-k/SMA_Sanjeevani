# API Documentation

Complete API reference for the SMA Sanjeevani backend.

## 📚 Available Documentation

- **COMPLETE_ROUTES_REFERENCE.md** - Complete list of all API endpoints
- **API_DATA_STORAGE_EXAMPLES.md** - Examples of API requests and responses

## 🔗 Quick Links

### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Feature Endpoints
- `POST /symptoms/recommend` - Medicine recommendations
- `GET /api/dashboard` - Dashboard data
- `POST /api/medicine-history` - Save medicine history
- `GET /api/prescriptions` - Get prescriptions
- `POST /api/prescriptions` - Create prescription
- `GET /api/reminders` - Get reminders
- `POST /api/reminders` - Create reminder
- `GET /api/qa-history` - Get Q&A history
- `POST /api/qa-history` - Save Q&A

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## 📖 Related Documentation

- [Backend README](../../backend/README.md)
- [Database Documentation](../database/)
- [Architecture Documentation](../architecture/)
