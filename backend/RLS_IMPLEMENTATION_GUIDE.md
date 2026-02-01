# ✅ Database RLS Integration - IMPLEMENTATION CHECKLIST

## Status
- ✅ SQL Schema: **COMPLETE** (sanjeevani_finaldb.sql)
- ✅ Backend Helper: **CREATED** (app/core/rls_context.py)
- ✅ Examples: **PROVIDED** (rls_integration_examples.py)
- ⏳ **YOUR TURN**: Apply changes to your code

---

## STEP 1: Deploy Schema to Azure PostgreSQL

This is a one-time setup. Run this on your Azure PostgreSQL instance:

```bash
# Option A: Using psql CLI
psql -h sma-sanjeevani.postgres.database.azure.com -U sma_admin@sma-sanjeevani -d sanjeevani_finaldb < backend/scripts/sanjeevani_finaldb.sql

# Option B: Using Azure Portal
# 1. Go to Azure Portal > PostgreSQL > Query Editor
# 2. Copy-paste the entire content of sanjeevani_finaldb.sql
# 3. Click "Run"

# Option C: Using DBeaver or PgAdmin
# 1. Connect to your Azure PostgreSQL instance
# 2. Run the SQL file directly
```

**What this does:**
- Enables RLS (Row-Level Security) on all user-scoped tables
- Creates policies that automatically filter data by user
- Updates views to respect per-user isolation
- No data loss, only adds security layer

---

## STEP 2: Update Your Backend Routes

### The Pattern (Copy-Paste for Each Route):

**BEFORE:**
```python
@router.get("/api/prescriptions")
def get_prescriptions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = db.query(Prescriptions).all()  # ❌ Might return ALL users' data
    return result
```

**AFTER:**
```python
from app.core.rls_context import get_db_with_rls  # Add this import

@router.get("/api/prescriptions")
def get_prescriptions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db = get_db_with_rls(db, current_user["id"])  # ✅ Set RLS context
    result = db.query(Prescriptions).all()  # Now returns ONLY this user's data
    return result
```

### Key Change:
```python
# Add ONE line at the start of each route:
db = get_db_with_rls(db, current_user["id"])

# Then use db normally - RLS filters automatically
```

---

## STEP 3: Routes to Update

Find these route files and add the RLS context:

```
backend/app/api/routes/routes_*.py
├─ routes_auth.py           (Login/Signup - user creation)
├─ routes_dashboard.py       (Dashboard - health summary)
├─ routes_prescriptions.py   (Prescriptions - doctor medicines)
├─ routes_medicine_history.py (Medicine tracking)
├─ routes_reminders.py       (Medicine reminders)
├─ routes_qa_history.py      (Chatbot conversations)
├─ routes_hospital_reports.py (Report analyzer)
└─ routes_appointments.py    (Doctor appointments)

backend/app/services/
├─ symptoms_recommendation.py (Symptom checker)
```

### Quick Search:
```bash
# Find all route files that query the database
grep -r "db.query" backend/app/api/routes/
grep -r "db.execute" backend/app/api/routes/
```

---

## STEP 4: Implementation Priority

Do these in order:

**Priority 1 (CRITICAL - User Isolation):**
1. routes_dashboard.py - User health summary
2. routes_medicine_history.py - User's medicine history
3. routes_prescriptions.py - User's prescriptions
4. routes_reminders.py - User's reminders

**Priority 2 (Important):**
5. routes_qa_history.py - Chatbot history
6. routes_hospital_reports.py - User's reports
7. routes_appointments.py - User's appointments

**Priority 3 (Nice to have):**
8. routes_medicine_identification.py
9. routes_doctors.py (if it stores user data)

---

## STEP 5: Testing

After updating each route, test with 2 users:

```python
# Test Script: backend/test_rls_isolation.py

import requests

BASE_URL = "http://localhost:8000"

# User 1
user1_token = login("user1@example.com", "password1")
prescriptions_1 = requests.get(
    f"{BASE_URL}/api/prescriptions",
    headers={"Authorization": f"Bearer {user1_token}"}
).json()

# User 2
user2_token = login("user2@example.com", "password2")
prescriptions_2 = requests.get(
    f"{BASE_URL}/api/prescriptions",
    headers={"Authorization": f"Bearer {user2_token}"}
).json()

# VERIFY:
assert prescriptions_1["user_id"] == 1
assert prescriptions_2["user_id"] == 2
assert prescriptions_1["prescriptions"] != prescriptions_2["prescriptions"]
print("✅ RLS Isolation Working!")
```

