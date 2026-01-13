'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Integrity event types
export type IntegrityEventType =
    | 'exam_started'
    | 'exam_ended'
    | 'tab_switch'
    | 'window_blur'
    | 'copy_attempt'
    | 'paste_attempt'
    | 'screenshot_attempt'
    | 'rapid_answer'
    | 'unusual_timing'
    | 'ai_spike'
    | 'browser_devtools';

export interface IntegrityEvent {
    id: string;
    type: IntegrityEventType;
    timestamp: string;
    details?: string;
    questionId?: string;
    severity: 'low' | 'medium' | 'high';
}

export interface IntegritySession {
    sessionId: string;
    quizId: string;
    userId: string;
    startTime: string;
    endTime?: string;
    events: IntegrityEvent[];
    tabSwitchCount: number;
    copyAttempts: number;
    rapidAnswers: number;
    overallScore: number; // 0-100 integrity score
}

interface IntegrityContextType {
    // State
    isMonitoring: boolean;
    currentSession: IntegritySession | null;
    sessions: IntegritySession[];

    // Actions
    startMonitoring: (quizId: string) => void;
    stopMonitoring: () => void;
    logEvent: (type: IntegrityEventType, details?: string, questionId?: string) => void;

    // For teachers
    getSessionsByQuiz: (quizId: string) => IntegritySession[];
    getSessionsByStudent: (userId: string) => IntegritySession[];
    calculateIntegrityScore: (session: IntegritySession) => number;
}

const IntegrityContext = createContext<IntegrityContextType | undefined>(undefined);

const STORAGE_KEY = 'lms_ypp_integrity_logs';

// Event severity mapping
const EVENT_SEVERITY: Record<IntegrityEventType, 'low' | 'medium' | 'high'> = {
    exam_started: 'low',
    exam_ended: 'low',
    tab_switch: 'medium',
    window_blur: 'low',
    copy_attempt: 'high',
    paste_attempt: 'high',
    screenshot_attempt: 'high',
    rapid_answer: 'medium',
    unusual_timing: 'medium',
    ai_spike: 'high',
    browser_devtools: 'high',
};

// Score deductions per event type
const SCORE_DEDUCTIONS: Record<IntegrityEventType, number> = {
    exam_started: 0,
    exam_ended: 0,
    tab_switch: 5,
    window_blur: 2,
    copy_attempt: 15,
    paste_attempt: 15,
    screenshot_attempt: 20,
    rapid_answer: 10,
    unusual_timing: 8,
    ai_spike: 25,
    browser_devtools: 30,
};

