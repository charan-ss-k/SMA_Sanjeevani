"""
Medicine CSV RAG Service
Loads medicine dataset from CSV and provides RAG (Retrieval Augmented Generation)
capabilities integrated with LLM for intelligent medicine information generation.
"""

import pandas as pd
import logging
from typing import Dict, Any, List, Optional
from difflib import get_close_matches
import os

logger = logging.getLogger(__name__)

class MedicineCSVRAG:
    """
    CSV-based RAG system for medicine information.
    Loads medicine dataset and provides fuzzy search and retrieval.
    """
    
    _df = None
    _medicine_index = None
    
    @classmethod
    def load_dataset(cls):
        """Load medicine dataset from CSV file"""
        if cls._df is not None:
            return  # Already loaded
        
        try:
            # Try multiple possible locations
            possible_paths = [
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'medicine_dataset.csv'),
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'medicine_dataset.csv'),
                'medicine_dataset.csv'
            ]
            
            csv_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    csv_path = path
                    break
            
            if csv_path is None:
                logger.warning(f"Medicine dataset not found in any location")
                cls._df = pd.DataFrame()
                return
            
            cls._df = pd.read_csv(csv_path)
            logger.info(f"✅ Loaded {len(cls._df)} medicines from CSV")
            
            # Create index for faster lookups
            cls._medicine_index = {
                name.lower(): idx 
                for idx, name in enumerate(cls._df['Name'].values)
            }
            logger.info(f"✅ Created medicine index with {len(cls._medicine_index)} entries")
            
        except Exception as e:
            logger.error(f"❌ Error loading medicine dataset: {e}")
            cls._df = pd.DataFrame()
    
    @classmethod
    def search_medicine(cls, medicine_name: str) -> Optional[Dict[str, Any]]:
        """
        Search for medicine in dataset using fuzzy matching
        
        Args:
            medicine_name: Medicine name to search
            
        Returns:
            Dictionary with medicine data or None if not found
        """
        cls.load_dataset()
        
        if cls._df.empty:
            return None
        
        medicine_lower = medicine_name.lower().strip()
        
        # Exact match first
        if medicine_lower in cls._medicine_index:
            idx = cls._medicine_index[medicine_lower]
            return cls._df.iloc[idx].to_dict()
        
        # Fuzzy match
        all_medicines = list(cls._medicine_index.keys())
        matches = get_close_matches(medicine_lower, all_medicines, n=3, cutoff=0.6)
        
        if matches:
            logger.info(f"Fuzzy matched '{medicine_name}' to '{matches[0]}'")
            idx = cls._medicine_index[matches[0]]
            return cls._df.iloc[idx].to_dict()
        
        return None
    
    @classmethod
    def search_by_category(cls, category: str) -> List[Dict[str, Any]]:
        """
        Search medicines by category
        
        Args:
            category: Medicine category
            
        Returns:
            List of matching medicine records
        """
        cls.load_dataset()
        
        if cls._df.empty:
            return []
        
        matching = cls._df[
            cls._df['Category'].str.lower() == category.lower()
        ]
        
        return matching.to_dict('records')[:10]  # Return top 10
    
    @classmethod
    def search_by_indication(cls, indication: str) -> List[Dict[str, Any]]:
        """
        Search medicines by indication (disease/symptom)
        
        Args:
            indication: Indication/symptom
            
        Returns:
            List of matching medicine records
        """
        cls.load_dataset()
        
        if cls._df.empty:
            return []
        
        matching = cls._df[
            cls._df['Indication'].str.lower() == indication.lower()
        ]
        
        return matching.to_dict('records')[:10]  # Return top 10
    
    @classmethod
    def get_medicine_info(cls, medicine_name: str) -> Dict[str, Any]:
        """
        Get complete medicine information from CSV
        
        Args:
            medicine_name: Medicine name
            
        Returns:
            Complete medicine information dictionary
        """
        medicine_data = cls.search_medicine(medicine_name)
        
        if medicine_data is None:
            logger.warning(f"Medicine '{medicine_name}' not found in dataset")
            return {
                "name": medicine_name,
                "found": False,
                "message": "Medicine not found in database"
            }
        
        # Convert to clean dictionary
        return {
            "name": medicine_data.get('Name', 'Unknown'),
            "category": medicine_data.get('Category', 'Unknown'),
            "dosage_form": medicine_data.get('Dosage Form', 'Unknown'),
            "strength": medicine_data.get('Strength', 'Unknown'),
            "manufacturer": medicine_data.get('Manufacturer', 'Unknown'),
            "indication": medicine_data.get('Indication', 'Unknown'),
            "classification": medicine_data.get('Classification', 'Unknown'),
            "found": True,
            "raw_data": medicine_data
        }
    
    @classmethod
    def get_all_medicines_count(cls) -> int:
        """Get total count of medicines in dataset"""
        cls.load_dataset()
        return len(cls._df) if cls._df is not None else 0
    
    @classmethod
    def format_for_llm(cls, medicine_info: Dict[str, Any]) -> str:
        """
        Format medicine information as context for LLM
        
        Args:
            medicine_info: Medicine information dictionary
            
        Returns:
            Formatted string for LLM input
        """
        if not medicine_info.get('found'):
            return f"Medicine: {medicine_info.get('name')}\nStatus: Not found in database"
        
        return f"""Medicine Database Information:
Name: {medicine_info.get('name')}
Category: {medicine_info.get('category')}
Dosage Form: {medicine_info.get('dosage_form')}
Strength: {medicine_info.get('strength')}
Manufacturer: {medicine_info.get('manufacturer')}
Indication: {medicine_info.get('indication')}
Classification: {medicine_info.get('classification')}"""
