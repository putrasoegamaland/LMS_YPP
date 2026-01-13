'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type { StudentProgress, CompletedQuiz } from '@/types';

interface GameContextType {
    // State
    xp: number;
    level: number;
    streak: number;
    badges: string[];
    dailyXp: number;
    dailyGoal: number;
    completedQuizzes: CompletedQuiz[];

    // Computed
    levelProgress: number;
    xpForNextLevel: number;
    dailyProgress: number;
    allBadges: BadgeInfo[];

    // Actions
    addXp: (amount: number) => void;
    completeQuiz: (quizId: string, correctAnswers: number, totalQuestions: number, reasoning?: string, confidence?: number) => QuizResult;
    isQuizCompleted: (quizId: string) => boolean;
    getQuizResult: (quizId: string) => CompletedQuiz | undefined;
    unlockBadge: (badgeId: string) => void;
    hasBadge: (badgeId: string) => boolean;

    // Animation states
    showXpGain: boolean;
    xpGainAmount: number;
    showLevelUp: boolean;
    showBadgeUnlock: boolean;
    unlockedBadge: BadgeInfo | null;
}

interface BadgeInfo {
    id: string;
    name: { id: string; en: string };
    icon: string;
    unlocked: boolean;
    description?: { id: string; en: string };
}

interface QuizResult {
    score: number;
    xpEarned: number;
    bonusXp: number;
}

// Badge definitions
const BADGES: Record<string, Omit<BadgeInfo, 'unlocked'>> = {
    reader: { id: 'reader', name: { id: 'Pembaca Hebat', en: 'Great Reader' }, icon: '📚' },
    mathstar: { id: 'mathstar', name: { id: 'Bintang Matematika', en: 'Math Star' }, icon: '🧮' },
    scientist: { id: 'scientist', name: { id: 'Ilmuwan Cilik', en: 'Young Scientist' }, icon: '🔬' },
    streak3: { id: 'streak3', name: { id: '3 Hari Berturut', en: '3 Day Streak' }, icon: '🔥' },
    streak7: { id: 'streak7', name: { id: '7 Hari Berturut', en: '7 Day Streak' }, icon: '🌟' },
    streak30: { id: 'streak30', name: { id: '30 Hari Berturut', en: '30 Day Streak' }, icon: '👑' },
    perfect: { id: 'perfect', name: { id: 'Nilai Sempurna', en: 'Perfect Score' }, icon: '💯' },
    explorer: { id: 'explorer', name: { id: 'Penjelajah', en: 'Explorer' }, icon: '🗺️' },
    champion: { id: 'champion', name: { id: 'Juara Kelas', en: 'Class Champion' }, icon: '🏆' },
    sprinter: { id: 'sprinter', name: { id: 'Sprinter Harian', en: 'Daily Sprinter' }, icon: '⚡' },
    helper: { id: 'helper', name: { id: 'Penolong Sejati', en: 'True Helper' }, icon: '🤝' },
    thinker: { id: 'thinker', name: { id: 'Pemikir Kritis', en: 'Critical Thinker' }, icon: '🧠' },
};

// Level thresholds
const LEVEL_XP = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000, 6500, 8000, 10000];

