"""
Medicine Knowledge Base - RAG (Retrieval Augmented Generation)
Stores comprehensive medicine information for accurate identification and recommendations.
"""
import logging
from typing import Dict, Any, List, Optional
from difflib import get_close_matches

logger = logging.getLogger(__name__)

# Comprehensive Medicine Knowledge Base
MEDICINE_DATABASE = {
    "paracetamol": {
        "name": "Paracetamol",
        "brand_names": ["Crocin", "Dolo", "Tylenol", "Pyremust", "Panadol"],
        "generic_name": "Paracetamol (Acetaminophen)",
        "category": "Analgesic & Antipyretic",
        "composition": "Paracetamol 500mg/650mg",
        "form": "Tablets, Capsules, Syrup",
        "uses": "Fever, pain, headache, body ache",
        "dosage": {
            "adults": "500-650mg every 4-6 hours, max 4g/day",
            "children_12_17": "250-500mg every 4-6 hours, max 3g/day",
            "children_6_11": "250-500mg every 4-6 hours, max 2g/day",
            "children_2_5": "120-250mg every 4-6 hours, max 1.5g/day",
            "infants": "Not recommended"
        },
        "food_interaction": "With or without food",
        "max_daily_dose": "4g (4000mg)",
        "side_effects": ["Nausea", "Vomiting", "Abdominal pain", "Rash"],
        "contraindications": ["Liver disease", "Kidney disease", "Alcohol abuse"],
        "overdose_risk": "Severe liver damage possible",
        "precautions": ["Avoid alcohol", "Do not exceed recommended dose", "Avoid if pregnant without consultation"],
        "avoid_if": ["Liver disease", "Kidney disease", "Alcoholism"],
        "age_restrictions": "Safe for adults and children above 2 years"
    },
    
    "cetirizine": {
        "name": "Cetirizine",
        "brand_names": ["Allergo", "Cetzine", "Theralergy", "Lizine"],
        "generic_name": "Cetirizine Dihydrochloride",
        "category": "Antihistamine",
        "composition": "Cetirizine 5mg or 10mg",
        "form": "Tablets, Syrup",
        "uses": "Allergies, itching, hives, allergic rhinitis, urticaria",
        "dosage": {
            "adults": "10mg once daily or 5mg twice daily",
            "children_12_17": "10mg once daily",
            "children_6_11": "5mg once daily",
            "children_2_5": "2.5mg once daily",
            "infants": "Not recommended"
        },
        "food_interaction": "With or without food",
        "max_daily_dose": "10mg",
        "side_effects": ["Drowsiness", "Fatigue", "Headache", "Dry mouth"],
        "contraindications": ["Severe kidney disease", "Hypersensitivity"],
        "overdose_risk": "Mild, mainly drowsiness",
        "precautions": ["May cause drowsiness, avoid driving", "Use with caution if pregnant"],
        "avoid_if": ["Severe renal impairment", "Known hypersensitivity"],
        "age_restrictions": "Safe for children above 2 years"
    },
    
    "ibuprofen": {
        "name": "Ibuprofen",
        "brand_names": ["Brufen", "Combiflam", "Ibugesic", "Afen"],
        "generic_name": "Ibuprofen",
        "category": "NSAID - Pain reliever & Anti-inflammatory",
        "composition": "Ibuprofen 200mg/400mg/600mg",
        "form": "Tablets, Capsules, Suspension",
        "uses": "Pain, fever, inflammation, arthritis, menstrual cramps",
        "dosage": {
            "adults": "200-400mg every 4-6 hours, max 3200mg/day",
            "children_12_17": "200-400mg every 4-6 hours, max 2400mg/day",
            "children_6_11": "150-200mg every 4-6 hours, max 1200mg/day",
            "children_2_5": "100mg every 6-8 hours, max 400mg/day",
            "infants": "Not recommended"
        },
        "food_interaction": "With food to reduce stomach irritation",
        "max_daily_dose": "3200mg",
        "side_effects": ["Stomach pain", "Heartburn", "Nausea", "Headache"],
        "contraindications": ["Peptic ulcer", "Heart disease", "Kidney disease", "Asthma"],
        "overdose_risk": "GI bleeding, renal damage",
        "precautions": ["Take with food", "Avoid alcohol", "Not for prolonged use"],
        "avoid_if": ["Peptic ulcer disease", "Heart disease", "Kidney/liver disease", "Asthma"],
        "age_restrictions": "Not recommended below 6 years without doctor consultation"
    },
    
    "amoxicillin": {
        "name": "Amoxicillin",
        "brand_names": ["Amoxyl", "Acillin", "Ospamox", "Meditoxin"],
        "generic_name": "Amoxicillin Trihydrate",
        "category": "Antibiotic - Beta-lactam",
        "composition": "Amoxicillin 250mg/500mg/875mg",
        "form": "Tablets, Capsules, Suspension",
        "uses": "Bacterial infections: respiratory, UTI, ear, skin, strep throat",
        "dosage": {
            "adults": "250-500mg every 8 hours OR 500-875mg every 12 hours",
            "children_12_17": "250-500mg every 8 hours",
            "children_6_11": "125-250mg every 8 hours",
            "children_2_5": "62.5-125mg every 8 hours",
            "infants": "Based on weight, consult doctor"
        },
        "food_interaction": "With or without food",
        "max_daily_dose": "4g",
        "side_effects": ["Diarrhea", "Nausea", "Vomiting", "Allergic reaction", "Rash"],
        "contraindications": ["Penicillin allergy", "Mononucleosis"],
        "overdose_risk": "Nausea, vomiting, diarrhea",
        "precautions": ["Complete full course", "Report if rash appears", "Tell doctor about allergies"],
        "avoid_if": ["Penicillin/cephalosporin allergy", "Mononucleosis"],
        "age_restrictions": "Safe for all ages when prescribed"
    },
    
    "metformin": {
        "name": "Metformin",
        "brand_names": ["Glucophage", "Diabetase", "Formin", "Metofolan"],
        "generic_name": "Metformin Hydrochloride",
        "category": "Antidiabetic",
        "composition": "Metformin 500mg/850mg/1000mg",
        "form": "Tablets, Extended-release",
        "uses": "Type 2 diabetes, prediabetes, PCOS",
        "dosage": {
            "adults": "500mg once/twice daily, max 2500mg/day",
            "children_10_17": "500mg once/twice daily, max 2000mg/day",
            "children_below_10": "Not recommended",
            "elderly": "Start low, may need dose adjustment"
        },
        "food_interaction": "With meals to reduce GI upset",
        "max_daily_dose": "2500mg",
        "side_effects": ["Nausea", "Diarrhea", "Stomach pain", "Metallic taste", "Loss of appetite"],
        "contraindications": ["Kidney disease (eGFR<30)", "Liver disease", "Heart failure", "Acute illness"],
        "overdose_risk": "Lactic acidosis (rare but serious)",
        "precautions": ["Take with meals", "Stay hydrated", "Monitor kidney function", "Skip if sick"],
        "avoid_if": ["Severe kidney disease", "Liver disease", "Heart failure", "Recent contrast dye procedure"],
        "age_restrictions": "Typically for adults; children require specialist supervision"
    },
    
    "omeprazole": {
        "name": "Omeprazole",
        "brand_names": ["Omez", "Prilosec", "Gastrogard", "Acidex"],
        "generic_name": "Omeprazole",
        "category": "Proton Pump Inhibitor (PPI)",
        "composition": "Omeprazole 20mg/40mg",
        "form": "Capsules, Tablets",
        "uses": "Acid reflux, GERD, ulcers, gastritis",
        "dosage": {
            "adults": "20mg once daily before food, can increase to 40mg",
            "children_1_17": "0.5-1mg/kg/day, max 20mg",
            "infants": "Consult doctor",
            "elderly": "Same as adults"
        },
        "food_interaction": "30 minutes before breakfast",
        "max_daily_dose": "40mg",
        "side_effects": ["Headache", "Diarrhea", "Nausea", "Abdominal pain"],
        "contraindications": ["Clopidogrel use", "Severe liver disease"],
        "overdose_risk": "Mild, rarely serious",
        "precautions": ["Take 30 min before food", "Long-term use needs monitoring", "Not for sporadic use"],
        "avoid_if": ["Taking clopidogrel", "Severe liver disease"],
        "age_restrictions": "Safe for children above 1 year when prescribed"
    }
}


