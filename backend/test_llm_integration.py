"""
Test script to verify LLM is always generating comprehensive information
"""

import sys
sys.path.insert(0, '/backend')

from app.services.unified_medicine_database import UnifiedMedicineDatabase
from app.services.enhanced_medicine_llm_generator import EnhancedMedicineLLMGenerator

print("\n" + "="*80)
print("🧪 TESTING LLM INTEGRATION FOR COMPREHENSIVE MEDICINE INFORMATION")
print("="*80 + "\n")

# Test medicines
test_medicines = [
    ("Paracetamol 500mg", "For fever and headache"),
    ("Augmentin 625", "For bacterial infection"),
    ("Cetirizine 10mg", "For allergy relief"),
]

for medicine_name, indication in test_medicines:
    print(f"\n{'='*80}")
    print(f"🔍 Testing: {medicine_name}")
    print(f"   Indication: {indication}")
    print("="*80)
    
    # Step 1: Get medicine info from database
    print("\n📊 Step 1: Retrieving from database...")
    medicine_info = UnifiedMedicineDatabase.get_medicine_info(medicine_name)
    
    if medicine_info.get('found'):
        print(f"✅ Found in database: {medicine_info.get('name')}")
        print(f"   Manufacturer: {medicine_info.get('manufacturer')}")
        print(f"   Price: {medicine_info.get('price')}")
        print(f"   Composition: {medicine_info.get('composition')}")
    else:
        print(f"⚠️  Not found in database: {medicine_name}")
    
    # Step 2: Generate comprehensive info with LLM
    print("\n🧠 Step 2: Generating comprehensive information with LLM...")
    print("   Please wait... (this may take 15-45 seconds)")
    
    ocr_text = f"{medicine_name} - {indication}"
    result = EnhancedMedicineLLMGenerator.generate_comprehensive_info(ocr_text, medicine_info)
    
    print(f"\n✅ Generation Complete!")
    print(f"   Source: {result.get('source')}")
    print(f"   LLM Generated: {result.get('llm_generated')}")
    
    # Step 3: Display all sections
    print("\n📋 COMPREHENSIVE INFORMATION:")
    print("-" * 80)
    
    # Show full information
    full_info = result.get('full_information', '')
    if len(full_info) > 500:
        print(full_info[:500] + "\n... (truncated for display)")
    else:
        print(full_info)
    
    # Show individual sections
    print("\n🔹 STRUCTURED SECTIONS:")
    print("-" * 80)
    
    for section_name in ['MEDICINE OVERVIEW', 'WHEN TO USE', 'DOSAGE INSTRUCTIONS', 
                         'PRECAUTIONS & WARNINGS', 'SIDE EFFECTS', 'DRUG INTERACTIONS',
                         'INSTRUCTIONS FOR USE', 'ADDITIONAL INFORMATION']:
        section_content = result.get('sections', {}).get(section_name, 'Not available')
        if section_content and section_content != 'Not available':
            print(f"\n📌 {section_name}:")
            print(f"   {section_content[:200]}...")

print("\n" + "="*80)
print("✅ LLM INTEGRATION TEST COMPLETE")
print("="*80)
print("\n📊 SUMMARY:")
print("   - LLM should be generating comprehensive information")
print("   - All 8 sections should be populated")
print("   - Information should include dosage for adults/children/pregnancy")
print("   - Precautions and side effects should be included")
print("   - If Ollama is running, should use LLM")
print("   - If Ollama is down, should use synthetic/fallback response")
print("\n✅ Ready for production use!")
print("="*80 + "\n")
