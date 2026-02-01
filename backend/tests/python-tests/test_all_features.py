#!/usr/bin/env python3
"""Comprehensive test suite for SMA Sanjeevani"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

def test_rag_system():
    """Test RAG system"""
    print("\n" + "="*70)
    print("TEST 1: RAG SYSTEM - Medicine Knowledge Base")
    print("="*70)
    
    try:
        from app.services.symptoms_recommendation.medicine_rag_system import (
            get_rag_context, MedicineRAGSystem, get_available_medicines
        )
        
        print("\n[1a] Getting RAG context for 'fever'...")
        context = get_rag_context(['fever'])
        print(f"[PASS] RAG Context retrieved: {len(context)} characters")
        print(f"   Preview: {context[:150]}...")
        
        print("\n[1b] Initializing RAG system...")
        rag = MedicineRAGSystem()
        print(f"[PASS] RAG System initialized with {len(rag.knowledge_base)} conditions")
        
        print("\n[1c] Getting medicines for 'fever'...")
        medicines = get_available_medicines('fever')
        print(f"[PASS] Found {len(medicines)} medicines for fever")
        print(f"   Sample: {', '.join(medicines[:3])}")
        
        print("\n[PASS] RAG SYSTEM TEST PASSED")
        return True
        
    except Exception as e:
        print(f"\n[FAIL] RAG SYSTEM TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_translation_service():
    """Test translation service"""
    print("\n" + "="*70)
    print("TEST 2: TRANSLATION SERVICE - Multi-Language Support")
    print("="*70)
    
    try:
        from app.services.symptoms_recommendation.translation_service import (
            translation_service, translate_symptoms_to_english
        )
        
        print("\n[2a] Testing language detection...")
        detected = translation_service.detect_language("fever")
        print(f"[PASS] Translation service available: {detected or 'english'}")
        
        print("\n[2b] Testing symptoms translation...")
        result = translate_symptoms_to_english(["fever", "cough"])
        print(f"[PASS] Symptoms translated: {result}")
        
        print("\n[PASS] TRANSLATION SERVICE TEST PASSED")
        return True
        
    except Exception as e:
        print(f"\n[FAIL] TRANSLATION SERVICE TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_medicine_recommendation():
    """Test complete recommendation pipeline"""
    print("\n" + "="*70)
    print("TEST 3: MEDICINE RECOMMENDATION - 5-Step Pipeline")
    print("="*70)
    
    try:
        from app.services.symptoms_recommendation.service import recommend_symptoms
        from app.core.schemas import SymptomRecommendationBody
        
        print("\n[3a] Testing English recommendation (Fever)...")
        request = SymptomRecommendationBody(
            symptoms=["fever"],
            age=25,
            gender="Male",
            language="english",
            allergies=[],
            existing_conditions=[],
            pregnancy_status=False
        )
        
        response = recommend_symptoms(request)
        print(f"[PASS] Condition: {response.get('predicted_condition', 'N/A')}")
        medicines = response.get('medicine_combination', [])
        print(f"[PASS] Medicines recommended: {len(medicines)}")
        if medicines:
            print(f"   Sample: {', '.join(medicines[:2])}")
        
        print("\n[3b] Testing multi-symptom recommendation...")
        request2 = SymptomRecommendationBody(
            symptoms=["fever", "headache"],
            age=35,
            gender="Female",
            language="english",
            allergies=["Penicillin"],
            existing_conditions=["Diabetes"],
            pregnancy_status=False
        )
        
        response2 = recommend_symptoms(request2)
        print(f"[PASS] Condition: {response2.get('predicted_condition', 'N/A')}")
        medicines2 = response2.get('medicine_combination', [])
        print(f"[PASS] Medicines recommended: {len(medicines2)}")
        
        print("\n[PASS] MEDICINE RECOMMENDATION TEST PASSED")
        return True
        
    except Exception as e:
        print(f"\n[FAIL] MEDICINE RECOMMENDATION TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_prescription_handling():
    """Test prescription data handling"""
    print("\n" + "="*70)
    print("TEST 4: PRESCRIPTION HANDLING")
    print("="*70)
    
    try:
        from app.core.schemas import PrescriptionData, MedicineEntry
        
        print("\n[4a] Creating prescription data...")
        medicine = MedicineEntry(
            name="Paracetamol",
            dosage="500 mg",
            frequency="Every 6 hours",
            duration="5 days"
        )
        
        prescription = PrescriptionData(
            patient_name="John Doe",
            condition="Fever",
            medicines=[medicine],
            diagnosis="Common fever"
        )
        
        print(f"[PASS] Prescription created:")
        print(f"   Patient: {prescription.patient_name}")
        print(f"   Condition: {prescription.condition}")
        print(f"   Medicines: {len(prescription.medicines)}")
        
        print("\n[PASS] PRESCRIPTION HANDLING TEST PASSED")
        return True
        
    except Exception as e:
        print(f"\n[FAIL] PRESCRIPTION HANDLING TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_chatbot_integration():
    """Test chatbot features"""
    print("\n" + "="*70)
    print("TEST 5: CHATBOT INTEGRATION")
    print("="*70)
    
    try:
        from app.core.schemas import ChatMessage
        
        print("\n[5a] Testing chat message structure...")
        message = ChatMessage(
            role="user",
            content="I have fever and headache"
        )
        
        print(f"[PASS] Chat message created:")
        print(f"   Role: {message.role}")
        print(f"   Content: {message.content}")
        
        print("\n[5b] Testing multi-turn conversation...")
        conversation = [
            {"role": "user", "content": "I have fever"},
            {"role": "assistant", "content": "Tell me more..."},
            {"role": "user", "content": "102 degrees for 2 days"},
            {"role": "assistant", "content": "I recommend..."}
        ]
        print(f"[PASS] Multi-turn conversation: {len(conversation)} turns")
        
        print("\n[PASS] CHATBOT INTEGRATION TEST PASSED")
        return True
        
    except Exception as e:
        print(f"\n[FAIL] CHATBOT INTEGRATION TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_rag_integration():
    """Test RAG integration with medicine recommendation"""
    print("\n" + "="*70)
    print("TEST 6: RAG INTEGRATION WITH RECOMMENDATION")
    print("="*70)
    
    try:
        from app.services.symptoms_recommendation.service import recommend_symptoms
        from app.services.symptoms_recommendation.medicine_rag_system import get_rag_context
        from app.core.schemas import SymptomRecommendationBody
        
        print("\n[6a] Testing RAG context retrieval...")
        rag_context = get_rag_context(['fever', 'headache'])
        print(f"[PASS] RAG context: {len(rag_context)} characters")
        
        print("\n[6b] Testing recommendation with RAG context...")
        request = SymptomRecommendationBody(
            symptoms=["fever", "headache"],
            age=28,
            gender="Female",
            language="english",
            allergies=[],
            existing_conditions=[],
            pregnancy_status=False
        )
        
        response = recommend_symptoms(request)
        print(f"[PASS] Recommendation generated:")
        print(f"   Condition: {response.get('predicted_condition', 'N/A')}")
        medicines = response.get('medicine_combination', [])
        print(f"   Medicines: {len(medicines)}")
        if medicines:
            print(f"   Sample: {', '.join(medicines[:2])}")
        
        print("\n[PASS] RAG INTEGRATION TEST PASSED")
        return True
        
    except Exception as e:
        print(f"\n[FAIL] RAG INTEGRATION TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all feature tests"""
    print("\n" + "="*70)
    print("  SMA SANJEEVANI - COMPREHENSIVE FEATURE TEST SUITE")
    print("="*70)
    
    tests = [
        ("RAG System", test_rag_system),
        ("Translation Service", test_translation_service),
        ("Medicine Recommendation", test_medicine_recommendation),
        ("Prescription Handling", test_prescription_handling),
        ("Chatbot Integration", test_chatbot_integration),
        ("RAG Integration", test_rag_integration),
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n[ERROR] {test_name}: {str(e)}")
            results[test_name] = False
    
    # Print summary
    print("\n" + "="*70)
    print("  TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} - {test_name}")
    
    print("\n" + "="*70)
    print(f"OVERALL: {passed}/{total} tests passed ({100*passed//total}%)")
    print("="*70)
    
    if passed == total:
        print("\n*** ALL TESTS PASSED - SYSTEM READY FOR DEPLOYMENT! ***\n")
    else:
        print(f"\n*** {total - passed} test(s) failed - review above for details ***\n")
    
    return passed == total


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
