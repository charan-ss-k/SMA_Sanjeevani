"""
Medicine Knowledge Base and RAG System
Provides retrieval-augmented generation for accurate medicine recommendations
"""

import json
import logging
from typing import List, Dict, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

# Global medicine knowledge base
MEDICINE_KNOWLEDGE_BASE = {
    "fever": {
        "condition": "Fever/Pyrexia",
        "synonyms": ["high temperature", "elevated temperature", "febrile"],
        "medicines": [
            {
                "name": "Paracetamol (Acetaminophen)",
                "common_brands": ["Crocin", "Dolo", "Paracip", "Tylenol"],
                "dosage": "500-1000mg per dose",
                "frequency": "Every 4-6 hours, max 3000mg/day",
                "age_adjustments": {
                    "child_6_12": "250-500mg per dose",
                    "adult": "500-1000mg per dose",
                    "elderly": "500mg per dose"
                },
                "mechanism": "Antipyretic and analgesic - reduces fever by hypothalamus action",
                "effectiveness": "Very effective for fever relief",
                "side_effects": ["Hepatotoxicity at high doses", "Allergic reactions"],
                "contraindications": ["Severe liver disease", "Paracetamol allergy"],
                "interactions": ["Alcohol (increases liver risk)"],
                "rating": 9
            },
            {
                "name": "Ibuprofen",
                "common_brands": ["Brufen", "Combiflam", "Ibugesic"],
                "dosage": "400-800mg per dose",
                "frequency": "Every 6-8 hours, max 2400mg/day",
                "age_adjustments": {
                    "child_6_12": "200-400mg per dose",
                    "adult": "400-800mg per dose",
                    "elderly": "200-400mg per dose"
                },
                "mechanism": "NSAID - inhibits prostaglandins, reduces inflammation and fever",
                "effectiveness": "Highly effective for fever and pain",
                "side_effects": ["Gastric irritation", "Renal effects", "Allergic reactions"],
                "contraindications": ["Peptic ulcer disease", "Severe renal disease", "NSAID allergy"],
                "interactions": ["NSAIDs combinations", "ACE inhibitors"],
                "rating": 9
            },
            {
                "name": "Aspirin",
                "common_brands": ["Aspirin", "Disprin"],
                "dosage": "325-500mg per dose",
                "frequency": "Every 4-6 hours, max 2000mg/day",
                "mechanism": "NSAID with antiplatelet properties",
                "effectiveness": "Effective for fever and mild pain",
                "contraindications": ["Children <12 years (Reye's syndrome risk)", "Bleeding disorders"],
                "rating": 7
            }
        ],
        "home_remedies": ["Rest", "Hydration", "Cool sponging", "Light meals"],
        "warning_signs": ["Fever >40°C", "Persistent fever >3 days", "Confusion", "Severe weakness"]
    },
    
    "cough": {
        "condition": "Cough (Tussis)",
        "synonyms": ["persistent cough", "dry cough", "productive cough", "hacking cough"],
        "medicines": [
            {
                "name": "Dextromethorphan (DXM) Cough Syrup",
                "common_brands": ["Coughex", "Tussivet", "Cosylan"],
                "dosage": "10-20ml per dose",
                "frequency": "3-4 times daily",
                "type": "Antitussive (cough suppressant)",
                "mechanism": "Acts on cough center in medulla, suppresses cough reflex",
                "effectiveness": "Very effective for dry, non-productive cough",
                "age_adjustments": {
                    "child_6_12": "5-10ml per dose",
                    "adult": "10-20ml per dose"
                },
                "contraindications": ["Productive cough (suppressing can be harmful)"],
                "rating": 9
            },
            {
                "name": "Guaifenesin (Expectorant)",
                "common_brands": ["Mucosolvan", "Glycodin", "Robitussin"],
                "dosage": "200-400mg per dose",
                "frequency": "3-4 times daily",
                "type": "Expectorant",
                "mechanism": "Increases mucus production, helps clear airway",
                "effectiveness": "Effective for productive, wet cough",
                "use": "Best for cough with phlegm",
                "rating": 8
            },
            {
                "name": "Salbutamol (Albuterol) Inhaler",
                "common_brands": ["Asthalin", "Levolin", "Cipla Aerocort"],
                "dosage": "1-2 inhalations",
                "frequency": "Every 4-6 hours as needed",
                "type": "Bronchodilator",
                "mechanism": "Relaxes airway smooth muscles, opens airways",
                "effectiveness": "Very effective for cough due to bronchospasm or asthma",
                "use": "For asthma-related or obstructive cough",
                "rating": 9
            }
        ],
        "home_remedies": ["Honey (1 teaspoon)", "Ginger-turmeric milk", "Warm water", "Avoid irritants"],
        "warning_signs": ["Cough lasting >3 weeks", "Bloody sputum", "Shortness of breath"]
    },
    
    "diarrhea": {
        "condition": "Diarrhea (Loose Stools)",
        "synonyms": ["loose motion", "loose stools", "gastroenteritis", "dysentery"],
        "medicines": [
            {
                "name": "Oral Rehydration Salts (ORS)",
                "common_brands": ["WHO-ORS", "Electral", "Goreg", "ORS packets"],
                "dosage": "1 sachet in 1 liter water",
                "frequency": "Sip continuously after each stool",
                "type": "Electrolyte replacement",
                "mechanism": "Replaces lost water and electrolytes",
                "effectiveness": "Critical for preventing dehydration",
                "priority": "FIRST LINE - Use immediately",
                "rating": 10
            },
            {
                "name": "Loperamide",
                "common_brands": ["Imodium", "Gastade", "Lop-A"],
                "dosage": "2mg per dose",
                "frequency": "After each loose stool, max 16mg/day",
                "age_adjustments": {
                    "child_2_12": "0.1mg/kg per dose",
                    "adult": "2mg per dose"
                },
                "type": "Anti-diarrheal",
                "mechanism": "Reduces intestinal motility and secretion",
                "effectiveness": "Very effective for stopping loose stools",
                "contraindications": ["Bloody diarrhea", "Severe abdominal pain", "Bacterial infection"],
                "rating": 8
            },
            {
                "name": "Zinc Supplement",
                "common_brands": ["Zinctral", "Shelcal-Z"],
                "dosage": "10-20mg elemental zinc",
                "frequency": "Once daily for 10 days",
                "type": "Mineral supplement",
                "mechanism": "Restores zinc, improves immune response",
                "effectiveness": "Proven to reduce diarrhea duration by 25%",
                "use": "Especially in malnourished patients",
                "rating": 8
            }
        ],
        "home_remedies": ["Buttermilk", "Rice water", "Coconut water", "Bland diet"],
        "warning_signs": ["Severe dehydration (no urine)", "Bloody stools", "Severe cramping", "Persistent >5 days"]
    },
    
    "headache": {
        "condition": "Headache (Cephalgia)",
        "synonyms": ["head pain", "migraine", "tension headache", "throbbing head"],
        "medicines": [
            {
                "name": "Paracetamol",
                "dosage": "500-1000mg per dose",
                "frequency": "Every 4-6 hours, max 3000mg/day",
                "effectiveness": "Good for mild to moderate headache",
                "rating": 8
            },
            {
                "name": "Ibuprofen",
                "dosage": "400-600mg per dose",
                "frequency": "Every 6-8 hours, max 2400mg/day",
                "effectiveness": "Better for migraine and tension headache",
                "rating": 9
            },
            {
                "name": "Aspirin with Caffeine",
                "common_brands": ["Aspirin+C", "Zerodol-C"],
                "dosage": "As per package",
                "frequency": "2-3 times daily",
                "mechanism": "Caffeine enhances pain relief",
                "effectiveness": "Excellent for severe headaches",
                "rating": 9
            }
        ],
        "warning_signs": ["Sudden severe headache", "Headache with fever", "Vision changes", "Neck stiffness"]
    },
    
    "nausea_vomiting": {
        "condition": "Nausea & Vomiting",
        "synonyms": ["feeling sick", "vomiting", "throwing up", "retching"],
        "medicines": [
            {
                "name": "Ondansetron",
                "common_brands": ["Emeset", "Voxit", "Ondogast"],
                "dosage": "4-8mg per dose",
                "frequency": "2-3 times daily",
                "type": "5-HT3 antagonist",
                "mechanism": "Blocks serotonin receptors in chemoreceptor trigger zone",
                "effectiveness": "Very effective for post-operative and chemotherapy nausea",
                "rating": 9
            },
            {
                "name": "Metoclopramide",
                "common_brands": ["Maxolon", "Perinorm", "Gastrocol"],
                "dosage": "10mg per dose",
                "frequency": "3 times daily",
                "mechanism": "Increases gastric motility, antiemetic action",
                "effectiveness": "Good for functional GI nausea",
                "rating": 8
            },
            {
                "name": "Domperidone",
                "common_brands": ["Domperidone", "Motinorm"],
                "dosage": "10mg per dose",
                "frequency": "3 times daily before meals",
                "mechanism": "Peripheral dopamine antagonist",
                "effectiveness": "Safe, good for nausea",
                "rating": 7
            }
        ],
        "home_remedies": ["Ginger tea", "Peppermint", "Small frequent meals", "Avoid spicy food"],
        "warning_signs": ["Persistent vomiting", "Inability to keep fluids down", "Severe abdominal pain"]
    },
    
    "stomach_pain": {
        "condition": "Gastroenteritis/Abdominal Pain",
        "synonyms": ["stomach cramps", "belly pain", "gastric pain", "indigestion"],
        "medicines": [
            {
                "name": "Antacid (Aluminum Hydroxide + Magnesium Hydroxide)",
                "common_brands": ["Gelusil", "Digene", "ENO"],
                "dosage": "15-30ml liquid or 1-2 tablets",
                "frequency": "3-4 times daily after meals",
                "mechanism": "Neutralizes gastric acid",
                "effectiveness": "Fast relief for acid-related pain",
                "rating": 8
            },
            {
                "name": "Omeprazole (PPI)",
                "common_brands": ["Omez", "Prilosec", "Meftop"],
                "dosage": "20-40mg once daily",
                "frequency": "Once daily, preferably morning",
                "mechanism": "Inhibits proton pump, reduces acid production",
                "effectiveness": "Best for GERD and peptic ulcers",
                "duration": "7-14 days",
                "rating": 9
            },
            {
                "name": "Ranitidine (H2 antagonist)",
                "common_brands": ["Zinetac", "Rantec"],
                "dosage": "150mg twice daily",
                "mechanism": "Blocks H2 receptors, reduces acid",
                "effectiveness": "Good for acid reflux",
                "rating": 8
            }
        ],
        "home_remedies": ["Avoid spicy food", "Eat light meals", "Avoid acidic drinks", "Rest"],
        "warning_signs": ["Severe persistent pain", "Vomiting blood", "Black stools", "Fever with pain"]
    }
}

