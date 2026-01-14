-- ============================================
-- LMS YPP - Supabase Schema (NO RLS)
-- Run this in Supabase SQL Editor
-- RLS bisa ditambahkan nanti
-- ============================================

-- 1. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade INTEGER DEFAULT 7,
    is_exam_mode BOOLEAN DEFAULT false,
    time_limit INTEGER,
    ai_hints_enabled BOOLEAN DEFAULT true,
    questions JSONB NOT NULL DEFAULT '[]',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BOOKS TABLE
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    file_url TEXT,
    assigned_to JSONB DEFAULT '[]',
    uploaded_by TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INTEGRITY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS integrity_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    quiz_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    logs JSONB DEFAULT '[]',
    is_flagged BOOLEAN DEFAULT false
);

-- 4. CLASSES TABLE
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    teacher_id TEXT NOT NULL,
    join_code TEXT UNIQUE,
    student_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    avatar TEXT DEFAULT '🦊',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT '{}',
    class_ids TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FORUM POSTS TABLE
CREATE TABLE IF NOT EXISTS forum_posts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT DEFAULT '😊',
    author_role TEXT DEFAULT 'student',
    content TEXT NOT NULL,
    topic TEXT DEFAULT 'general',
    likes INTEGER DEFAULT 0,
    liked_by TEXT[] DEFAULT '{}',
    replies JSONB DEFAULT '[]',
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    quiz_id TEXT NOT NULL,
    quiz_title TEXT NOT NULL,
    class_id TEXT NOT NULL,
    class_name TEXT NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'active',
    submission_count INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PROGRESS (Quiz Attempts) TABLE
CREATE TABLE IF NOT EXISTS progress (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL,
    quiz_id TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}',
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    quiz_ids TEXT[] DEFAULT '{}',
    participant_ids TEXT[] DEFAULT '{}',
    leaderboard JSONB DEFAULT '[]',
    status TEXT DEFAULT 'upcoming',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. LIVE BATTLE ROOMS TABLE
CREATE TABLE IF NOT EXISTS battle_rooms (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code TEXT UNIQUE NOT NULL,
    host_id TEXT NOT NULL,
    status TEXT DEFAULT 'waiting',
    participants JSONB DEFAULT '[]',
    current_question INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DISABLE RLS FOR ALL TABLES
-- ============================================
ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE integrity_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE battle_rooms DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ENABLE REALTIME (for live battle)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'battle_rooms'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE battle_rooms;
    END IF;
END $$;

-- ============================================
-- SAMPLE DATA (untuk testing)
-- ============================================
INSERT INTO classes (id, name, description, teacher_id, join_code)
VALUES ('class-1', 'Kelas 9A', 'Kelas Matematika', 'teacher-1', 'ABC123')
ON CONFLICT (id) DO NOTHING;

INSERT INTO students (id, user_id, name, email, avatar, xp, level)
VALUES ('student-1', 'student-1', 'Siswa Demo', 'siswa@email.com', '🦊', 100, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO quizzes (id, title, subject, grade, questions, created_by)
VALUES ('quiz-1', 'Matematika Dasar', 'Matematika', 7, 
    '[{"id":"q1","type":"choice","text":"Berapa 2+2?","options":["3","4","5","6"],"correctOption":1}]',
    'teacher-1')
ON CONFLICT (id) DO NOTHING;

SELECT 'Schema created successfully! ✅' as status;
