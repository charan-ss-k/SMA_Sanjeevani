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

from app.core.database import SessionLocal, get_db
from app.models.models import User, Appointment
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
    doctor_id: str = Field(..., description="Employee ID of the doctor", min_length=1)
    patient_name: str = Field(..., min_length=2, max_length=100, description="Patient full name")
    patient_email: str = Field(..., min_length=5, max_length=120, description="Valid email address")
    patient_phone: str = Field(..., min_length=10, max_length=20, description="Valid phone number")
    appointment_date: str = Field(..., description="Date in format YYYY-MM-DD")
    appointment_time: str = Field(..., description="Time in format HH:MM")
    notes: Optional[str] = Field(None, max_length=500, description="Optional appointment notes")


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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Book an appointment with a doctor.
    Validates doctor exists and saves to database.
    """
    try:
        print(f"\n🔔 Appointment booking request received:")
        print(f"  - Current User Type: {type(current_user)} | Value: {current_user}")
        print(f"  - Doctor ID: {appointment.doctor_id}")
        print(f"  - Patient Name: {appointment.patient_name}")
        print(f"  - Patient Email: {appointment.patient_email}")
        print(f"  - Patient Phone: {appointment.patient_phone}")
        print(f"  - Date: {appointment.appointment_date}")
        print(f"  - Time: {appointment.appointment_time}")
        print(f"  - Notes: {appointment.notes}")
        
        # Verify current_user is actually a User object
        if not hasattr(current_user, 'id'):
            print(f"❌ ERROR: current_user is not a User object. Type: {type(current_user)}, Value: {current_user}")
            raise HTTPException(
                status_code=401,
                detail=f"Authentication error: current_user type is {type(current_user).__name__}, expected User object"
            )
        
        user_id = current_user.id
        print(f"  - User ID: {user_id} (type: {type(user_id)})")
        
        # Load doctors to verify doctor exists
        doctors = load_doctors_from_csv()
        doctor_found = None
        for doc in doctors:
            if doc.employee_id == appointment.doctor_id:
                doctor_found = doc
                break
        
        if not doctor_found:
            print(f"❌ Doctor not found with ID: {appointment.doctor_id}")
            raise HTTPException(status_code=404, detail=f"Doctor with ID {appointment.doctor_id} not found")
        
        # Validate date and time format
        try:
            date_str = appointment.appointment_date.strip()
            time_str = appointment.appointment_time.strip()
            datetime_str = f"{date_str} {time_str}"
            print(f"  - Parsing datetime: '{datetime_str}'")
            
            appointment_datetime = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
            print(f"✅ Date/Time validation passed: {appointment_datetime}")
        except ValueError as ve:
            print(f"❌ Date/Time format error: {ve}")
            print(f"  - Expected format: YYYY-MM-DD HH:MM")
            print(f"  - Received date: {appointment.appointment_date}")
            print(f"  - Received time: {appointment.appointment_time}")
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid date/time format. Date must be YYYY-MM-DD, time must be HH:MM. Received: {appointment.appointment_date} {appointment.appointment_time}"
            )
        
        # Save appointment to database
        print(f"💾 Creating Appointment object...")
        new_appointment = Appointment(
            user_id=user_id,
            doctor_name=doctor_found.name,
            doctor_id=doctor_found.employee_id,
            specialization=doctor_found.specialization,
            hospital_name=doctor_found.hospital,
            locality=doctor_found.locality,
            city=doctor_found.city,
            state=doctor_found.state,
            doctor_email=doctor_found.email,
            doctor_phone=doctor_found.phone,
            patient_name=appointment.patient_name.strip(),
            patient_email=appointment.patient_email.strip().lower(),
            patient_phone=appointment.patient_phone.strip(),
            appointment_date=appointment_datetime,
            appointment_time=appointment.appointment_time,
            notes=appointment.notes.strip() if appointment.notes else None,
            status="scheduled"
        )
        
        print(f"💾 Saving appointment to database...")
        print(f"  - Appointment object created: {new_appointment}")
        db.add(new_appointment)
        db.commit()
        print(f"  - Commit successful, refreshing object...")
        db.refresh(new_appointment)
        
        print(f"✅ Appointment {new_appointment.id} booked successfully for user {user_id}")
        
        return {
            "success": True,
            "appointment_id": new_appointment.id,
            "message": "Appointment booked successfully!",
            "doctor_info": doctor_found,
            "appointment_details": {
                "appointment_id": new_appointment.id,
                "patient_name": appointment.patient_name,
                "patient_email": appointment.patient_email,
                "patient_phone": appointment.patient_phone,
                "doctor_name": doctor_found.name,
                "doctor_phone": doctor_found.phone,
                "hospital": doctor_found.hospital,
                "date": appointment.appointment_date,
                "time": appointment.appointment_time,
                "notes": appointment.notes or "No notes provided"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error booking appointment: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Booking failed: {str(e)}")


@router.get("/my-appointments")
async def get_my_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all appointments for the current user.
    """
    try:
        appointments = db.query(Appointment).filter(Appointment.user_id == current_user.id).order_by(Appointment.appointment_date.desc()).all()
        
        return {
            "success": True,
            "total": len(appointments),
            "appointments": [
                {
                    "id": apt.id,
                    "doctor_name": apt.doctor_name,
                    "specialization": apt.specialization,
                    "hospital": apt.hospital_name,
                    "locality": apt.locality,
                    "city": apt.city,
                    "state": apt.state,
                    "doctor_phone": apt.doctor_phone,
                    "doctor_email": apt.doctor_email,
                    "appointment_date": apt.appointment_date.isoformat(),
                    "appointment_time": apt.appointment_time,
                    "status": apt.status,
                    "notes": apt.notes,
                    "created_at": apt.created_at.isoformat()
                }
                for apt in appointments
            ]
        }
    except Exception as e:
        print(f"❌ Error fetching appointments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upcoming-appointments")
