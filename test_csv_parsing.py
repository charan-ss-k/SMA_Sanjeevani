#!/usr/bin/env python
import csv

csv_path = r"backend\indian_doctors_dataset (1).csv"

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Total doctors: {len(rows)}")
print("\nColumn names:")
for key in rows[0].keys():
    print(f"  - {key}")

# Extract unique states
states = set()
cities = set()
localities = set()
specializations = set()
native_languages = set()

for row in rows:
    area_city_state = row.get('Area / City & State', '').strip()
    if ',' in area_city_state:
        parts = area_city_state.split(',')
        city = parts[0].strip()
        state = parts[1].strip() if len(parts) > 1 else ""
        cities.add(city)
        states.add(state)
    
    locality = row.get('Locality', '').strip()
    if locality:
        localities.add(locality)
    
    spec = row.get('Specialization', '').strip()
    if spec:
        specializations.add(spec)
        
    native_lang = row.get('Native Language', '').strip()
    if native_lang:
        native_languages.add(native_lang)

print(f"\n✅ EXTRACTED OPTIONS:")
print(f"\nUnique States ({len(states)}): {sorted(states)}")
print(f"\nUnique Cities ({len(cities)}): {sorted(cities)}")
print(f"\nUnique Localities ({len(localities)}): {sorted(localities)}")
print(f"\nUnique Specializations ({len(specializations)}): {sorted(specializations)}")
print(f"\nUnique Native Languages ({len(native_languages)}): {sorted(native_languages)}")
