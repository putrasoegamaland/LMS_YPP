/**
 * Database Service Layer
 * 
 * Provides a unified API for database operations.
 * Uses Supabase when configured, falls back to localStorage otherwise.
 * This allows the app to work in both modes seamlessly.
 */

import { supabase, isSupabaseConfigured, DbQuiz, DbBook, DbIntegritySession } from './supabase';

// ============================================
// QUIZZES
// ============================================

const QUIZ_STORAGE_KEY = 'lms_ypp_quiz_drafts';

export interface QuizData {
    id: string;
    title: string;
    subject: string;
    grade: number;
    isExamMode: boolean;
    timeLimit?: number;
    aiHintsEnabled: boolean;
    questions: any[];
    createdAt: string;
    createdBy?: string;
}

export const quizService = {
    async getAll(teacherId?: string): Promise<QuizData[]> {
        if (isSupabaseConfigured()) {
            let query = supabase.from('quizzes').select('*');
            if (teacherId) {
                query = query.eq('created_by', teacherId);
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []).map(mapDbQuizToApp);
        }
        // Fallback to localStorage
        const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    },

    async getById(id: string): Promise<QuizData | null> {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('quizzes')
                .select('*')
                .eq('id', id)
                .single();
            if (error) return null;
            return mapDbQuizToApp(data);
        }
        const all = await this.getAll();
        return all.find(q => q.id === id) || null;
    },

    async create(quiz: QuizData): Promise<QuizData> {
        if (isSupabaseConfigured()) {
            const dbQuiz = mapAppQuizToDb(quiz);
            const { data, error } = await supabase
                .from('quizzes')
                .insert(dbQuiz)
                .select()
                .single();
            if (error) throw error;
            return mapDbQuizToApp(data);
        }
        // Fallback to localStorage
        const all = await this.getAll();
        const updated = [quiz, ...all];
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(updated));
        return quiz;
    },

    async update(id: string, updates: Partial<QuizData>): Promise<QuizData | null> {
        if (isSupabaseConfigured()) {
            const dbUpdates = mapAppQuizToDb({ ...updates, id } as QuizData);
            const { data, error } = await supabase
                .from('quizzes')
                .update({ ...dbUpdates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return mapDbQuizToApp(data);
        }
        const all = await this.getAll();
        const idx = all.findIndex(q => q.id === id);
        if (idx === -1) return null;
        all[idx] = { ...all[idx], ...updates };
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(all));
        return all[idx];
    },

    async delete(id: string): Promise<boolean> {
        if (isSupabaseConfigured()) {
            const { error } = await supabase.from('quizzes').delete().eq('id', id);
            return !error;
        }
        const all = await this.getAll();
        const filtered = all.filter(q => q.id !== id);
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(filtered));
        return true;
    }
};

// ============================================
// BOOKS
// ============================================

const BOOK_STORAGE_KEY = 'lms_ypp_books';

export interface BookData {
    id: string;
    title: string;
    description: string;
    subject: string;
    fileUrl: string;
    assignedTo: { type: string; id: string; name: string }[];
    uploadedAt: string;
    uploadedBy?: string;
}

