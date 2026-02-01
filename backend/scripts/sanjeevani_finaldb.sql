-- ============================================================================
-- SMA SANJEEVANI - FRESH PostgreSQL Database Schema
-- Version: 2.0 (Completely Redesigned)
-- Date: 2026-01-26
-- Purpose: Complete health data management system
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE - User Authentication & Profile
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    age INTEGER,
    gender VARCHAR(20),  -- Male, Female, Other
    blood_type VARCHAR(5),
    allergies_info TEXT,
    chronic_conditions TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    language_preference VARCHAR(50) DEFAULT 'english',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. HEALTH PROFILE TABLE - Detailed Health Info Per User
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    blood_pressure VARCHAR(10),
    blood_sugar_level VARCHAR(10),
    bmi DECIMAL(5,2),
    known_allergies JSONB,  -- Array of allergies: [penicillin, shellfish]
    existing_conditions JSONB,  -- Array: [diabetes, hypertension]
    surgical_history JSONB,  -- Array of past surgeries
    family_medical_history TEXT,
    current_medications JSONB,  -- Array of current medicines
    vaccination_status JSONB,  -- {covid: "completed", polio: "completed"}
    last_checkup_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 3. SYMPTOM CHECKER HISTORY - All Symptom Analysis Records
-- ============================================================================
CREATE TABLE IF NOT EXISTS symptom_check_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    age_at_check INTEGER,
    gender_at_check VARCHAR(20),
    symptoms JSONB NOT NULL,  -- ["fever", "headache", "cough"]
    custom_symptoms TEXT,  -- User-entered symptoms
    allergies_reported JSONB,  -- User's reported allergies at time
    existing_conditions_reported JSONB,  -- Health conditions at time
    pregnancy_status BOOLEAN,
    language_used VARCHAR(50),
    
    -- Analysis Results
    predicted_condition VARCHAR(255),
    condition_confidence DECIMAL(5,2),  -- 0-100% confidence
    recommended_medicines JSONB,  -- [{name: "Paracetamol", dosage: "500mg", frequency: "2x daily"}]
    home_care_advice JSONB,  -- Array of home care tips
    doctor_consultation_needed BOOLEAN,
    warning_signs TEXT,
    
    -- Additional Info
    tts_payload TEXT,  -- Full text that was read aloud
    user_feedback VARCHAR(255),  -- Was this helpful?
    marked_helpful BOOLEAN,
    
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 4. MEDICINE RECOMMENDATIONS - Detailed Medicine Data
-- ============================================================================
CREATE TABLE IF NOT EXISTS medicine_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    symptom_check_id INTEGER,
    
    medicine_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    medicine_type VARCHAR(100),  -- Antibiotic, Painkiller, etc.
    dosage VARCHAR(100) NOT NULL,  -- "500mg", "2 tablets"
    frequency VARCHAR(100) NOT NULL,  -- "Twice daily", "Every 6 hours"
    duration VARCHAR(100) NOT NULL,  -- "7 days", "Until symptoms subside"
    
    -- Precautions
    side_effects JSONB,  -- Common side effects
    contraindications TEXT,  -- Don't use if you have X
    food_interactions TEXT,  -- Don't mix with food X
    drug_interactions JSONB,  -- Array of medicines to avoid
    pregnancy_safe BOOLEAN,
    nursing_safe BOOLEAN,
    
    -- Effectiveness
    effectiveness_rating DECIMAL(3,2),  -- 1-5 stars
    user_rating DECIMAL(3,2),  -- User's rating after use
    user_review TEXT,
    
    -- References
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (symptom_check_id) REFERENCES symptom_check_history(id) ON DELETE SET NULL
);

