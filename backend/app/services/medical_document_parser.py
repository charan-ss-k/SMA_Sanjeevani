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
            response_text = EnhancedMedicineLLMGenerator._call_llm_with_retry(
                prompt,
                max_retries=max_retries,
                timeout_base=timeout
            )
            
            if not response_text or len(response_text.strip()) < 50:
                logger.warning("⚠️ LLM returned empty or very short response, using fallback")
                return MedicalDocumentParser._parse_with_regex(extracted_text)
            
            logger.info(f"✅ LLM Response received: {len(response_text)} chars")
            logger.info(f"📄 LLM RESPONSE PREVIEW:\n{response_text[:1000]}...")
            logger.info(f"📄 LLM RESPONSE END:\n...{response_text[-500:]}")
            logger.info(f"📄 LLM RESPONSE END:\n...{response_text[-500:]}")
            
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
            
            response_text = EnhancedMedicineLLMGenerator._call_llm_with_retry(
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
        Enhanced to handle ALL sections of printed prescriptions perfectly.
        """
        prompt = f"""You are an EXPERT MEDICAL DOCUMENT ANALYST with 25+ years experience in healthcare documentation.
Your PRIMARY MISSION: Extract EVERY SINGLE piece of information from this hospital report with 100% accuracy.

⚠️ CRITICAL IMPORTANCE: This is a REAL medical document. Missing information could affect patient care.

DOCUMENT TEXT TO ANALYZE:
==========================================
{extracted_text[:3500]}
==========================================

🎯 YOUR TASK: Parse this document completely and structure it perfectly.

📋 EXTRACTION PRIORITY (WHAT TO FIND):

1. **HOSPITAL/CLINIC DETAILS** (Top of document):
   - Look for: Hospital/Clinic name, Business Center, address, city, PIN code
   - Phone numbers (Ph:, Phone:, Contact:)
   - Email addresses if present
   - Registration numbers (Reg:, Registration:)
   - Timings (09:00 AM - 01:00 PM format)
   - Closed days (Closed: Sunday)

2. **DOCTOR DETAILS** (Header section):
   - Full name (Dr., Dr, Doctor)
   - Qualifications (MS, MD, MBBS, etc.)
   - Registration number (MMC, Reg No:, License:)
   - Specialization if mentioned

3. **PATIENT INFORMATION** (After header):
   - Patient ID (OPD, ID:, Patient ID:, MR No:)
   - Full name
   - Age (Y for years, M for months)
   - Gender (M/F/Male/Female)
   - Mobile number (Mob No:, Contact:, Phone:)
   - Complete address
   - Visit date (Date:, dd-mm-yyyy format)

4. **CLINICAL DATA** (Middle section):
   - Weight (Kg, kg)
   - Height (Cm, cm)
   - BMI (B.MI:, BMI:)
   - Blood Pressure (BP:, mm Hg, mmHg)
   - Temperature if present
   - Clinical Findings section
   - Chief Complaints (symptoms with duration in days/weeks)
   - Diagnosis

5. **MEDICINES LIST** (MOST IMPORTANT - Medicine Name section):
   ⚠️ CRITICAL: Look for EVERY medicine after these markers:
   - "Medicine Name", "Medicines:", "Rx:", "R/", "Prescription:", "Treatment:"
   - Usually numbered (1), 2), 3), etc.) or bulleted
   
   For EACH medicine extract:
   - Serial number (1., 2., 3.)
   - Complete medicine name (TAB., CAP., SYP., INJ. prefix)
   - Generic/Brand name (ALL CAPITAL LETTERS usually)
   - Strength/composition (10MG, 500MG, etc.)
   - Dosage column (Morning, Night, Afternoon, Evening)
   - When to take (After Food, Before Food, Empty Stomach)
   - Duration (X Days, X Weeks, "Tot: X Tab" means total tablets)
   - Frequency (Once/Twice/Thrice daily, OD/BD/TDS)

6. **MEDICAL ADVICE** (Bottom section):
   - Advice: section (dietary, lifestyle instructions)
   - Follow Up: (date for next visit)
   - Precautions and warnings
   - Emergency instructions

7. **ADDITIONAL NOTES**:
   - Any substitute recommendations
   - Test reports mentioned
   - Other instructions

🔍 MEDICINE EXTRACTION RULES:
✓ Look for pattern: "NUMBER) TYPE. MEDICINE_NAME STRENGTH"
   Example: "1) TAB. ABCIXIMAB 8 Days"
✓ Dosage column shows: Morning/Night/Afternoon timing
✓ "(Tot: X Tab)" means total number of tablets
✓ Duration is usually after the medicine name (8 Days, 3 Days)
✓ Some medicines show composition like "DOXYLAMINE 10MG + PYRIDOXINE 10MG"

