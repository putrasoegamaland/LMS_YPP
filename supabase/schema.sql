-- =============================================
-- LMS_YPP Database Schema for Supabase
-- Run this in Supabase SQL Editor
-- =============================================

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    grade INTEGER NOT NULL,
    teacher_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table (simple user info, no auth)
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY, -- Using TEXT to match our simple auth IDs
    name TEXT NOT NULL,
    email TEXT,
    class_id UUID REFERENCES classes(id),
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    badges JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade INTEGER NOT NULL,
    is_exam_mode BOOLEAN DEFAULT FALSE,
    time_limit INTEGER,
    ai_hints_enabled BOOLEAN DEFAULT TRUE,
    questions JSONB NOT NULL DEFAULT '[]',
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    file_url TEXT,
    assigned_to JSONB DEFAULT '[]',
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integrity sessions table
CREATE TABLE IF NOT EXISTS integrity_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    quiz_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    events JSONB DEFAULT '[]',
    tab_switch_count INTEGER DEFAULT 0,
    copy_attempts INTEGER DEFAULT 0,
    rapid_answers INTEGER DEFAULT 0,
    overall_score INTEGER DEFAULT 100,
    review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'flagged', 'dismissed'))
);

-- Quiz assignments (which classes/students can access which quizzes)
CREATE TABLE IF NOT EXISTS quiz_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    UNIQUE(quiz_id, class_id)
);

-- Student quiz attempts/progress
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id TEXT REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
    score INTEGER,
    answers JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_spent INTEGER -- seconds
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher ON quizzes(created_by);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON quizzes(subject);
CREATE INDEX IF NOT EXISTS idx_integrity_quiz ON integrity_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_integrity_user ON integrity_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_integrity_status ON integrity_sessions(review_status);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);

-- Row Level Security (RLS) - Basic policies
-- Note: Since we're not using Supabase Auth, these are permissive for now
-- In production, you'd want proper RLS based on your auth system

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (anon key)
-- In production, you'd restrict this based on your auth token
CREATE POLICY "Allow all for quizzes" ON quizzes FOR ALL USING (true);
CREATE POLICY "Allow all for books" ON books FOR ALL USING (true);
CREATE POLICY "Allow all for integrity" ON integrity_sessions FOR ALL USING (true);
CREATE POLICY "Allow all for students" ON students FOR ALL USING (true);
CREATE POLICY "Allow all for classes" ON classes FOR ALL USING (true);