-- ============================================================================
-- 5. PRESCRIPTIONS TABLE - Doctor Prescribed Medicines
-- ============================================================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    
    -- Prescription Details
    prescription_date DATE DEFAULT CURRENT_DATE,
    doctor_name VARCHAR(200),
    doctor_qualification VARCHAR(100),  -- MD, DM, MBBS
    hospital_clinic_name VARCHAR(200),
    contact_info VARCHAR(200),
    
    -- Medicine Info
    medicine_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,  -- "2 tablets twice daily"
    duration VARCHAR(100) NOT NULL,  -- "14 days"
    quantity INTEGER,  -- Number of tablets/doses
    instructions TEXT,  -- Special instructions from doctor
    
    -- Schedule
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Tracking
    refill_needed BOOLEAN DEFAULT FALSE,
    refill_date DATE,
    
    -- Notes
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 6. REMINDERS TABLE - Medicine Reminder Schedules
-- ============================================================================
CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    prescription_id INTEGER,  -- Can be from prescription or self-added
    
    -- Reminder Details
    medicine_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    reminder_type VARCHAR(50),  -- scheduled, one-time, recurring
    
    -- Time Schedule
    reminder_time TIME NOT NULL,  -- 09:30
    frequency VARCHAR(50),  -- daily, weekly, custom
    days_of_week JSONB,  -- ["Monday", "Wednesday", "Friday"] for weekly
    repeat_pattern VARCHAR(100),  -- "Every 6 hours", "Twice daily"
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    
    -- Tracking
    last_reminded_at TIMESTAMP,
    next_reminder_at TIMESTAMP,
    times_taken INTEGER DEFAULT 0,
    times_missed INTEGER DEFAULT 0,
    
    -- Notification Settings
    enable_sound BOOLEAN DEFAULT TRUE,
    enable_vibration BOOLEAN DEFAULT TRUE,
    send_sms BOOLEAN DEFAULT FALSE,
    send_email BOOLEAN DEFAULT FALSE,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL
);

-- ============================================================================
-- 7. MEDICINE TAKEN LOG - Track When User Took Medicine
-- ============================================================================
CREATE TABLE IF NOT EXISTS medicine_taken_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    reminder_id INTEGER,
    
    medicine_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    status VARCHAR(50),  -- taken, missed, skipped, incomplete
    skipped_reason TEXT,  -- Why they skipped
    
    -- Side Effects Reported
    side_effects_reported TEXT,
    side_effect_severity VARCHAR(20),  -- mild, moderate, severe
    adverse_event BOOLEAN DEFAULT FALSE,  -- Serious adverse event?
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE SET NULL
);

-- ============================================================================
-- 8. CHATBOT CONVERSATION HISTORY - Q&A Sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    
    session_id VARCHAR(255),  -- Group messages by session
    message_count INTEGER,
    
    session_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_ended_at TIMESTAMP,
    session_duration_minutes INTEGER,
    
    topic_category VARCHAR(100),  -- Symptoms, Medicines, Prevention, General
    language_used VARCHAR(50),
    
    -- Engagement
    user_satisfied BOOLEAN,
    user_rating DECIMAL(3,2),  -- 1-5 stars
    feedback_text TEXT,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. CHATBOT MESSAGES - Individual Q&A Pairs
-- ============================================================================
CREATE TABLE IF NOT EXISTS chatbot_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    
    -- Message Details
    message_type VARCHAR(50),  -- question, answer, follow_up
    sequence_number INTEGER,  -- Order in conversation
    
    -- User Question
    user_question TEXT NOT NULL,
    question_language VARCHAR(50),
    
    -- AI Answer
    ai_answer TEXT NOT NULL,
    answer_language VARCHAR(50),
    
    -- AI Processing
    llm_model_used VARCHAR(100),  -- mistral, gpt, etc
    processing_time_ms INTEGER,
    confidence_score DECIMAL(5,2),
    
    -- Category
    question_category VARCHAR(100),  -- Symptoms, Treatment, Prevention
    subcategory VARCHAR(100),
    
    -- User Interaction
    was_helpful BOOLEAN,
    follow_up_question_asked BOOLEAN,
    
    -- Additional
    reference_links TEXT,  -- Any medical references provided (renamed from reserved word `references`)
    tts_used BOOLEAN,  -- Did user listen via TTS?
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 10. HEALTH SCHEDULE - User's Daily Health Schedule/Routine
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    
    -- Time Slots
    slot_type VARCHAR(50),  -- medicine, exercise, meal, checkup, meditation
    activity_name VARCHAR(200),
    
    -- Schedule Details
    scheduled_time TIME NOT NULL,
    frequency VARCHAR(50),  -- daily, weekly, custom
    days_of_week JSONB,  -- For weekly schedules
    
    -- Details by Type
    details JSONB,  -- {meal_type: "breakfast", medicine: "Aspirin", duration: "30min"}
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    completed_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    
    -- Notifications
    send_reminder BOOLEAN DEFAULT TRUE,
    reminder_time_before_minutes INTEGER,  -- 15 minutes before
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 11. HEALTH SCHEDULE LOG - Track Completion
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_schedule_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    schedule_id INTEGER NOT NULL,
    
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    actual_completion_time TIMESTAMP,
    
    status VARCHAR(50),  -- completed, missed, pending, postponed
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES health_schedules(id) ON DELETE CASCADE
);

