"""
Enhanced LLM Medical Document Parser
Specialized for extracting complete structured data from medical documents
with focus on 80%+ accuracy
"""

import logging
import json
import re
from typing import Dict, Any, List
import time

logger = logging.getLogger(__name__)


class MedicalDocumentParser:
    """
    Parses medical documents with enhanced accuracy.
    Focuses on complete extraction of all relevant fields.
    """
    
    @staticmethod
    def parse_hospital_report_accurate(extracted_text: str, max_retries: int = 5, timeout: int = 120) -> Dict[str, Any]:
        """
        Parse hospital report with maximum accuracy.
        Allows more time for better results.
        """
        logger.info("🧠 HIGH ACCURACY MODE: Parsing hospital report with detailed extraction...")
        
        prompt = MedicalDocumentParser._create_hospital_report_prompt(extracted_text)
        
        try:
            from app.services.enhanced_medicine_llm_generator import EnhancedMedicineLLMGenerator
            
            # Call LLM with increased timeout for accuracy
            logger.info(f"📞 Calling LLM (timeout: {timeout}s, retries: {max_retries})...")
            response_text = EnhancedMedicineLLMGenerator._call_ollama_with_retry(
                prompt,
                max_retries=max_retries,
                timeout_base=timeout
            )
            
            if not response_text or len(response_text.strip()) < 50:
                logger.warning("⚠️ LLM returned empty or very short response, using fallback")
                return MedicalDocumentParser._parse_with_regex(extracted_text)
            
            logger.debug(f"📄 Raw LLM Response length: {len(response_text)} chars")
            logger.info(f"📄 LLM RESPONSE PREVIEW:\n{response_text[:800]}")
            
            # Try to extract and parse JSON
            parsed = MedicalDocumentParser._extract_json_safe(response_text)
            
            if parsed:
                logger.info(f"✅ Successfully parsed with {len(parsed.get('medicines', []))} medicines found")
                logger.info(f"📋 PARSED DATA: {list(parsed.keys())}")
                return parsed
            else:
                logger.warning("⚠️ JSON parsing failed, using regex-based fallback")
                return MedicalDocumentParser._parse_with_regex(extracted_text)
                
        except Exception as e:
            logger.error(f"❌ LLM parsing error: {e}")
            logger.info("📍 Falling back to regex-based parsing...")
            return MedicalDocumentParser._parse_with_regex(extracted_text)
    
    @staticmethod
    def parse_handwritten_prescription_accurate(extracted_text: str, max_retries: int = 5, timeout: int = 120) -> Dict[str, Any]:
        """
        Parse handwritten prescription with maximum accuracy.
        """
        logger.info("🧠 HIGH ACCURACY MODE: Parsing handwritten prescription...")
        
        prompt = MedicalDocumentParser._create_handwritten_prescription_prompt(extracted_text)
        
        try:
            from app.services.enhanced_medicine_llm_generator import EnhancedMedicineLLMGenerator
            
            response_text = EnhancedMedicineLLMGenerator._call_ollama_with_retry(
                prompt,
                max_retries=max_retries,
                timeout_base=timeout
            )
            
            if not response_text or len(response_text.strip()) < 50:
                logger.warning("⚠️ LLM returned empty response")
                return MedicalDocumentParser._parse_prescription_regex(extracted_text)
            
            parsed = MedicalDocumentParser._extract_json_safe(response_text)
            
            if parsed:
                logger.info(f"✅ Found {len(parsed.get('medicines', []))} medicines")
                return parsed
            else:
                return MedicalDocumentParser._parse_prescription_regex(extracted_text)
                
        except Exception as e:
            logger.error(f"❌ Handwritten prescription parsing error: {e}")
            return MedicalDocumentParser._parse_prescription_regex(extracted_text)
    
    @staticmethod
    def _create_hospital_report_prompt(extracted_text: str) -> str:
        """
        Create comprehensive prompt for hospital report parsing.
        Includes examples and strict formatting requirements.
        """
        prompt = f"""You are a MEDICAL DOCUMENT EXPERT with 20+ years of healthcare experience.
Your task is to extract EVERY piece of information from a hospital report and structure it carefully.

IMPORTANT: 
- Extract EXACTLY what you see in the document
- Do NOT make assumptions or add information not present
- For missing information, use null or empty string
- PRESERVE original names, numbers, and spellings
- Return ONLY valid JSON

HOSPITAL REPORT TEXT:
==================
{extracted_text[:2000]}
==================

CRITICAL TASK: Parse this hospital report completely and extract EVERY medicine mentioned.

MEDICINE EXTRACTION PRIORITY:
⚠️ MOST IMPORTANT: Find ALL medicines in the text, even if:
    - They appear after "Rx:", "R/", "Prescription:", "Medicines:", "Treatment:"
    - Listed with numbers (1., 2., 3.) or bullet points
    - Have dosage after name (e.g., "Paracetamol 500mg")
    - Abbreviated (Tab., Cap., Syp., Inj.)
    - Written in any section of the report

WHAT TO EXTRACT:
1. Hospital name, address, phone, email
2. Patient full name, ID, age, gender, contact  
3. Doctor name, specialization, registration number
4. Visit date, type, department, diagnosis
5. ALL symptoms and complaints
6. ⚠️ EVERY MEDICINE - look for:
    - Medicine names (generic or brand)
    - Dosage form (tablet, capsule, syrup, injection)
    - Strength (mg, ml, gm)
    - Frequency (OD/BD/TDS, once/twice/thrice daily, morning/evening)
    - Duration (days, weeks, "till next visit")
    - Instructions (after food, before sleep, etc)
7. ALL investigations/tests
8. Complete medical advice and follow-up

RETURN THIS EXACT JSON FORMAT:
{{
  "hospital_details": {{
    "name": "extracted hospital name or null",
    "address": "full address or null",
    "phone": "contact number or null",
    "email": "email or null"
  }},
  "patient_details": {{
    "name": "patient full name",
    "id": "patient ID/MR number or null",
    "age": "age in numbers or null",
    "gender": "Male/Female/Other or null",
    "contact": "phone number or null",
    "address": "address or null"
  }},
  "doctor_details": {{
    "name": "doctor full name",
    "specialization": "specialization or null",
    "registration_number": "registration/license number or null",
    "contact": "contact or null"
  }},
  "visit_details": {{
    "date": "visit date or null",
    "type": "OPD/IPD/Emergency/Follow-up or null",
    "department": "department name or null",
    "chief_complaint": "main complaint or null",
    "diagnosis": "final diagnosis or null",
    "symptoms": ["symptom 1", "symptom 2", "symptom 3"] (or empty if none)
  }},
  "medicines": [
    {{
      "name": "medicine name with strength (e.g., Amoxicillin 500mg)",
      "dosage": "e.g., 1 tablet or 5ml",
      "frequency": "e.g., twice daily / BD / TDS",
      "duration": "e.g., 7 days or 2 weeks",
      "timing": "e.g., after food, before sleep, morning",
      "instructions": "any special instructions or null",
      "route": "oral/injection/topical or null"
    }}
  ],
  "investigations": [
    {{
      "name": "test/investigation name",
      "result": "result if shown or null",
      "normal_range": "normal values or null"
    }}
  ],
  "medical_advice": {{
    "diet": "dietary restrictions or recommendations or null",
    "lifestyle": "activity level, rest needed, etc or null",
    "precautions": "things to avoid or be careful about or null",
    "follow_up": "when to return for follow-up or null",
    "emergency": "when to seek emergency care or null"
  }},
  "additional_information": "any other important details from report or null"
}}

VALIDATION CHECKLIST:
✓ All medicine names are exact from document
✓ Dosages and frequencies match document exactly
✓ No invented or assumed information
✓ Missing fields are null, not empty strings
✓ Valid JSON syntax (can be parsed by json.loads)

NOW PARSE THE REPORT AND RETURN ONLY THE JSON."""
        return prompt
    
    @staticmethod
    def _create_handwritten_prescription_prompt(extracted_text: str) -> str:
        """
        Create comprehensive prompt for handwritten prescription parsing.
        """
        prompt = f"""You are a PHARMACY EXPERT specializing in prescription reading.
Your task is to extract EVERY medicine from a handwritten prescription accurately.

PRESCRIPTION TEXT:
==================
{extracted_text[:1500]}
==================

TASK: Extract ALL medicines mentioned. For each medicine, get:
1. Complete medicine name (including strength if written)
2. Dosage (amount per dose: e.g., 1 tablet, 5ml, 250mg)
3. Frequency (how often: BD, TDS, OD, Thrice daily, etc)
4. Duration (how long: 7 days, 1 week, 10 tablets, etc)
5. Timing (when to take: after food, before bed, morning, etc)
6. Special instructions if any

RETURN THIS EXACT JSON:
{{
  "patient_name": "name if written or null",
  "doctor_name": "doctor name if visible or null",
  "prescription_date": "date if visible or null",
  "medicines": [
    {{
      "name": "EXACT medicine name as written",
      "strength": "strength/dosage strength if written (e.g., 500mg) or null",
      "dosage": "amount per dose (e.g., 1 tablet, 5ml)",
      "frequency": "how often (e.g., BD, TDS, twice daily)",
      "duration": "how long (e.g., 7 days, 1 week, 10 tablets)",
      "timing": "when (e.g., after food, with water, morning) or null",
      "instructions": "any special instructions or null"
    }}
  ],
  "additional_notes": "any other information from prescription or null"
}}

CRITICAL RULES:
- Extract names EXACTLY as written (preserve spelling)
- Do NOT add information not on prescription
- If unclear, put in instructions field
- Return ONLY valid JSON
- medicines array MUST contain all medicines found

NOW PARSE AND RETURN ONLY THE JSON."""
        return prompt
    
    @staticmethod
    def _extract_json_safe(text: str) -> Dict[str, Any]:
        """
        Safely extract and parse JSON from LLM response.
        Handles various formats and errors.
        """
        try:
            # Try direct parsing first
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Try to extract JSON from text
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            try:
                json_str = json_match.group(0)
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass
        
        # Try to fix common JSON issues
        try:
            # Remove markdown formatting
            cleaned = re.sub(r'```json\n?', '', text)
            cleaned = re.sub(r'```\n?', '', cleaned)
            
            # Find first { and last }
            start = cleaned.find('{')
            end = cleaned.rfind('}') + 1
            if start >= 0 and end > start:
                json_str = cleaned[start:end]
                return json.loads(json_str)
        except:
            pass
        
        logger.warning("⚠️ Could not extract valid JSON from LLM response")
        return None
    
    @staticmethod
    def _parse_with_regex(text: str) -> Dict[str, Any]:
        """
        Fallback regex-based parsing for hospital reports.
        Extracts medicines and key information.
        """
        logger.info("🔍 Using regex-based extraction (fallback)...")
        
        medicines = MedicalDocumentParser._extract_medicines_regex(text)
        
        return {
            "hospital_details": {"name": "", "address": "", "phone": "", "email": ""},
            "patient_details": {"name": "", "age": "", "gender": "", "contact": ""},
            "doctor_details": {"name": "", "specialization": "", "registration_number": ""},
            "visit_details": {"date": "", "diagnosis": "", "symptoms": []},
            "medicines": medicines,
            "investigations": [],
            "medical_advice": {"diet": "", "lifestyle": "", "precautions": "", "follow_up": ""},
            "additional_information": "Extracted via regex fallback - some fields may be incomplete"
        }
    
    @staticmethod
    def _parse_prescription_regex(text: str) -> Dict[str, Any]:
        """Fallback regex parsing for prescriptions."""
        medicines = MedicalDocumentParser._extract_medicines_regex(text)
        return {
            "medicines": medicines,
            "additional_notes": "Extracted via regex fallback"
        }
    
    @staticmethod
    def _extract_medicines_regex(text: str) -> List[Dict[str, str]]:
        """
        Extract medicines from text using regex patterns.
        Looks for common pharmaceutical formats.
        """
        medicines = []
        
        # Common medicine name patterns
        medicine_patterns = [
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(\d+\s*(?:mg|ml|gm|IU|mcg))',  # Name + strength
            r'1\.\s*([A-Z][a-z]+.*?)\s*[-–]\s*(\d+.*?)(?:\n|$)',  # Numbered format
            r'^([A-Z][a-z]+.*?)\s+(\d+.*?)$',  # Line-by-line format
        ]
        
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line or len(line) < 5:
                continue
            
            for pattern in medicine_patterns:
                matches = re.findall(pattern, line)
                if matches:
                    for match in matches:
                        medicines.append({
                            "name": match[0] if len(match) > 0 else "",
                            "dosage": match[1] if len(match) > 1 else "",
                            "frequency": "",
                            "duration": "",
                            "timing": "",
                            "instructions": ""
                        })
                    break
        
        return medicines
