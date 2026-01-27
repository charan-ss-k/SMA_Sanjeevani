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
    TIMEOUT = 60  # seconds (phi4 may need more time)
    
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
        """Create comprehensive prompt for LLM"""
        
        db_context = UnifiedMedicineDatabase.format_for_llm_comprehensive(medicine_info)
        
        prompt = f"""{db_context}

PATIENT OBSERVATION FROM IMAGE: {ocr_text}

Please provide COMPREHENSIVE medical information in the following format:

1. MEDICINE OVERVIEW:
   - What is it: [Brief description]
   - Purpose: [Main purpose]
   - Classification: [Type of medicine]

2. WHEN TO USE:
   - Primary uses: [List conditions]
   - Symptoms it treats: [Common symptoms]
   - When not to use: [Contraindications]

3. DOSAGE INSTRUCTIONS:
   FOR ADULTS:
   - Standard dose: [Amount and frequency]
   - Maximum daily: [Max amount]
   - Duration: [How long to take]
   
   FOR CHILDREN:
   - Under 5 years: [Dosage if applicable or "Not recommended"]
   - 5-12 years: [Age-appropriate dose]
   - 12-18 years: [Teen dosage]
   
   FOR PREGNANCY:
   - Safe during pregnancy: [Yes/No/Consult doctor]
   - Trimester 1: [Safety info]
   - Trimester 2: [Safety info]
   - Trimester 3: [Safety info]
   
   FOR BREASTFEEDING:
   - Safe while breastfeeding: [Yes/No/Consult doctor]
   - Notes: [Any specific precautions]

4. PRECAUTIONS & WARNINGS:
   - Important warnings: [Critical information]
   - Before taking: [Check these conditions]
   - During use: [Things to avoid]
   - Storage: [How to store]

5. SIDE EFFECTS:
   - Common side effects: [Usually mild]
   - Serious side effects: [Seek medical help]
   - Allergic reactions: [Signs to watch for]

6. DRUG INTERACTIONS:
   - Medicines to avoid: [Which medicines conflict]
   - Food interactions: [Food effects]
   - Alcohol: [Safe or not]

7. INSTRUCTIONS FOR USE:
   - How to take: [Detailed instructions]
   - Best time to take: [Morning/Evening/With food]
   - What to do if missed dose: [Instructions]
   - What to do if overdose: [Emergency info]

8. ADDITIONAL INFORMATION:
   - Effectiveness: [When you'll feel better]
   - Habit forming: [Addiction risk]
   - Long-term use: [Safety considerations]
   - Special precautions: [For elderly/weak patients]

IMPORTANT: Provide all information in clear, easy-to-understand language. 
Be precise about safety information. Always recommend consulting a healthcare professional.
Focus on accuracy and patient safety."""
        
        return prompt
    
    @staticmethod
    def _parse_comprehensive_output(llm_text: str, medicine_info: Dict[str, Any]) -> Dict[str, Any]:
        """Parse LLM output into comprehensive structured format"""
        
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
            
            # Parsed sections - structured for frontend tabs
            "sections": {
                "MEDICINE OVERVIEW": sections.get("MEDICINE OVERVIEW", sections.get("OVERVIEW", "Information not available")),
                "DOSAGE INSTRUCTIONS": sections.get("DOSAGE INSTRUCTIONS", sections.get("DOSAGE", "Consult doctor for dosage")),
                "PRECAUTIONS & WARNINGS": sections.get("PRECAUTIONS & WARNINGS", sections.get("PRECAUTIONS", "Consult healthcare professional")),
                "SIDE EFFECTS": sections.get("SIDE EFFECTS", "Information not available"),
                "DRUG INTERACTIONS": sections.get("DRUG INTERACTIONS", sections.get("INTERACTIONS", "Consult pharmacist")),
                "INSTRUCTIONS FOR USE": sections.get("INSTRUCTIONS FOR USE", sections.get("INSTRUCTIONS", "Follow healthcare provider's instructions")),
                "ADDITIONAL INFORMATION": sections.get("ADDITIONAL INFORMATION", "See full information")
            },
            
            # Flat fields for compatibility
            "precautions": sections.get("PRECAUTIONS & WARNINGS", sections.get("PRECAUTIONS", "Consult healthcare professional")),
            "side_effects": sections.get("SIDE EFFECTS", "Information not available"),
            "interactions": sections.get("DRUG INTERACTIONS", sections.get("INTERACTIONS", "Consult pharmacist")),
            "dosage": sections.get("DOSAGE INSTRUCTIONS", sections.get("DOSAGE", "As prescribed")),
            "when_to_use": sections.get("WHEN TO USE", "As per doctor's recommendation"),
            "instructions": sections.get("INSTRUCTIONS FOR USE", sections.get("INSTRUCTIONS", "Follow healthcare provider's instructions")),
            
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
        Extract all numbered sections from LLM output.
        Handles both numbered format (1. SECTION:) and unnumbered sections.
        """
        sections = {}
        
        # List of section headers to look for
        section_headers = [
            "MEDICINE OVERVIEW",
            "WHEN TO USE",
            "DOSAGE INSTRUCTIONS",
            "DOSAGE",
            "PRECAUTIONS & WARNINGS",
            "PRECAUTIONS",
            "SIDE EFFECTS",
            "DRUG INTERACTIONS",
            "INTERACTIONS",
            "INSTRUCTIONS FOR USE",
            "INSTRUCTIONS",
            "ADDITIONAL INFORMATION",
            "OVERVIEW"
        ]
        
        lines = text.split('\n')
        current_section = None
        current_content = []
        
        for i, line in enumerate(lines):
            # Check if this line starts a new section
            is_new_section = False
            for header in section_headers:
                if header in line.upper():
                    # Save previous section
                    if current_section:
                        sections[current_section] = '\n'.join(current_content).strip()
                    
                    current_section = header
                    current_content = []
                    is_new_section = True
                    break
            
            if not is_new_section and current_section:
                # Add line to current section if not empty or a sub-header
                if line.strip() and not line.strip().startswith('-'):
                    current_content.append(line)
                elif line.strip().startswith('-') or line.strip().startswith('•'):
                    # Include bullet points
                    current_content.append(line)
        
        # Save last section
        if current_section:
            sections[current_section] = '\n'.join(current_content).strip()
        
        # If no sections found, create from full text
        if not sections:
            sections["FULL INFORMATION"] = text
        
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
    def _generate_with_fallback(prompt: str, medicine_info: Dict[str, Any], use_llm_even_if_empty: bool = False, retry_count: int = 0, max_retries: int = 2) -> Dict[str, Any]:
        """
        Attempt LLM generation with automatic fallback
        
        ALWAYS tries LLM first regardless of database availability
        Falls back to database response only if LLM completely fails
        
        Args:
            retry_count: Current retry count (internal use)
            max_retries: Maximum number of retries (default: 2)
        """
        try:
            logger.info(f"🧠 Attempting LLM generation for: {medicine_info.get('name')} (attempt {retry_count + 1}/{max_retries + 1})")
            
            # Try LLM with extended timeout
            response = requests.post(
                EnhancedMedicineLLMGenerator.OLLAMA_URL,
                json={
                    "model": EnhancedMedicineLLMGenerator.MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "temperature": 0.3,
                    "top_p": 0.9,
                    "top_k": 40,
                },
                timeout=EnhancedMedicineLLMGenerator.TIMEOUT
            )
            
            if response.status_code == 200:
                llm_output = response.json().get('response', '')
                if llm_output.strip():
                    logger.info("✅ LLM generated comprehensive medicine information successfully")
                    # Parse LLM output into structured format
                    return EnhancedMedicineLLMGenerator._parse_comprehensive_output(
                        llm_output,
                        medicine_info
                    )
                else:
                    logger.warning(f"LLM returned empty response (attempt {retry_count + 1}/{max_retries + 1})")
                    if retry_count < max_retries:
                        return EnhancedMedicineLLMGenerator._generate_with_fallback(
                            prompt, medicine_info, use_llm_even_if_empty, retry_count + 1, max_retries
                        )
                    else:
                        logger.warning("Max retries reached, using fallback response")
                        if not medicine_info.get('found'):
                            return EnhancedMedicineLLMGenerator._create_synthetic_response(prompt, medicine_info)
                        return EnhancedMedicineLLMGenerator._create_database_response(medicine_info)
            elif response.status_code == 404:
                # 404 means service not found or model not available - fallback immediately
                logger.warning(f"⚠️ LLM service returned 404 - Ollama may not be running or model unavailable")
                if not medicine_info.get('found'):
                    logger.info("Using synthetic response generation")
                    return EnhancedMedicineLLMGenerator._create_synthetic_response(prompt, medicine_info)
                logger.info("Using enhanced database response")
                return EnhancedMedicineLLMGenerator._create_database_response(medicine_info)
            elif response.status_code == 500:
                # 500 means server error - try once more
                logger.warning(f"LLM returned server error (500) (attempt {retry_count + 1}/{max_retries + 1})")
                if retry_count < max_retries:
                    return EnhancedMedicineLLMGenerator._generate_with_fallback(
                        prompt, medicine_info, use_llm_even_if_empty, retry_count + 1, max_retries
                    )
                else:
                    logger.warning("Max retries reached after server errors, using fallback")
                    if not medicine_info.get('found'):
                        return EnhancedMedicineLLMGenerator._create_synthetic_response(prompt, medicine_info)
                    return EnhancedMedicineLLMGenerator._create_database_response(medicine_info)
            else:
                # Other status codes - fallback immediately
                logger.warning(f"LLM returned status {response.status_code}, using fallback response")
                if not medicine_info.get('found'):
                    return EnhancedMedicineLLMGenerator._create_synthetic_response(prompt, medicine_info)
                return EnhancedMedicineLLMGenerator._create_database_response(medicine_info)
                
        except requests.exceptions.ConnectionError:
            logger.warning("❌ Cannot connect to LLM service - Ollama may not be running")
            logger.info("Using fallback response generation")
            if not medicine_info.get('found'):
                return EnhancedMedicineLLMGenerator._create_synthetic_response(prompt, medicine_info)
            return EnhancedMedicineLLMGenerator._create_database_response(medicine_info)
            
        except requests.exceptions.Timeout:
            logger.warning(f"⏱️ LLM timeout (attempt {retry_count + 1}/{max_retries + 1})")
            if retry_count < max_retries:
                logger.info("Retrying with extended timeout...")
                try:
                    response = requests.post(
                        EnhancedMedicineLLMGenerator.OLLAMA_URL,
                        json={
                            "model": EnhancedMedicineLLMGenerator.MODEL,
                            "prompt": prompt,
                            "stream": False,
                            "temperature": 0.3,
                        },
                        timeout=60  # Extended timeout
                    )
                    if response.status_code == 200:
                        llm_output = response.json().get('response', '')
                        if llm_output.strip():
                            logger.info("✅ LLM succeeded with extended timeout")
                            return EnhancedMedicineLLMGenerator._parse_comprehensive_output(
                                llm_output,
                                medicine_info
                            )
                except:
                    pass
            
            logger.warning("Max timeout attempts reached, using fallback response")
            # If LLM completely fails, generate from prompt anyway
            if not medicine_info.get('found'):
                logger.info("Generating synthetic response from prompt template...")
                return EnhancedMedicineLLMGenerator._create_synthetic_response(prompt, medicine_info)
            
            logger.warning("📊 Falling back to database response")
            return EnhancedMedicineLLMGenerator._create_database_response(medicine_info)
            
        except Exception as e:
            logger.error(f"❌ LLM error: {type(e).__name__}: {e}")
            logger.info("Using fallback response generation")
            # Try to create a more comprehensive response even from database
            if not medicine_info.get('found'):
                logger.info("Generating response from prompt for unknown medicine...")
                return EnhancedMedicineLLMGenerator._create_synthetic_response(prompt, medicine_info)
            
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
