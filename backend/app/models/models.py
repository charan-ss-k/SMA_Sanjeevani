"""
Database Models for Sanjeevani Application
Defines all tables and relationships
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    """User account model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    blood_type = Column(String(5), nullable=True)
    allergies_info = Column(Text, nullable=True)
    chronic_conditions = Column(Text, nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    emergency_phone = Column(String(20), nullable=True)
    language_preference = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    medicine_history = relationship("MedicineHistory", back_populates="user", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="user", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")
    qa_history = relationship("QAHistory", back_populates="user", cascade="all, delete-orphan")
    hospital_report_history = relationship("HospitalReportHistory", back_populates="user", cascade="all, delete-orphan")
    dashboard_data = relationship("DashboardData", back_populates="user", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"


class MedicineHistory(Base):
    """History of medicine recommendations for each user"""
    __tablename__ = "medicine_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    symptoms = Column(JSON, nullable=False)  # List of symptoms
    predicted_condition = Column(String(255), nullable=False)
    recommended_medicines = Column(JSON, nullable=False)  # List of medicines with details
    home_care_advice = Column(JSON, nullable=True)
    doctor_consultation_advice = Column(Text, nullable=True)
    dosage_info = Column(JSON, nullable=True)
    effectiveness_rating = Column(Float, nullable=True)  # User rating 1-5
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="medicine_history")

    def __repr__(self):
        return f"<MedicineHistory(user_id={self.user_id}, condition={self.predicted_condition})>"


class Prescription(Base):
    """Prescription management for users"""
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    medicine_name = Column(String(255), nullable=False)
    dosage = Column(Text, nullable=False)  # Changed from String(100) to Text for longer dosage information
    frequency = Column(String(255), nullable=False)  # e.g., "Twice daily"
    duration = Column(String(255), nullable=False)  # e.g., "7 days", "2 weeks"
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    doctor_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="prescriptions")

    def __repr__(self):
        return f"<Prescription(user_id={self.user_id}, medicine={self.medicine_name})>"


class Reminder(Base):
    """Medicine reminders and alarms"""
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=True)
    medicine_name = Column(String(200), nullable=False)
    dosage = Column(String(100), nullable=False)
    reminder_time = Column(String(10), nullable=False)  # HH:MM format
    frequency = Column(String(50), nullable=False)  # Daily, Weekly, Custom
    days = Column(JSON, nullable=True)  # Days of week for reminders
    is_active = Column(Boolean, default=True)
    last_reminded = Column(DateTime, nullable=True)
    next_reminder = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="reminders")

    def __repr__(self):
        return f"<Reminder(user_id={self.user_id}, medicine={self.medicine_name})>"


class QAHistory(Base):
    """Medical Q&A conversation history for each user"""
    __tablename__ = "qa_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)  # e.g., "Symptoms", "Treatment", "Prevention"
    helpful = Column(Boolean, nullable=True)  # Did user find it helpful?
    follow_up_questions = Column(JSON, nullable=True)  # Suggested follow-up questions
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationship
    user = relationship("User", back_populates="qa_history")

    def __repr__(self):
        return f"<QAHistory(user_id={self.user_id}, category={self.category})>"


class DashboardData(Base):
    """User dashboard statistics and analytics"""
    __tablename__ = "dashboard_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    total_consultations = Column(Integer, default=0)
    medications_tracked = Column(Integer, default=0)
    reminders_set = Column(Integer, default=0)
    questions_asked = Column(Integer, default=0)
    last_consultation = Column(DateTime, nullable=True)
    health_score = Column(Float, default=0)  # 0-100 based on compliance
    streak_days = Column(Integer, default=0)  # Consecutive reminder compliance days
    total_medications = Column(Integer, default=0)
    active_reminders = Column(Integer, default=0)
    custom_data = Column(JSON, nullable=True)  # Additional custom metrics
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="dashboard_data")

    def __repr__(self):
        return f"<DashboardData(user_id={self.user_id}, health_score={self.health_score})>"


class Appointment(Base):
    """Doctor appointment bookings"""
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    doctor_name = Column(String(255), nullable=False)
    doctor_id = Column(String(50), nullable=False)  # Employee ID from CSV
    specialization = Column(String(100), nullable=False)
    hospital_name = Column(String(255), nullable=False)
    locality = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    doctor_email = Column(String(120), nullable=False)
    doctor_phone = Column(String(20), nullable=False)
    patient_name = Column(String(255), nullable=False)
    patient_email = Column(String(120), nullable=False)
    patient_phone = Column(String(20), nullable=False)
    appointment_date = Column(DateTime, nullable=False, index=True)
    appointment_time = Column(String(10), nullable=False)  # HH:MM format
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="scheduled")  # scheduled, completed, cancelled
    reminder_set = Column(Boolean, default=False)
    reminder_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="appointments")

    def __repr__(self):
        return f"<Appointment(user_id={self.user_id}, doctor={self.doctor_name}, date={self.appointment_date})>"


class HospitalReportHistory(Base):
    """History of saved hospital report analyses for each user"""
    __tablename__ = "hospital_report_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    report_title = Column(String(255), nullable=True)
    uploaded_file = Column(String(255), nullable=True)
    ocr_method = Column(String(100), nullable=True)
    extracted_text = Column(Text, nullable=True)
    structured_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationship
    user = relationship("User", back_populates="hospital_report_history")

    def __repr__(self):
        return f"<HospitalReportHistory(user_id={self.user_id}, title={self.report_title})>"
