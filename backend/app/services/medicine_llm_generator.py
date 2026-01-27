"""
Medicine LLM Service
Integrates CSV dataset with LLM (Phi-4) to generate intelligent
medicine information from structured data.
"""

import logging
import requests
import json
from typing import Dict, Any
from app.services.medicine_csv_rag import MedicineCSVRAG

logger = logging.getLogger(__name__)

class MedicineLLMGenerator:
    """
    Uses LLM to generate comprehensive medicine information
    based on CSV dataset + natural language generation.
    """
    
    OLLAMA_URL = "http://localhost:11434/api/generate"
    MODEL = "phi4"
    TIMEOUT = 60  # seconds
    
    @staticmethod
    def generate_medicine_info(ocr_text: str, medicine_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate comprehensive medicine information using LLM + CSV data
        
        Args:
            ocr_text: Text extracted from medicine image via OCR
            medicine_info: Medicine data from CSV RAG
            
        Returns:
            Generated medicine information with LLM insights
        """
        
        if not medicine_info.get('found'):
            logger.warning(f"Medicine not found in CSV: {medicine_info.get('name')}")
            return MedicineLLMGenerator._create_fallback_response(medicine_info)
        
        # Create prompt for LLM with CSV data
        prompt = MedicineLLMGenerator._create_llm_prompt(ocr_text, medicine_info)
        
        try:
            logger.info(f"🧠 Generating medicine info using LLM for: {medicine_info.get('name')}")
            
            # Call Ollama LLM
            response = requests.post(
                MedicineLLMGenerator.OLLAMA_URL,
                json={
                    "model": MedicineLLMGenerator.MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "temperature": 0.3,  # Lower temperature for factual output
                },
                timeout=MedicineLLMGenerator.TIMEOUT
            )
            
            if response.status_code == 200:
                llm_output = response.json().get('response', '')
                logger.info("✅ LLM generated medicine information successfully")
                
                # Parse and structure LLM output
                return MedicineLLMGenerator._parse_llm_output(
                    llm_output, 
                    medicine_info
                )
            else:
                logger.warning(f"LLM returned status {response.status_code}")
                return MedicineLLMGenerator._create_csv_based_response(medicine_info)
                
        except requests.exceptions.Timeout:
            logger.warning("⏱️ LLM timeout, using CSV data directly")
            return MedicineLLMGenerator._create_csv_based_response(medicine_info)
        except Exception as e:
            logger.error(f"❌ LLM generation error: {e}")
            return MedicineLLMGenerator._create_csv_based_response(medicine_info)
    
    @staticmethod
    def _create_llm_prompt(ocr_text: str, medicine_info: Dict[str, Any]) -> str:
        """Create structured prompt for LLM"""
        
        csv_context = MedicineCSVRAG.format_for_llm(medicine_info)
        
        prompt = f"""Based on the following medicine database information, provide detailed medical guidance:

{csv_context}

Patient observation from image: {ocr_text}

Please provide:
1. Medicine Overview: Brief description of the medicine
2. Uses: Primary indications and uses
3. Dosage Recommendations: Safe dosage information
4. Administration: How to take the medicine
5. Precautions: Important warnings and precautions
6. Side Effects: Possible side effects to watch for
7. Drug Interactions: Potential interactions
8. Storage: Proper storage conditions
9. Contraindications: Who should not take this medicine

Format your response clearly with each section labeled."""
        
        return prompt
    
    @staticmethod
    def _parse_llm_output(llm_text: str, medicine_info: Dict[str, Any]) -> Dict[str, Any]:
        """Parse LLM output and structure it"""
        
        result = {
            "medicine_name": medicine_info.get('name', 'Unknown'),
            "category": medicine_info.get('category'),
            "dosage_form": medicine_info.get('dosage_form'),
            "strength": medicine_info.get('strength'),
            "manufacturer": medicine_info.get('manufacturer'),
            "indication": medicine_info.get('indication'),
            "classification": medicine_info.get('classification'),
            "llm_generated": True,
            "detailed_info": llm_text,
            "source": "LLM + CSV Database"
        }
        
        # Extract key information from LLM output
        sections = MedicineLLMGenerator._extract_sections(llm_text)
        result.update(sections)
        
        return result
    
    @staticmethod
    def _extract_sections(text: str) -> Dict[str, str]:
        """Extract key sections from LLM output"""
        
        sections = {
            "overview": "",
            "uses": "",
            "dosage": "",
            "administration": "",
            "precautions": "",
            "side_effects": "",
            "interactions": "",
            "storage": "",
            "contraindications": ""
        }
        
        # Simple section extraction
        lines = text.split('\n')
        current_section = None
        
        for line in lines:
            line_lower = line.lower()
            
            if 'overview' in line_lower:
                current_section = 'overview'
            elif 'uses' in line_lower:
                current_section = 'uses'
            elif 'dosage' in line_lower:
                current_section = 'dosage'
            elif 'administration' in line_lower:
                current_section = 'administration'
            elif 'precautions' in line_lower or 'warnings' in line_lower:
                current_section = 'precautions'
            elif 'side effects' in line_lower:
                current_section = 'side_effects'
            elif 'interaction' in line_lower:
                current_section = 'interactions'
            elif 'storage' in line_lower:
                current_section = 'storage'
            elif 'contraindication' in line_lower:
                current_section = 'contraindications'
            elif current_section and line.strip():
                sections[current_section] += line + "\n"
        
        # Clean up sections
        for key in sections:
            sections[key] = sections[key].strip()
        
        return sections
    
    @staticmethod
    def _create_csv_based_response(medicine_info: Dict[str, Any]) -> Dict[str, Any]:
        """Create response based on CSV data when LLM unavailable"""
        
        logger.info(f"📊 Creating response from CSV data for: {medicine_info.get('name')}")
        
        return {
            "medicine_name": medicine_info.get('name', 'Unknown'),
            "category": medicine_info.get('category'),
            "dosage_form": medicine_info.get('dosage_form'),
            "strength": medicine_info.get('strength'),
            "manufacturer": medicine_info.get('manufacturer'),
            "indication": medicine_info.get('indication'),
            "classification": medicine_info.get('classification'),
            "llm_generated": False,
            "detailed_info": f"""
Medicine Information:
- Name: {medicine_info.get('name')}
- Category: {medicine_info.get('category')}
- Dosage Form: {medicine_info.get('dosage_form')}
- Strength: {medicine_info.get('strength')}
- Manufacturer: {medicine_info.get('manufacturer')}
- Indication: {medicine_info.get('indication')}
- Classification: {medicine_info.get('classification')}

Note: This information is retrieved from the medicine database. 
Please consult with a healthcare professional for personalized medical advice.
""",
            "source": "CSV Database",
            "warning": "Always consult a healthcare professional before taking any medicine"
        }
    
    @staticmethod
    def _create_fallback_response(medicine_info: Dict[str, Any]) -> Dict[str, Any]:
        """Create response when medicine not found"""
        
        return {
            "medicine_name": medicine_info.get('name', 'Unknown'),
            "found": False,
            "llm_generated": False,
            "detailed_info": f"""
Medicine '{medicine_info.get('name')}' was not found in the database.

Possible reasons:
1. The medicine name may have been misidentified in the image
2. The medicine might be known by a different name
3. The medicine may not be in the current database

Recommendation:
- Please consult a pharmacist or healthcare professional
- Verify the medicine name from the original packaging
- Check for generic or brand names of the medicine

For your safety, always consult with a qualified healthcare professional.
""",
            "source": "Not Found",
            "warning": "Please consult a healthcare professional for accurate medicine information"
        }
