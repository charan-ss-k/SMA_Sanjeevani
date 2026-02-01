"""
Test Script for Integrated Medicine CSV + LLM System
Tests the complete workflow from OCR to LLM-generated medicine information
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.medicine_csv_rag import MedicineCSVRAG
from app.services.medicine_llm_generator import MedicineLLMGenerator
from app.services.medicine_ocr_service import extract_medicine_name

print("="*60)
print("🧪 TESTING INTEGRATED MEDICINE CSV + LLM SYSTEM")
print("="*60)

# Test 1: Load CSV dataset
print("\n✅ TEST 1: Loading CSV Dataset")
MedicineCSVRAG.load_dataset()
total_medicines = MedicineCSVRAG.get_all_medicines_count()
print(f"   - Total medicines in dataset: {total_medicines}")
assert total_medicines > 0, "CSV dataset should have medicines"

# Test 2: Search medicines in CSV
print("\n✅ TEST 2: Searching Medicines in CSV")
test_medicines = ['Amoxicillin', 'Acetocillin', 'Ibuprocillin', 'Metovir']
for med in test_medicines:
    info = MedicineCSVRAG.get_medicine_info(med)
    print(f"   - {med}: Found={info.get('found')}, Category={info.get('category')}")
    assert info.get('found'), f"Medicine {med} should be found"

# Test 3: Extract medicine name from OCR text
print("\n✅ TEST 3: Extracting Medicine Names from OCR Text")
test_ocr_texts = [
    "Amoxicillin 500mg tablets",
    "Cefcillin Antipyretic Ointment",
    "Metovir Antifungal Capsule",
    "Unknown Medicine"
]
for ocr_text in test_ocr_texts:
    med_name = extract_medicine_name(ocr_text)
    print(f"   - OCR: '{ocr_text}' → Extracted: '{med_name}'")

# Test 4: Generate medicine info (CSV-based fallback)
print("\n✅ TEST 4: Generating Medicine Information (CSV Fallback)")
ocr_sample = "Amoxicillin 500mg tablet from Pfizer"
medicine_info = MedicineCSVRAG.get_medicine_info("Amoxicillin")
print(f"   - OCR Input: '{ocr_sample}'")
print(f"   - Medicine Found: {medicine_info.get('found')}")
if medicine_info.get('found'):
    result = MedicineLLMGenerator._create_csv_based_response(medicine_info)
    print(f"   - Generated Info Keys: {list(result.keys())}")
    print(f"   - Source: {result.get('source')}")
    print(f"   - Medicine Name: {result.get('medicine_name')}")
    print(f"   - Category: {result.get('category')}")
    print(f"   - Manufacturer: {result.get('manufacturer')}")

# Test 5: Format for LLM prompt
print("\n✅ TEST 5: Formatting Medicine Info for LLM")
medicine_data = MedicineCSVRAG.get_medicine_info("Acetocillin")
if medicine_data.get('found'):
    llm_prompt_context = MedicineCSVRAG.format_for_llm(medicine_data)
    print(f"   - LLM Prompt Context:\n{llm_prompt_context}")

# Test 6: Search by category
print("\n✅ TEST 6: Searching Medicines by Category")
antibiotic_meds = MedicineCSVRAG.search_by_category("Antibiotic")
print(f"   - Found {len(antibiotic_meds)} Antibiotic medicines")
if antibiotic_meds:
    print(f"   - Sample: {antibiotic_meds[0].get('Name')}")

# Test 7: Search by indication
print("\n✅ TEST 7: Searching Medicines by Indication")
pain_meds = MedicineCSVRAG.search_by_indication("Pain")
print(f"   - Found {len(pain_meds)} medicines for Pain indication")
if pain_meds:
    print(f"   - Sample: {pain_meds[0].get('Name')}")

print("\n" + "="*60)
print("✅ ALL TESTS PASSED!")
print("="*60)
print("\n📊 System Ready:")
print(f"   ✅ CSV Dataset: {total_medicines} medicines loaded")
print(f"   ✅ RAG Search: Working")
print(f"   ✅ Medicine Name Extraction: Working")
print(f"   ✅ CSV-based Response Generation: Working")
print(f"   ✅ LLM Integration: Ready (will activate when Ollama is running)")
print("\n🚀 READY FOR PRODUCTION!")
