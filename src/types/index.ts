// Type definitions for LMS YPP

// User types
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    avatar: string;
    classId?: string;
    className?: string;
    createdAt: string;
}

export interface StudentProgress {
    xp: number;
    level: number;
    streak: number;
    badges: string[];
    completedQuizzes: CompletedQuiz[];
    completedLessons: string[];
    lastActive: string | null;
    aiHintUsage: AIHintUsage;
}

export interface AIHintUsage {
    totalHintsUsed: number;
    dailyHintsUsed: number;
    bonusTokens: number;
    lastHintDate: string | null;
}

export interface CompletedQuiz {
    quizId: string;
    score: number;
    xpEarned: number;
    completedAt: string;
    reasoning?: string;
    confidence?: number;
}

// Class types
export interface Class {
    id: string;
    name: string;
    code: string;
    grade: number; // 7-12 for SMP/SMA
    level: 'SMP' | 'SMA';
    teacherId: string;
    teacherName: string;
    studentCount: number;
    curriculum: string;
    createdAt: string;
}

// Lesson and Quiz types
export interface Lesson {
    id: string;
    title: LocalizedText;
    description: LocalizedText;
    subject: Subject;
    grade: number;
    icon: string;
    status: 'locked' | 'active' | 'completed';
    xpReward: number;
    activities: Activity[];
    prerequisiteIds?: string[];
}

export interface Activity {
    id: string;
    type: ActivityType;
    title: LocalizedText;
    content: ActivityContent;
    order: number;
}

export type ActivityType =
    | 'video'
    | 'reading'
    | 'quiz'
    | 'drag_drop'
    | 'step_by_step'
    | 'simulation'
    | 'discussion';

export interface ActivityContent {
    // Content varies by activity type
    [key: string]: unknown;
}

export interface Quiz {
    id: string;
    title: LocalizedText;
    description?: LocalizedText;
    subject: Subject;
    grade: number;
    classId?: string; // If null, available to all
    questions: Question[];
    settings: QuizSettings;
    createdAt: string;
    createdBy: string;
}

export interface QuizSettings {
    aiHintsEnabled: boolean;
    aiHintLimit: number;
    examMode: boolean;
    requireReasoning: boolean;
    requireConfidence: boolean;
    timeLimit: number | null; // In minutes
    allowRedo: boolean;
    allowSkip: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
}

export interface Question {
    id: string;
    type: QuestionType;
    question: LocalizedText;
    image?: string;
    options?: string[];
    correctAnswer?: string | string[];
    rubric?: LocalizedText;
    minLength?: number;
    points: number;
    difficulty: 'easy' | 'medium' | 'hard';
    hints?: QuestionHints;
}

export type QuestionType = 'choice' | 'multiple_choice' | 'essay' | 'drawing' | 'fill_blank';

export interface QuestionHints {
    level1: LocalizedText; // Concept reminder
    level2: LocalizedText; // Guiding question
    level3: LocalizedText; // Micro-example
    prerequisite?: LocalizedText;
}

// Competition types
export interface Competition {
    id: string;
    type: CompetitionType;
    title: LocalizedText;
    description?: LocalizedText;
    status: 'upcoming' | 'active' | 'completed';
    startTime: string;
    endTime: string;
    participants: CompetitionParticipant[];
    settings: CompetitionSettings;
    createdBy: string;
}

export type CompetitionType = 'daily_sprint' | 'class_battle' | 'tournament' | 'coop_raid';

export interface CompetitionParticipant {
    id: string; // User or Class ID
    type: 'student' | 'class';
    name: string;
    score: number;
    rank?: number;
}

export interface CompetitionSettings {
    questionCount: number;
    timeLimit: number;
    difficultyMix: { easy: number; medium: number; hard: number };
    normalizeByParticipants?: boolean;
}

// Leaderboard types
export interface LeaderboardEntry {
    rank: number;
    userId: string;
    userName: string;
    avatar: string;
    score: number;
    xp: number;
    streak: number;
    change?: number; // Position change from previous period
}

// AI Hint types
export interface HintRequest {
    questionId: string;
    attemptCount: number;
    userInput?: string;
}

export interface HintResponse {
    allowed: boolean;
    hint?: LocalizedText;
    level: 1 | 2 | 3;
    tokensRemaining: number;
    reason?: 'exam_mode' | 'no_tokens' | 'show_work_first';
}

// Integrity types
export interface IntegrityLog {
    studentId: string;
    quizId: string;
    events: IntegrityEvent[];
}

export interface IntegrityEvent {
    type: 'tab_switch' | 'rapid_answer' | 'unusual_timing' | 'copy_paste' | 'ai_spike';
    timestamp: string;
    details: string;
    severity: 'low' | 'medium' | 'high';
}

// Subject types
export type Subject =
    | 'matematika'
    | 'bahasa_indonesia'
    | 'bahasa_inggris'
    | 'ipa'
    | 'ips'
    | 'pkn'
    | 'seni_budaya'
    | 'pjok'
    | 'informatika';

// Localization
export interface LocalizedText {
    id: string; // Indonesian
    en: string; // English
}

// Badge definitions
export interface Badge {
    id: string;
    name: LocalizedText;
    description: LocalizedText;
    icon: string;
    condition: BadgeCondition;
}

export interface BadgeCondition {
    type: 'xp' | 'streak' | 'quizzes' | 'perfect_score' | 'level' | 'competition';
    value: number;
    subject?: Subject;
}

// Book Library types
export interface Book {
    id: string;
    title: string;
    description: string;
    fileUrl: string; // Mock URL or base64
    coverUrl?: string; // Optional cover
    subject: Subject;
    assignedTo: Assignment[];
    uploadedAt: string;
}

export interface Assignment {
    type: 'class' | 'student';
    id: string;
    name: string;
}