const STORAGE_KEY = 'lms_ypp_progress';

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    // Game state
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [streak, setStreak] = useState(0);
    const [badges, setBadges] = useState<string[]>([]);
    const [dailyXp, setDailyXp] = useState(0);
    const [dailyGoal] = useState(50);
    const [completedQuizzes, setCompletedQuizzes] = useState<CompletedQuiz[]>([]);

    // Animation states
    const [showXpGain, setShowXpGain] = useState(false);
    const [xpGainAmount, setXpGainAmount] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [showBadgeUnlock, setShowBadgeUnlock] = useState(false);
    const [unlockedBadge, setUnlockedBadge] = useState<BadgeInfo | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        if (user?.id) {
            const savedProgress = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
            if (savedProgress) {
                try {
                    const progress: StudentProgress = JSON.parse(savedProgress);
                    setXp(progress.xp || 0);
                    setLevel(progress.level || 1);
                    setStreak(progress.streak || 0);
                    setBadges(progress.badges || []);
                    setCompletedQuizzes(progress.completedQuizzes || []);

                    // Update streak on login
                    updateStreak(progress);
                } catch (e) {
                    console.error('Failed to parse saved progress:', e);
                }
            }
        }
    }, [user?.id]);

    // Save to localStorage when state changes
    useEffect(() => {
        if (user?.id) {
            const progress: StudentProgress = {
                xp,
                level,
                streak,
                badges,
                completedQuizzes,
                completedLessons: [],
                lastActive: new Date().toISOString(),
                aiHintUsage: {
                    totalHintsUsed: 0,
                    dailyHintsUsed: 0,
                    bonusTokens: 0,
                    lastHintDate: null,
                },
            };
            localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(progress));
        }
    }, [user?.id, xp, level, streak, badges, completedQuizzes]);

    // Update streak based on last active date
    const updateStreak = (progress: StudentProgress) => {
        const today = new Date().toDateString();
        const lastActive = progress.lastActive ? new Date(progress.lastActive).toDateString() : null;

        if (lastActive === today) {
            return; // Already active today
        }

        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = lastActive === yesterday ? progress.streak + 1 : 1;
        setStreak(newStreak);

        // Check for streak badges
        if (newStreak >= 3 && !badges.includes('streak3')) {
            unlockBadge('streak3');
        }
        if (newStreak >= 7 && !badges.includes('streak7')) {
            unlockBadge('streak7');
        }
        if (newStreak >= 30 && !badges.includes('streak30')) {
            unlockBadge('streak30');
        }
    };

    // Calculate level from XP
    const calculateLevel = (totalXp: number): number => {
        for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
            if (totalXp >= LEVEL_XP[i]) {
                return i + 1;
            }
        }
        return 1;
    };

    // Get XP needed for next level
    const getXpForNextLevel = (): number => {
        return LEVEL_XP[level] || LEVEL_XP[LEVEL_XP.length - 1];
    };

    // Get current level progress percentage
    const getLevelProgress = (): number => {
        const currentLevelXp = LEVEL_XP[level - 1] || 0;
        const nextLevelXp = LEVEL_XP[level] || LEVEL_XP[LEVEL_XP.length - 1];
        const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
        return Math.min(Math.max(progress, 0), 100);
    };

    // Add XP
    const addXp = useCallback((amount: number) => {
        const newXp = xp + amount;
        const newLevel = calculateLevel(newXp);

        // Show XP gain animation
        setXpGainAmount(amount);
        setShowXpGain(true);
        setTimeout(() => setShowXpGain(false), 2000);

        // Check for level up
        if (newLevel > level) {
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 3000);
        }

        setXp(newXp);
        setLevel(newLevel);
        setDailyXp(prev => prev + amount);
    }, [xp, level]);

    // Complete quiz
    const completeQuiz = useCallback((
        quizId: string,
        correctAnswers: number,
        totalQuestions: number,
        reasoning?: string,
        confidence?: number
    ): QuizResult => {
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        const xpEarned = correctAnswers * 10;

        // Bonus XP for perfect score
        const bonusXp = score === 100 ? 20 : 0;

        // Bonus for providing reasoning
        const reasoningBonus = reasoning && reasoning.length > 20 ? 5 : 0;

        const totalXp = xpEarned + bonusXp + reasoningBonus;

        // Add XP
        addXp(totalXp);

        // Save quiz completion
        const quizResult: CompletedQuiz = {
            quizId,
            score,
            xpEarned: totalXp,
            completedAt: new Date().toISOString(),
            reasoning,
            confidence,
        };
        setCompletedQuizzes(prev => [...prev, quizResult]);

        // Check for perfect score badge
        if (score === 100 && !badges.includes('perfect')) {
            unlockBadge('perfect');
        }

        return { score, xpEarned: totalXp, bonusXp: bonusXp + reasoningBonus };
    }, [addXp, badges]);

    // Check if quiz was completed
    const isQuizCompleted = (quizId: string): boolean => {
        return completedQuizzes.some(q => q.quizId === quizId);
    };

    // Get quiz result
    const getQuizResult = (quizId: string): CompletedQuiz | undefined => {
        return completedQuizzes.find(q => q.quizId === quizId);
    };

    // Unlock badge
    const unlockBadge = useCallback((badgeId: string) => {
        if (!badges.includes(badgeId)) {
            const badge = BADGES[badgeId];
            if (badge) {
                setBadges(prev => [...prev, badgeId]);

                // Show badge unlock animation
                setUnlockedBadge({ ...badge, unlocked: true });
                setShowBadgeUnlock(true);
                setTimeout(() => setShowBadgeUnlock(false), 3000);

                // Bonus XP for badge
                addXp(50);
            }
        }
    }, [badges, addXp]);

    // Check if badge is unlocked
    const hasBadge = (badgeId: string): boolean => badges.includes(badgeId);

    // Get all badges with unlock status
    const getAllBadges = (): BadgeInfo[] => {
        return Object.values(BADGES).map(badge => ({
            ...badge,
            unlocked: badges.includes(badge.id),
        }));
    };

    // Daily goal progress
    const getDailyProgress = (): number => {
        return Math.min((dailyXp / dailyGoal) * 100, 100);
    };

    const value: GameContextType = {
        // State
        xp,
        level,
        streak,
        badges,
        dailyXp,
        dailyGoal,
        completedQuizzes,

        // Computed
        levelProgress: getLevelProgress(),
        xpForNextLevel: getXpForNextLevel(),
        dailyProgress: getDailyProgress(),
        allBadges: getAllBadges(),

        // Actions
        addXp,
        completeQuiz,
        isQuizCompleted,
        getQuizResult,
        unlockBadge,
        hasBadge,

        // Animation states
        showXpGain,
        xpGainAmount,
        showLevelUp,
        showBadgeUnlock,
        unlockedBadge,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}

export default GameContext;
