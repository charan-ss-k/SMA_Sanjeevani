from typing import List, Optional, Any
from pydantic import BaseModel, Field


class SymptomRequest(BaseModel):
    age: int
    gender: str
    symptoms: List[str]
    allergies: Optional[List[str]] = Field(default_factory=list)
    existing_conditions: Optional[List[str]] = Field(default_factory=list)
    pregnancy_status: Optional[bool] = False
    language: Optional[str] = "english"


class MedicineRecommendation(BaseModel):
    name: str
    dosage: Optional[Any] = None
    duration: Optional[Any] = None
    instructions: Optional[Any] = None
    warnings: Optional[List[str]] = Field(default_factory=list)


class SymptomResponse(BaseModel):
    predicted_condition: str
    recommended_medicines: List[MedicineRecommendation]
    home_care_advice: List[str]
    doctor_consultation_advice: str
    disclaimer: str
    tts_payload: Optional[str] = None
