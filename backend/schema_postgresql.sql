-- ============================================================================
-- PostgreSQL Schema for SMA Sanjeevani Application
-- Database: sanjeevani
-- Created: 2026-01-26
-- Description: Stores user health data, medicine recommendations, QA history, 
--              prescriptions, and reminders
-- ============================================================================

-- Create database (run this separately if needed)
-- CREATE DATABASE sanjeevani;

-- ============================================================================
-- Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    hashed_password VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),  -- Male, Female, Other
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- ============================================================================
-- Medicine History Table
-- Stores medicine recommendations for symptoms
-- ============================================================================
CREATE TABLE IF NOT EXISTS medicine_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    symptoms JSONB NOT NULL,  -- Array of symptoms
    predicted_condition VARCHAR(255) NOT NULL,
    recommended_medicines JSONB NOT NULL,  -- Array of medicines with details
    home_care_advice JSONB,
    doctor_consultation_advice TEXT,
    dosage_info JSONB,
    effectiveness_rating FLOAT,  -- User rating 1-5
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- ============================================================================
-- Prescriptions Table
-- Stores prescription information
-- ============================================================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    medicine_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,  -- e.g., "500mg", "2 tablets"
    frequency VARCHAR(100) NOT NULL,  -- e.g., "Twice daily"
    duration VARCHAR(100) NOT NULL,  -- e.g., "7 days", "2 weeks"
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    doctor_name VARCHAR(200),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
);

-- ============================================================================
-- Reminders Table
-- Stores medicine reminders and alarms
-- ============================================================================
CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    prescription_id INTEGER,
    medicine_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    reminder_time VARCHAR(10) NOT NULL,  -- HH:MM format
    frequency VARCHAR(50) NOT NULL,  -- Daily, Weekly, Custom
    days JSONB,  -- Days of week for reminders
    is_active BOOLEAN DEFAULT TRUE,
    last_reminded TIMESTAMP,
    next_reminder TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active),
    INDEX idx_next_reminder (next_reminder)
);

-- ============================================================================
-- QA History Table
-- Stores medical Q&A conversation history
-- ============================================================================
CREATE TABLE IF NOT EXISTS qa_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),  -- Symptoms, Treatment, Prevention, General
    helpful BOOLEAN,  -- Did user find it helpful?
    follow_up_questions JSONB,  -- Suggested follow-up questions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
);

-- ============================================================================
-- Dashboard Data Table
-- Stores user dashboard statistics and analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    total_consultations INTEGER DEFAULT 0,
    medications_tracked INTEGER DEFAULT 0,
    reminders_set INTEGER DEFAULT 0,
    questions_asked INTEGER DEFAULT 0,
    last_consultation TIMESTAMP,
    health_score FLOAT DEFAULT 0,  -- 0-100 based on compliance
    streak_days INTEGER DEFAULT 0,  -- Consecutive reminder compliance days
    total_medications INTEGER DEFAULT 0,
    active_reminders INTEGER DEFAULT 0,
    custom_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- Medicine History indexes
CREATE INDEX IF NOT EXISTS idx_medicine_history_user_created 
    ON medicine_history(user_id, created_at DESC);

-- Prescriptions indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_active 
    ON prescriptions(user_id, is_active);

-- Reminders indexes
CREATE INDEX IF NOT EXISTS idx_reminders_user_active 
    ON reminders(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_reminders_next_reminder 
    ON reminders(next_reminder) WHERE is_active = TRUE;

-- QA History indexes
CREATE INDEX IF NOT EXISTS idx_qa_history_user_category 
    ON qa_history(user_id, category);

-- ============================================================================
-- Sample Data for Testing
-- ============================================================================

-- Insert test user (password: password123 hashed with bcrypt)
INSERT INTO users (username, email, full_name, hashed_password, age, gender, is_active)
VALUES (
    'testuser',
    'testuser@example.com',
    'Test User',
    '$2b$12$test_hashed_password_here',
    30,
    'Male',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- Active prescriptions view
CREATE OR REPLACE VIEW active_prescriptions AS
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
LEFT JOIN reminders r ON p.id = r.prescription_id AND r.is_active = TRUE
WHERE p.is_active = TRUE
GROUP BY p.id, p.user_id, p.medicine_name, p.dosage, p.frequency, p.duration, p.doctor_name, p.start_date, p.end_date;

-- User health summary view
CREATE OR REPLACE VIEW user_health_summary AS
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
-- End of PostgreSQL Schema
-- ============================================================================
