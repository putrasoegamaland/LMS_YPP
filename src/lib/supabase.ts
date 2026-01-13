import { createClient } from '@supabase/supabase-js';

// Supabase client for database operations only (NOT using Supabase Auth)
// Auth is handled by our simple AuthContext with mock users

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not configured. Using localStorage fallback.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
    return Boolean(supabaseUrl && supabaseAnonKey);
};

// Database types for TypeScript
export interface DbQuiz {
    id: string;
    title: string;
    subject: string;
    grade: number;
    is_exam_mode: boolean;
    time_limit: number | null;
    ai_hints_enabled: boolean;
    questions: any; // JSON
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface DbBook {
    id: string;
    title: string;
    description: string;
    subject: string;
    file_url: string;
    assigned_to: any; // JSON array
    uploaded_by: string;
    uploaded_at: string;
}

export interface DbIntegritySession {
    id: string;
    session_id: string;
    quiz_id: string;
    user_id: string;
    start_time: string;
    end_time: string | null;
    events: any; // JSON array
    tab_switch_count: number;
    copy_attempts: number;
    rapid_answers: number;
    overall_score: number;
    review_status: 'pending' | 'approved' | 'flagged' | 'dismissed';
}

export interface DbStudent {
    id: string;
    name: string;
    email: string;
    class_id: string | null;
    xp: number;
    level: number;
    streak: number;
    badges: any; // JSON array
    created_at: string;
}

export interface DbClass {
    id: string;
    name: string;
    code: string;
    grade: number;
    teacher_id: string;
    created_at: string;
}
