"""
Auto-update routes with RLS context - Run this to add RLS to remaining routes
"""

import os
import re

routes_to_update = [
    "routes_medicine_history.py",
    "routes_reminders.py",
    "routes_qa_history.py",
    "routes_hospital_reports.py",
    "routes_hospital_report_history.py",
    "routes_appointments.py",
    "routes_doctors.py",
    "routes_handwritten_prescriptions.py",
    "routes_medicine_identification.py"
]

route_dir = "backend/app/api/routes"

def add_rls_import(content):
    """Add RLS import to file"""
    if "from app.core.rls_context import get_db_with_rls" in content:
        return content  # Already added
    
    # Find the database import and add RLS import after it
    content = content.replace(
        "from app.core.database import get_db",
        "from app.core.database import get_db\nfrom app.core.rls_context import get_db_with_rls"
    )
    return content

def add_rls_context_to_functions(content):
    """Add RLS context to async functions that use db"""
    
    # Pattern to match async function definitions with user_id and db parameters
    pattern = r'(async def \w+\([^)]*user.*?db: Session = Depends\(get_db\)[^)]*\):\s*"""[^"]*""")'
    
    def replace_func(match):
        func_def = match.group(1)
        # Add RLS context after docstring
        rls_line = '\n    \n    # ✅ Set RLS context for per-user isolation\n    db = get_db_with_rls(db, user)'
        return func_def + rls_line
    
    content = re.sub(pattern, replace_func, content, flags=re.DOTALL)
    return content

print("=" * 70)
print("AUTO-UPDATE ROUTES WITH RLS CONTEXT")
print("=" * 70)
print("\nScanning routes for update...\n")

updated_count = 0
for route_file in routes_to_update:
    file_path = os.path.join(route_dir, route_file)
    
    if not os.path.exists(file_path):
        print(f"⚠️  {route_file} - NOT FOUND")
        continue
    
    with open(file_path, 'r') as f:
        original_content = f.read()
    
    # Check if already updated
    if "from app.core.rls_context import get_db_with_rls" in original_content:
        print(f"✅ {route_file} - ALREADY UPDATED")
        continue
    
    updated_content = add_rls_import(original_content)
    updated_content = add_rls_context_to_functions(updated_content)
    
    if updated_content != original_content:
        # Write back
        try:
            with open(file_path, 'w') as f:
                f.write(updated_content)
            print(f"✅ {route_file} - UPDATED")
            updated_count += 1
        except Exception as e:
            print(f"❌ {route_file} - ERROR: {e}")
    else:
        print(f"⚠️  {route_file} - NO CHANGES MADE (check function signatures)")

print(f"\n{updated_count} files updated successfully!")
print("\n📝 MANUAL VERIFICATION REQUIRED:")
print("   1. Review each updated file to ensure RLS context was added correctly")
print("   2. Look for: db = get_db_with_rls(db, user)")
print("   3. Test each route with 2 different users")