class MedicineRAGSystem:
    """RAG System for medicine recommendations"""
    
    def __init__(self):
        self.knowledge_base = MEDICINE_KNOWLEDGE_BASE
        logger.info(f"Initialized Medicine RAG with {len(self.knowledge_base)} condition types")
    
    def get_medicines_for_symptom(self, symptom: str) -> Optional[Dict]:
        """
        Retrieve medicines for a specific symptom using RAG
        """
        symptom_lower = symptom.lower().strip()
        
        # Direct match
        if symptom_lower in self.knowledge_base:
            return self.knowledge_base[symptom_lower]
        
        # Fuzzy match with synonyms
        for condition_key, condition_data in self.knowledge_base.items():
            if "synonyms" in condition_data:
                for synonym in condition_data["synonyms"]:
                    if symptom_lower in synonym or synonym in symptom_lower:
                        return condition_data
        
        return None
    
    def format_for_llm_context(self, symptoms: List[str]) -> str:
        """
        Format medicine knowledge base for LLM context (RAG)
        """
        context = "# GLOBAL MEDICINE KNOWLEDGE BASE (from WHO and medical databases)\n\n"
        context += "Use this knowledge base to recommend medicines:\n\n"
        
        retrieved_conditions = []
        for symptom in symptoms:
            medicine_data = self.get_medicines_for_symptom(symptom)
            if medicine_data and medicine_data not in retrieved_conditions:
                retrieved_conditions.append(medicine_data)
        
        for idx, condition_data in enumerate(retrieved_conditions, 1):
            context += f"## {idx}. {condition_data['condition']}\n"
            context += f"Symptoms: {', '.join(condition_data['synonyms'][:3])}\n\n"
            
            context += "**Recommended Medicines:**\n"
            for med in condition_data['medicines'][:3]:  # Top 3 medicines
                context += f"- **{med['name']}** (Rating: {med.get('rating', 'N/A')}/10)\n"
                context += f"  - Brands: {med.get('common_brands', ['Generic'])[0]}\n"
                context += f"  - Dosage: {med.get('dosage', 'As prescribed')}\n"
                context += f"  - Mechanism: {med.get('mechanism', 'Standard action')}\n"
                context += f"  - Contraindications: {', '.join(med.get('contraindications', ['None']))}\n\n"
            
            if "home_remedies" in condition_data:
                context += f"**Home Remedies:** {', '.join(condition_data['home_remedies'][:3])}\n"
            
            context += f"**Warning Signs:** {', '.join(condition_data['warning_signs'][:2])}\n\n"
        
        return context
    
    def get_medicines_list(self, symptoms: List[str]) -> List[Dict]:
        """
        Get all available medicines for given symptoms
        """
        medicines_list = []
        
        for symptom in symptoms:
            medicine_data = self.get_medicines_for_symptom(symptom)
            if medicine_data and "medicines" in medicine_data:
                for med in medicine_data["medicines"]:
                    if med not in medicines_list:
                        medicines_list.append(med)
        
        return medicines_list

# Initialize global RAG system
rag_system = MedicineRAGSystem()


def get_rag_context(symptoms: List[str]) -> str:
    """Get RAG context for LLM"""
    return rag_system.format_for_llm_context(symptoms)


def get_available_medicines(symptoms: List[str]) -> List[Dict]:
    """Get available medicines from knowledge base"""
    return rag_system.get_medicines_list(symptoms)
