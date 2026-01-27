from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.middleware import get_current_user
from app.models.models import DashboardData, MedicineHistory, Prescription, Reminder, QAHistory
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

class DashboardDataResponse(BaseModel):
    consultations: int
    medications_tracked: int
    reminders_set: int
    health_score: int
    streak_days: int
    recent_activities: list

    class Config:
        from_attributes = True

@router.get("/stats", response_model=DashboardDataResponse)
async def get_dashboard_stats(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's dashboard statistics and health metrics."""
    
    # Count consultations (Q&A history)
    consultations = db.query(func.count(QAHistory.id)).filter(
        QAHistory.user_id == user_id
    ).scalar() or 0
    
    # Count medications tracked
    medications_tracked = db.query(func.count(MedicineHistory.id)).filter(
        MedicineHistory.user_id == user_id
    ).scalar() or 0
    
    # Count reminders set
    reminders_set = db.query(func.count(Reminder.id)).filter(
        Reminder.user_id == user_id
    ).scalar() or 0
    
    # Calculate health score (0-100)
    # Base score 50 + (consultations * 5) + (medications * 3) + (reminders * 2)
    # Capped at 100
    health_score = min(50 + (consultations * 5) + (medications_tracked * 3) + (reminders_set * 2), 100)
    
    # Calculate streak days (days with activity)
    last_7_days = datetime.utcnow() - timedelta(days=7)
    recent_activity = db.query(QAHistory).filter(
        QAHistory.user_id == user_id,
        QAHistory.created_at >= last_7_days
    ).all()
    
    streak_days = len(set(qa.created_at.date() for qa in recent_activity))
    
    # Get recent activities
    recent_qas = db.query(QAHistory).filter(
        QAHistory.user_id == user_id
    ).order_by(QAHistory.created_at.desc()).limit(5).all()
    
    recent_prescriptions = db.query(Prescription).filter(
        Prescription.user_id == user_id
    ).order_by(Prescription.created_at.desc()).limit(5).all()
    
    recent_activities = []
    
    for qa in recent_qas:
        recent_activities.append({
            "type": "consultation",
            "description": f"Asked: {qa.question[:50]}...",
            "timestamp": qa.created_at.isoformat(),
            "category": qa.category
        })
    
    for rx in recent_prescriptions:
        recent_activities.append({
            "type": "prescription",
            "description": f"Added: {rx.medicine_name} - {rx.dosage}",
            "timestamp": rx.created_at.isoformat(),
            "doctor": rx.doctor_name
        })
    
    # Sort by timestamp, most recent first
    recent_activities = sorted(
        recent_activities,
        key=lambda x: x["timestamp"],
        reverse=True
    )[:10]
    
    return {
        "consultations": consultations,
        "medications_tracked": medications_tracked,
        "reminders_set": reminders_set,
        "health_score": health_score,
        "streak_days": streak_days,
        "recent_activities": recent_activities
    }

@router.get("/progress")
async def get_user_progress(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = 30
):
    """Get user's progress over specified number of days."""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get daily counts
    daily_data = []
    
    for i in range(days):
        current_date = datetime.utcnow() - timedelta(days=days - i - 1)
        start_of_day = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        qa_count = db.query(func.count(QAHistory.id)).filter(
            QAHistory.user_id == user_id,
            QAHistory.created_at >= start_of_day,
            QAHistory.created_at < end_of_day
        ).scalar() or 0
        
        medicine_count = db.query(func.count(MedicineHistory.id)).filter(
            MedicineHistory.user_id == user_id,
            MedicineHistory.created_at >= start_of_day,
            MedicineHistory.created_at < end_of_day
        ).scalar() or 0
        
        if qa_count > 0 or medicine_count > 0:
            daily_data.append({
                "date": current_date.date().isoformat(),
                "consultations": qa_count,
                "medications": medicine_count
            })
    
    return {
        "period_days": days,
        "daily_progress": daily_data
    }

@router.get("/health-insights")
async def get_health_insights(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized health insights based on user data."""
    
    # Get most common conditions
    conditions = db.query(
        MedicineHistory.predicted_condition,
        func.count(MedicineHistory.id).label("count")
    ).filter(
        MedicineHistory.user_id == user_id
    ).group_by(
        MedicineHistory.predicted_condition
    ).order_by(
        func.count(MedicineHistory.id).desc()
    ).limit(5).all()
    
    # Get medicines frequency
    medicines = db.query(
        MedicineHistory.medicines,
        func.count(MedicineHistory.id).label("count")
    ).filter(
        MedicineHistory.user_id == user_id
    ).group_by(
        MedicineHistory.medicines
    ).order_by(
        func.count(MedicineHistory.id).desc()
    ).limit(5).all()
    
    # Get helpful Q&As
    helpful_qas = db.query(
        QAHistory.category,
        func.count(QAHistory.id).label("count")
    ).filter(
        QAHistory.user_id == user_id,
        QAHistory.helpful == True
    ).group_by(
        QAHistory.category
    ).all()
    
    insights = {
        "top_conditions": [
            {"condition": cond, "frequency": count}
            for cond, count in conditions
        ],
        "common_medicines": [
            {"medicine": med, "frequency": count}
            for med, count in medicines
        ],
        "helpful_qa_categories": [
            {"category": cat, "helpful_count": count}
            for cat, count in helpful_qas
        ],
        "recommendations": []
    }
    
    # Generate recommendations
    if conditions and conditions[0][1] > 2:
        top_condition = conditions[0][0]
        insights["recommendations"].append(
            f"Consider scheduling a regular check-up for {top_condition}"
        )
    
    if len(medicines) > 3:
        insights["recommendations"].append(
            "You're taking multiple medicines. Ensure there are no interactions."
        )
    
    if len(daily_consultations := db.query(func.count(QAHistory.id)).filter(
        QAHistory.user_id == user_id,
        QAHistory.created_at >= datetime.utcnow() - timedelta(days=1)
    ).scalar() or 0) > 5:
        insights["recommendations"].append(
            "You've had many consultations recently. Consider scheduling a doctor's appointment."
        )
    
    return insights
