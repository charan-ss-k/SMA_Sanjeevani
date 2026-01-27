from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.middleware import get_current_user
from app.models.models import Reminder
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/reminders", tags=["reminders"])

class ReminderCreate(BaseModel):
    prescription_id: int
    medicine_name: str
    reminder_time: str  # Format: "HH:MM"
    frequency: str  # Daily, Weekly, Monthly
    days: Optional[str] = None  # Comma-separated days for weekly

    class Config:
        from_attributes = True

class ReminderResponse(BaseModel):
    id: int
    user_id: int
    prescription_id: int
    medicine_name: str
    reminder_time: str
    frequency: str
    days: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

@router.post("/", response_model=ReminderResponse)
async def create_reminder(
    reminder: ReminderCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new medicine reminder for authenticated user."""
    new_reminder = Reminder(
        user_id=user_id,
        prescription_id=reminder.prescription_id,
        medicine_name=reminder.medicine_name,
        reminder_time=reminder.reminder_time,
        frequency=reminder.frequency,
        days=reminder.days
    )
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)
    
    return {
        **new_reminder.__dict__,
        'created_at': new_reminder.created_at.isoformat(),
        'updated_at': new_reminder.updated_at.isoformat()
    }

@router.get("/", response_model=List[ReminderResponse])
async def get_user_reminders(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """Get all reminders for authenticated user."""
    reminders = db.query(Reminder).filter(
        Reminder.user_id == user_id
    ).offset(skip).limit(limit).all()
    
    return [
        {
            **r.__dict__,
            'created_at': r.created_at.isoformat(),
            'updated_at': r.updated_at.isoformat()
        } for r in reminders
    ]

@router.get("/{reminder_id}", response_model=ReminderResponse)
async def get_reminder(
    reminder_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific reminder (user can only access their own)."""
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == user_id
    ).first()
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    return {
        **reminder.__dict__,
        'created_at': reminder.created_at.isoformat(),
        'updated_at': reminder.updated_at.isoformat()
    }

@router.put("/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    reminder_id: int,
    reminder_update: ReminderCreate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update reminder (user can only update their own)."""
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == user_id
    ).first()
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    reminder.prescription_id = reminder_update.prescription_id
    reminder.medicine_name = reminder_update.medicine_name
    reminder.reminder_time = reminder_update.reminder_time
    reminder.frequency = reminder_update.frequency
    reminder.days = reminder_update.days
    reminder.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(reminder)
    
    return {
        **reminder.__dict__,
        'created_at': reminder.created_at.isoformat(),
        'updated_at': reminder.updated_at.isoformat()
    }

@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(
    reminder_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete reminder (user can only delete their own)."""
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