export const bookService = {
    async getAll(teacherId?: string): Promise<BookData[]> {
        if (isSupabaseConfigured()) {
            let query = supabase.from('books').select('*');
            if (teacherId) {
                query = query.eq('uploaded_by', teacherId);
            }
            const { data, error } = await query.order('uploaded_at', { ascending: false });
            if (error) throw error;
            return (data || []).map(mapDbBookToApp);
        }
        const saved = localStorage.getItem(BOOK_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    },

    async create(book: BookData): Promise<BookData> {
        if (isSupabaseConfigured()) {
            const dbBook = mapAppBookToDb(book);
            const { data, error } = await supabase
                .from('books')
                .insert(dbBook)
                .select()
                .single();
            if (error) throw error;
            return mapDbBookToApp(data);
        }
        const all = await this.getAll();
        const updated = [...all, book];
        localStorage.setItem(BOOK_STORAGE_KEY, JSON.stringify(updated));
        return book;
    },

    async update(id: string, updates: Partial<BookData>): Promise<BookData | null> {
        if (isSupabaseConfigured()) {
            const dbUpdates: any = {};
            if (updates.title) dbUpdates.title = updates.title;
            if (updates.description) dbUpdates.description = updates.description;
            if (updates.assignedTo) dbUpdates.assigned_to = updates.assignedTo;

            const { data, error } = await supabase
                .from('books')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return mapDbBookToApp(data);
        }
        const all = await this.getAll();
        const idx = all.findIndex(b => b.id === id);
        if (idx === -1) return null;
        all[idx] = { ...all[idx], ...updates };
        localStorage.setItem(BOOK_STORAGE_KEY, JSON.stringify(all));
        return all[idx];
    },

    async delete(id: string): Promise<boolean> {
        if (isSupabaseConfigured()) {
            const { error } = await supabase.from('books').delete().eq('id', id);
            return !error;
        }
        const all = await this.getAll();
        const filtered = all.filter(b => b.id !== id);
        localStorage.setItem(BOOK_STORAGE_KEY, JSON.stringify(filtered));
        return true;
    }
};

// ============================================
// INTEGRITY SESSIONS
// ============================================

const INTEGRITY_STORAGE_KEY = 'lms_ypp_integrity_logs';

export interface IntegritySessionData {
    sessionId: string;
    quizId: string;
    userId: string;
    startTime: string;
    endTime?: string;
    events: any[];
    tabSwitchCount: number;
    copyAttempts: number;
    rapidAnswers: number;
    overallScore: number;
    reviewStatus?: 'pending' | 'approved' | 'flagged' | 'dismissed';
}

export const integrityService = {
    async getAll(): Promise<IntegritySessionData[]> {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('integrity_sessions')
                .select('*')
                .order('start_time', { ascending: false });
            if (error) throw error;
            return (data || []).map(mapDbIntegrityToApp);
        }
        const saved = localStorage.getItem(INTEGRITY_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    },

    async getByQuiz(quizId: string): Promise<IntegritySessionData[]> {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('integrity_sessions')
                .select('*')
                .eq('quiz_id', quizId);
            if (error) throw error;
            return (data || []).map(mapDbIntegrityToApp);
        }
        const all = await this.getAll();
        return all.filter(s => s.quizId === quizId);
    },

    async getByStudent(userId: string): Promise<IntegritySessionData[]> {
        if (isSupabaseConfigured()) {
            const { data, error } = await supabase
                .from('integrity_sessions')
                .select('*')
                .eq('user_id', userId);
            if (error) throw error;
            return (data || []).map(mapDbIntegrityToApp);
        }
        const all = await this.getAll();
        return all.filter(s => s.userId === userId);
    },

    async create(session: IntegritySessionData): Promise<IntegritySessionData> {
        if (isSupabaseConfigured()) {
            const dbSession = mapAppIntegrityToDb(session);
            const { data, error } = await supabase
                .from('integrity_sessions')
                .insert(dbSession)
                .select()
                .single();
            if (error) throw error;
            return mapDbIntegrityToApp(data);
        }
        const all = await this.getAll();
        const updated = [...all, session];
        localStorage.setItem(INTEGRITY_STORAGE_KEY, JSON.stringify(updated));
        return session;
    },

    async updateReviewStatus(sessionId: string, status: 'pending' | 'approved' | 'flagged' | 'dismissed'): Promise<boolean> {
        if (isSupabaseConfigured()) {
            const { error } = await supabase
                .from('integrity_sessions')
                .update({ review_status: status })
                .eq('session_id', sessionId);
            return !error;
        }
        const all = await this.getAll();
        const idx = all.findIndex(s => s.sessionId === sessionId);
        if (idx === -1) return false;
        all[idx].reviewStatus = status;
        localStorage.setItem(INTEGRITY_STORAGE_KEY, JSON.stringify(all));
        return true;
    }
};