export function IntegrityProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [currentSession, setCurrentSession] = useState<IntegritySession | null>(null);
    const [sessions, setSessions] = useState<IntegritySession[]>([]);

    // Load sessions from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setSessions(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load integrity logs:', e);
            }
        }
    }, []);

    // Save sessions to localStorage
    const saveSessions = useCallback((newSessions: IntegritySession[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
        setSessions(newSessions);
    }, []);

    // Listen for browser events when monitoring
    useEffect(() => {
        if (!isMonitoring || !currentSession) return;

        // Tab visibility change
        const handleVisibilityChange = () => {
            if (document.hidden) {
                logEvent('tab_switch', 'User switched to another tab');
            }
        };

        // Window blur (clicking outside browser)
        const handleWindowBlur = () => {
            logEvent('window_blur', 'Window lost focus');
        };

        // Copy prevention
        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            logEvent('copy_attempt', 'User attempted to copy content');
        };

        // Paste prevention
        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            logEvent('paste_attempt', 'User attempted to paste content');
        };

        // Keyboard shortcuts (Ctrl+C, Ctrl+V, PrintScreen)
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                logEvent('copy_attempt', 'Ctrl+C pressed');
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                logEvent('paste_attempt', 'Ctrl+V pressed');
            }
            if (e.key === 'PrintScreen') {
                logEvent('screenshot_attempt', 'PrintScreen key pressed');
            }
            // Detect F12 (DevTools)
            if (e.key === 'F12') {
                logEvent('browser_devtools', 'F12 pressed - possible DevTools');
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
                logEvent('browser_devtools', 'Ctrl+Shift+I pressed - DevTools shortcut');
            }
        };

        // Context menu (right-click)
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            logEvent('copy_attempt', 'Right-click menu blocked');
        };

        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('contextmenu', handleContextMenu);

        // Cleanup
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [isMonitoring, currentSession]);

    // Start monitoring for an exam
    const startMonitoring = useCallback((quizId: string) => {
        if (!user) return;

        const session: IntegritySession = {
            sessionId: `session-${Date.now()}`,
            quizId,
            userId: user.id,
            startTime: new Date().toISOString(),
            events: [],
            tabSwitchCount: 0,
            copyAttempts: 0,
            rapidAnswers: 0,
            overallScore: 100,
        };

        // Add start event
        session.events.push({
            id: `evt-${Date.now()}`,
            type: 'exam_started',
            timestamp: new Date().toISOString(),
            severity: 'low',
            details: 'Exam session started',
        });

        setCurrentSession(session);
        setIsMonitoring(true);

        console.log('🔒 Integrity monitoring started for quiz:', quizId);
    }, [user]);

    // Stop monitoring
    const stopMonitoring = useCallback(() => {
        if (!currentSession) return;

        const finalSession: IntegritySession = {
            ...currentSession,
            endTime: new Date().toISOString(),
            events: [
                ...currentSession.events,
                {
                    id: `evt-${Date.now()}`,
                    type: 'exam_ended',
                    timestamp: new Date().toISOString(),
                    severity: 'low',
                    details: 'Exam session ended',
                },
            ],
        };

        // Calculate final score
        finalSession.overallScore = calculateIntegrityScore(finalSession);

        // Save session
        saveSessions([...sessions, finalSession]);
        setCurrentSession(null);
        setIsMonitoring(false);

        console.log('🔓 Integrity monitoring stopped. Score:', finalSession.overallScore);
    }, [currentSession, sessions, saveSessions]);

    // Log an integrity event
    const logEvent = useCallback((
        type: IntegrityEventType,
        details?: string,
        questionId?: string
    ) => {
        if (!currentSession) return;

        const event: IntegrityEvent = {
            id: `evt-${Date.now()}`,
            type,
            timestamp: new Date().toISOString(),
            details,
            questionId,
            severity: EVENT_SEVERITY[type],
        };

        setCurrentSession(prev => {
            if (!prev) return null;

            const updated = { ...prev };
            updated.events = [...updated.events, event];

            // Update counters
            if (type === 'tab_switch') updated.tabSwitchCount++;
            if (type === 'copy_attempt' || type === 'paste_attempt') updated.copyAttempts++;
            if (type === 'rapid_answer') updated.rapidAnswers++;

            // Recalculate score
            updated.overallScore = calculateIntegrityScore(updated);

            return updated;
        });

        console.log(`⚠️ Integrity event: ${type}`, details || '');
    }, [currentSession]);

    // Calculate integrity score from session
    const calculateIntegrityScore = useCallback((session: IntegritySession): number => {
        let score = 100;

        for (const event of session.events) {
            score -= SCORE_DEDUCTIONS[event.type] || 0;
        }

        // Minimum score is 0
        return Math.max(0, score);
    }, []);

    // Get sessions by quiz
    const getSessionsByQuiz = useCallback((quizId: string): IntegritySession[] => {
        return sessions.filter(s => s.quizId === quizId);
    }, [sessions]);

    // Get sessions by student
    const getSessionsByStudent = useCallback((userId: string): IntegritySession[] => {
        return sessions.filter(s => s.userId === userId);
    }, [sessions]);

    const value: IntegrityContextType = {
        isMonitoring,
        currentSession,
        sessions,
        startMonitoring,
        stopMonitoring,
        logEvent,
        getSessionsByQuiz,
        getSessionsByStudent,
        calculateIntegrityScore,
    };

    return (
        <IntegrityContext.Provider value={value}>
            {children}
        </IntegrityContext.Provider>
    );
}

export function useIntegrity() {
    const context = useContext(IntegrityContext);
    if (context === undefined) {
        throw new Error('useIntegrity must be used within an IntegrityProvider');
    }
    return context;
}

export default IntegrityContext;
