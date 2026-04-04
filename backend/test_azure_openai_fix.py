"""
Test Azure OpenAI Integration for Hospital Report Analysis
Tests the complete flow: OCR → LLM Parsing → Structured Output
"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Set environment to use Azure OpenAI
os.environ['LLM_PROVIDER'] = 'azure_openai'
os.environ['LLM_TEMPERATURE'] = '0.1'
os.environ['LLM_MAX_TOKENS'] = '4096'

from app.services.medical_document_parser import MedicalDocumentParser

# Sample prescription text (as extracted by OCR)
sample_prescription_text = """SMS hospital
Dr Akshara
B/503 Business Center; MG Road; Pune
MS:
Reg: No: MMC 2018
411000
Timing: Ph: 5465647658
09.00 AM - 01.00 PM, 06.00 PM - 08.00 PM
Closed: Sunday
Date: 30-Aug-2023

OPD6 PATIENT (M)
ID: 11
13 Y
Mob No : 9423380390
Address: PUNE
Weight (Kg): 80
Height (Cm): 200 (B.MI: 20.00) , BP: 120/80 mmHg

Clinical Findings
Chief Complaints
FEVER WITH CHILLS (4 DAYS)
HEADACHE (2 DAYS)

Diagnosis:
MALARIA

Medicine Name    Dosage    Duration
1) TAB. ABCIXIMAB    Morning    8 Days (Tot:8 Tab)
2) TAB. VOMILAST    Night    Morning Days (After Food) (Tot:16 Tab)
   DOXYLAMINE 10MG
   PYRIDOXINE 10 MG
   FOLIC ACID 2.5 MG
3) CAP. ZOCLAR 500    Morning    3 Days (Tot:3 Cap)
   CLARITHROMYCIN 500MG
4) TAB. GESTAKIND 10/SR    Night    Days (Tot:4 Tab)
   ISOXSUPRINE 10 MG

Advice:
TAKE BED REST
DO NOT EAT OUTSIDE FOOD
EAT EASY TO DIGEST FOOD LIKE BOILED RICE WITH DAAL

Follow Up: 04-09-2023
Substitute with equivalent Generics as required
"""

print("=" * 80)
print("🧪 TESTING AZURE OPENAI INTEGRATION")
print("=" * 80)

print("\n📋 Sample Prescription Text:")
print(sample_prescription_text[:300] + "...\n")

print("🔄 Parsing with Azure OpenAI Phi-4...")
print("-" * 80)

try:
    result = MedicalDocumentParser.parse_hospital_report_accurate(
        sample_prescription_text,
        max_retries=3,
        timeout=120
    )
    
    print("\n✅ PARSING SUCCESSFUL!")
    print("=" * 80)
    
    # Display results
    print("\n🏥 HOSPITAL DETAILS:")
    hospital = result.get('hospital_details', {})
    for key, value in hospital.items():
        if value:
            print(f"  • {key}: {value}")
    
    print("\n👨‍⚕️ DOCTOR DETAILS:")
    doctor = result.get('doctor_details', {})
    for key, value in doctor.items():
        if value:
            print(f"  • {key}: {value}")
    
    print("\n🧑‍⚕️ PATIENT DETAILS:")
    patient = result.get('patient_details', {})
    for key, value in patient.items():
        if value:
            print(f"  • {key}: {value}")
    
    print("\n🩺 CLINICAL DETAILS:")
    clinical = result.get('clinical_details', {})
    for key, value in clinical.items():
        if value:
            if isinstance(value, list):
                print(f"  • {key}:")
                for item in value:
                    print(f"    - {item}")
            else:
                print(f"  • {key}: {value}")
    
    print("\n💊 MEDICINES:")
    medicines = result.get('medicines', [])
    print(f"  📊 Total medicines found: {len(medicines)}")
    print()
    
    for idx, med in enumerate(medicines, 1):
        print(f"  {idx}. {med.get('name', 'Unknown')}")
        print(f"     • Type: {med.get('medicine_type', 'N/A')}")
        print(f"     • Strength: {med.get('strength', 'N/A')}")
        print(f"     • Dosage: {med.get('dosage', 'N/A')}")
        print(f"     • Timing: {med.get('timing', 'N/A')}")
        print(f"     • Frequency: {med.get('frequency', 'N/A')}")
        print(f"     • Duration: {med.get('duration', 'N/A')}")
        if med.get('composition'):
            print(f"     • Composition: {med.get('composition')}")
        print()
    
    print("\n💡 MEDICAL ADVICE:")
    advice = result.get('medical_advice', {})
    if advice.get('advice'):
        print("  Advice:")
        for item in advice.get('advice', []):
            print(f"    • {item}")
    if advice.get('follow_up_date'):
        print(f"  Follow-up Date: {advice.get('follow_up_date')}")
    
    # Validation
    print("\n" + "=" * 80)
    print("📊 VALIDATION:")
    print(f"  ✓ Expected 4 medicines - Found: {len(medicines)}")
    
    expected_medicines = ['ABCIXIMAB', 'VOMILAST', 'ZOCLAR', 'GESTAKIND']
    found_medicines = [m.get('name', '') for m in medicines]
    
    for expected in expected_medicines:
        found = any(expected in name for name in found_medicines)
        status = "✅" if found else "❌"
        print(f"  {status} {expected}: {'Found' if found else 'NOT FOUND'}")
    
    # Check for false positives
    false_positives = []
    for med in medicines:
        name = med.get('name', '').upper()
        if any(label in name for label in ['MMC', 'PHONE', 'DATE', 'WEIGHT', 'HEIGHT', 'FOLLOW UP']):
            false_positives.append(name)
    
    if false_positives:
        print(f"\n  ❌ FALSE POSITIVES DETECTED:")
        for fp in false_positives:
            print(f"     • {fp}")
    else:
        print(f"\n  ✅ NO FALSE POSITIVES")
    
    print("\n" + "=" * 80)
    if len(medicines) == 4 and not false_positives:
        print("🎉 TEST PASSED! All medicines correctly identified!")
    else:
        print("⚠️ TEST NEEDS REVIEW - Check results above")
    print("=" * 80)

except Exception as e:
    print(f"\n❌ ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    print("\n💡 TIP: Make sure Azure OpenAI credentials are set in .env_cloud")
    print("   Check AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY")
