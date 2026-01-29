# Backend Router Integration - Copy/Paste Code

## 📌 Where to Add the Router Integration

### Find your main FastAPI application file:
- Usually `backend/app/main.py` or `backend/app/app.py`
- Look for: `app = FastAPI()`

---

## 🔧 Integration Code - COPY THIS

### Option A: If using main.py

**Find this section** in your `backend/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ... CORS setup and other configurations ...

# FIND THIS AREA - usually near the end with other routers
```

**Add this code** right after your FastAPI app initialization and after other router includes:

```python
# Import the consultation router
from app.services.consultation.router import router as consultation_router

# Include the consultation routes
# Add this with your other app.include_router() calls
app.include_router(consultation_router)
```

---

## 📋 Complete Example

Here's what your main.py should look like with the integration:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Import all your routers
from app.services.medicine_ocr_service import router as ocr_router
from app.services.symptoms_recommendation.router import router as symptoms_router
from app.services.consultation.router import router as consultation_router  # ADD THIS LINE

# ... rest of imports ...

app = FastAPI(title="SMA Sanjeevani API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(ocr_router)
app.include_router(symptoms_router)
app.include_router(consultation_router)  # ADD THIS LINE

# ... rest of your app configuration ...
```

---

## ✅ Verification Commands

After adding the router, test with these commands:

```bash
# Test 1: Get all doctors
curl http://localhost:8000/api/doctors

# Expected Response (if dataset loaded):
[
  {
    "employee_id": "EMP1000",
    "doctor_name": "Dr. Pooja Gupta",
    "specialization": "Cardiology",
    ...
  }
]
```

```bash
# Test 2: Search for doctors
curl -X POST http://localhost:8000/api/doctors/search \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": "chest pain",
    "locality": "Jubilee Hills",
    "city": "Hyderabad",
    "state": "Telangana",
    "language": "english"
  }'

# Expected Response:
{
  "total": 5,
  "doctors": [
    {
      "employee_id": "EMP1000",
      "doctor_name": "Dr. Pooja Gupta",
      "specialization": "Cardiology",
      "match_score": 95,
      ...
    }
  ]
}
```

---

## 🐛 Troubleshooting

### ❌ Error: `ModuleNotFoundError: No module named 'app.services.consultation'`
**Solution**: Make sure `backend/app/services/consultation/router.py` file exists

### ❌ Error: `FileNotFoundError: Doctors dataset not found`
**Solution**: Make sure `backend/app/data/doctors_dataset.json` exists

### ❌ Error: `404 Not Found` on `/api/doctors`
**Solution**: Make sure `app.include_router(consultation_router)` is added to main.py

### ❌ Error: `Conflict in operation IDs` 
**Solution**: Check if another router has the same endpoint paths

---

## 📝 Quick Checklist

Before deploying, verify:
- [ ] `backend/app/services/consultation/router.py` exists
- [ ] `backend/app/data/doctors_dataset.json` exists
- [ ] Import added to main.py: `from app.services.consultation.router import router as consultation_router`
- [ ] Router included: `app.include_router(consultation_router)`
- [ ] Backend starts without errors: `python start.py`
- [ ] Endpoints respond: `curl http://localhost:8000/api/doctors`

---

## 🚀 Testing the Integration

```bash
# 1. Start backend
cd backend
python start.py

# 2. In another terminal, test the endpoint
curl http://localhost:8000/api/doctors

# 3. Should return doctors list (or empty list if dataset not loaded)
```

---

## 💡 Common Patterns

### If you have multiple routers organized differently:

```python
# Alternative 1: Group imports
from app.services.consultation import router as consultation_router
app.include_router(consultation_router)

# Alternative 2: With prefix
from app.services.consultation.router import router as consultation_router
app.include_router(consultation_router, prefix="/api")

# Alternative 3: With tags
from app.services.consultation.router import router as consultation_router
app.include_router(consultation_router, tags=["consultation"])
```

---

## 📄 Example Minimal main.py

If you want to start fresh, here's a minimal working example:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.consultation.router import router as consultation_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(consultation_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## ✨ Expected API Endpoints After Integration

Once integrated, you should have these endpoints:

```
GET    /api/doctors
POST   /api/doctors/search
POST   /api/appointments/book
GET    /api/appointments/{patient_email}
```

---

## 🔄 Integration Steps Summary

1. **Open** `backend/app/main.py`
2. **Add import**: `from app.services.consultation.router import router as consultation_router`
3. **Add router**: `app.include_router(consultation_router)`
4. **Save file**
5. **Restart backend**: `python start.py`
6. **Test endpoint**: `curl http://localhost:8000/api/doctors`

Done! ✅

---

## 📞 Still Having Issues?

1. Check `backend/app/services/consultation/router.py` is at correct path
2. Verify `backend/app/data/doctors_dataset.json` exists
3. Check for Python syntax errors: `python -m py_compile backend/app/main.py`
4. Check backend console output for import errors
5. Verify port 8000 is not in use
6. Try restarting the backend process

---

**That's it! Your doctor consultation API is now integrated.** 🎉

