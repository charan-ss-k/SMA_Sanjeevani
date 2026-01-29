"""
Doctor consultation and recommendation API
"""
import json
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Load doctors dataset
DOCTORS_DATASET_PATH = os.path.join(os.path.dirname(__file__), "data", "doctors_dataset.json")

def load_doctors_dataset():
    """Load doctors dataset from JSON file"""
    try:
        with open(DOCTORS_DATASET_PATH, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning(f"Doctors dataset not found at {DOCTORS_DATASET_PATH}")
        return []

# Models
class DoctorRecommendationRequest(BaseModel):
    symptoms: str
    locality: str
    city: str
    state: str
    language: str
    hospital_name: Optional[str] = None
    specialization: Optional[str] = None
    languages_known: Optional[List[str]] = None

class AppointmentBookingRequest(BaseModel):
    doctor_id: str
    patient_name: str
    appointment_date: str
    appointment_time: str
    symptoms_brief: str
    phone_number: str
    email: str
    notes: Optional[str] = None

@router.get("/api/doctors")
async def get_all_doctors():
    """Get all doctors from dataset"""
    try:
        doctors = load_doctors_dataset()
        logger.info(f"📋 Retrieved {len(doctors)} doctors from dataset")
        return {"doctors": doctors, "total": len(doctors)}
    except Exception as e:
        logger.error(f"Error loading doctors: {e}")
        raise HTTPException(status_code=500, detail="Error loading doctors dataset")

@router.post("/api/doctors/search")
async def search_doctors(request: DoctorRecommendationRequest):
    """
    Search and recommend doctors based on criteria
    """
    try:
        doctors = load_doctors_dataset()
        
        # Filter doctors based on criteria
        filtered_doctors = []
        
        for doctor in doctors:
            match_score = 0
            
            # City match (higher priority)
            if doctor["city"].lower() == request.city.lower():
                match_score += 40
            
            # Locality match
            if request.locality and doctor["locality"].lower() == request.locality.lower():
                match_score += 20
            
            # State match
            if request.state and doctor["state"].lower() == request.state.lower():
                match_score += 15
            
            # Language match (communication language)
            if request.language and request.language.lower() in [lang.lower() for lang in doctor["languages_known"]]:
                match_score += 20
            
            # Specialization match (if provided)
            if request.specialization and doctor["specialization"].lower() == request.specialization.lower():
                match_score += 25
            
            # Only include doctors with some match
            if match_score > 0:
                doctor_with_score = {**doctor, "match_score": match_score}
                filtered_doctors.append(doctor_with_score)
        
        # Sort by match score (highest first) and rating
        filtered_doctors.sort(key=lambda x: (x["match_score"], x.get("rating", 0)), reverse=True)
        
        logger.info(f"🔍 Found {len(filtered_doctors)} matching doctors for criteria: {request.dict()}")
        
        return {
            "doctors": filtered_doctors[:10],  # Return top 10
            "total": len(filtered_doctors),
            "criteria": request.dict()
        }
    
    except Exception as e:
        logger.error(f"Error searching doctors: {e}")
        raise HTTPException(status_code=500, detail="Error searching doctors")

@router.post("/api/appointments/book")
async def book_appointment(request: AppointmentBookingRequest):
    """
    Book an appointment with a doctor
    """
    try:
        doctors = load_doctors_dataset()
        
        # Find the doctor
        doctor = next((d for d in doctors if d["employee_id"] == request.doctor_id), None)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        # Create appointment record
        appointment = {
            "appointment_id": f"APT{request.doctor_id}_{request.patient_name.replace(' ', '_')}_{request.appointment_date}",
            "doctor": doctor,
            "patient_name": request.patient_name,
            "appointment_date": request.appointment_date,
            "appointment_time": request.appointment_time,
            "symptoms_brief": request.symptoms_brief,
            "phone_number": request.phone_number,
            "email": request.email,
            "notes": request.notes,
            "status": "confirmed",
            "created_at": "2026-01-28"
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
        logger.error(f"Error booking appointment: {e}")
        raise HTTPException(status_code=500, detail="Error booking appointment")

@router.get("/api/appointments/{patient_email}")
async def get_appointments(patient_email: str):
    """
    Get all appointments for a patient
    """
    try:
        # This would normally fetch from database
        # For now, return empty list
        logger.info(f"📅 Retrieved appointments for {patient_email}")
        return {
            "appointments": [],
            "total": 0
        }
    except Exception as e:
        logger.error(f"Error retrieving appointments: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving appointments")
