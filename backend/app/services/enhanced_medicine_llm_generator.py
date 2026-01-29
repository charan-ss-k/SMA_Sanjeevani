"""
Enhanced Medicine LLM Generator
Generates comprehensive medicine information including:
- Precautions & warnings
- Dosage for adults, children, pregnancy
- When to use
- Instructions
- Side effects & interactions
"""

import logging
import os
import time
import random
import requests
from typing import Dict, Any
from app.services.unified_medicine_database import UnifiedMedicineDatabase

logger = logging.getLogger(__name__)

class EnhancedMedicineLLMGenerator:
    """
    Generates comprehensive medicine information using:
    1. Phi-4 (Microsoft) LLM for natural language generation
    2. Unified medicine database (50K + 250K medicines)
    3. Pre-trained models for medical information
    """
    
    OLLAMA_URL = "http://localhost:11434/api/generate"
    MODEL = "phi4"
    # Configurable timeouts and retry behavior
    TIMEOUT_BASE = int(os.getenv('OLLAMA_TIMEOUT_BASE', '60'))  # base read timeout in seconds
    MAX_RETRIES = int(os.getenv('OLLAMA_MAX_RETRIES', '3'))  # number of retry attempts on timeout/server error
    NUM_PREDICT = int(os.getenv('OLLAMA_NUM_PREDICT', '2048'))  # maximum tokens to request from model
    
    @staticmethod
    def generate_comprehensive_info(ocr_text: str, medicine_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate comprehensive medicine information for all scenarios:
        - Adults
        - Children (different age groups)
        - Pregnancy
        - Precautions
        - Side effects
        - When to use
        - Instructions
        
        ALWAYS uses LLM to generate missing information even if database has partial data
        """
        
        if not medicine_info.get('found'):
            logger.warning(f"Medicine not found: {medicine_info.get('name')}")
            # Even if not found, try to generate info from LLM
            prompt = EnhancedMedicineLLMGenerator._create_comprehensive_prompt(ocr_text, medicine_info)
            return EnhancedMedicineLLMGenerator._generate_with_fallback(
                prompt, medicine_info, use_llm_even_if_empty=True
            )
        
        # Create comprehensive LLM prompt
        prompt = EnhancedMedicineLLMGenerator._create_comprehensive_prompt(ocr_text, medicine_info)
        
        logger.info(f"🧠 Generating comprehensive medicine info for: {medicine_info.get('name')}")
        
        # Always attempt LLM generation for comprehensive info
        return EnhancedMedicineLLMGenerator._generate_with_fallback(prompt, medicine_info)
    
    @staticmethod
    def _create_comprehensive_prompt(ocr_text: str, medicine_info: Dict[str, Any]) -> str:
        """Create comprehensive prompt for accurate LLM-generated medicine information"""
        
        medicine_name = medicine_info.get('name', 'Unknown Medicine')
        
        prompt = f"""You are an expert medical information provider. Based on your medical knowledge, provide ACCURATE and COMPLETE information about the following medicine.

MEDICINE IDENTIFIED FROM IMAGE:
Medicine Name: {medicine_name}
OCR Text from Image: {ocr_text}

YOUR TASK: Generate ACCURATE medical information about this medicine using your medical knowledge. Do NOT make up information - use only verified medical knowledge.

Provide the information in EXACTLY this format with all sections filled:

1. MEDICINE NAME:
Provide the exact generic and brand name of this medicine.

2. TYPE:
Provide the pharmaceutical form (e.g., Tablet, Capsule, Syrup, Powder, Injection, Cream, etc.)
Be specific about the formulation.

3. DOSAGE:
   For Adults: Provide standard adult dosage including frequency and maximum daily dose
   For Children: Provide age-specific dosages or indicate if not recommended for children
   For Pregnancy: Provide safety category (Category A/B/C/D/X) and explain safety in each trimester
   Include specific measurements and frequency for each group

4. WHO CAN TAKE & AGE RESTRICTIONS:
   Suitable for: List specific age groups and conditions
   Avoid for: List specific contraindications and medical conditions where NOT recommended
   During Pregnancy: Specify pregnancy category and trimester-specific info
   During Breastfeeding: Specify if safe during breastfeeding and any precautions

5. INSTRUCTIONS:
   How to take: Provide detailed step-by-step instructions
   Best time to take: Specify optimal time (with/without food, morning/evening, etc.)
   If missed dose: Provide clear instructions
   Storage: Provide specific storage requirements (temperature, humidity, light, etc.)
   Special considerations: Any special handling or usage notes

6. PRECAUTIONS:
   Important warnings: List critical warnings and cautions
   Avoid with: List specific medicines, foods, supplements that should NOT be taken together
   Check before taking: List medical conditions to check with doctor first
   Lab monitoring: Any tests or monitoring needed during use
   Contraindications: Absolute reasons NOT to take this medicine

7. SIDE EFFECTS:
   Common: List frequently occurring side effects that are usually mild
   Serious: List serious side effects requiring immediate medical attention
   Allergic reactions: List signs of allergic reactions
   Rare but serious: List uncommon but dangerous side effects

CRITICAL INSTRUCTIONS:
- Use your medical knowledge base, NOT made-up information
- Include specific dosages with measurements (mg, ml, etc.)
- Include frequency (times per day, every X hours, etc.)
- Be precise about age groups (Under 5, 5-12, 12-18, 18-65, Over 65)
- Include pregnancy categories (FDA categories A/B/C/D/X)
- List SPECIFIC drug interactions, not generic ones
- Mention SPECIFIC food interactions
- Include warnings from medical guidelines
- Always mention "consult healthcare professional" where applicable
- If you don't have accurate information about something, say "Specific information not available in medical database"

Generate COMPLETE information for all 7 sections. Do not omit any section."""
        
        return prompt
    
    @staticmethod
    def _parse_comprehensive_output(llm_text: str, medicine_info: Dict[str, Any]) -> Dict[str, Any]:
        """Parse LLM output into simplified 7-field format"""
        
        # Extract all sections from LLM text
        sections = EnhancedMedicineLLMGenerator._extract_all_sections(llm_text)
        
        result = {
            "medicine_name": medicine_info.get('name', 'Unknown'),
            "category": medicine_info.get('category'),
            "manufacturer": medicine_info.get('manufacturer'),
            "price": medicine_info.get('price'),
            "pack_size": medicine_info.get('pack_size'),
            "composition": medicine_info.get('composition', []),
            "llm_generated": True,
            "source": "LLM + Unified Database",
            "generated_at": __import__('datetime').datetime.now().isoformat(),
            
            # Full LLM response
            "full_information": llm_text,
            
            # Simplified 7 fields - structured for frontend single-column display
            "sections": {
                "MEDICINE NAME": sections.get("MEDICINE NAME", medicine_info.get('name', 'Unknown')),
                "TYPE": sections.get("TYPE", "Not specified"),
                "DOSAGE": sections.get("DOSAGE", "As prescribed"),
                "WHO CAN TAKE & AGE RESTRICTIONS": sections.get("WHO CAN TAKE & AGE RESTRICTIONS", "Consult doctor"),
                "INSTRUCTIONS": sections.get("INSTRUCTIONS", "Follow healthcare provider's instructions"),
                "PRECAUTIONS": sections.get("PRECAUTIONS", "Consult healthcare professional"),
                "SIDE EFFECTS": sections.get("SIDE EFFECTS", "Information not available")
            },
            
            # Flat fields for compatibility
            "type": sections.get("TYPE", "Not specified"),
            "precautions": sections.get("PRECAUTIONS", "Consult healthcare professional"),
            "side_effects": sections.get("SIDE EFFECTS", "Information not available"),
            "dosage": sections.get("DOSAGE", "As prescribed"),
            "who_can_take": sections.get("WHO CAN TAKE & AGE RESTRICTIONS", "Consult doctor"),
            "instructions": sections.get("INSTRUCTIONS", "Follow healthcare provider's instructions"),
            
            # Warnings
            "warnings": [
                "This information is generated by AI and should not replace professional medical advice",
                "Always consult a healthcare professional before taking any medicine",
                "In case of allergic reactions or severe side effects, seek immediate medical help"
            ]
        }
        
        return result
    
    @staticmethod
    def _extract_all_sections(text: str) -> Dict[str, str]:
        """
        Extract simplified 7-section format from LLM output.
        Handles detailed responses with sub-sections and bullet points.
        """
        sections = {}
        
        # List of section headers to look for (simplified)
        section_headers = [
            "MEDICINE NAME",
            "TYPE",
            "DOSAGE",
            "WHO CAN TAKE & AGE RESTRICTIONS",
            "INSTRUCTIONS",
            "PRECAUTIONS",
            "SIDE EFFECTS"
        ]
        
        lines = text.split('\n')
        current_section = None
        current_content = []
        
        for i, line in enumerate(lines):
            # Check if this line starts a new section (look for section number and header)
            is_new_section = False
            for header in section_headers:
                # Match both "1. MEDICINE NAME:" and just "MEDICINE NAME:"
                if header in line.upper() and (
                    line.strip().startswith(header) or 
                    line.strip().startswith(f"{section_headers.index(header) + 1}.") or
                    (any(c.isdigit() for c in line[:3]) and header in line.upper())
                ):
                    # Save previous section
                    if current_section:
                        sections[current_section] = '\n'.join(current_content).strip()
                    
                    current_section = header
                    current_content = []
                    is_new_section = True
                    # Skip the header line itself, get content from next line
                    break
            
            if not is_new_section and current_section:
                # Add line to current section
                if line.strip():
                    current_content.append(line)
                elif current_content:  # Keep empty lines if we already have content
                    current_content.append(line)
        
        # Save last section
        if current_section:
            sections[current_section] = '\n'.join(current_content).strip()
        
        # If no sections found, try alternative parsing - split by numbered sections
        if not sections:
            sections = EnhancedMedicineLLMGenerator._extract_sections_alternative(text, section_headers)
        
        # If still no sections, use full text
        if not sections:
            sections["FULL INFORMATION"] = text
        
        return sections
    
    @staticmethod
    def _extract_sections_alternative(text: str, section_headers: list) -> Dict[str, str]:
        """Alternative extraction method for numbered sections"""
        sections = {}
        
        for idx, header in enumerate(section_headers, 1):
            # Look for patterns like "1. MEDICINE NAME:" or "1.MEDICINE NAME" or "[MEDICINE NAME]"
            pattern_variants = [
                f"{idx}. {header}",
                f"{idx}. {header.lower()}",
                f"{idx}.{header}",
                f"[{header}]",
                header
            ]
            
            for variant in pattern_variants:
                if variant.lower() in text.lower():
                    start_idx = text.lower().find(variant.lower())
                    # Find next section start
                    next_idx = len(text)
                    for next_header in section_headers:
                        if next_header != header:
                            for next_variant in [f"{section_headers.index(next_header) + 1}.", f"[{next_header}]", next_header]:
                                find_pos = text.lower().find(next_variant.lower(), start_idx + len(variant))
                                if find_pos != -1 and find_pos < next_idx:
                                    next_idx = find_pos
                    
                    content = text[start_idx + len(variant):next_idx].strip()
                    if content:
                        sections[header] = content
                        break
        
        return sections
    
    @staticmethod
    def _extract_sections(text: str) -> Dict[str, str]:
        """Extract all sections from LLM output - simplified version"""
        return EnhancedMedicineLLMGenerator._extract_all_sections(text)
    
    @staticmethod
    def _extract_section(text: str, section_name: str) -> str:
        """Extract specific section from text"""
        
        lines = text.split('\n')
        section_content = []
        found = False
        
        for line in lines:
            if section_name.upper() in line.upper():
                found = True
                continue
            
            if found:
                if any(header in line for header in ['OVERVIEW', 'WHEN TO USE', 'DOSAGE', 'PRECAUTIONS',
                                                       'SIDE EFFECTS', 'INTERACTIONS', 'INSTRUCTIONS']):
                    break
                
                if line.strip():
                    section_content.append(line.strip())
        
        return ' '.join(section_content[:10]) if section_content else 'Information not available'
    
    @staticmethod
    def _generate_with_fallback(prompt: str, medicine_info: Dict[str, Any], use_llm_even_if_empty: bool = False, retry_count: int = 0, max_retries: int = None) -> Dict[str, Any]:
        """
        Attempt LLM generation with automatic fallback
        
        ALWAYS tries LLM first regardless of database availability
        Falls back to database response only if LLM completely fails
        
        Args:
            retry_count: Current retry count (internal use)
            max_retries: Maximum number of retries (default: 2)
        """
        # Determine max retries
        if max_retries is None:
            max_retries = EnhancedMedicineLLMGenerator.MAX_RETRIES

        attempt = 0
        base_read_timeout = EnhancedMedicineLLMGenerator.TIMEOUT_BASE

        while attempt <= max_retries:
            read_timeout = base_read_timeout * (2 ** attempt)
            logger.info(f"🧠 Attempting LLM generation for: {medicine_info.get('name')} (attempt {attempt + 1}/{max_retries + 1}) - read_timeout={read_timeout}s")

            try:
                payload = {
                    "model": EnhancedMedicineLLMGenerator.MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "temperature": 0.1,  # low temperature for accuracy
                    "top_p": 0.95,
                    "top_k": 40,
                    "num_predict": EnhancedMedicineLLMGenerator.NUM_PREDICT,
                }

                # Use a tuple timeout: (connect_timeout, read_timeout)
                response = requests.post(
                    EnhancedMedicineLLMGenerator.OLLAMA_URL,
                    json=payload,
                    timeout=(10, read_timeout)
                )

                if response.status_code == 200:
                    # Some LLM endpoints respond with a 'response' field
                    data = None
                    try:
                        data = response.json()
                    except Exception:
                        # fallback to raw text
                        pass

                    llm_output = ''
                    if isinstance(data, dict):
                        llm_output = data.get('response') or data.get('text') or data.get('output') or ''
                    if not llm_output:
                        # try raw text
                        try:
                            llm_output = response.text or ''
                        except Exception:
                            llm_output = ''

                    if llm_output and llm_output.strip():
                        logger.info("✅ LLM generated comprehensive medicine information successfully")
                        return EnhancedMedicineLLMGenerator._parse_comprehensive_output(llm_output, medicine_info)

                    logger.warning(f"LLM returned empty response on attempt {attempt + 1}")
                    # fall through to retry

                elif response.status_code == 404:
                    logger.warning("⚠️ LLM service returned 404 - model/service unavailable")
                    break
                elif response.status_code >= 500:
                    logger.warning(f"LLM returned server error {response.status_code} on attempt {attempt + 1}")
                    # retry on server errors
                else:
                    logger.warning(f"LLM returned status {response.status_code}, using fallback response")
                    break

            except requests.exceptions.ConnectionError:
                logger.warning("❌ Cannot connect to LLM service - Ollama may not be running")
                break

            except requests.exceptions.Timeout:
                logger.warning(f"⏱️ LLM read timeout on attempt {attempt + 1} (read_timeout={read_timeout}s)")
                # retry with exponential backoff

            except Exception as e:
                logger.error(f"❌ LLM error on attempt {attempt + 1}: {type(e).__name__}: {e}")
                # On unexpected exceptions, allow a retry

            # Prepare for next attempt (if any)
            attempt += 1
            if attempt <= max_retries:
                backoff = min(30, (2 ** attempt) + random.uniform(0.5, 1.5))
                logger.info(f"Waiting {backoff:.1f}s before next LLM attempt...")
                time.sleep(backoff)

        # If LLM completely fails after retries, fallback
        logger.warning("LLM generation failed after retries, using fallback response")
        if not medicine_info.get('found'):
            logger.info("Generating synthetic response from prompt template...")
            return EnhancedMedicineLLMGenerator._create_synthetic_response(prompt, medicine_info)

        logger.warning("📊 Falling back to database response")
        return EnhancedMedicineLLMGenerator._create_database_response(medicine_info)
    
    @staticmethod
    def _create_synthetic_response(prompt: str, medicine_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a synthetic comprehensive response from prompt template
        Used when LLM is unavailable but medicine name is identified
        """
        logger.info(f"🤖 Creating synthetic response for: {medicine_info.get('name')}")
        
        medicine_name = medicine_info.get('name', 'Unknown Medicine')
        
        synthetic_info = f"""
COMPREHENSIVE MEDICINE INFORMATION: {medicine_name}

1. MEDICINE OVERVIEW:
   - What is it: This is a pharmaceutical medication identified from your image
   - Purpose: To provide therapeutic benefit for various conditions
   - Classification: Consult healthcare professional for specific classification

2. WHEN TO USE:
   - Primary uses: As prescribed by your healthcare provider
   - Symptoms it treats: Consult your doctor about specific indications
   - When not to use: Contraindications should be discussed with your pharmacist

3. DOSAGE INSTRUCTIONS:
   FOR ADULTS:
   - Standard dose: As prescribed on the package or by your doctor
   - Maximum daily: Follow package instructions or doctor's advice
   - Duration: Continue for prescribed duration or until advised otherwise
   
   FOR CHILDREN:
   - Under 5 years: Consult healthcare professional before use
   - 5-12 years: Dosage requires professional recommendation
   - 12-18 years: May require adjusted dosing
   
   FOR PREGNANCY:
   - Safe during pregnancy: CONSULT DOCTOR BEFORE USE
   - Trimester 1: Must be reviewed by healthcare professional
   - Trimester 2: Must be reviewed by healthcare professional
   - Trimester 3: Must be reviewed by healthcare professional
   
   FOR BREASTFEEDING:
   - Safe while breastfeeding: Consult healthcare professional
   - Notes: Many medicines pass into breast milk

4. PRECAUTIONS & WARNINGS:
   ⚠️ IMPORTANT WARNINGS:
   - Read all package inserts before use
   - Do not exceed recommended dose
   - Inform healthcare provider of all medications you take
   - Discontinue if allergic reactions occur
   
   Before taking:
   - Inform your doctor of medical conditions
   - List all current medications
   - Mention any known allergies
   
   During use:
   - Avoid alcohol unless approved by doctor
   - Do not drive if drowsiness occurs
   - Store at room temperature away from moisture
   
   Storage:
   - Keep in original container
   - Store away from heat and moisture
   - Keep out of reach of children
   - Check expiry date before use

5. SIDE EFFECTS:
   - Common side effects: Mild reactions like nausea, headache, dizziness
   - Serious side effects: Difficulty breathing, chest pain, severe reactions
   - Allergic reactions: Rash, swelling, severe itching

6. DRUG INTERACTIONS:
   - Medicines to avoid: Consult pharmacist about all your medications
   - Food interactions: Some medicines should be taken with or without food
   - Alcohol: Generally not recommended with most medicines

7. INSTRUCTIONS FOR USE:
   - How to take: Follow package instructions or doctor's prescription
   - Best time to take: As advised on package or by healthcare provider
   - What to do if missed dose: Take the next dose at regular time
   - What to do if overdose: Seek immediate medical attention

8. ADDITIONAL INFORMATION:
   - Effectiveness: May take several days to weeks for full effect
   - Habit forming: Check with healthcare professional
   - Long-term use: Regular monitoring by doctor may be needed
   - Special precautions: Elderly or weak patients need special attention

⚠️ MEDICAL DISCLAIMER:
This information is based on standard medical knowledge and the medicine identified from your image.
This is NOT a substitute for professional medical advice.
ALWAYS CONSULT A HEALTHCARE PROFESSIONAL before starting any medication.
In case of adverse effects or emergency, seek immediate medical help.
Every individual is different - dosages and suitability vary by person.
"""
        
        return {
            "medicine_name": medicine_name,
            "category": medicine_info.get('category', 'Unspecified'),
            "manufacturer": medicine_info.get('manufacturer', 'Unknown'),
            "price": medicine_info.get('price', 'Price not available'),
            "composition": medicine_info.get('composition', ['Composition unknown']),
            "llm_generated": False,
            "source": "Synthetic Template + Image Analysis",
            "generated_at": __import__('datetime').datetime.now().isoformat(),
            
            "full_information": synthetic_info,
            
            "sections": {
                "OVERVIEW": "Please consult healthcare professional",
                "WHEN_TO_USE": "Follow doctor's prescription",
                "DOSAGE": "As prescribed",
                "PRECAUTIONS": "See full information above",
                "SIDE_EFFECTS": "See full information above",
                "INTERACTIONS": "Consult your pharmacist",
                "INSTRUCTIONS": "Follow package guidelines"
            },
            
            "precautions": "⚠️ CONSULT HEALTHCARE PROFESSIONAL BEFORE USE",
            "side_effects": "See full information for details",
            "interactions": "Consult pharmacist about all medications",
            "dosage": "As prescribed by healthcare provider",
            "when_to_use": "As per doctor's recommendation",
            "instructions": "Follow healthcare provider's instructions",
            
            "warnings": [
                "⚠️ This information is generated automatically from image analysis",
                "⚠️ This is NOT medical advice and should not replace consultation with healthcare professional",
                "⚠️ ALWAYS consult your doctor or pharmacist before taking any medicine",
                "⚠️ In case of allergic reactions or emergency, seek immediate medical help",
                "⚠️ Every individual is different - suitability varies by person"
            ]
        }
    
    @staticmethod
    def _create_database_response(medicine_info: Dict[str, Any]) -> Dict[str, Any]:
        """Create response from database when LLM unavailable"""
        
        logger.info(f"📊 Creating response from database for: {medicine_info.get('name')}")
        
        composition_str = ', '.join(medicine_info.get('composition', ['Not specified']))
        
        return {
            "medicine_name": medicine_info.get('name', 'Unknown'),
            "category": medicine_info.get('category'),
            "manufacturer": medicine_info.get('manufacturer'),
            "price": medicine_info.get('price'),
            "pack_size": medicine_info.get('pack_size'),
            "composition": medicine_info.get('composition', []),
            "llm_generated": False,
            "source": "Unified Database",
            "generated_at": __import__('datetime').datetime.now().isoformat(),
            
            "full_information": f"""
MEDICINE INFORMATION:

Name: {medicine_info.get('name', 'Unknown')}
Category: {medicine_info.get('category', 'Not specified')}
Manufacturer: {medicine_info.get('manufacturer', 'Not specified')}
Dosage Form: {medicine_info.get('dosage_form', 'Not specified')}
Strength: {medicine_info.get('strength', 'Not specified')}
Pack Size: {medicine_info.get('pack_size', 'Not specified')}
Price: {medicine_info.get('price', 'Not specified')}

Composition: {composition_str}

Type: {medicine_info.get('type', 'Not specified')}
Indication: {medicine_info.get('indication', 'Not specified')}
Classification: {medicine_info.get('classification', 'Not specified')}

⚠️ IMPORTANT:
- This is database information retrieved automatically
- Please consult a healthcare professional for medical advice
- Do not self-medicate; always follow doctor's prescription
- In case of any adverse effects, contact your doctor immediately
""",
            
            "precautions": "Please consult a healthcare professional before using this medicine",
            "side_effects": "Information available upon consultation",
            "interactions": "Consult healthcare provider for drug interactions",
            "dosage": medicine_info.get('strength', 'As prescribed'),
            "when_to_use": medicine_info.get('indication', 'As per doctor\'s recommendation'),
            "instructions": "Follow healthcare provider's instructions",
            
            "warnings": [
                "This is database information, not medical advice",
                "Always consult a qualified healthcare professional",
                "Do not self-medicate",
                "Follow your doctor's prescription"
            ]
        }
    
    @staticmethod
    def _create_not_found_response(medicine_info: Dict[str, Any]) -> Dict[str, Any]:
        """Create response when medicine not found"""
        
        return {
            "medicine_name": medicine_info.get('name', 'Unknown'),
            "found": False,
            "llm_generated": False,
            "source": "Not Found",
            "generated_at": __import__('datetime').datetime.now().isoformat(),
            
            "full_information": f"""
MEDICINE NOT FOUND IN DATABASE

Searched for: {medicine_info.get('name', 'Unknown')}

Possible reasons:
1. Medicine name may have been misidentified in the image
2. Medicine might be known by a different name
3. Medicine may not be in the current database
4. Newly released medicine not yet added to database

What to do:
1. Check the original medicine packaging
2. Verify the exact medicine name and spelling
3. Consult a pharmacist or healthcare professional
4. Take the medicine packaging to your doctor

IMPORTANT REMINDER:
- Never take any medicine without prescription
- Always consult a qualified healthcare professional
- For medical emergencies, call your emergency number

For safety, it's recommended to consult with:
- Your doctor
- A pharmacist
- Medical emergency services (if needed)
""",
            
            "precautions": "Cannot provide precautions - medicine not found",
            "side_effects": "Cannot provide - medicine not found",
            "interactions": "Cannot provide - medicine not found",
            "dosage": "Cannot determine - medicine not found",
            "when_to_use": "Cannot determine - medicine not found",
            "instructions": "Please consult healthcare professional",
            
            "warnings": [
                "Medicine not found in database",
                "Please verify the medicine name",
                "Consult a healthcare professional immediately",
                "Do not take any medicine without proper medical advice"
            ]
        }
    @staticmethod
    def decipher_prescription_text(noisy_ocr_text: str) -> Dict[str, Any]:
        """
        Decipher handwritten prescription text using specialized LLM prompt.
        Designed specifically for noisy, messy OCR output from handwritten prescriptions.
        
        Args:
            noisy_ocr_text: Raw OCR text from handwritten prescription (messy, unclear)
            
        Returns:
            Structured JSON with deciphered medicines, dosages, and frequencies
        """
        logger.info("🔍 Starting prescription text deciphering...")
        logger.debug(f"Raw OCR text: {noisy_ocr_text[:200]}...")
        
        # Create specialized prompt for deciphering
        prompt = EnhancedMedicineLLMGenerator._create_prescription_deciphering_prompt(noisy_ocr_text)
        
        logger.info("📝 Sending deciphering prompt to LLM...")
        
        try:
            # Call LLM with retry logic
            response_text = EnhancedMedicineLLMGenerator._call_ollama_with_retry(
                prompt,
                max_retries=EnhancedMedicineLLMGenerator.MAX_RETRIES,
                timeout_base=EnhancedMedicineLLMGenerator.TIMEOUT_BASE
            )
            
            logger.debug(f"LLM Response: {response_text[:500]}...")
            
            # Parse the JSON response
            import json
            
            # Try to extract JSON from response
            json_match = None
            try:
                # Look for JSON array in the response
                start_idx = response_text.find('[')
                end_idx = response_text.rfind(']') + 1
                
                if start_idx != -1 and end_idx > start_idx:
                    json_str = response_text[start_idx:end_idx]
                    medicines_list = json.loads(json_str)
                    logger.info(f"✅ Successfully extracted {len(medicines_list)} medicines from prescription")
                    return {
                        "status": "success",
                        "medicines": medicines_list,
                        "raw_text": noisy_ocr_text,
                        "llm_output": response_text,
                        "generated_at": __import__('datetime').datetime.now().isoformat()
                    }
            except json.JSONDecodeError as je:
                logger.warning(f"JSON parsing failed: {je}. Attempting fallback parsing...")
            
            # Fallback: manual parsing if JSON extraction fails
            medicines_list = EnhancedMedicineLLMGenerator._parse_prescription_fallback(response_text)
            
            return {
                "status": "success" if medicines_list else "partial",
                "medicines": medicines_list,
                "raw_text": noisy_ocr_text,
                "llm_output": response_text,
                "generated_at": __import__('datetime').datetime.now().isoformat(),
                "note": "Used fallback parsing - results may be less accurate"
            }
            
        except Exception as e:
            logger.error(f"❌ Prescription deciphering failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "raw_text": noisy_ocr_text,
                "medicines": [],
                "generated_at": __import__('datetime').datetime.now().isoformat()
            }
    
    @staticmethod
    def _create_prescription_deciphering_prompt(noisy_text: str) -> str:
        """
        Create a specialized prompt for an expert pharmacist LLM.
        The LLM must decipher messy, handwritten prescription text.
        """
        prompt = f"""You are an expert pharmacist with 30+ years of experience reading handwritten doctor prescriptions.

TASK: Decipher the following NOISY handwritten prescription text and extract structured medicine information.

IMPORTANT NOTES:
- The input text is from OCR (optical character recognition) of a handwritten prescription
- It will contain spelling errors, unclear abbreviations, and medical shorthand
- Your job is to INTERPRET the messy text and identify actual medicine names and instructions
- You must work with INCOMPLETE and INCORRECT text

NOISY OCR TEXT FROM HANDWRITTEN PRESCRIPTION:
---
{noisy_text}
---

YOUR TASK:
1. Identify each DISTINCT medicine mentioned
2. Extract dosage (e.g., "500mg", "1 tablet", "5ml")
3. Extract frequency (e.g., "BD" = twice daily, "TDS" = thrice daily, "OD" = once daily, "QID" = four times daily)
4. Extract duration if mentioned (e.g., "7 days", "2 weeks")
5. Handle common medical abbreviations:
   - BD = Bis Die (twice daily)
   - TDS = Ter Die Sumendum (thrice daily)
   - OD = Omni Die (once daily)
   - QID = Quater In Die (four times daily)
   - PC = Post Cibum (after meals)
   - AC = Ante Cibum (before meals)
   - HS = Hora Somni (at bedtime)
   - AM/PM = morning/evening
   - SOS = as needed
   - IM = intramuscular, IV = intravenous, PO = oral

RETURN EXACTLY THIS JSON FORMAT (array of medicine objects):
[
  {{
    "medicine_name": "Actual medicine name (best guess if unclear)",
    "dosage": "Amount and unit (e.g. 500mg, 1 tablet, 10ml)",
    "frequency": "How many times per day or interval",
    "duration": "How long to take (days/weeks/months or 'as needed')",
    "special_instructions": "Any special instructions (with/without food, bedtime, etc.)",
    "confidence": "high/medium/low (how confident you are about this medicine)",
    "notes": "Any uncertainty or alternative interpretations"
  }},
  ...
]

RULES FOR DECIPHERING:
1. Medicine names: Even if misspelled in OCR, identify the likely medicine
2. For unclear entries, use "confidence": "low" and add notes
3. If text says "as needed", set frequency to "as needed" and duration to "N/A"
4. Remove duplicates - don't list the same medicine twice
5. Only include items that are clearly medicines (ignore general notes)
6. If cannot determine a field, use empty string ""

EXAMPLE OUTPUT:
[
  {{
    "medicine_name": "Paracetamol",
    "dosage": "500mg",
    "frequency": "TDS (thrice daily)",
    "duration": "5 days",
    "special_instructions": "After meals",
    "confidence": "high",
    "notes": ""
  }},
  {{
    "medicine_name": "Amoxicillin",
    "dosage": "250mg",
    "frequency": "BD (twice daily)",
    "duration": "10 days",
    "special_instructions": "With milk or water",
    "confidence": "high",
    "notes": ""
  }}
]

CRITICAL: Return ONLY the JSON array, nothing else. Start with [ and end with ]"""
        
        return prompt
    
    @staticmethod
    def _parse_prescription_fallback(llm_output: str) -> list:
        """
        Fallback parser if JSON extraction fails.
        Attempts to extract medicine information from natural language output.
        """
        import re
        import json
        
        medicines = []
        
        # Try to find any JSON-like structure first
        json_patterns = [
            r'\[\s*\{.*?\}\s*\]',  # Array of objects
            r'\{[^}]*medicine[^}]*\}',  # Object with 'medicine'
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, llm_output, re.DOTALL)
            for match in matches:
                try:
                    parsed = json.loads(match)
                    if isinstance(parsed, list):
                        medicines.extend(parsed)
                    elif isinstance(parsed, dict):
                        medicines.append(parsed)
                except:
                    continue
        
        if medicines:
            logger.info(f"Fallback parser found {len(medicines)} medicines")
            return medicines
        
        # Last resort: try to extract key phrases
        logger.warning("Could not parse prescription output - returning empty list")
        return []
    
    @staticmethod
    def _call_ollama_with_retry(prompt: str, max_retries: int = 3, timeout_base: int = 60) -> str:
        """
        Helper method to call Ollama API with retry logic.
        Reuses existing retry mechanism from the class.
        """
        import time
        
        for attempt in range(max_retries):
            try:
                timeout = timeout_base * (2 ** attempt)  # Exponential backoff
                
                response = requests.post(
                    EnhancedMedicineLLMGenerator.OLLAMA_URL,
                    json={
                        "model": EnhancedMedicineLLMGenerator.MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "num_predict": EnhancedMedicineLLMGenerator.NUM_PREDICT
                    },
                    timeout=timeout
                )
                
                if response.status_code == 200:
                    return response.json().get('response', '')
                else:
                    logger.warning(f"LLM returned status {response.status_code}")
                    
            except requests.Timeout:
                logger.warning(f"Timeout on attempt {attempt + 1}/{max_retries}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                continue
            except Exception as e:
                logger.warning(f"Error on attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    time.sleep(1)
                continue
        
        raise RuntimeError("Failed to get response from LLM after retries")