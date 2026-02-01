from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user
from app.core.rls_context import get_db_with_rls
from app.models.models import Reminder
from pydantic import BaseModel, validator, ValidationError
from typing import List, Optional, Any, Dict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/reminders", tags=["reminders"])

class ReminderCreate(BaseModel):
    prescription_id: Optional[int] = None
    medicine_name: str
    dosage: str
    reminder_time: str  # Format: "HH:MM"
    frequency: str  # Daily, Weekly, Monthly
    days: Optional[Any] = None  # Days of week for weekly (can be list or null)
    quantity: Optional[str] = None

    @validator("prescription_id", pre=True)
    def _coerce_prescription_id(cls, value):
        """Coerce prescription_id to proper int or None"""
        if value in ("", None, "null", "undefined"):
            return None
        if isinstance(value, str):
            if value.isdigit():
                return int(value)
            return None
        return value

    @validator("days", pre=True)
    def _coerce_days(cls, value):
        """Normalize days field to accept null, empty string, or list"""
        if value in ("", None, "null", "undefined"):
            return None
        if isinstance(value, list):
            return value
        return None

    @validator("quantity", pre=True)
    def _coerce_quantity(cls, value):
        """Normalize quantity to None if empty"""
        if value in ("", "null", "undefined"):
            return None
        return value

    class Config:
        from_attributes = True

class ReminderResponse(BaseModel):
    id: int
    user_id: int
    prescription_id: Optional[int]
    medicine_name: str
    dosage: str
    reminder_time: str
    frequency: str
    days: Optional[List[str]]
    quantity: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

def _normalize_days_quantity(days_value: Any) -> Dict[str, Any]:
    if isinstance(days_value, dict):
        return days_value
    if isinstance(days_value, list):
        return {"days": days_value}
    if days_value is None:
        return {}
    return {"days": days_value}


def _build_response_payload(reminder: Reminder) -> Dict[str, Any]:
    meta = _normalize_days_quantity(reminder.days)
    return {
        **reminder.__dict__,
        "days": meta.get("days"),
        "quantity": meta.get("quantity"),
        "created_at": reminder.created_at.isoformat(),
        "updated_at": reminder.updated_at.isoformat(),
    }


@router.post("/", response_model=ReminderResponse)
async def create_reminder(
    request: Request,
    reminder: ReminderCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new medicine reminder for authenticated user."""
    
    try:
        # Extract user_id from User object
        user_id = current_user.id if hasattr(current_user, 'id') else current_user
        
        # Log incoming data for debugging
        logger.info(f"📥 Creating reminder for user {user_id}")
        logger.debug(f"📦 Reminder data: {reminder.dict()}")
        
        # ✅ Set RLS context for per-user isolation
        db = get_db_with_rls(db, user_id)
        
        days_payload: Optional[Dict[str, Any]] = None
        if reminder.days or reminder.quantity:
            days_payload = {"days": reminder.days, "quantity": reminder.quantity}

        new_reminder = Reminder(
            user_id=user_id,
            prescription_id=reminder.prescription_id,
            medicine_name=reminder.medicine_name,
            dosage=reminder.dosage,
            reminder_time=reminder.reminder_time,
            frequency=reminder.frequency,
            days=days_payload
        )
        db.add(new_reminder)
        db.commit()
        db.refresh(new_reminder)
        
        logger.info(f"✅ Reminder created successfully: ID={new_reminder.id}")
        return _build_response_payload(new_reminder)
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Failed to create reminder: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create reminder: {str(e)}"
        )

@router.get("/", response_model=List[ReminderResponse])
async def get_user_reminders(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """Get all reminders for authenticated user."""
    
    # Extract user_id from User object
    user_id = current_user.id if hasattr(current_user, 'id') else current_user
    
    # ✅ Set RLS context for per-user isolation
    db = get_db_with_rls(db, user_id)
    
    reminders = db.query(Reminder).filter(
        Reminder.user_id == user_id
    ).offset(skip).limit(limit).all()
    
    logger.info(f"📋 Fetching reminders for user {user_id}: Found {len(reminders)} reminders")
    if reminders:
        for r in reminders:
            logger.info(f"  - {r.medicine_name} at {r.reminder_time}")
    
    result = [_build_response_payload(r) for r in reminders]
    logger.debug(f"📤 Returning {len(result)} reminders to frontend")
    return result

@router.get("/{reminder_id}", response_model=ReminderResponse)
async def get_reminder(
    reminder_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific reminder (user can only access their own)."""
    # Extract user_id from User object
    user_id = current_user.id if hasattr(current_user, 'id') else current_user
    
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == user_id
    ).first()
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    return _build_response_payload(reminder)

@router.put("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    reminder_id: int,
    reminder_update: ReminderCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update reminder (user can only update their own)."""
    # Extract user_id from User object
    user_id = current_user.id if hasattr(current_user, 'id') else current_user
    
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == user_id
    ).first()
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    days_payload: Optional[Dict[str, Any]] = None
    if reminder_update.days or reminder_update.quantity:
        days_payload = {"days": reminder_update.days, "quantity": reminder_update.quantity}

    reminder.prescription_id = reminder_update.prescription_id
    reminder.medicine_name = reminder_update.medicine_name
    reminder.dosage = reminder_update.dosage
    reminder.reminder_time = reminder_update.reminder_time
    reminder.frequency = reminder_update.frequency
    reminder.days = days_payload
    reminder.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(reminder)
    
    return _build_response_payload(reminder)

@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(
    reminder_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete reminder (user can only delete their own)."""
    # Extract user_id from User object
    user_id = current_user.id if hasattr(current_user, 'id') else current_user
    
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == user_id
    ).first()
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    db.delete(reminder)
    db.commit()