-- ============================================================================
-- 12. MEDICAL TESTS/CHECKUPS - Track Doctor Visits
-- ============================================================================
CREATE TABLE IF NOT EXISTS medical_checkups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    
    checkup_type VARCHAR(100),  -- General, Blood Test, CT Scan, etc.
    doctor_name VARCHAR(200),
    hospital_name VARCHAR(200),
    contact_info VARCHAR(200),
    
    checkup_date DATE,
    next_checkup_date DATE,
    
    findings TEXT,
    recommendations TEXT,
    prescribed_medicines JSONB,
    
    report_file_path VARCHAR(255),  -- Path to uploaded report
    
    status VARCHAR(50),  -- scheduled, completed, pending_report
    cost DECIMAL(10,2),
    insurance_covered BOOLEAN,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 13. ANALYTICS TABLE - User Engagement & Health Metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    
    -- Engagement Metrics
    total_symptom_checks INTEGER DEFAULT 0,
    total_qa_questions INTEGER DEFAULT 0,
    total_medicines_tracked INTEGER DEFAULT 0,
    total_reminders_set INTEGER DEFAULT 0,
    total_checkups_done INTEGER DEFAULT 0,
    
    -- Compliance Metrics
    medicine_adherence_rate DECIMAL(5,2),  -- 0-100%
    reminder_compliance_count INTEGER DEFAULT 0,
    medicines_taken_on_time INTEGER DEFAULT 0,
    medicines_missed INTEGER DEFAULT 0,
    
    -- Health Scores
    health_score DECIMAL(5,2),  -- 0-100, based on compliance
    streak_days INTEGER DEFAULT 0,  -- Consecutive days of adherence
    
    -- Last Activity
    last_symptom_check DATE,
    last_qa_question DATE,
    last_medicine_taken DATE,
    last_reminder_acknowledged DATE,
    last_login_date DATE,
    
    -- Preferences
    preferred_language VARCHAR(50),
    preferred_reminder_time TIME,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES - Performance Optimization
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

-- Health Profile indexes
CREATE INDEX IF NOT EXISTS idx_health_profile_user ON health_profiles(user_id);

