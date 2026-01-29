# Integration Guide - Doctor Consultation Feature

## 🔧 Pre-Deployment Checklist

### Backend Setup
- [ ] `backend/app/services/consultation/router.py` exists
- [ ] `backend/app/data/doctors_dataset.json` exists with doctor data
- [ ] Consultation router imported in `app.py`

### Frontend Setup
- [ ] All components created and imported
- [ ] CSS files created and linked
- [ ] Routes updated in `main.jsx`
- [ ] Navbar updated with Consult link
- [ ] Home page updated with dashboard components
- [ ] TTS utility available and working

---

## 📦 Files Created/Modified

### ✅ New Files Created

1. **Backend**
   - `backend/app/services/consultation/router.py` (171 lines)
   - `backend/app/data/doctors_dataset.json` (8 samples)

2. **Frontend Components**
   - `frontend/src/components/ConsultPage.jsx` (310 lines)
   - `frontend/src/components/ConsultPage.css` (200 lines)
   - `frontend/src/components/DoctorRecommendation.jsx` (280 lines)
   - `frontend/src/components/AppointmentBooking.jsx` (300 lines)
   - `frontend/src/components/DashboardAppointments.jsx` (350 lines)
   - `frontend/src/components/DashboardReminders.jsx` (250 lines)

3. **Documentation**
   - `CONSULT_FEATURE_IMPLEMENTATION.md`
   - `CONSULT_FEATURE_TESTING.md`
   - `INTEGRATION_GUIDE.md` (this file)

### ⚙️ Files Modified

1. **Backend**
   - `backend/app/main.py` or `backend/app/app.py`
     - Add consultation router import and include_router call

2. **Frontend**
   - `frontend/src/main.jsx`
     - Added ConsultPage import
     - Added `/consult` route with ProtectedRoute
   - `frontend/src/components/Navbar.jsx`
     - Added Consult Doctor link
   - `frontend/src/components/Home.jsx`
     - Imported DashboardAppointments and DashboardReminders
     - Replaced demo data with real dashboard
     - Added conditional rendering based on auth status

---

## 🚀 Integration Steps

### Step 1: Backend Integration

Open `backend/app/main.py` (or `app.py`):

```python
# Add this import at the top
from app.services.consultation.router import router as consultation_router

# Add this after FastAPI app creation
app.include_router(consultation_router)
```

### Step 2: Verify Doctor Dataset

Check that `backend/app/data/doctors_dataset.json` exists:
```bash
ls backend/app/data/doctors_dataset.json
# Should show file path if exists
```

If missing, create the directory and file with sample data.

### Step 3: Test Backend Endpoints

```bash
# Test GET /api/doctors
curl http://localhost:8000/api/doctors

# Test POST /api/doctors/search
curl -X POST http://localhost:8000/api/doctors/search \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": "chest pain",
    "locality": "Jubilee Hills",
    "city": "Hyderabad",
    "state": "Telangana",
    "language": "english"
  }'
```

### Step 4: Frontend Components Verification

Ensure all components are created:
```bash
# From frontend directory
ls src/components/ConsultPage.jsx
ls src/components/ConsultPage.css
ls src/components/DoctorRecommendation.jsx
ls src/components/AppointmentBooking.jsx
ls src/components/DashboardAppointments.jsx
ls src/components/DashboardReminders.jsx
```

### Step 5: Check Route Integration

Verify in `frontend/src/main.jsx`:
```javascript
import ConsultPage from './components/ConsultPage.jsx';

// Inside Routes:
<Route path="/consult" element={<ProtectedRoute><ConsultPage /></ProtectedRoute>} />
```

### Step 6: Verify Navbar Link

Check `frontend/src/components/Navbar.jsx`:
```jsx
<li>
  <Link to="/consult" className={getLinkClass('/consult')}>
    🏥 Consult Doctor
  </Link>
</li>
```

### Step 7: Start Services

```bash
# Terminal 1: Backend
cd backend
python -m pip install -r requirements.txt
python start.py

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

### Step 8: Test in Browser

1. Open browser to `http://localhost:5173` (or configured frontend URL)
2. Login with test account
3. Click "🏥 Consult Doctor" in navbar
4. Follow the consultation flow

---

## 🔄 API Integration Details

### Doctor Search Request/Response

**Request**:
```json
{
  "symptoms": "chest pain",
  "locality": "Jubilee Hills",
  "city": "Hyderabad",
  "state": "Telangana",
  "language": "english",
  "hospital_name": "Apollo",
  "specialization": "Cardiology",
  "languages_known": ["english", "hindi"]
}
```

**Response**:
```json
{
  "total": 5,
  "doctors": [
    {
      "employee_id": "EMP1000",
      "doctor_name": "Dr. Pooja Gupta",
      "specialization": "Cardiology",
      "hospital_name": "CMC Vellore",
      "locality": "Vellore",
      "city": "Vellore",
      "state": "Tamil Nadu",
      "phone_number": "+91-9876543210",
      "email_address": "pooja.gupta@example.com",
      "native_language": "Hindi",
      "languages_known": ["English", "Hindi", "Tamil", "Telugu"],
      "rating": 4.8,
      "match_score": 95
    }
  ]
}
```

