"""
Doctor consultation and recommendation API
"""
import json
import os
import csv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# CSV path - now in backend/resources folder
# From backend/app/services/consultation/router.py, go up to app, then to backend, then to resources
DOCTORS_CSV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../resources/indian_doctors_dataset (1).csv'))

print(f"🔍 CSV Path: {DOCTORS_CSV_PATH}")
print(f"🔍 CSV Exists: {os.path.exists(DOCTORS_CSV_PATH)}")

def load_doctors_dataset():
    """Load doctors dataset from CSV file with robust parsing"""
    doctors = []
    logger.info(f"📂 Attempting to load CSV from: {DOCTORS_CSV_PATH}")
    logger.info(f"📂 CSV file exists: {os.path.exists(DOCTORS_CSV_PATH)}")
    
    try:
        if not os.path.exists(DOCTORS_CSV_PATH):
            logger.error(f"❌ CSV file not found at {DOCTORS_CSV_PATH}")
            return doctors
            
        with open(DOCTORS_CSV_PATH, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # Parse 'Area / City & State' field
                area_city_state = row.get('Area / City & State', '').strip()
                city, state = '', ''
                if ',' in area_city_state:
                    parts = [p.strip() for p in area_city_state.split(',')]
                    city = parts[0]
                    state = ', '.join(parts[1:]) if len(parts) > 1 else ''
                
                # Parse languages known
                langs_str = row.get('Languages Known', '').strip()
                languages_known = [l.strip() for l in langs_str.split(',')] if langs_str else []
                
                # Create doctor object with all CSV fields
                doctor = {
                    'employee_id': row.get('Employee ID', '').strip(),
                    'doctor_name': row.get('Doctor Name', '').strip(),
                    'specialization': row.get('Specialization', '').strip(),
                    'hospital_name': row.get('Hospital Name', '').strip(),
                    'locality': row.get('Locality', '').strip(),
                    'city': city,
                    'state': state,
                    'phone_number': row.get('Phone Number', '').strip(),
                    'email_address': row.get('Email Address', '').strip(),
                    'native_language': row.get('Native Language', '').strip(),
                    'languages_known': languages_known,
                }
                doctors.append(doctor)
        logger.info(f"✅ Loaded {len(doctors)} doctors from CSV")
        return doctors
    except FileNotFoundError as e:
        logger.error(f"❌ Doctors dataset not found at {DOCTORS_CSV_PATH}: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error loading doctors dataset: {e}")
        return []

# Request models
class DoctorSearchRequest(BaseModel):
    state: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    specialization: Optional[str] = None
    language: Optional[str] = None
    hospital_name: Optional[str] = None
    languages_known: Optional[List[str]] = None

class AppointmentBookingRequest(BaseModel):
    doctor_id: str
    patient_name: str
    appointment_date: str
    appointment_time: str
    phone_number: str
    email: str
    notes: Optional[str] = None

# API Routes
@router.get("/doctors/test")
async def test_endpoint():
    """Test endpoint to verify router is loaded"""
    logger.info("✅ Consultation router is working!")
    return {"status": "Consultation router is active", "csv_exists": os.path.exists(DOCTORS_CSV_PATH)}

@router.get("/doctors/all")
async def get_all_doctors():
    """Get all doctors from CSV"""
    try:
        doctors = load_doctors_dataset()
        logger.info(f"📋 Retrieved all {len(doctors)} doctors")
        return {
            "success": True,
            "doctors": doctors,
            "total": len(doctors)
        }
    except Exception as e:
        logger.error(f"Error getting all doctors: {e}")
        raise HTTPException(status_code=500, detail="Error loading doctors")

@router.post("/doctors/search")
async def search_doctors(request: DoctorSearchRequest):
    """
    Search doctors with flexible matching.
    Returns doctors sorted by match score.
    """
    try:
        doctors = load_doctors_dataset()
        
        if not doctors:
            logger.warning("❌ No doctors loaded from CSV")
            raise HTTPException(status_code=500, detail="Doctor database is empty")
        
        logger.info(f"🔍 Searching doctors with criteria: {request.dict()}")
        
        # Score all doctors based on matching criteria
        scored_doctors = []
        for doctor in doctors:
            score = calculate_match_score(doctor, request)
            doctor_with_score = {**doctor, "match_score": score}
            scored_doctors.append(doctor_with_score)
        
        # Sort by score descending
        scored_doctors.sort(key=lambda x: x["match_score"], reverse=True)
        
        # Log top matches for debugging
        if scored_doctors:
            logger.info(f"✅ Top match score: {scored_doctors[0]['match_score']} for {scored_doctors[0]['doctor_name']}")
        
        # Return top 15 doctors regardless of score (always show results)
        results = scored_doctors[:15]
        
        logger.info(f"📊 Returning {len(results)} doctors")
        
        return {
            "success": True,
            "doctors": results,
            "total": len(results),
            "message": f"Found {len(results)} matching doctors"
        }
    
    except Exception as e:
        logger.error(f"❌ Error searching doctors: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error searching doctors: {str(e)}")

def calculate_match_score(doctor, request):
    """
    Calculate match score for a doctor based on request criteria.
    Uses flexible matching with partial credit.
    """
    score = 0
    
    # State match (highest priority)
    if request.state and request.state.strip():
        if doctor["state"].lower() == request.state.strip().lower():
            score += 30
    
    # City match
    if request.city and request.city.strip():
        if doctor["city"].lower() == request.city.strip().lower():
            score += 25
    
    # Locality match
    if request.locality and request.locality.strip():
        if doctor["locality"].lower() == request.locality.strip().lower():
            score += 20
    
    # Specialization match
    if request.specialization and request.specialization.strip():
        if doctor["specialization"].lower() == request.specialization.strip().lower():
            score += 25
    
    # Communication language match
    if request.language and request.language.strip():
        lang_match = any(
            request.language.strip().lower() == lang.lower()
            for lang in doctor["languages_known"]
        )
        if lang_match:
            score += 15
    
    # Hospital name match
    if request.hospital_name and request.hospital_name.strip():
        if doctor["hospital_name"].lower() == request.hospital_name.strip().lower():
            score += 10
    
    # Preferred languages overlap
    if request.languages_known and len(request.languages_known) > 0:
        doc_langs_lower = set(lang.lower() for lang in doctor["languages_known"])
        req_langs_lower = set(lang.lower() for lang in request.languages_known)
        overlap = doc_langs_lower & req_langs_lower
        if overlap:
            score += 5 * len(overlap)
    
    # Minimum score baseline: if any criteria matches, give base score
    if score == 0:
        score = 1  # Everyone gets minimum 1 point so they're included
    
    return score

@router.post("/appointments/book")
async def book_appointment(request: AppointmentBookingRequest):
    """Book an appointment with a doctor"""
    try:
        doctors = load_doctors_dataset()
        
        # Find doctor by employee_id
        doctor = next((d for d in doctors if d["employee_id"] == request.doctor_id), None)
        if not doctor:
            logger.warning(f"Doctor not found: {request.doctor_id}")
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        # Create appointment record
        appointment = {
            "appointment_id": f"APT{request.doctor_id}_{request.patient_name.replace(' ', '_')}",
            "doctor_name": doctor["doctor_name"],
            "doctor_id": request.doctor_id,
            "patient_name": request.patient_name,
            "appointment_date": request.appointment_date,
            "appointment_time": request.appointment_time,
            "phone_number": request.phone_number,
            "email": request.email,
            "notes": request.notes,
            "status": "confirmed"
        }
        
        logger.info(f"✅ Appointment booked: {appointment['appointment_id']}")
        
        return {
            "success": True,
            "message": f"Appointment booked successfully with {doctor['doctor_name']}",
            "appointment": appointment
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error booking appointment: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error booking appointment")