-- Symptom Check indexes
CREATE INDEX IF NOT EXISTS idx_symptom_check_user ON symptom_check_history(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_check_date ON symptom_check_history(checked_at);
CREATE INDEX IF NOT EXISTS idx_symptom_check_user_date ON symptom_check_history(user_id, checked_at DESC);

-- Medicine Recommendations indexes
CREATE INDEX IF NOT EXISTS idx_med_rec_user ON medicine_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_med_rec_symptom ON medicine_recommendations(symptom_check_id);

-- Prescriptions indexes
CREATE INDEX IF NOT EXISTS idx_prescription_user ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescription_active ON prescriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_prescription_user_active ON prescriptions(user_id, is_active);

-- Reminders indexes
CREATE INDEX IF NOT EXISTS idx_reminder_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_prescription ON reminders(prescription_id);
CREATE INDEX IF NOT EXISTS idx_reminder_active ON reminders(is_active);
CREATE INDEX IF NOT EXISTS idx_reminder_next ON reminders(next_reminder_at);

-- Medicine Taken Log indexes
CREATE INDEX IF NOT EXISTS idx_med_log_user ON medicine_taken_log(user_id);
CREATE INDEX IF NOT EXISTS idx_med_log_reminder ON medicine_taken_log(reminder_id);
CREATE INDEX IF NOT EXISTS idx_med_log_taken_at ON medicine_taken_log(taken_at);

-- Chatbot indexes
CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_user ON chatbot_messages(user_id);

-- Health Schedule indexes
CREATE INDEX IF NOT EXISTS idx_schedule_user ON health_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_active ON health_schedules(is_active);

-- Health Schedule Log indexes
CREATE INDEX IF NOT EXISTS idx_schedule_log_user ON health_schedule_log(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_log_date ON health_schedule_log(scheduled_date);

-- Medical Checkups indexes
CREATE INDEX IF NOT EXISTS idx_checkup_user ON medical_checkups(user_id);
CREATE INDEX IF NOT EXISTS idx_checkup_date ON medical_checkups(checkup_date);

-- ============================================================================
-- VIEWS - Common Queries
-- ============================================================================

-- View: All Active Medicines for User
CREATE OR REPLACE VIEW active_medicines_view AS
SELECT 
    u.id as user_id,
    u.username,
    p.id as prescription_id,
    p.medicine_name,
    p.dosage,
    p.frequency,
    p.duration,
    p.start_date,
    p.end_date,
    COUNT(r.id) as reminder_count
FROM users u
LEFT JOIN prescriptions p ON u.id = p.user_id AND p.is_active = TRUE
LEFT JOIN reminders r ON p.id = r.prescription_id AND r.is_active = TRUE
WHERE u.id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
GROUP BY u.id, u.username, p.id, p.medicine_name, p.dosage, p.frequency, p.duration, p.start_date, p.end_date;

-- View: User Health Summary
CREATE OR REPLACE VIEW user_health_summary_view AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.age as age,
    u.blood_type,
    COUNT(DISTINCT sch.id) as total_symptom_checks,
    COUNT(DISTINCT p.id) as total_prescriptions,
    COUNT(DISTINCT r.id) as total_reminders,
    COUNT(DISTINCT cc.id) as total_conversations,
    COUNT(DISTINCT mc.id) as total_checkups,
    ua.medicine_adherence_rate,
    ua.health_score,
    ua.streak_days,
    MAX(cc.session_started_at) as last_qa_time,
    MAX(sch.checked_at) as last_symptom_check,
    MAX(mtl.taken_at) as last_medicine_taken
FROM users u
LEFT JOIN health_profiles hp ON u.id = hp.user_id
LEFT JOIN symptom_check_history sch ON u.id = sch.user_id
LEFT JOIN prescriptions p ON u.id = p.user_id
LEFT JOIN reminders r ON u.id = r.user_id
LEFT JOIN chatbot_conversations cc ON u.id = cc.user_id
LEFT JOIN medical_checkups mc ON u.id = mc.user_id
LEFT JOIN medicine_taken_log mtl ON u.id = mtl.user_id
LEFT JOIN user_analytics ua ON u.id = ua.user_id
WHERE u.id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
GROUP BY 
    u.id, 
    u.username, 
    u.email, 
    u.age,
    u.blood_type,
    ua.medicine_adherence_rate, 
    ua.health_score, 
    ua.streak_days;
-- View: Upcoming Reminders for Next 24 Hours
CREATE OR REPLACE VIEW upcoming_reminders_view AS
SELECT 
    r.id,
    r.user_id,
    r.medicine_name,
    r.dosage,
    r.reminder_time,
    r.next_reminder_at,
    EXTRACT(HOUR FROM (r.next_reminder_at - CURRENT_TIMESTAMP)) as hours_until_reminder
FROM reminders r
WHERE r.is_active = TRUE
    AND r.user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
    AND r.next_reminder_at BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '24 hours'
ORDER BY r.next_reminder_at;

-- View: Medicine Adherence Report
CREATE OR REPLACE VIEW medicine_adherence_report_view AS
SELECT 
    u.id,
    u.username,
    p.medicine_name,
    COUNT(mtl.id) as times_taken,
    COUNT(CASE WHEN mtl.status = 'missed' THEN 1 END) as times_missed,
    COUNT(CASE WHEN mtl.status = 'taken' THEN 1 END) as times_taken_on_time,
    ROUND(100.0 * COUNT(CASE WHEN mtl.status = 'taken' THEN 1 END) / NULLIF(COUNT(mtl.id), 0), 2) as adherence_percentage,
    p.start_date,
    p.end_date
FROM users u
LEFT JOIN prescriptions p ON u.id = p.user_id
LEFT JOIN reminders r ON p.id = r.prescription_id
LEFT JOIN medicine_taken_log mtl ON r.id = mtl.reminder_id
WHERE p.is_active = TRUE
  AND u.id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
GROUP BY u.id, u.username, p.id, p.medicine_name, p.start_date, p.end_date;

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) - Per-user data isolation across all features
-- Requires application to set: SET app.current_user_id = '<user_id>' per session/connection
-- ============================================================================

-- 2. HEALTH PROFILE
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_health_profiles ON health_profiles
    USING (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER))
    WITH CHECK (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER));