---

## STEP 6: What Each User Sees (After Implementation)

### User 1 (ID=1):
```
Dashboard:
✅ Own symptom checks
✅ Own prescriptions
✅ Own reminders
❌ Other user's data (blocked by RLS)

History:
✅ Own medicine taken logs
✅ Own appointments
✅ Own chatbot conversations
❌ Other user's data
```

### User 2 (ID=2):
```
Dashboard:
✅ Own symptom checks
✅ Own prescriptions
✅ Own reminders
❌ Other user's data (blocked by RLS)
```

**Both users can have identical feature names, but completely isolated data.**

---

## Common Patterns (Copy-Paste Ready)

### Pattern 1: Insert with RLS
```python
from app.core.rls_context import get_db_with_rls

@router.post("/api/feature/add")
def add_feature(data: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db = get_db_with_rls(db, current_user["id"])  # ✅ Set RLS
    db.add(MyModel(user_id=current_user["id"], **data))
    db.commit()
    return {"status": "success"}
```

### Pattern 2: Query with RLS
```python
@router.get("/api/feature/list")
def list_features(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db = get_db_with_rls(db, current_user["id"])  # ✅ Set RLS
    results = db.query(MyModel).all()  # Only this user's rows
    return results
```

### Pattern 3: Raw SQL with RLS
```python
@router.get("/api/feature/custom")
def custom_query(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db = get_db_with_rls(db, current_user["id"])  # ✅ Set RLS
    result = db.execute(text("SELECT * FROM my_table")).fetchall()
    return result
```

### Pattern 4: Using Scoped Views
```python
@router.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db = get_db_with_rls(db, current_user["id"])  # ✅ Set RLS
    summary = db.execute(text("SELECT * FROM user_health_summary_view")).fetchone()
    return summary
```

---

## Troubleshooting

### Problem: "No rows returned" or "permission denied"
**Solution:** Check if you set RLS context:
```python
db = get_db_with_rls(db, current_user["id"])  # Don't forget this line!
```

### Problem: Views returning empty results
**Solution:** Verify `app.current_user_id` is set:
```python
# Add debug line temporarily:
result = db.execute(text("SELECT current_setting('app.current_user_id')")).scalar()
print(f"Current RLS user: {result}")
```

### Problem: Still seeing other users' data
**Solution:** Database schema not updated. Run SQL file again:
```bash
psql -h sma-sanjeevani.postgres.database.azure.com -U sma_admin@sma-sanjeevani -d sanjeevani_finaldb < backend/scripts/sanjeevani_finaldb.sql
```

---

## Benefits After Implementation

✅ **Data Isolation**: Each user sees ONLY their own data  
✅ **No SQL Injection**: RLS blocks unauthorized access at DB level  
✅ **Multi-Tenancy**: Same database, 100% isolated data per user  
✅ **History Persistence**: All user activities saved with timestamps  
✅ **Compliance**: GDPR-compliant data isolation  
✅ **Simple Code**: One-line change per route  

---

## File Locations

| File | Purpose |
|------|---------|
| `backend/scripts/sanjeevani_finaldb.sql` | Database schema with RLS |
| `backend/app/core/rls_context.py` | Helper module for RLS |
| `backend/rls_integration_examples.py` | Copy-paste examples |
| `backend/app/api/routes/routes_*.py` | **YOUR ROUTE FILES** (to update) |

---

## Next Steps

1. ✅ Deploy schema to Azure
2. ⏳ Update routes (using examples as template)
3. ⏳ Test with 2+ users
4. ⏳ Deploy to production

**Estimated time: 30-60 minutes for all routes**

---

## Questions?

Refer to:
- `rls_integration_examples.py` - Complete working examples
- `app/core/rls_context.py` - Helper function docs
- Database schema - RLS policies defined in `sanjeevani_finaldb.sql`