// ============================================
// MAPPERS
// ============================================

function mapDbQuizToApp(db: any): QuizData {
    return {
        id: db.id,
        title: db.title,
        subject: db.subject,
        grade: db.grade,
        isExamMode: db.is_exam_mode,
        timeLimit: db.time_limit,
        aiHintsEnabled: db.ai_hints_enabled,
        questions: db.questions,
        createdAt: db.created_at,
        createdBy: db.created_by,
    };
}

function mapAppQuizToDb(app: QuizData): any {
    return {
        id: app.id,
        title: app.title,
        subject: app.subject,
        grade: app.grade,
        is_exam_mode: app.isExamMode,
        time_limit: app.timeLimit || null,
        ai_hints_enabled: app.aiHintsEnabled,
        questions: app.questions,
        created_at: app.createdAt,
        created_by: app.createdBy || 'unknown',
    };
}

function mapDbBookToApp(db: any): BookData {
    return {
        id: db.id,
        title: db.title,
        description: db.description,
        subject: db.subject,
        fileUrl: db.file_url,
        assignedTo: db.assigned_to || [],
        uploadedAt: db.uploaded_at,
        uploadedBy: db.uploaded_by,
    };
}

function mapAppBookToDb(app: BookData): any {
    return {
        id: app.id,
        title: app.title,
        description: app.description,
        subject: app.subject,
        file_url: app.fileUrl,
        assigned_to: app.assignedTo,
        uploaded_at: app.uploadedAt,
        uploaded_by: app.uploadedBy || 'unknown',
    };
}

function mapDbIntegrityToApp(db: any): IntegritySessionData {
    return {
        sessionId: db.session_id,
        quizId: db.quiz_id,
        userId: db.user_id,
        startTime: db.start_time,
        endTime: db.end_time,
        events: db.events || [],
        tabSwitchCount: db.tab_switch_count,
        copyAttempts: db.copy_attempts,
        rapidAnswers: db.rapid_answers,
        overallScore: db.overall_score,
        reviewStatus: db.review_status,
    };
}

function mapAppIntegrityToDb(app: IntegritySessionData): any {
    return {
        session_id: app.sessionId,
        quiz_id: app.quizId,
        user_id: app.userId,
        start_time: app.startTime,
        end_time: app.endTime || null,
        events: app.events,
        tab_switch_count: app.tabSwitchCount,
        copy_attempts: app.copyAttempts,
        rapid_answers: app.rapidAnswers,
        overall_score: app.overallScore,
        review_status: app.reviewStatus || 'pending',
    };
}

// ============================================
// TOURNAMENTS
// ============================================

const TOURNAMENT_STORAGE_KEY = 'lms_ypp_tournaments';

export interface TournamentData {
    id: string;
    name: string;
    type: 'class_battle' | 'weekly' | 'daily_sprint';
    startDate: string;
    endDate?: string;
    classes: string[];
    status: 'scheduled' | 'active' | 'completed';
    rounds: number;
    currentRound: number;
    participants: { id: string; name: string; score: number }[];
    createdBy: string;
    createdAt: string;
}

export const tournamentService = {
    async getAll(): Promise<TournamentData[]> {
        const saved = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    },

    async getActive(): Promise<TournamentData[]> {
        const all = await this.getAll();
        return all.filter(t => t.status === 'active');
    },

    async create(tournament: TournamentData): Promise<TournamentData> {
        const all = await this.getAll();
        const updated = [tournament, ...all];
        localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(updated));
        return tournament;
    },

    async update(id: string, updates: Partial<TournamentData>): Promise<TournamentData | null> {
        const all = await this.getAll();
        const idx = all.findIndex(t => t.id === id);
        if (idx === -1) return null;
        all[idx] = { ...all[idx], ...updates };
        localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(all));
        return all[idx];
    },

    async delete(id: string): Promise<boolean> {
        const all = await this.getAll();
        const filtered = all.filter(t => t.id !== id);
        localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(filtered));
        return true;
    }
};

