'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type { HintRequest, HintResponse, LocalizedText, QuizSettings } from '@/types';

interface AIHintContextType {
    // State
    dailyTokens: number;
    bonusTokens: number;
    totalTokens: number;
    isExamMode: boolean;
    isLocked: boolean;
    hintHistory: HintHistoryItem[];
    isLoading: boolean;

    // Actions
    requestHint: (request: HintRequest) => HintResponse;
    requestAIHint: (question: string, subject: string, attemptCount: number, userMessage?: string, context?: any) => Promise<AIHintResult>;
    setExamMode: (isExam: boolean) => void;
    checkTaskMode: (settings: QuizSettings) => 'locked' | 'hint-only' | 'open';
    awardBonusToken: (reason: 'discussion' | 'peer_help' | 'streak') => void;
    resetDailyTokens: () => void;

    // Guardrails
    detectAnswerRequest: (text: string) => boolean;
    validateResponse: (response: string) => GuardrailResult;

    // UI State
    isPanelOpen: boolean;
    togglePanel: () => void;
}

interface HintHistoryItem {
    questionId: string;
    level: 1 | 2 | 3;
    hint: LocalizedText;
    timestamp: string;
    isFromAI?: boolean;
}

interface GuardrailResult {
    allowed: boolean;
    rewrittenResponse?: string;
    violationType?: 'direct_answer' | 'full_solution' | 'step_complete';
}

interface AIHintResult {
    success: boolean;
    hint: string;
    level: 1 | 2 | 3;
    followUp?: string | null;
    error?: string;
}

const AIHintContext = createContext<AIHintContextType | undefined>(undefined);

// Default daily token limit
const DEFAULT_DAILY_TOKENS = 10;
const STORAGE_KEY = 'lms_ypp_ai_hints';

