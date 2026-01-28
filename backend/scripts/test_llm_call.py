import json
import sys

# Ensure backend path is on sys.path when running directly
import os
backend_path = os.path.join(os.path.dirname(__file__), '..')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.services.enhanced_medicine_llm_generator import EnhancedMedicineLLMGenerator

ocr_text = "DR Best Paracetamol 250 Oral Suspension - sample OCR"
medicine_info = {
    'name': 'DR Best Paracetamol 250 Oral Suspension',
    'found': True,
    'composition': ['Paracetamol 250mg/5ml'],
    'manufacturer': 'DR Best'
}

result = EnhancedMedicineLLMGenerator.generate_comprehensive_info(ocr_text, medicine_info)
print(json.dumps(result, indent=2, ensure_ascii=False))