// ============================================
// FORUM POSTS
// ============================================

const FORUM_STORAGE_KEY = 'lms_ypp_forum_posts';

export interface ForumPostData {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    authorRole: 'student' | 'teacher';
    content: string;
    topic: string;
    createdAt: string;
    likes: number;
    likedBy: string[];
    replies: ForumReplyData[];
    isPinned: boolean;
}

export interface ForumReplyData {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    authorRole: 'student' | 'teacher';
    content: string;
    createdAt: string;
    likes: number;
    likedBy: string[];
    isBestAnswer: boolean;
}

export const forumService = {
    async getAll(): Promise<ForumPostData[]> {
        const saved = localStorage.getItem(FORUM_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    },

    async getByTopic(topic: string): Promise<ForumPostData[]> {
        const all = await this.getAll();
        return all.filter(p => p.topic === topic);
    },

    async create(post: ForumPostData): Promise<ForumPostData> {
        const all = await this.getAll();
        const updated = [post, ...all];
        localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(updated));
        return post;
    },

    async addReply(postId: string, reply: ForumReplyData): Promise<ForumPostData | null> {
        const all = await this.getAll();
        const idx = all.findIndex(p => p.id === postId);
        if (idx === -1) return null;
        all[idx].replies.push(reply);
        localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(all));
        return all[idx];
    },

    async toggleLike(postId: string, userId: string): Promise<ForumPostData | null> {
        const all = await this.getAll();
        const idx = all.findIndex(p => p.id === postId);
        if (idx === -1) return null;
        const post = all[idx];
        if (post.likedBy.includes(userId)) {
            post.likedBy = post.likedBy.filter(id => id !== userId);
            post.likes--;
        } else {
            post.likedBy.push(userId);
            post.likes++;
        }
        localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(all));
        return post;
    },

    async delete(id: string): Promise<boolean> {
        const all = await this.getAll();
        const filtered = all.filter(p => p.id !== id);
        localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(filtered));
        return true;
    }
};

// ============================================
// STUDENT PROGRESS
// ============================================

const PROGRESS_STORAGE_KEY = 'lms_ypp_student_progress';

export interface StudentProgressData {
    id: string;
    quizId: string;
    studentId: string;
    score: number;
    answers: any[];
    completedAt: string;
    timeTaken: number; // seconds
    attemptNumber: number;
}

export const progressService = {
    async getAll(): Promise<StudentProgressData[]> {
        const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    },

    async getByStudent(studentId: string): Promise<StudentProgressData[]> {
        const all = await this.getAll();
        return all.filter(p => p.studentId === studentId);
    },

    async getByQuiz(quizId: string): Promise<StudentProgressData[]> {
        const all = await this.getAll();
        return all.filter(p => p.quizId === quizId);
    },

    async getAttemptCount(studentId: string, quizId: string): Promise<number> {
        const all = await this.getAll();
        return all.filter(p => p.studentId === studentId && p.quizId === quizId).length;
    },

    async create(progress: StudentProgressData): Promise<StudentProgressData> {
        const all = await this.getAll();
        const updated = [progress, ...all];
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(updated));
        return progress;
    },

    async getLeaderboard(limit: number = 10): Promise<{ studentId: string; totalScore: number; quizCount: number }[]> {
        const all = await this.getAll();
        const scores: { [studentId: string]: { totalScore: number; quizCount: number } } = {};

        all.forEach(p => {
            if (!scores[p.studentId]) {
                scores[p.studentId] = { totalScore: 0, quizCount: 0 };
            }
            scores[p.studentId].totalScore += p.score;
            scores[p.studentId].quizCount++;
        });

        return Object.entries(scores)
            .map(([studentId, data]) => ({ studentId, ...data }))
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, limit);
    }
};

// ============================================
// CLASSES
// ============================================

const CLASS_STORAGE_KEY = 'lms_ypp_classes';
const STUDENT_STORAGE_KEY = 'lms_ypp_students';