// Patterns that indicate user is asking for direct answer
const ANSWER_REQUEST_PATTERNS = [
    /jawab(an)?nya\s*(apa|berapa)/i,
    /apa\s*jawab(an)?nya/i,
    /berapa\s*hasil(nya)?/i,
    /kasih\s*jawab(an)?/i,
    /beri\s*jawab(an)?/i,
    /tell\s*me\s*the\s*answer/i,
    /what('s|\s+is)\s*the\s*answer/i,
    /give\s*me\s*the\s*answer/i,
    /just\s*tell\s*me/i,
];

// Fallback hint templates for different levels (used when API fails)
const HINT_TEMPLATES: Record<1 | 2 | 3, LocalizedText[]> = {
    1: [
        { id: 'Ingat konsep dasar tentang topik ini...', en: 'Remember the basic concept about this topic...' },
        { id: 'Coba ingat-ingat pelajaran sebelumnya.', en: 'Try to recall the previous lesson.' },
        { id: 'Kunci untuk soal ini adalah memahami...', en: 'The key to this problem is understanding...' },
    ],
    2: [
        { id: 'Apa yang terjadi jika kamu mencoba...?', en: 'What happens if you try...?' },
        { id: 'Bagaimana menurutmu jika kita mulai dari...?', en: 'What do you think if we start from...?' },
        { id: 'Pernahkah kamu bertanya mengapa...?', en: 'Have you ever wondered why...?' },
    ],
    3: [
        { id: 'Contoh serupa: jika kita punya...', en: 'Similar example: if we have...' },
        { id: 'Mari lihat contoh dengan angka berbeda...', en: 'Let\'s look at an example with different numbers...' },
        { id: 'Bayangkan situasi sederhana dulu...', en: 'Imagine a simpler situation first...' },
    ],
};

// Socratic response when user asks for answer
const SOCRATIC_RESPONSES: LocalizedText[] = [
    { id: 'Sebelum saya bantu, coba jelaskan dulu apa yang sudah kamu pahami tentang soal ini?', en: 'Before I help, can you explain what you already understand about this problem?' },
    { id: 'Apa langkah pertama yang menurutmu perlu dilakukan?', en: 'What do you think is the first step that needs to be done?' },
    { id: 'Bagian mana dari soal ini yang membuatmu bingung?', en: 'Which part of this problem confuses you?' },
    { id: 'Coba tuliskan dulu apa yang sudah kamu coba.', en: 'Try writing down what you\'ve already tried.' },
];

export function AIHintProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    // Token state
    const [dailyTokens, setDailyTokens] = useState(DEFAULT_DAILY_TOKENS);
    const [bonusTokens, setBonusTokens] = useState(0);
    const [lastTokenReset, setLastTokenReset] = useState<string | null>(null);

    // Mode state
    const [isExamMode, setIsExamMode] = useState(false);
    const [hintHistory, setHintHistory] = useState<HintHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // UI state
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // Load from localStorage
    useEffect(() => {
        if (user?.id) {
            const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    setDailyTokens(data.dailyTokens ?? DEFAULT_DAILY_TOKENS);
                    setBonusTokens(data.bonusTokens ?? 0);
                    setLastTokenReset(data.lastTokenReset ?? null);
                    setHintHistory(data.hintHistory ?? []);

                    // Check if we need to reset daily tokens
                    const today = new Date().toDateString();
                    if (data.lastTokenReset !== today) {
                        setDailyTokens(DEFAULT_DAILY_TOKENS);
                        setLastTokenReset(today);
                    }
                } catch (e) {
                    console.error('Failed to parse AI hint data:', e);
                }
            }
        }
    }, [user?.id]);

    // Save to localStorage
    useEffect(() => {
        if (user?.id) {
            const data = {
                dailyTokens,
                bonusTokens,
                lastTokenReset,
                hintHistory,
            };
            localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(data));
        }
    }, [user?.id, dailyTokens, bonusTokens, lastTokenReset, hintHistory]);

    // Total available tokens
    const totalTokens = dailyTokens + bonusTokens;
    const isLocked = isExamMode || totalTokens <= 0;

    // Detect if user is asking for direct answer
    const detectAnswerRequest = useCallback((text: string): boolean => {
        return ANSWER_REQUEST_PATTERNS.some(pattern => pattern.test(text));
    }, []);

    // Validate AI response for answer leakage
    const validateResponse = useCallback((response: string): GuardrailResult => {
        // Check for numeric answers at the end
        if (/=\s*\d+\s*$/.test(response)) {
            return {
                allowed: false,
                violationType: 'direct_answer',
                rewrittenResponse: response.replace(/=\s*\d+\s*$/, '= ?'),
            };
        }

        // Check for "jawaban adalah" or "the answer is" patterns
        if (/jawaban(nya)?\s*(adalah|=)/i.test(response) || /the\s*answer\s*is/i.test(response)) {
            return {
                allowed: false,
                violationType: 'direct_answer',
            };
        }

        // Check for step-by-step that ends with final answer
        if (/langkah\s*\d+.*=.*\d+$/im.test(response) || /step\s*\d+.*=.*\d+$/im.test(response)) {
            return {
                allowed: false,
                violationType: 'step_complete',
            };
        }

        return { allowed: true };
    }, []);

    // Check task mode based on quiz settings
    const checkTaskMode = useCallback((settings: QuizSettings): 'locked' | 'hint-only' | 'open' => {
        if (settings.examMode || !settings.aiHintsEnabled) {
            return 'locked';
        }
        if (settings.timeLimit && settings.timeLimit < 10) {
            return 'locked'; // Lock for very short timed quizzes
        }
        return 'hint-only';
    }, []);

    // Determine hint level based on attempt count
    const getHintLevel = (attemptCount: number): 1 | 2 | 3 => {
        if (attemptCount <= 1) return 1;
        if (attemptCount <= 3) return 2;
        return 3;
    };

    // Request hint from Gemini AI API
    const requestAIHint = useCallback(async (
        question: string,
        subject: string,
        attemptCount: number,
        userMessage?: string,
        context?: any
    ): Promise<AIHintResult> => {
        // Check if locked
        if (isExamMode) {
            return { success: false, hint: '', level: 1, error: 'exam_mode' };
        }

        if (totalTokens <= 0) {
            return { success: false, hint: '', level: 1, error: 'no_tokens' };
        }

        // Check if user is asking for direct answer
        if (userMessage && detectAnswerRequest(userMessage)) {
            const socraticResponse = SOCRATIC_RESPONSES[Math.floor(Math.random() * SOCRATIC_RESPONSES.length)];
            return {
                success: true,
                hint: socraticResponse.id, // Don't consume token
                level: 1,
            };
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/ai-hint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    subject,
                    attemptCount,
                    userMessage,
                    context,
                    language: 'id',
                }),
            });

            const data = await response.json();

            if (data.success && data.hint) {
                // Validate the response for answer leakage
                const validation = validateResponse(data.hint);
                const finalHint = validation.allowed
                    ? data.hint
                    : (validation.rewrittenResponse || 'Coba pikirkan langkah pertama yang diperlukan.');

                // Consume token
                if (bonusTokens > 0) {
                    setBonusTokens(prev => prev - 1);
                } else {
                    setDailyTokens(prev => prev - 1);
                }

                // Add to history
                const level = data.level || getHintLevel(attemptCount);
                const historyItem: HintHistoryItem = {
                    questionId: question.substring(0, 50),
                    level,
                    hint: { id: finalHint, en: finalHint },
                    timestamp: new Date().toISOString(),
                    isFromAI: true,
                };
                setHintHistory(prev => [...prev, historyItem]);

                setIsLoading(false);
                return {
                    success: true,
                    hint: finalHint,
                    level,
                    followUp: data.followUp,
                };
            } else {
                throw new Error(data.error || 'Failed to get hint');
            }
        } catch (error) {
            console.error('AI Hint Error:', error);
            setIsLoading(false);

            // Fallback to template hints
            const level = getHintLevel(attemptCount);
            const templates = HINT_TEMPLATES[level];
            const fallbackHint = templates[Math.floor(Math.random() * templates.length)];

            // Still consume token for fallback
            if (bonusTokens > 0) {
                setBonusTokens(prev => prev - 1);
            } else {
                setDailyTokens(prev => prev - 1);
            }

            return {
                success: true,
                hint: fallbackHint.id,
                level,
            };
        }
    }, [isExamMode, totalTokens, bonusTokens, detectAnswerRequest, validateResponse]);

    // Legacy request hint (synchronous, template-based)
    const requestHint = useCallback((request: HintRequest): HintResponse => {
        // Check if locked
        if (isExamMode) {
            return {
                allowed: false,
                level: 1,
                tokensRemaining: totalTokens,
                reason: 'exam_mode',
            };
        }

        if (totalTokens <= 0) {
            return {
                allowed: false,
                level: 1,
                tokensRemaining: 0,
                reason: 'no_tokens',
            };
        }

        // Check if user is asking for direct answer
        if (request.userInput && detectAnswerRequest(request.userInput)) {
            const socraticResponse = SOCRATIC_RESPONSES[Math.floor(Math.random() * SOCRATIC_RESPONSES.length)];
            return {
                allowed: true,
                hint: socraticResponse,
                level: 1,
                tokensRemaining: totalTokens,
                reason: 'show_work_first',
            };
        }

        // Get appropriate hint level
        const level = getHintLevel(request.attemptCount);
        const templates = HINT_TEMPLATES[level];
        const hint = templates[Math.floor(Math.random() * templates.length)];

        // Consume token (prefer bonus tokens first)
        if (bonusTokens > 0) {
            setBonusTokens(prev => prev - 1);
        } else {
            setDailyTokens(prev => prev - 1);
        }

        // Add to history
        const historyItem: HintHistoryItem = {
            questionId: request.questionId,
            level,
            hint,
            timestamp: new Date().toISOString(),
        };
        setHintHistory(prev => [...prev, historyItem]);

        return {
            allowed: true,
            hint,
            level,
            tokensRemaining: totalTokens - 1,
        };
    }, [isExamMode, totalTokens, bonusTokens, detectAnswerRequest]);

    // Set exam mode
    const setExamModeState = useCallback((isExam: boolean) => {
        setIsExamMode(isExam);
        if (isExam) {
            setIsPanelOpen(false);
        }
    }, []);

    // Award bonus token
    const awardBonusToken = useCallback((reason: 'discussion' | 'peer_help' | 'streak') => {
        setBonusTokens(prev => prev + 1);
        console.log(`Bonus hint token awarded for: ${reason}`);
    }, []);

    // Reset daily tokens
    const resetDailyTokens = useCallback(() => {
        setDailyTokens(DEFAULT_DAILY_TOKENS);
        setLastTokenReset(new Date().toDateString());
    }, []);

    // Toggle panel
    const togglePanel = useCallback(() => {
        if (!isExamMode) {
            setIsPanelOpen(prev => !prev);
        }
    }, [isExamMode]);

    const value: AIHintContextType = {
        // State
        dailyTokens,
        bonusTokens,
        totalTokens,
        isExamMode,
        isLocked,
        hintHistory,
        isLoading,

        // Actions
        requestHint,
        requestAIHint,
        setExamMode: setExamModeState,
        checkTaskMode,
        awardBonusToken,
        resetDailyTokens,

        // Guardrails
        detectAnswerRequest,
        validateResponse,

        // UI State
        isPanelOpen,
        togglePanel,
    };

    return (
        <AIHintContext.Provider value={value}>
            {children}
        </AIHintContext.Provider>
    );
}

export function useAIHint() {
    const context = useContext(AIHintContext);
    if (context === undefined) {
        throw new Error('useAIHint must be used within an AIHintProvider');
    }
    return context;
}

export default AIHintContext;
