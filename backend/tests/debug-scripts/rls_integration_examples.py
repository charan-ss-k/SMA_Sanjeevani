"""
RLS Integration Examples - Copy patterns to your existing routes
Shows how to use RLSContextManager in FastAPI endpoints
"""

# ============================================================================
# EXAMPLE 1: Symptom Checker - Per-user history isolation
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.rls_context import RLSContextManager, get_db_with_rls
from app.core.auth import get_current_user  # Your existing auth dependency

router = APIRouter()


@router.post("/api/symptoms/check")
def check_symptoms(
    symptoms_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Store symptom check for current user only.
    RLS ensures this is isolated per user.
    """
    # CRITICAL: Set RLS context with user ID
    db_with_rls = get_db_with_rls(db, current_user["id"])
    
    # Insert respects RLS - only stores for current user
    db_with_rls.execute(text("""
        INSERT INTO symptom_check_history 
        (user_id, age_at_check, gender_at_check, symptoms, predicted_condition, checked_at)
        VALUES (:user_id, :age, :gender, :symptoms, :condition, NOW())
    """), {
        "user_id": current_user["id"],
        "age": symptoms_data.get("age"),
        "gender": symptoms_data.get("gender"),
        "symptoms": symptoms_data.get("symptoms"),
        "condition": symptoms_data.get("predicted_condition")
    })
    db_with_rls.commit()
    
    return {"status": "Symptom check saved", "user_id": current_user["id"]}


@router.get("/api/symptoms/history")
def get_symptoms_history(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get symptom history for ONLY current user.
    RLS automatically filters to user's own records.
    """
    # CRITICAL: Set RLS context
    db_with_rls = get_db_with_rls(db, current_user["id"])
    
    # Query respects RLS - returns only this user's data
    history = db_with_rls.execute(text("""
        SELECT id, age_at_check, symptoms, predicted_condition, checked_at
        FROM symptom_check_history
        ORDER BY checked_at DESC
        LIMIT 20
    """)).fetchall()
    
    return {
        "user_id": current_user["id"],
        "history": [dict(row._mapping) for row in history]
    }


# ============================================================================
# EXAMPLE 2: Prescriptions - Per-user prescription tracking
# ============================================================================

@router.post("/api/prescriptions/add")
def add_prescription(
    rx_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Add prescription for current user.
    RLS ensures user can only add prescriptions for themselves.
    """
    db_with_rls = get_db_with_rls(db, current_user["id"])
    
    db_with_rls.execute(text("""
        INSERT INTO prescriptions 
        (user_id, doctor_name, medicine_name, dosage, frequency, duration, start_date, is_active)
        VALUES (:user_id, :doctor, :medicine, :dosage, :frequency, :duration, :start_date, TRUE)
    """), {
        "user_id": current_user["id"],
        "doctor": rx_data.get("doctor_name"),
        "medicine": rx_data.get("medicine_name"),
        "dosage": rx_data.get("dosage"),
        "frequency": rx_data.get("frequency"),
        "duration": rx_data.get("duration"),
        "start_date": rx_data.get("start_date")
    })
    db_with_rls.commit()
    
    return {"status": "Prescription added", "user_id": current_user["id"]}


@router.get("/api/prescriptions/active")
def get_active_prescriptions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get active prescriptions for current user.
    RLS filters to show only this user's prescriptions.
    """
    db_with_rls = get_db_with_rls(db, current_user["id"])
    
    prescriptions = db_with_rls.execute(text("""
        SELECT id, medicine_name, dosage, frequency, start_date, end_date
        FROM prescriptions
        WHERE is_active = TRUE
        ORDER BY start_date DESC
    """)).fetchall()
    
    return {
        "user_id": current_user["id"],
        "active_prescriptions": [dict(row._mapping) for row in prescriptions]
    }


# ============================================================================
# EXAMPLE 3: Medicine Reminders - Per-user reminder management
# ============================================================================

@router.post("/api/reminders/set")
def set_reminder(
    reminder_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create medicine reminder for current user.
    RLS ensures reminders are isolated per user.
    """
    db_with_rls = get_db_with_rls(db, current_user["id"])
    
    db_with_rls.execute(text("""
        INSERT INTO reminders 
        (user_id, medicine_name, dosage, reminder_type, reminder_time, frequency, is_active, next_reminder_at)
        VALUES (:user_id, :medicine, :dosage, :type, :time, :freq, TRUE, NOW() + INTERVAL '1 hour')
    """), {
        "user_id": current_user["id"],
        "medicine": reminder_data.get("medicine_name"),
        "dosage": reminder_data.get("dosage"),
        "type": reminder_data.get("reminder_type", "scheduled"),
        "time": reminder_data.get("reminder_time"),
        "freq": reminder_data.get("frequency", "daily")
    })
    db_with_rls.commit()
    
    return {"status": "Reminder set", "user_id": current_user["id"]}


@router.get("/api/reminders/upcoming")
def get_upcoming_reminders(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get upcoming reminders for current user (next 24h).
    Automatically filters via RLS to user's own reminders.
    """
    db_with_rls = get_db_with_rls(db, current_user["id"])
    
    # Uses scoped view that filters by current_setting('app.current_user_id')
    reminders = db_with_rls.execute(text("""
        SELECT * FROM upcoming_reminders_view
    """)).fetchall()
    
    return {
        "user_id": current_user["id"],
        "upcoming_reminders": [dict(row._mapping) for row in reminders]
    }


@router.post("/api/medicine-log/took")
def log_medicine_taken(
    log_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Log that user took medicine.
    RLS ensures each user can only log their own medicine intake.
    """
    db_with_rls = get_db_with_rls(db, current_user["id"])
    
    db_with_rls.execute(text("""
        INSERT INTO medicine_taken_log 
        (user_id, medicine_name, dosage, taken_at, status)
        VALUES (:user_id, :medicine, :dosage, NOW(), :status)
    """), {
        "user_id": current_user["id"],
        "medicine": log_data.get("medicine_name"),
        "dosage": log_data.get("dosage"),
        "status": log_data.get("status", "taken")
    })
    db_with_rls.commit()
    
    return {"status": "Medicine intake logged", "user_id": current_user["id"]}


# ============================================================================
# EXAMPLE 4: Dashboard - Per-user health summary
# ============================================================================

@router.get("/api/dashboard/summary")
def get_health_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get complete health summary for current user.
    Uses scoped view that returns ONLY this user's aggregated data.
    """
    db_with_rls = get_db_with_rls(db, current_user["id"])
    
    summary = db_with_rls.execute(text("""
        SELECT * FROM user_health_summary_view
    """)).fetchone()
    
    if not summary:
        raise HTTPException(status_code=404, detail="Health profile not found")
    
    return dict(summary._mapping)


@router.get("/api/dashboard/medicine-adherence")
def get_medicine_adherence(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get medicine adherence report for current user.
    Shows compliance metrics - isolated per user via RLS.
    """
    db_with_rls = get_db_with_rls(db, current_user["id"])
    
    adherence = db_with_rls.execute(text("""
        SELECT * FROM medicine_adherence_report_view
    """)).fetchall()
    
    return {
        "user_id": current_user["id"],
        "adherence_report": [dict(row._mapping) for row in adherence]
    }


# ============================================================================
# EXAMPLE 5: Chatbot - Per-user conversation history
# ============================================================================

@router.post("/api/chatbot/message")
def send_chatbot_message(
    msg_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Save chatbot conversation message.
    RLS ensures messages are stored per user.
    """
    db_with_rls = get_db_with_rls(db, current_user["id"])
    
    # Create conversation if needed
    conv_result = db_with_rls.execute(text("""
        INSERT INTO chatbot_conversations 
        (user_id, session_id, session_started_at)
        VALUES (:user_id, :session_id, NOW())
        ON CONFLICT DO NOTHING
        RETURNING id
    """), {
        "user_id": current_user["id"],
        "session_id": msg_data.get("session_id")
    }).fetchone()
    
    conv_id = conv_result[0] if conv_result else msg_data.get("conversation_id")
    
    # Store message
    db_with_rls.execute(text("""
        INSERT INTO chatbot_messages 
        (conversation_id, user_id, message_type, user_question, ai_answer, sequence_number)
        VALUES (:conv_id, :user_id, :type, :question, :answer, :seq)
    """), {
        "conv_id": conv_id,
        "user_id": current_user["id"],
        "type": msg_data.get("message_type", "question"),
        "question": msg_data.get("question"),
        "answer": msg_data.get("answer"),
        "seq": msg_data.get("sequence_number", 1)
    })
    db_with_rls.commit()
    
    return {"status": "Message saved", "conversation_id": conv_id}


@router.get("/api/chatbot/history")
def get_chatbot_history(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get chat history for current user.
    RLS ensures isolation - no cross-user data leak.
    """
    db_with_rls = get_db_with_rls(db, current_user["id"])
    
    conversations = db_with_rls.execute(text("""
        SELECT id, session_id, session_started_at, user_satisfied
        FROM chatbot_conversations
        ORDER BY session_started_at DESC
        LIMIT 10
    """)).fetchall()
    
    return {
        "user_id": current_user["id"],
        "conversations": [dict(row._mapping) for row in conversations]
    }


# ============================================================================
# CRITICAL NOTES FOR IMPLEMENTATION
# ============================================================================
"""
1. ALWAYS use: db_with_rls = get_db_with_rls(db, current_user["id"])
   This sets the RLS context before any database query.

2. AFTER setting RLS context, you can:
   - Query directly (RLS filters automatically)
   - Use ORM models (RLS filters automatically)
   - Use raw SQL (RLS filters automatically)

3. If you forget to set RLS context:
   - Scoped views will return NO rows (safe default)
   - RLS policies will prevent all access (safe default)
   - You'll get empty results or "permission denied" errors

4. Benefits of this approach:
   ✅ Works across all existing routes
   ✅ No changes to database queries
   ✅ No per-route configuration
   ✅ One-line implementation per route
   ✅ Cannot accidentally expose other users' data
   ✅ Thread-safe and connection-safe

5. Integration steps:
   Step 1: Add "db_with_rls = get_db_with_rls(db, current_user['id'])" to each route
   Step 2: Replace "db." with "db_with_rls." in that route
   Step 3: Test with multiple users - verify data isolation
"""