export interface ClassData {
    id: string;
    name: string;
    code: string; // Join code for students
    grade: number;
    subject?: string;
    description?: string;
    teacherId: string;
    studentIds: string[];
    createdAt: string;
}

export interface StudentData {
    id: string;
    name: string;
    email?: string;
    avatar: string;
    classIds: string[];
    xp: number;
    level: number;
    streak: number;
    createdAt: string;
}

export const classService = {
    async getAll(teacherId?: string): Promise<ClassData[]> {
        const saved = localStorage.getItem(CLASS_STORAGE_KEY);
        const classes = saved ? JSON.parse(saved) : [];
        if (teacherId) {
            return classes.filter((c: ClassData) => c.teacherId === teacherId);
        }
        return classes;
    },

    async getById(id: string): Promise<ClassData | null> {
        const all = await this.getAll();
        return all.find(c => c.id === id) || null;
    },

    async getByCode(code: string): Promise<ClassData | null> {
        const all = await this.getAll();
        return all.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
    },

    async create(classData: ClassData): Promise<ClassData> {
        const all = await this.getAll();
        const updated = [classData, ...all];
        localStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(updated));
        return classData;
    },

    async update(id: string, updates: Partial<ClassData>): Promise<ClassData | null> {
        const all = await this.getAll();
        const idx = all.findIndex(c => c.id === id);
        if (idx === -1) return null;
        all[idx] = { ...all[idx], ...updates };
        localStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(all));
        return all[idx];
    },

    async addStudent(classId: string, studentId: string): Promise<boolean> {
        const all = await this.getAll();
        const idx = all.findIndex(c => c.id === classId);
        if (idx === -1) return false;
        if (!all[idx].studentIds.includes(studentId)) {
            all[idx].studentIds.push(studentId);
            localStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(all));
        }
        return true;
    },

    async removeStudent(classId: string, studentId: string): Promise<boolean> {
        const all = await this.getAll();
        const idx = all.findIndex(c => c.id === classId);
        if (idx === -1) return false;
        all[idx].studentIds = all[idx].studentIds.filter(id => id !== studentId);
        localStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(all));
        return true;
    },

    async delete(id: string): Promise<boolean> {
        const all = await this.getAll();
        const filtered = all.filter(c => c.id !== id);
        localStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(filtered));
        return true;
    },

    generateCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
};

export const studentService = {
    async getAll(): Promise<StudentData[]> {
        const saved = localStorage.getItem(STUDENT_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    },

    async getById(id: string): Promise<StudentData | null> {
        const all = await this.getAll();
        return all.find(s => s.id === id) || null;
    },

    async getByClass(classId: string): Promise<StudentData[]> {
        const all = await this.getAll();
        return all.filter(s => s.classIds.includes(classId));
    },

    async create(student: StudentData): Promise<StudentData> {
        const all = await this.getAll();
        const updated = [student, ...all];
        localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(updated));
        return student;
    },

    async update(id: string, updates: Partial<StudentData>): Promise<StudentData | null> {
        const all = await this.getAll();
        const idx = all.findIndex(s => s.id === id);
        if (idx === -1) return null;
        all[idx] = { ...all[idx], ...updates };
        localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(all));
        return all[idx];
    },

    async joinClass(studentId: string, classId: string): Promise<boolean> {
        const all = await this.getAll();
        const idx = all.findIndex(s => s.id === studentId);
        if (idx === -1) return false;
        if (!all[idx].classIds.includes(classId)) {
            all[idx].classIds.push(classId);
            localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(all));
        }
        return true;
    },

    async leaveClass(studentId: string, classId: string): Promise<boolean> {
        const all = await this.getAll();
        const idx = all.findIndex(s => s.id === studentId);
        if (idx === -1) return false;
        all[idx].classIds = all[idx].classIds.filter(id => id !== classId);
        localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(all));
        return true;
    },

    async delete(id: string): Promise<boolean> {
        const all = await this.getAll();
        const filtered = all.filter(s => s.id !== id);
        localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(filtered));
        return true;
    }
};