-- 3. SYMPTOM CHECKER HISTORY
ALTER TABLE symptom_check_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_symptom_check_history ON symptom_check_history
    USING (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER))
    WITH CHECK (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER));

-- 4. MEDICINE RECOMMENDATIONS
ALTER TABLE medicine_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_medicine_recommendations ON medicine_recommendations
    USING (
        user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        AND (symptom_check_id IS NULL OR EXISTS (
            SELECT 1 FROM symptom_check_history sch
            WHERE sch.id = symptom_check_id
              AND sch.user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        ))
    )
    WITH CHECK (
        user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        AND (symptom_check_id IS NULL OR EXISTS (
            SELECT 1 FROM symptom_check_history sch
            WHERE sch.id = symptom_check_id
              AND sch.user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        ))
    );

-- 5. PRESCRIPTIONS
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_prescriptions ON prescriptions
    USING (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER))
    WITH CHECK (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER));

-- 6. REMINDERS
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_reminders ON reminders
    USING (
        user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        AND (prescription_id IS NULL OR EXISTS (
            SELECT 1 FROM prescriptions p
            WHERE p.id = prescription_id
              AND p.user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        ))
    )
    WITH CHECK (
        user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        AND (prescription_id IS NULL OR EXISTS (
            SELECT 1 FROM prescriptions p
            WHERE p.id = prescription_id
              AND p.user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        ))
    );

-- 7. MEDICINE TAKEN LOG
ALTER TABLE medicine_taken_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_medicine_taken_log ON medicine_taken_log
    USING (
        user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        AND (reminder_id IS NULL OR EXISTS (
            SELECT 1 FROM reminders r
            WHERE r.id = reminder_id
              AND r.user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        ))
    )
    WITH CHECK (
        user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        AND (reminder_id IS NULL OR EXISTS (
            SELECT 1 FROM reminders r
            WHERE r.id = reminder_id
              AND r.user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        ))
    );

-- 8. CHATBOT CONVERSATIONS
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_chatbot_conversations ON chatbot_conversations
    USING (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER))
    WITH CHECK (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER));

-- 9. CHATBOT MESSAGES
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_chatbot_messages ON chatbot_messages
    USING (
        user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        AND EXISTS (
            SELECT 1 FROM chatbot_conversations c
            WHERE c.id = conversation_id
              AND c.user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        )
    )
    WITH CHECK (
        user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        AND EXISTS (
            SELECT 1 FROM chatbot_conversations c
            WHERE c.id = conversation_id
              AND c.user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        )
    );

-- 10. HEALTH SCHEDULES
ALTER TABLE health_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_health_schedules ON health_schedules
    USING (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER))
    WITH CHECK (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER));

-- 11. HEALTH SCHEDULE LOG
ALTER TABLE health_schedule_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_health_schedule_log ON health_schedule_log
    USING (
        user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        AND EXISTS (
            SELECT 1 FROM health_schedules hs
            WHERE hs.id = schedule_id
              AND hs.user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        )
    )
    WITH CHECK (
        user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        AND EXISTS (
            SELECT 1 FROM health_schedules hs
            WHERE hs.id = schedule_id
              AND hs.user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER)
        )
    );

-- 12. MEDICAL CHECKUPS
ALTER TABLE medical_checkups ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_medical_checkups ON medical_checkups
    USING (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER))
    WITH CHECK (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER));

-- 13. USER ANALYTICS
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_user_analytics ON user_analytics
    USING (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER))
    WITH CHECK (user_id = CAST(current_setting('app.current_user_id', true) AS INTEGER));


-- ============================================================================
-- SAMPLE DATA - For Testing
-- ============================================================================

-- Insert test user
INSERT INTO users (
    username, email, password_hash, first_name, last_name, 
    age, gender, language_preference, is_active
) VALUES (
    'testuser',
    'testuser@sanjeevani.com',
    'hashed_password_placeholder',
    'Test',
    'User',
    28,
    'Male',
    'english',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- END OF DATABASE SCHEMA
-- ============================================================================
