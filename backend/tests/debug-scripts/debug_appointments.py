"""
Quick test to check what's actually stored in the database
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from datetime import datetime
from app.database.database import get_db
from app.models.models import Appointment

# Create database session
db = next(get_db())

# Get all appointments
appointments = db.query(Appointment).all()

print(f"Found {len(appointments)} total appointments")
print("\nDetailed appointment analysis:")

current_time = datetime.now()
print(f"Current time: {current_time}")

for apt in appointments:
    print(f"\n=== Appointment {apt.id} ===")
    print(f"Status: {apt.status}")
    print(f"Stored datetime: {apt.appointment_date}")
    print(f"Display time: {apt.appointment_time}")
    print(f"Type: {type(apt.appointment_date)}")
    print(f"Timezone: {apt.appointment_date.tzinfo}")
    
    # Compare times
    is_future = apt.appointment_date > current_time
    time_diff = apt.appointment_date - current_time
    
    print(f"Is future: {is_future}")
    print(f"Time difference: {time_diff}")
    print(f"Hours until: {time_diff.total_seconds() / 3600:.2f}")

print(f"\nAppointments that should be upcoming:")
upcoming = [apt for apt in appointments if apt.status == "scheduled" and apt.appointment_date > current_time]
print(f"Count: {len(upcoming)}")

print(f"\nAppointments that should be in history:")
past = [apt for apt in appointments if apt.status != "scheduled" or apt.appointment_date <= current_time]
print(f"Count: {len(past)}")