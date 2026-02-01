"""
Quick script to show which routes need RLS updates
"""

routes_needing_rls = [
    "routes_dashboard.py",
    "routes_medicine_history.py",
    "routes_prescriptions.py",
    "routes_reminders.py",
    "routes_qa_history.py",
    "routes_hospital_reports.py",
    "routes_hospital_report_history.py",
    "routes_appointments.py",
    "routes_doctors.py",
    "routes_handwritten_prescriptions.py",
    "routes_medicine_identification.py"
]

print("=" * 70)
print("ROUTES NEEDING RLS CONTEXT UPDATES")
print("=" * 70)
for i, route in enumerate(routes_needing_rls, 1):
    print(f"{i}. {route}")

print("\n" + "=" * 70)
print("UPDATE PATTERN FOR EACH ROUTE")
print("=" * 70)
print("""
STEP 1: Add import at the top
from app.core.rls_context import get_db_with_rls

STEP 2: In EACH async function that uses db.query or db.execute, add:
db = get_db_with_rls(db, user_id)  # Add this line after function starts

STEP 3: Then use db normally - RLS filters automatically

EXAMPLE:
@router.get("/api/example")
async def get_example(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db = get_db_with_rls(db, user_id)  # ✅ Add this line
    
    # Now all queries are isolated to this user
    result = db.query(MyModel).filter(MyModel.user_id == user_id).all()
    return result
""")
