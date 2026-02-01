"""
Simple debug script to understand datetime comparison without SQLAlchemy dependencies
"""
from datetime import datetime

print("=== DATETIME DEBUGGING ===")
print(f"Current time (datetime.now()): {datetime.now()}")
print(f"Current time type: {type(datetime.now())}")
print(f"Current time timezone: {datetime.now().tzinfo}")

# Test some sample dates - using 2026 since system is in 2026
test_dates = [
    "2026-01-31 22:00",  # Today but later
    "2026-02-01 10:00",  # Tomorrow
    "2026-01-30 15:00",  # Yesterday  
    "2026-02-15 16:00",  # Future date
    "2024-12-25 16:00",  # Past date from 2024
]

current = datetime.now()
print(f"\n=== COMPARISON TESTS ===")
for date_str in test_dates:
    test_date = datetime.strptime(date_str, "%Y-%m-%d %H:%M")
    is_future = test_date > current
    time_diff = test_date - current
    
    print(f"Date: {test_date}")
    print(f"  Is future: {is_future}")
    print(f"  Time diff: {time_diff}")
    print(f"  Diff seconds: {time_diff.total_seconds()}")
    print()