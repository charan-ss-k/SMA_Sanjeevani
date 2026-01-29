"""
Doctor Consultation and Appointment Booking Routes
Handles doctor search and appointment booking from CSV data
"""

import csv
import os
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.models import User
from app.core.middleware import get_current_user

# ============================================
# Router and Configuration
# ============================================
router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

# CSV file path - relative to backend folder
CSV_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "indian_doctors_dataset (1).csv")

print(f"📍 CSV Path configured: {CSV_FILE_PATH}")
print(f"✓ CSV file exists: {os.path.exists(CSV_FILE_PATH)}")


# ============================================
# Pydantic Models
# ============================================
class DoctorData(BaseModel):
    """Doctor information from CSV"""
    employee_id: str
    name: str
    specialization: str
    hospital: str
    locality: str
    city: str
    state: str
    phone: str
    email: str
    native_language: str
    languages_known: List[str]


class DoctorSearchRequest(BaseModel):
    """Search criteria for finding doctors"""
    state: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    specialization: Optional[str] = None
    native_language: Optional[str] = None
    languages_known: Optional[str] = None


class AppointmentBookRequest(BaseModel):
    """Request to book an appointment"""
    doctor_id: str = Field(..., description="Employee ID of the doctor")
    patient_name: str = Field(..., min_length=2, max_length=100)
    patient_email: str
    patient_phone: str
    appointment_date: str = Field(..., description="Date in format YYYY-MM-DD")
    appointment_time: str = Field(..., description="Time in format HH:MM")
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    """Response after booking an appointment"""
    success: bool
    appointment_id: str
    message: str
    doctor_info: Optional[DoctorData] = None