### Appointment Booking Request

```json
{
  "doctor_id": "EMP1000",
  "patient_name": "John Doe",
  "appointment_date": "2024-12-25",
  "appointment_time": "10:00",
  "symptoms_brief": "Chest pain",
  "phone_number": "+91-9999999999",
  "email": "john@example.com",
  "notes": "First visit"
}
```

---

## 🧪 Quick Test Workflow

1. **Start Backend**:
   ```bash
   cd backend && python start.py
   ```

2. **Start Frontend**:
   ```bash
   cd frontend && npm run dev
   ```

3. **Open Browser**: http://localhost:5173

4. **Login**: Use test credentials

5. **Navigate**: Click "🏥 Consult Doctor"

6. **Fill Form**:
   - Symptoms: "fever and cough"
   - Locality: "Jubilee Hills"
   - City: "Hyderabad"
   - State: "Telangana"
   - Language: "english"

7. **Search**: Click "🔍 Find Doctors"

8. **Book**: Select doctor and fill booking form

9. **Verify**: Check home page dashboard

---

## 🔗 Dependency Mapping

```
Frontend Dependencies:
  ConsultPage.jsx
    ├── imports DoctorRecommendation.jsx
    ├── imports AppointmentBooking.jsx
    ├── imports ConsultPage.css
    ├── uses TTS utility (playTTS, stopAllTTS)
    └── uses translations (t function)

  Home.jsx
    ├── imports DashboardAppointments.jsx
    ├── imports DashboardReminders.jsx
    └── uses AuthContext

  Navbar.jsx
    ├── routes to /consult path
    └── displays Consult Doctor link

Backend Dependencies:
  app.py
    ├── imports consultation/router.py
    └── serves /api/doctors/* endpoints

  consultation/router.py
    ├── loads doctors_dataset.json
    ├── implements search algorithm
    └── stores appointments
```

---

## 🎯 Validation Checklist

### Backend
- [ ] `app.include_router(consultation_router)` added
- [ ] `/api/doctors` endpoint returns list
- [ ] `/api/doctors/search` returns filtered results
- [ ] Search algorithm weights are correct
- [ ] Doctor dataset loads without errors
- [ ] Appointment booking saves correctly
- [ ] No SQL errors (if using DB later)

### Frontend
- [ ] ConsultPage renders at /consult route
- [ ] Form validation works
- [ ] Doctor search calls API correctly
- [ ] Results display in grid
- [ ] Booking form submits data
- [ ] Dashboard shows appointments
- [ ] TTS plays announcements
- [ ] Mobile layout responsive

### Integration
- [ ] Navbar link works
- [ ] Route protection active
- [ ] Home page shows dashboard
- [ ] Data persists in localStorage
- [ ] No console errors
- [ ] All imports resolve

---

## 🆘 Troubleshooting

### Issue: /consult route gives 404
**Solution**: Verify `main.jsx` has the route and component is imported

### Issue: "Cannot GET /api/doctors"
**Solution**: Check if `consultation_router` is included in `app.include_router()`

### Issue: Appointments not saving
**Solution**: Check browser localStorage is enabled, verify API returns success response

### Issue: Form inputs not responsive on mobile
**Solution**: Verify `ConsultPage.css` media queries are present (max-width: 768px)

### Issue: TTS not playing
**Solution**: Check mute button state, verify audio permission in browser, check TTS utility is working

### Issue: Doctor data not loading
**Solution**: Verify `doctors_dataset.json` exists in correct path, check JSON formatting

---

## 📝 Post-Deployment Steps

1. **Backup Current Database** (if applicable)
2. **Deploy Backend** Changes
3. **Deploy Frontend** Changes
4. **Run Tests** from CONSULT_FEATURE_TESTING.md
5. **Monitor Logs** for errors
6. **Verify Patient Workflow**:
   - Login → Consult → Book → Dashboard
7. **Test on Multiple Devices**
8. **Collect User Feedback**

---

## 📊 Monitoring Points

- Consult page load time
- Doctor search API response time
- Appointment booking success rate
- Mobile vs desktop traffic
- TTS feature usage
- Error rate on endpoints

---

## 🔄 Rollback Plan

If issues occur:

1. **Revert main.jsx** - Comment out /consult route
2. **Revert Navbar.jsx** - Remove Consult link
3. **Revert Home.jsx** - Use previous version
4. **Keep backend** - Doesn't affect other features

---

## 💡 Future Enhancements

- [ ] Connect to real database (replace JSON)
- [ ] Add email notifications
- [ ] Implement Phi4 LLM for symptom analysis
- [ ] Add payment integration
- [ ] Enable SMS reminders
- [ ] Add video consultation
- [ ] Create admin panel
- [ ] Add doctor reviews/ratings

---

## 📞 Support Resources

1. **Component Issues**: Check component JSX syntax
2. **Routing Issues**: Verify main.jsx Routes structure
3. **API Issues**: Check console Network tab for requests
4. **Styling Issues**: Check browser DevTools Elements tab
5. **Data Issues**: Check browser DevTools Storage/LocalStorage

---

**Integration Completed**: _______________
**Tested By**: _______________
**Status**: ☐ READY FOR PRODUCTION