RETURN THIS EXACT JSON STRUCTURE:
{{
  "hospital_details": {{
    "name": "Full hospital/clinic name",
    "address": "Complete address with city and PIN",
    "phone": "Phone number",
    "email": "Email if present or null",
    "registration": "Registration number or null",
    "timings": "Operating hours or null",
    "closed_days": "Closed days or null"
  }},
  "doctor_details": {{
    "name": "Dr. Full Name",
    "qualifications": "MS, MD, MBBS etc or null",
    "specialization": "Specialty or null",
    "registration_number": "MMC/Registration number",
    "contact": "Doctor contact or null"
  }},
  "patient_details": {{
    "name": "Patient full name",
    "patient_id": "OPD ID / Patient ID",
    "age": "Age with unit (e.g., 13 Y, 6 M)",
    "gender": "Male/Female/M/F",
    "mobile": "Mobile number",
    "address": "Patient address",
    "visit_date": "Visit date (dd-mm-yyyy)"
  }},
  "clinical_details": {{
    "weight_kg": "Weight in kg or null",
    "height_cm": "Height in cm or null",
    "bmi": "BMI value or null",
    "blood_pressure": "BP reading (e.g., 120/80 mmHg) or null",
    "temperature": "Temperature or null",
    "chief_complaints": ["Complaint 1 (duration)", "Complaint 2 (duration)"],
    "clinical_findings": "Clinical findings text or null",
    "diagnosis": "Diagnosis"
  }},
  "medicines": [
    {{
      "serial_number": "1",
      "medicine_type": "TAB/CAP/SYP/INJ",
      "name": "MEDICINE NAME",
      "strength": "500mg / 10mg / etc",
      "composition": "Chemical composition or null",
      "dosage": "1 tablet / 5ml / etc",
      "timing": "Morning/Night/Afternoon/Evening",
      "frequency": "Once daily / BD / TDS / OD",
      "duration": "7 Days / 2 Weeks / etc",
      "total_quantity": "Total tablets/capsules (Tot: 8 Tab) or null",
      "when_to_take": "After Food / Before Food / Empty Stomach or null",
      "instructions": "Special instructions or null"
    }}
  ],
  "medical_advice": {{
    "advice": ["Advice 1", "Advice 2", "Advice 3"],
    "dietary_restrictions": "Diet instructions or null",
    "precautions": "Precautions or null",
    "follow_up_date": "Next visit date or null",
    "emergency_instructions": "When to seek emergency care or null"
  }},
  "additional_notes": "Any other important information or substitute recommendations"
}}

⚠️ VALIDATION REQUIREMENTS:
✓ Extract medicine names EXACTLY as written (preserve capitalization)
✓ Do NOT skip any medicine - get ALL of them
✓ Duration format: "X Days" not "for X days"
✓ Timing: Extract from dosage column (Morning/Night/Afternoon/Evening)
✓ Total quantity: Look for "(Tot: X Tab)" or "(Tot: X Cap)"
✓ Use null for missing data, NEVER empty strings
✓ Return ONLY valid JSON - must parse with json.loads()
✓ NO explanatory text before or after JSON

🚨 FINAL CHECK: Did you find ALL medicines? Count them in the document and in your JSON. They MUST match!

NOW EXTRACT ALL INFORMATION AND RETURN ONLY THE JSON:"""
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
        IMPROVED: Filters out non-medicine field labels.
        """
        medicines = []
        
        # Field labels that are NOT medicines (case-insensitive)
        excluded_labels = {
            'no:', 'ph:', 'phone:', 'date:', 'weight', 'height', 'follow up:', 'address:', 
            'mob no:', 'mobile:', 'reg:', 'timing:', 'b.mi:', 'bmi:', 'blood pressure:', 'bp:',
            'patient', 'doctor', 'dr.', 'dr ', 'hospital', 'clinic', 'mmc', 'diagnosis:', 
            'closed:', 'opd', 'id:', 'age:', 'gender:', 'contact:', 'email:', 'registration:',
            'clinical findings', 'chief complaints', 'symptoms', 'advice:', 'precautions:',
            'instructions:', 'notes:', 'remarks:', 'visit date:', 'consultant:', 'dept:'
        }
        
        # Common medicine patterns
        medicine_patterns = [
            # Pattern 1: "1) TAB. MEDICINE_NAME" or "1. TAB MEDICINE"
            r'(?:^|\n)\s*\d+\)\s*(?:TAB\.?|CAP\.?|SYP\.?|INJ\.?|SUSP\.?)\s+([A-Z][A-Z\s]+?)(?:\s+\d+\s*(?:mg|ml|gm|mcg|IU))?',
            # Pattern 2: "Medicine Name 500mg"
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(\d+\s*(?:mg|ml|gm|mcg|IU))',
            # Pattern 3: After "Rx:", "Medicines:", "Prescription:"
            r'(?:Rx:|Medicines?:|Prescription:)\s*\n\s*(?:\d+[.)]\s*)?([A-Z][A-Z\s]+)',
        ]
        
        lines = text.split('\n')
        for line in lines:
            line_clean = line.strip()
            
            # Skip empty lines
            if not line_clean or len(line_clean) < 3:
                continue
            
            # Skip if line is just a field label (excluded label)
            line_lower = line_clean.lower()
            is_excluded = any(label in line_lower for label in excluded_labels)
            if is_excluded:
                logger.debug(f"Skipping excluded label: {line_clean}")
                continue
            
            # Skip lines that are just numbers or dates
            if re.match(r'^\d+[-/]\d+[-/]\d+$', line_clean) or re.match(r'^\d{8,}$', line_clean):
                continue
            
            # Try to match medicine patterns
            for pattern in medicine_patterns:
                matches = re.findall(pattern, line_clean, re.IGNORECASE)
                if matches:
                    for match in matches:
                        medicine_name = match if isinstance(match, str) else match[0]
                        medicine_name = medicine_name.strip()
                        
                        # Additional validation: medicine name should be mostly letters
                        if len(medicine_name) < 3:
                            continue
                        
                        letter_count = sum(c.isalpha() for c in medicine_name)
                        if letter_count < len(medicine_name) * 0.5:  # At least 50% letters
                            continue
                        
                        medicines.append({
                            "name": medicine_name,
                            "dosage": match[1] if isinstance(match, tuple) and len(match) > 1 else "",
                            "frequency": "",
                            "duration": "",
                            "timing": "",
                            "instructions": ""
                        })
                    break
        
        logger.info(f"Regex extraction found {len(medicines)} medicines (after filtering)")
        return medicines