# ============================================
# Helper Functions
# ============================================
def load_doctors_from_csv() -> List[DoctorData]:
    """
    Load doctor data from CSV file.
    Parses 'Area / City & State' column to extract city and state.
    Splits 'Languages Known' by comma into a list.
    """
    if not os.path.exists(CSV_FILE_PATH):
        print(f"❌ CSV file not found: {CSV_FILE_PATH}")
        raise HTTPException(status_code=500, detail="Doctor database not found")
    
    doctors = []
    try:
        with open(CSV_FILE_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                try:
                    # Parse Area / City & State column
                    area_city_state = row.get('Area / City & State', '').strip()
                    city, state = "", ""
                    if ',' in area_city_state:
                        parts = area_city_state.split(',')
                        city = parts[0].strip()
                        state = parts[1].strip() if len(parts) > 1 else ""
                    
                    # Parse Languages Known
                    languages_str = row.get('Languages Known', '').strip()
                    languages_list = [l.strip() for l in languages_str.split(',') if l.strip()]
                    
                    doctor = DoctorData(
                        employee_id=row.get('Employee ID', '').strip(),
                        name=row.get('Doctor Name', '').strip(),
                        specialization=row.get('Specialization', '').strip(),
                        hospital=row.get('Hospital Name', '').strip(),
                        locality=row.get('Locality', '').strip(),
                        city=city,
                        state=state,
                        phone=row.get('Phone Number', '').strip(),
                        email=row.get('Email Address', '').strip(),
                        native_language=row.get('Native Language', '').strip(),
                        languages_known=languages_list
                    )
                    doctors.append(doctor)
                except Exception as e:
                    print(f"⚠️ Error parsing row {idx}: {e}")
                    continue
        
        print(f"✅ Successfully loaded {len(doctors)} doctors from CSV")
        return doctors
    except Exception as e:
        print(f"❌ Error reading CSV file: {e}")
        raise HTTPException(status_code=500, detail=f"Error reading doctor database: {str(e)}")


def filter_doctors(doctors: List[DoctorData], search_criteria: DoctorSearchRequest) -> List[DoctorData]:
    """
    Filter doctors based on search criteria.
    Returns doctors matching ALL provided criteria (AND logic).
    """
    if not any([search_criteria.state, search_criteria.city, search_criteria.locality,
                search_criteria.specialization, search_criteria.native_language, 
                search_criteria.languages_known]):
        return doctors
    
    # Count how many criteria are actually provided (not empty)
    criteria_count = sum(1 for criterion in [
        search_criteria.state, 
        search_criteria.city, 
        search_criteria.locality,
        search_criteria.specialization, 
        search_criteria.native_language, 
        search_criteria.languages_known
    ] if criterion)
    
    filtered = []
    for doctor in doctors:
        matches = 0
        
        # Check each criterion - ALL must match
        if search_criteria.state:
            if doctor.state.lower() == search_criteria.state.lower():
                matches += 1
            else:
                continue  # Skip this doctor if state doesn't match
                
        if search_criteria.city:
            if doctor.city.lower() == search_criteria.city.lower():
                matches += 1
            else:
                continue  # Skip this doctor if city doesn't match
                
        if search_criteria.locality:
            if search_criteria.locality.lower() in doctor.locality.lower():
                matches += 1
            else:
                continue  # Skip this doctor if locality doesn't match
                
        if search_criteria.specialization:
            if doctor.specialization.lower() == search_criteria.specialization.lower():
                matches += 1
            else:
                continue  # Skip this doctor if specialization doesn't match
                
        if search_criteria.native_language:
            if doctor.native_language.lower() == search_criteria.native_language.lower():
                matches += 1
            else:
                continue  # Skip this doctor if native language doesn't match
                
        if search_criteria.languages_known:
            search_langs = [l.strip().lower() for l in search_criteria.languages_known.split(',')]
            found_language = False
            for lang in search_langs:
                if any(lang == dl.lower() for dl in doctor.languages_known):
                    found_language = True
                    matches += 1
                    break
            if not found_language:
                continue  # Skip this doctor if none of the languages match
        
        # Include only if ALL criteria matched
        if matches == criteria_count:
            filtered.append(doctor)
    
    return filtered


# ============================================
# API Endpoints
# ============================================

@router.get("/search/options")
async def get_search_options():
    """
    Get all available filter options from the doctor database.
    Returns unique values for state, city, locality, specialization, languages.
    """
    print("🔍 GET /api/appointments/search/options endpoint called")
    try:
        doctors = load_doctors_from_csv()
        
        states = sorted(set(d.state for d in doctors if d.state))
        cities = sorted(set(d.city for d in doctors if d.city))
        localities = sorted(set(d.locality for d in doctors if d.locality))
        specializations = sorted(set(d.specialization for d in doctors if d.specialization))
        native_languages = sorted(set(d.native_language for d in doctors if d.native_language))
        all_languages = sorted(set(lang for d in doctors for lang in d.languages_known if lang))
        
        return {
            "success": True,
            "options": {
                "states": states,
                "cities": cities,
                "localities": localities,
                "specializations": specializations,
                "native_languages": native_languages,
                "languages": all_languages
            }
        }
    except Exception as e:
        print(f"❌ Error getting search options: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search_doctors(criteria: DoctorSearchRequest):
    """
    Search for doctors matching the provided criteria.
    Returns list of matching doctors with all details.
    """
    try:
        doctors = load_doctors_from_csv()
        matched_doctors = filter_doctors(doctors, criteria)
        
        return {
            "success": True,
            "count": len(matched_doctors),
            "doctors": matched_doctors,
            "message": f"Found {len(matched_doctors)} matching doctors"
        }
    except Exception as e:
        print(f"❌ Error searching doctors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/book")
async def book_appointment(
    appointment: AppointmentBookRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Book an appointment with a doctor.
    Validates doctor exists and creates appointment record.
    """
    try:
        # Load doctors to verify doctor exists
        doctors = load_doctors_from_csv()
        doctor_found = None
        for doc in doctors:
            if doc.employee_id == appointment.doctor_id:
                doctor_found = doc
                break
        
        if not doctor_found:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        # Validate date and time format
        try:
            datetime.strptime(appointment.appointment_date, "%Y-%m-%d")
            datetime.strptime(appointment.appointment_time, "%H:%M")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date/time format. Use YYYY-MM-DD and HH:MM")
        
        # Generate appointment ID
        appointment_id = f"APT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{appointment.doctor_id}"
        
        # In a real system, you would save this to database
        # For now, we'll return success with the appointment details
        
        return {
            "success": True,
            "appointment_id": appointment_id,
            "message": "Appointment booked successfully!",
            "doctor_info": doctor_found,
            "appointment_details": {
                "patient_name": appointment.patient_name,
                "patient_email": appointment.patient_email,
                "patient_phone": appointment.patient_phone,
                "date": appointment.appointment_date,
                "time": appointment.appointment_time,
                "notes": appointment.notes or "No notes provided"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error booking appointment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/doctor/{doctor_id}")
async def get_doctor_details(doctor_id: str):
    """
    Get detailed information about a specific doctor.
    """
    try:
        doctors = load_doctors_from_csv()
        for doctor in doctors:
            if doctor.employee_id == doctor_id:
                return {
                    "success": True,
                    "doctor": doctor
                }
        
        raise HTTPException(status_code=404, detail="Doctor not found")
    except Exception as e:
        print(f"❌ Error getting doctor details: {e}")
        raise HTTPException(status_code=500, detail=str(e))
