# 🚀 QUICK START - RLS DEPLOYMENT

## What's Done ✅
- Azure PostgreSQL configured
- RLS schema created
- 3 routes updated
- Test script ready

## What's Needed ⏳
1. Deploy full schema to Azure
2. Update remaining routes
3. Run tests

---

## STEP 1: Deploy RLS Schema to Azure

```bash
cd backend
python deploy_schema_azure.py
```

**Expected Output**:
```
🚀 SMA SANJEEVANI - DEPLOYING RLS SCHEMA TO AZURE POSTGRESQL
📡 Connecting to Azure PostgreSQL...
   ✅ Connection successful!
📖 Reading SQL file: scripts/sanjeevani_finaldb.sql
   ✅ SQL file read (28,963 bytes)
⏳ Deploying schema to Azure...
----------------------------------------------------------------------
✅ Schema deployed successfully!
```

---

## STEP 2: Update Remaining Routes (8 files)

Each file needs this 1-line change in every database-using function:

### File 1: routes_medicine_history.py
```python
# Add import at top:
from app.core.rls_context import get_db_with_rls

# In each async def that uses db:
db = get_db_with_rls(db, user_id)  # Add this line after docstring
```

### File 2: routes_qa_history.py
```python
# Add import at top:
from app.core.rls_context import get_db_with_rls

# In each async def that uses db:
db = get_db_with_rls(db, user_id)
```

### File 3: routes_hospital_reports.py
```python
# Add import at top:
from app.core.rls_context import get_db_with_rls

# In each async def that uses db:
db = get_db_with_rls(db, user_id)
```

### File 4: routes_hospital_report_history.py
```python
# Add import at top:
from app.core.rls_context import get_db_with_rls

# In each async def that uses db:
db = get_db_with_rls(db, user_id)
```

### File 5: routes_appointments.py
```python
# Add import at top:
from app.core.rls_context import get_db_with_rls

# In each async def that uses db:
db = get_db_with_rls(db, user_id)
```

### File 6: routes_doctors.py
```python
# Add import at top:
from app.core.rls_context import get_db_with_rls

# In each async def that uses db:
db = get_db_with_rls(db, user_id)
```

### File 7: routes_handwritten_prescriptions.py
```python
# Add import at top:
from app.core.rls_context import get_db_with_rls

# In each async def that uses db:
db = get_db_with_rls(db, user_id)
```

### File 8: routes_medicine_identification.py
```python
# Add import at top:
from app.core.rls_context import get_db_with_rls

# In each async def that uses db:
db = get_db_with_rls(db, user_id)
```

---

## STEP 3: Test RLS Isolation

```bash
cd backend
python test_rls_isolation.py
```

**Expected Output**:
```
🧪 TESTING RLS ISOLATION - 2 USERS
1️⃣ Creating 2 test users...
   ✅ User1 created (ID: X)
   ✅ User2 created (ID: Y)

2️⃣ User1 creates prescriptions...
   ✅ User1 created 2 prescriptions

3️⃣ User2 creates prescriptions...
   ✅ User2 created 2 prescriptions

4️⃣ TEST: User1 queries prescriptions...
   ✅ PASS: User1 sees ONLY their 2 prescriptions

5️⃣ TEST: User2 queries prescriptions...
   ✅ PASS: User2 sees ONLY their 2 prescriptions

6️⃣ TEST: Cross-user isolation check...
   ✅ PASS: No data overlap between users

✅ ALL TESTS PASSED - RLS ISOLATION WORKING!
```

---

## Timeline Estimate

| Task | Time |
|------|------|
| Step 1: Deploy schema | 5-10 min |
| Step 2: Update 8 routes | 30-45 min |
| Step 3: Run tests | 2-5 min |
| **Total** | **~1 hour** |

---

## Verification Checklist

After completing all steps:

- [ ] Deploy script ran successfully
- [ ] All 8 routes updated with RLS import
- [ ] All routes have `db = get_db_with_rls(db, user_id)` line
- [ ] Test script passes all 6 tests
- [ ] Backend starts without errors
- [ ] 2 test users can login separately
- [ ] User1's data is invisible to User2
- [ ] User2's data is invisible to User1

---

## Quick Support

**Azure PostgreSQL Connection Issues?**
- Check firewall rules allow your IP
- Verify credentials in `.env`
- Test with: `python deploy_schema_azure.py`

**Routes not isolating data?**
- Verify import: `from app.core.rls_context import get_db_with_rls`
- Verify line: `db = get_db_with_rls(db, user_id)` in EACH function
- Check user_id parameter exists in function signature

**Test not running?**
- Ensure backend is not running
- Check Azure connectivity
- Verify User and Prescription models import correctly

---

## Commands Cheat Sheet

```bash
# Deploy schema
cd backend && python deploy_schema_azure.py

# Test isolation
cd backend && python test_rls_isolation.py

# Start backend
cd backend && uvicorn app.main:app --reload

# Check .env
cat .env | grep DATABASE_URL

# Clear test data (careful!)
# Run from PostgreSQL CLI:
# DELETE FROM users WHERE username IN ('testuser1', 'testuser2');
```

---

**Status**: 90% Ready
**ETA to 100%**: ~1 hour of work remaining
**Difficulty**: Low (copy-paste pattern)
**Testing**: Automated (test script provided)
