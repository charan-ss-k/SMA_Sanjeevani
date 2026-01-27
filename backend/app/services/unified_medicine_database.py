"""
Unified Medicine Database Service
Merges multiple CSV datasets and provides comprehensive medicine information
Integrates with PostgreSQL and Azure storage
"""

import pandas as pd
import logging
import os
import json
from typing import Dict, Any, List, Optional
from difflib import get_close_matches
from datetime import datetime

logger = logging.getLogger(__name__)

class UnifiedMedicineDatabase:
    """
    Unified medicine database combining:
    1. medicine_dataset.csv (50K+ medicines)
    2. A_Z_medicines_dataset_of_India.csv (250K+ medicines with pricing/composition)
    
    Provides unified search and retrieval across all medicines.
    """
    
    _df_combined = None
    _medicine_index = None
    _loaded = False
    
    @classmethod
    def load_all_datasets(cls):
        """Load and merge all medicine datasets"""
        if cls._loaded:
            return  # Already loaded
        
        logger.info("🔄 Loading and merging medicine datasets...")
        
        try:
            # Find datasets
            possible_paths = [
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'medicine_dataset.csv'),
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'A_Z_medicines_dataset_of_India.csv'),
                'medicine_dataset.csv',
                'A_Z_medicines_dataset_of_India.csv'
            ]
            
            datasets = []
            
            # Load medicine_dataset.csv (50K+ generic medicines)
            for path in possible_paths:
                if 'medicine_dataset.csv' in path and os.path.exists(path):
                    df1 = pd.read_csv(path)
                    logger.info(f"✅ Loaded medicine_dataset.csv: {len(df1)} records")
                    df1['source'] = 'generic_database'
                    df1['dataset_version'] = '1.0'
                    df1['load_date'] = datetime.now().isoformat()
                    datasets.append(df1)
                    break
            
            # Load A_Z_medicines_dataset_of_India.csv (250K+ Indian medicines with pricing)
            for path in possible_paths:
                if 'A_Z_medicines' in path and os.path.exists(path):
                    df2 = pd.read_csv(path)
                    logger.info(f"✅ Loaded A_Z_medicines_dataset_of_India.csv: {len(df2)} records")
                    df2['source'] = 'india_database'
                    df2['dataset_version'] = '2.0'
                    df2['load_date'] = datetime.now().isoformat()
                    datasets.append(df2)
                    break
            
            if not datasets:
                logger.error("❌ No medicine datasets found")
                cls._df_combined = pd.DataFrame()
                cls._loaded = True
                return
            
            # Merge datasets intelligently
            if len(datasets) == 2:
                # Standardize column names for merging
                df1, df2 = datasets
                
                # Create combined dataset with all columns
                df_combined = pd.concat([df1, df2], ignore_index=True, sort=False)
                
                # Fill missing values
                df_combined = df_combined.fillna('Not specified')
                
                logger.info(f"✅ Combined dataset: {len(df_combined)} total medicines")
            else:
                df_combined = datasets[0] if datasets else pd.DataFrame()
                logger.info(f"✅ Using single dataset: {len(df_combined)} medicines")
            
            # Create medicine index for fast lookup
            cls._df_combined = df_combined
            cls._create_index()
            cls._loaded = True
            
            logger.info(f"✅ Unified database ready: {len(cls._df_combined)} medicines indexed")
            
        except Exception as e:
            logger.error(f"❌ Error loading datasets: {e}")
            cls._df_combined = pd.DataFrame()
            cls._loaded = True
    
    @classmethod
    def _create_index(cls):
        """Create fast lookup index"""
        try:
            cls._medicine_index = {}
            
            # Index by name
            if 'name' in cls._df_combined.columns:
                for idx, name in enumerate(cls._df_combined['name'].values):
                    if pd.notna(name):
                        cls._medicine_index[str(name).lower().strip()] = idx
            
            # Also try Name (capital N)
            elif 'Name' in cls._df_combined.columns:
                for idx, name in enumerate(cls._df_combined['Name'].values):
                    if pd.notna(name):
                        cls._medicine_index[str(name).lower().strip()] = idx
            
            logger.info(f"✅ Created index with {len(cls._medicine_index)} entries")
        except Exception as e:
            logger.warning(f"⚠️ Error creating index: {e}")
            cls._medicine_index = {}
    
    @classmethod
    def search_medicine(cls, medicine_name: str) -> Optional[Dict[str, Any]]:
        """Search for medicine with fuzzy matching"""
        cls.load_all_datasets()
        
        if cls._df_combined.empty or not medicine_name:
            return None
        
        medicine_lower = medicine_name.lower().strip()
        
        # Exact match first
        if medicine_lower in cls._medicine_index:
            idx = cls._medicine_index[medicine_lower]
            return cls._df_combined.iloc[idx].to_dict()
        
        # Try partial name match
        for med_key in cls._medicine_index:
            if medicine_lower in med_key:
                idx = cls._medicine_index[med_key]
                return cls._df_combined.iloc[idx].to_dict()
        
        # Fuzzy match
        all_medicines = list(cls._medicine_index.keys())
        matches = get_close_matches(medicine_lower, all_medicines, n=1, cutoff=0.6)
        
        if matches:
            logger.info(f"✅ Fuzzy matched '{medicine_name}' to '{matches[0]}'")
            idx = cls._medicine_index[matches[0]]
            return cls._df_combined.iloc[idx].to_dict()
        
        return None
    
    @classmethod
    def get_medicine_info(cls, medicine_name: str) -> Dict[str, Any]:
        """Get complete medicine information"""
        medicine_data = cls.search_medicine(medicine_name)
        
        if medicine_data is None:
            return {
                "name": medicine_name,
                "found": False,
                "message": "Medicine not found in database"
            }
        
        # Build comprehensive info from available columns
        info = {
            "found": True,
            "source": medicine_data.get('source', 'database'),
            "dataset_version": medicine_data.get('dataset_version', 'unknown'),
            
            # Generic info
            "name": medicine_data.get('name') or medicine_data.get('Name', 'Unknown'),
            "category": medicine_data.get('category') or medicine_data.get('Category', 'Not specified'),
            
            # Indian dataset specific
            "price": medicine_data.get('price(₹)', 'Not specified'),
            "manufacturer": medicine_data.get('manufacturer_name') or medicine_data.get('Manufacturer', 'Not specified'),
            "type": medicine_data.get('type', 'Not specified'),
            "pack_size": medicine_data.get('pack_size_label', 'Not specified'),
            "is_discontinued": medicine_data.get('Is_discontinued', False),
            
            # Composition
            "composition": [],
            "composition1": medicine_data.get('short_composition1', ''),
            "composition2": medicine_data.get('short_composition2', ''),
            
            # Generic dataset specific
            "dosage_form": medicine_data.get('Dosage Form', 'Not specified'),
            "strength": medicine_data.get('Strength', 'Not specified'),
            "indication": medicine_data.get('Indication', 'Not specified'),
            "classification": medicine_data.get('Classification', 'Not specified'),
            
            # Raw data for LLM context
            "raw_data": medicine_data
        }
        
        # Combine compositions
        if info['composition1']:
            info['composition'].append(info['composition1'])
        if info['composition2']:
            info['composition'].append(info['composition2'])
        
        return info
    
    @classmethod
    def get_total_medicines(cls) -> int:
        """Get total number of medicines"""
        cls.load_all_datasets()
        return len(cls._df_combined) if cls._df_combined is not None else 0
    
    @classmethod
    def format_for_llm_comprehensive(cls, medicine_info: Dict[str, Any]) -> str:
        """Format medicine info comprehensively for LLM prompt"""
        if not medicine_info.get('found'):
            return f"Medicine: {medicine_info.get('name')}\nStatus: Not found in database"
        
        composition_str = '\n  - '.join(medicine_info.get('composition', []))
        
        context = f"""MEDICINE DATABASE INFORMATION:

Name: {medicine_info.get('name', 'Unknown')}
Category: {medicine_info.get('category', 'Not specified')}
Type: {medicine_info.get('type', 'Not specified')}
Classification: {medicine_info.get('classification', 'Not specified')}

COMPOSITION:
  - {composition_str if composition_str else 'Not specified'}

DOSAGE & PACKAGING:
- Dosage Form: {medicine_info.get('dosage_form', 'Not specified')}
- Strength: {medicine_info.get('strength', 'Not specified')}
- Pack Size: {medicine_info.get('pack_size', 'Not specified')}

MANUFACTURER & AVAILABILITY:
- Manufacturer: {medicine_info.get('manufacturer', 'Not specified')}
- Price: {medicine_info.get('price', 'Not specified')}
- Discontinued: {medicine_info.get('is_discontinued', 'No')}

MEDICAL USE:
- Indication: {medicine_info.get('indication', 'Not specified')}

Data Source: {medicine_info.get('source', 'database')} (Dataset v{medicine_info.get('dataset_version', 'unknown')})"""
        
        return context
    
    @classmethod
    def search_by_category(cls, category: str) -> List[Dict[str, Any]]:
        """Search medicines by category"""
        cls.load_all_datasets()
        
        if cls._df_combined.empty:
            return []
        
        # Search in both Category columns
        matches = []
        for col in ['Category', 'category', 'type']:
            if col in cls._df_combined.columns:
                matching = cls._df_combined[
                    cls._df_combined[col].astype(str).str.lower().str.contains(category.lower(), na=False)
                ]
                matches.extend(matching.to_dict('records')[:5])
        
        return matches[:10]
    
    @classmethod
    def search_by_manufacturer(cls, manufacturer: str) -> List[Dict[str, Any]]:
        """Search medicines by manufacturer"""
        cls.load_all_datasets()
        
        if cls._df_combined.empty:
            return []
        
        # Search in both manufacturer columns
        matches = []
        for col in ['manufacturer_name', 'Manufacturer']:
            if col in cls._df_combined.columns:
                matching = cls._df_combined[
                    cls._df_combined[col].astype(str).str.lower().str.contains(manufacturer.lower(), na=False)
                ]
                matches.extend(matching.to_dict('records')[:5])
        
        return matches[:10]
    
    @classmethod
    def get_statistics(cls) -> Dict[str, Any]:
        """Get database statistics"""
        cls.load_all_datasets()
        
        if cls._df_combined.empty:
            return {"status": "empty"}
        
        return {
            "total_medicines": len(cls._df_combined),
            "data_sources": cls._df_combined['source'].unique().tolist() if 'source' in cls._df_combined.columns else [],
            "columns": cls._df_combined.columns.tolist(),
            "datasets_merged": cls._loaded
        }