async def get_upcoming_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get upcoming appointments (not yet passed) for the current user.
    """
    try:
        now = datetime.utcnow()
        upcoming = db.query(Appointment).filter(
            Appointment.user_id == current_user.id,
            Appointment.appointment_date >= now,
            Appointment.status == "scheduled"
        ).order_by(Appointment.appointment_date).all()
        
        return {
            "success": True,
            "total": len(upcoming),
            "appointments": [
                {
                    "id": apt.id,
                    "doctor_name": apt.doctor_name,
                    "specialization": apt.specialization,
                    "hospital": apt.hospital_name,
                    "locality": apt.locality,
                    "city": apt.city,
                    "state": apt.state,
                    "doctor_phone": apt.doctor_phone,
                    "doctor_email": apt.doctor_email,
                    "appointment_date": apt.appointment_date.isoformat(),
                    "appointment_time": apt.appointment_time,
                    "notes": apt.notes
                }
                for apt in upcoming
            ]
        }
    except Exception as e:
        print(f"❌ Error fetching upcoming appointments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/appointment/{appointment_id}")
async def update_appointment(
    appointment_id: int,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update appointment status (completed, cancelled, etc).
    """
    try:
        appointment = db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id
        ).first()
        
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        appointment.status = status
        appointment.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(appointment)
        
        return {
            "success": True,
            "message": f"Appointment status updated to {status}",
            "appointment_id": appointment.id
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating appointment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/appointment/{appointment_id}")
async def delete_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete/cancel an appointment - removes it from the database.
    """
    try:
        print(f"🗑️ [CANCEL] Deleting appointment {appointment_id} for user {current_user.id}")
        
        appointment = db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.user_id == current_user.id
        ).first()
        
        if not appointment:
            print(f"❌ [CANCEL] Appointment {appointment_id} not found for user {current_user.id}")
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Store details before deleting
        apt_details = {
            "id": appointment.id,
            "doctor_name": appointment.doctor_name,
            "appointment_date": appointment.appointment_date.isoformat() if appointment.appointment_date else None
        }
        
        db.delete(appointment)
        db.commit()
        
        print(f"✅ [CANCEL] Appointment {appointment_id} successfully deleted for user {current_user.id}")
        
        return {
            "success": True,
            "message": f"Appointment with Dr. {apt_details['doctor_name']} on {apt_details['appointment_date']} has been cancelled",
            "appointment_id": appointment_id
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [CANCEL] Error deleting appointment {appointment_id}: {e}")
        db.rollback()
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