class MedicineRAG:
    """Retrieval Augmented Generation for Medicine Information"""
    
    @staticmethod
    def search_medicine(medicine_name: str) -> Optional[Dict[str, Any]]:
        """
        Search for medicine in knowledge base using fuzzy matching.
        
        Args:
            medicine_name: Medicine name to search
            
        Returns:
            Medicine information dict or None
        """
        medicine_lower = medicine_name.lower().strip()
        
        # Exact match
        if medicine_lower in MEDICINE_DATABASE:
            return MEDICINE_DATABASE[medicine_lower]
        
        # Fuzzy match against medicine names
        all_medicines = list(MEDICINE_DATABASE.keys())
        matches = get_close_matches(medicine_lower, all_medicines, n=1, cutoff=0.6)
        
        if matches:
            logger.info(f"Fuzzy matched '{medicine_name}' to '{matches[0]}'")
            return MEDICINE_DATABASE[matches[0]]
        
        # Try matching against brand names
        for med_key, med_info in MEDICINE_DATABASE.items():
            brand_names = [b.lower() for b in med_info.get("brand_names", [])]
            if medicine_lower in brand_names:
                logger.info(f"Matched brand name '{medicine_name}' to '{med_key}'")
                return MEDICINE_DATABASE[med_key]
        
        logger.warning(f"Medicine '{medicine_name}' not found in knowledge base")
        return None
    
    @staticmethod
    def get_medicine_info(medicine_name: str) -> Dict[str, Any]:
        """
        Get complete medicine information for display.
        
        Args:
            medicine_name: Medicine name
            
        Returns:
            Complete medicine information
        """
        medicine = MedicineRAG.search_medicine(medicine_name)
        
        if not medicine:
            logger.warning(f"Medicine '{medicine_name}' not in knowledge base, returning placeholder")
            return {
                "medicine_name": medicine_name,
                "composition": "Information not available",
                "dosage": {"adults": "Consult pharmacist or doctor"},
                "food_interaction": "Consult packaging",
                "precautions": ["Always consult healthcare professional"],
                "side_effects": [],
                "contraindications": [],
                "max_daily_dose": "See packaging",
                "duration_limit": "As prescribed",
                "age_restrictions": "Follow prescription",
                "warnings": ["Always verify with original packaging", "Consult healthcare professional"]
            }
        
        return {
            "medicine_name": medicine.get("name", "Unknown"),
            "brand_names": medicine.get("brand_names", []),
            "generic_name": medicine.get("generic_name"),
            "category": medicine.get("category"),
            "composition": medicine.get("composition"),
            "form": medicine.get("form"),
            "uses": medicine.get("uses"),
            "dosage": medicine.get("dosage", {}),
            "food_interaction": medicine.get("food_interaction"),
            "precautions": medicine.get("precautions", []),
            "side_effects": medicine.get("side_effects", []),
            "contraindications": medicine.get("contraindications", []),
            "max_daily_dose": medicine.get("max_daily_dose"),
            "overdose_risk": medicine.get("overdose_risk"),
            "age_restrictions": medicine.get("age_restrictions"),
            "avoid_if": medicine.get("avoid_if", []),
            "warnings": [
                "This information is from AI analysis",
                "Always consult a healthcare professional before taking any medicine",
                "Follow dosage as prescribed by your doctor or pharmacist"
            ]
        }
    
    @staticmethod
    def list_available_medicines() -> List[str]:
        """Get list of all available medicines in knowledge base"""
        return list(MEDICINE_DATABASE.keys())
    
    @staticmethod
    def search_by_category(category: str) -> List[str]:
        """Search medicines by category"""
        category_lower = category.lower()
        matching = [
            med_key for med_key, med_info in MEDICINE_DATABASE.items()
            if category_lower in med_info.get("category", "").lower()
        ]
        return matching
