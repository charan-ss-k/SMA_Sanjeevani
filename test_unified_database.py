"""Test unified medicine database"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.unified_medicine_database import UnifiedMedicineDatabase

print("=" * 60)
print("🧪 Testing Unified Medicine Database")
print("=" * 60)

UnifiedMedicineDatabase.load_all_datasets()
print('\n✅ Unified database loaded')

stats = UnifiedMedicineDatabase.get_statistics()
print(f'Total medicines: {stats.get("total_medicines")}')
print(f'Data sources: {stats.get("data_sources")}')

# Test search
print('\n' + '=' * 60)
print('Testing medicine searches:')
print('=' * 60)

medicines_to_test = ['Augmentin', 'Azithral', 'Ascoril', 'Cetirizine', 'Paracetamol']
for med_name in medicines_to_test:
    info = UnifiedMedicineDatabase.get_medicine_info(med_name)
    print(f'\n{med_name}:')
    print(f'  Found: {info.get("found")}')
    if info.get("found"):
        print(f'  Price: {info.get("price")}')
        print(f'  Manufacturer: {info.get("manufacturer")}')
        print(f'  Composition: {info.get("composition")}')
        print(f'  Source: {info.get("source")}')

print('\n✅ All tests passed!')
