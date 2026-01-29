"""
Doctor Search and Management Routes
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import pandas as pd
import logging
from typing import List, Optional
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])

# Load doctor data from CSV
def load_doctors_data():
    """Load and cache doctor data from CSV"""
    csv_path = os.path.join(os.path.dirname(__file__), "../../../indian_doctors_dataset (1).csv")
    
    try:
        df = pd.read_csv(csv_path)
        logger.info(f"✅ Loaded {len(df)} doctors from CSV")
        return df
    except Exception as e:
        logger.error(f"❌ Failed to load doctors CSV: {e}")
        return None

# Cache the doctors data
_doctors_cache = None

def get_doctors_data():
    """Get cached doctors data"""
    global _doctors_cache
    if _doctors_cache is None:
        _doctors_cache = load_doctors_data()
    return _doctors_cache


class DoctorSearchRequest(BaseModel):
    """Search request for doctors"""
    symptoms: Optional[str] = None
    locality: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    language: Optional[str] = None
    specialization: Optional[str] = None


class DoctorResponse(BaseModel):
    """Doctor response model"""
    id: str
    name: str
    specialization: str
    hospital: str
    locality: str
    city: str
    state: str
    phone: str
    email: str
    languages: List[str]
    match_score: float


def parse_location(location_str: str) -> tuple[str, str]:
    """Parse 'City, State' format"""
    try:
        parts = location_str.split(", ")
        if len(parts) == 2:
            return parts[0].strip(), parts[1].strip()
    except:
        pass
    return "", ""


def calculate_match_score(doctor_row, search_params) -> float:
    """Calculate match score for a doctor based on search criteria"""
    score = 0
    max_score = 100
    
    # Extract search criteria
    search_locality = (search_params.get("locality") or "").lower().strip()
    search_city = (search_params.get("city") or "").lower().strip()
    search_state = (search_params.get("state") or "").lower().strip()
    search_language = (search_params.get("language") or "").lower().strip()
    search_specialization = (search_params.get("specialization") or "").lower().strip()
    
    # Extract doctor data
    doctor_locality = (doctor_row.get("Locality") or "").lower().strip()
    doctor_specialization = (doctor_row.get("Specialization") or "").lower().strip()
    doctor_languages = (doctor_row.get("Languages Known") or "").lower()
    
    # Parse location
    area_location = doctor_row.get("Area / City & State") or ""
    doctor_city, doctor_state = parse_location(area_location)
    doctor_city = doctor_city.lower().strip()
    doctor_state = doctor_state.lower().strip()
    
    # Scoring: locality match (40 points)
    if search_locality and search_locality in doctor_locality:
        score += 40
    
    # Scoring: city match (30 points)
    if search_city and search_city in doctor_city:
        score += 30
    
    # Scoring: state match (15 points)
    if search_state and search_state in doctor_state:
        score += 15
    
    # Scoring: language match (20 points)
    if search_language:
        if search_language in doctor_languages:
            score += 20
    
    # Scoring: specialization match (25 points)
    if search_specialization and search_specialization in doctor_specialization:
        score += 25
    
    # Base score if at least one match
    if score > 0:
        return min(score, max_score)
    
    # Return small score if no criteria match (general practitioners)
    return 10


@router.post("/search")
async def search_doctors(request: DoctorSearchRequest):
    """Search for doctors based on criteria"""
    try:
        df = get_doctors_data()
        
        if df is None or df.empty:
            raise HTTPException(status_code=500, detail="Doctor data not available")
        
        # Convert to list of dicts for processing
        doctors_list = df.to_dict("records")
        
        # Calculate match scores
        search_params = {
            "locality": request.locality,
            "city": request.city,
            "state": request.state,
            "language": request.language,
            "specialization": request.specialization,
        }
        
        scored_doctors = []
        for doctor in doctors_list:
            match_score = calculate_match_score(doctor, search_params)
            
            # Parse languages
            languages_str = doctor.get("Languages Known") or ""
            languages = [lang.strip() for lang in languages_str.split(",") if lang.strip()]
            
            # Parse location
            area_location = doctor.get("Area / City & State") or ""
            city, state = parse_location(area_location)
            
            doctor_response = {
                "id": doctor.get("Employee ID", ""),
                "name": doctor.get("Doctor Name", ""),
                "specialization": doctor.get("Specialization", ""),
                "hospital": doctor.get("Hospital Name", ""),
                "locality": doctor.get("Locality", ""),
                "city": city,
                "state": state,
                "phone": str(doctor.get("Phone Number", "")).lstrip("-"),
                "email": doctor.get("Email Address", ""),
                "languages": languages,
                "match_score": match_score
            }
            
            # Only include doctors with match score > 0
            if match_score > 0:
                scored_doctors.append(doctor_response)
        
        # Sort by match score descending
        scored_doctors.sort(key=lambda x: x["match_score"], reverse=True)
        
        # Return top 10 results
        top_doctors = scored_doctors[:10]
        
        return {
            "total": len(top_doctors),
            "doctors": top_doctors
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Doctor search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/")
async def get_all_doctors(
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    """Get all doctors with pagination"""
    try:
        df = get_doctors_data()
        
        if df is None or df.empty:
            raise HTTPException(status_code=500, detail="Doctor data not available")
        
        doctors_list = df.to_dict("records")
        
        # Apply pagination
        paginated_doctors = doctors_list[skip:skip + limit]
        
        # Format response
        formatted_doctors = []
        for doctor in paginated_doctors:
            # Parse languages
            languages_str = doctor.get("Languages Known") or ""
            languages = [lang.strip() for lang in languages_str.split(",") if lang.strip()]
            
            # Parse location
            area_location = doctor.get("Area / City & State") or ""
            city, state = parse_location(area_location)
            
            doctor_response = {
                "id": doctor.get("Employee ID", ""),
                "name": doctor.get("Doctor Name", ""),
                "specialization": doctor.get("Specialization", ""),
                "hospital": doctor.get("Hospital Name", ""),
                "locality": doctor.get("Locality", ""),
                "city": city,
                "state": state,
                "phone": str(doctor.get("Phone Number", "")).lstrip("-"),
                "email": doctor.get("Email Address", ""),
                "languages": languages,
                "match_score": 50  # Default for all doctors endpoint
            }
            formatted_doctors.append(doctor_response)
        
        return {
            "total": len(doctors_list),
            "skip": skip,
            "limit": limit,
            "doctors": formatted_doctors
        }
    
    except Exception as e:
        logger.error(f"❌ Get doctors error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch doctors: {str(e)}")


@router.get("/{doctor_id}")
async def get_doctor(doctor_id: str):
    """Get a specific doctor by ID"""
    try:
        df = get_doctors_data()
        
        if df is None or df.empty:
            raise HTTPException(status_code=500, detail="Doctor data not available")
        
        # Find doctor by Employee ID
        doctor = df[df["Employee ID"] == doctor_id].to_dict("records")
        
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        doctor_data = doctor[0]
        
        # Parse languages
        languages_str = doctor_data.get("Languages Known") or ""
        languages = [lang.strip() for lang in languages_str.split(",") if lang.strip()]
        
        # Parse location
        area_location = doctor_data.get("Area / City & State") or ""
        city, state = parse_location(area_location)
        
        doctor_response = {
            "id": doctor_data.get("Employee ID", ""),
            "name": doctor_data.get("Doctor Name", ""),
            "specialization": doctor_data.get("Specialization", ""),
            "hospital": doctor_data.get("Hospital Name", ""),
            "locality": doctor_data.get("Locality", ""),
            "city": city,
            "state": state,
            "phone": str(doctor_data.get("Phone Number", "")).lstrip("-"),
            "email": doctor_data.get("Email Address", ""),
            "languages": languages,
            "match_score": 100
        }
        
        return doctor_response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get doctor error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch doctor: {str(e)}")
