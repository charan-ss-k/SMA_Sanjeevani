-- ============================================================================
-- SQLite Schema for SMA Sanjeevani Application
-- Database: sanjeevani.db
-- Created: 2026-01-26
-- Description: Stores user health data, medicine recommendations, QA history, 
--              prescriptions, and reminders
-- ============================================================================

-- ============================================================================
-- Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    hashed_password TEXT NOT NULL,
    age INTEGER,
    gender TEXT,  -- Male, Female, Other
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_created_at ON users(created_at);

-- ============================================================================
-- Medicine History Table
-- Stores medicine recommendations for symptoms
-- ============================================================================
CREATE TABLE IF NOT EXISTS medicine_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    symptoms TEXT NOT NULL,  -- JSON array of symptoms
    predicted_condition TEXT NOT NULL,
    recommended_medicines TEXT NOT NULL,  -- JSON array of medicines with details
    home_care_advice TEXT,  -- JSON
    doctor_consultation_advice TEXT,
    dosage_info TEXT,  -- JSON
    effectiveness_rating REAL,  -- User rating 1-5
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_medicine_history_user ON medicine_history(user_id);
CREATE INDEX IF NOT EXISTS idx_medicine_history_created ON medicine_history(created_at);
CREATE INDEX IF NOT EXISTS idx_medicine_history_user_created ON medicine_history(user_id, created_at DESC);

-- ============================================================================
-- Prescriptions Table
-- Stores prescription information
-- ============================================================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    medicine_name TEXT NOT NULL,
    dosage TEXT NOT NULL,  -- e.g., "500mg", "2 tablets"
    frequency TEXT NOT NULL,  -- e.g., "Twice daily"
    duration TEXT NOT NULL,  -- e.g., "7 days", "2 weeks"
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    doctor_name TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_user ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_is_active ON prescriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_prescriptions_created ON prescriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_active ON prescriptions(user_id, is_active);

-- ============================================================================
-- Reminders Table
-- Stores medicine reminders and alarms
-- ============================================================================
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    prescription_id INTEGER,
    medicine_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    reminder_time TEXT NOT NULL,  -- HH:MM format
    frequency TEXT NOT NULL,  -- Daily, Weekly, Custom
    days TEXT,  -- JSON array of days for reminders
    is_active BOOLEAN DEFAULT 1,
    last_reminded TIMESTAMP,
    next_reminder TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_is_active ON reminders(is_active);
CREATE INDEX IF NOT EXISTS idx_reminders_next_reminder ON reminders(next_reminder);
CREATE INDEX IF NOT EXISTS idx_reminders_user_active ON reminders(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_reminders_next_reminder_active ON reminders(next_reminder) WHERE is_active = 1;

-- ============================================================================
-- QA History Table
-- Stores medical Q&A conversation history
-- ============================================================================
CREATE TABLE IF NOT EXISTS qa_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,  -- Symptoms, Treatment, Prevention, General
    helpful BOOLEAN,  -- Did user find it helpful?
    follow_up_questions TEXT,  -- JSON array of suggested follow-up questions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_qa_history_user ON qa_history(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_history_category ON qa_history(category);
CREATE INDEX IF NOT EXISTS idx_qa_history_created ON qa_history(created_at);
CREATE INDEX IF NOT EXISTS idx_qa_history_user_category ON qa_history(user_id, category);

-- ============================================================================
-- Dashboard Data Table
-- Stores user dashboard statistics and analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    total_consultations INTEGER DEFAULT 0,
    medications_tracked INTEGER DEFAULT 0,
    reminders_set INTEGER DEFAULT 0,
    questions_asked INTEGER DEFAULT 0,
    last_consultation TIMESTAMP,
    health_score REAL DEFAULT 0,  -- 0-100 based on compliance
    streak_days INTEGER DEFAULT 0,  -- Consecutive reminder compliance days
    total_medications INTEGER DEFAULT 0,
    active_reminders INTEGER DEFAULT 0,
    custom_data TEXT,  -- JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- Sample Data for Testing
-- ============================================================================

-- Insert test user (password: password123 hashed with bcrypt)
INSERT OR IGNORE INTO users (username, email, full_name, hashed_password, age, gender, is_active)
VALUES (
    'testuser',
    'testuser@example.com',
    'Test User',
    '$2b$12$test_hashed_password_here',
    30,
    'Male',
    1
);

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- Active prescriptions view
CREATE VIEW IF NOT EXISTS active_prescriptions AS
SELECT 
    p.id,
    p.user_id,
    p.medicine_name,
    p.dosage,
    p.frequency,
    p.duration,
    p.doctor_name,
    p.start_date,
    p.end_date,
    COUNT(r.id) as reminder_count
FROM prescriptions p
LEFT JOIN reminders r ON p.id = r.prescription_id AND r.is_active = 1
WHERE p.is_active = 1
GROUP BY p.id, p.user_id, p.medicine_name, p.dosage, p.frequency, p.duration, p.doctor_name, p.start_date, p.end_date;

-- User health summary view
CREATE VIEW IF NOT EXISTS user_health_summary AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    COUNT(DISTINCT m.id) as total_recommendations,
    COUNT(DISTINCT p.id) as total_prescriptions,
    COUNT(DISTINCT r.id) as total_reminders,
    COUNT(DISTINCT q.id) as total_qa_questions,
    MAX(q.created_at) as last_question_date,
    MAX(m.created_at) as last_recommendation_date
FROM users u
LEFT JOIN medicine_history m ON u.id = m.user_id
LEFT JOIN prescriptions p ON u.id = p.user_id
LEFT JOIN reminders r ON u.id = r.user_id
LEFT JOIN qa_history q ON u.id = q.user_id
GROUP BY u.id, u.username, u.email, u.full_name;

-- ============================================================================
-- End of SQLite Schema
-- ============================================================================
