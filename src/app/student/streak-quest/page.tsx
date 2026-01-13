'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

// Streak milestones and rewards
const STREAK_MILESTONES = [
    { days: 3, reward: 50, badge: '🔥', name: { id: '3 Hari Beruntun', en: '3-Day Streak' } },
    { days: 7, reward: 150, badge: '⚡', name: { id: 'Seminggu Tanpa Henti', en: 'Week Warrior' } },
    { days: 14, reward: 350, badge: '🌟', name: { id: '2 Minggu Champion', en: '2-Week Champion' } },
    { days: 30, reward: 800, badge: '👑', name: { id: 'Sebulan Legenda', en: 'Month Legend' } },
    { days: 60, reward: 2000, badge: '💎', name: { id: 'Master Konsisten', en: 'Consistency Master' } },
    { days: 100, reward: 5000, badge: '🏆', name: { id: 'Centurion', en: 'Centurion' } },
];

// Daily challenges
const DAILY_CHALLENGES = [
    { id: 'practice-1', type: 'practice', target: 1, xp: 20, title: { id: 'Selesaikan 1 kuis', en: 'Complete 1 quiz' } },
    { id: 'practice-3', type: 'practice', target: 3, xp: 50, title: { id: 'Selesaikan 3 kuis', en: 'Complete 3 quizzes' } },
    { id: 'correct-10', type: 'correct', target: 10, xp: 30, title: { id: 'Jawab 10 soal benar', en: 'Answer 10 questions correctly' } },
    { id: 'perfect-1', type: 'perfect', target: 1, xp: 75, title: { id: 'Dapat nilai sempurna', en: 'Get a perfect score' } },
    { id: 'hint-0', type: 'no-hint', target: 1, xp: 40, title: { id: 'Selesaikan tanpa hint', en: 'Complete without hints' } },
];

export default function StreakQuestPage() {
    const router = useRouter();
    const { isStudent, isLoading: authLoading } = useAuth();
    const { language, t } = useLanguage();
    const { streak, xp, addXp, completedQuizzes } = useGame();
    const quizzesCompleted = completedQuizzes.length;

    const [claimedMilestones, setClaimedMilestones] = useState<number[]>([]);
    const [dailyChallenges, setDailyChallenges] = useState<typeof DAILY_CHALLENGES>([]);
    const [showCelebration, setShowCelebration] = useState(false);

    // Load claimed milestones from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('lms_ypp_streak_milestones');
        if (saved) {
            try {
                setClaimedMilestones(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load milestones:', e);
            }
        }

        // Set random daily challenges (3 per day)
        const shuffled = [...DAILY_CHALLENGES].sort(() => Math.random() - 0.5);
        setDailyChallenges(shuffled.slice(0, 3));
    }, []);

    // Redirect if not student
    useEffect(() => {
        if (!authLoading && !isStudent) {
            router.push('/login?role=student');
        }
    }, [isStudent, authLoading, router]);

    if (authLoading || !isStudent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const handleClaimMilestone = (days: number) => {
        const milestone = STREAK_MILESTONES.find(m => m.days === days);
        if (!milestone || streak < days || claimedMilestones.includes(days)) return;

        addXp(milestone.reward);
        const newClaimed = [...claimedMilestones, days];
        setClaimedMilestones(newClaimed);
        localStorage.setItem('lms_ypp_streak_milestones', JSON.stringify(newClaimed));

        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
    };

    const nextMilestone = STREAK_MILESTONES.find(m => m.days > streak);
    const daysToNext = nextMilestone ? nextMilestone.days - streak : 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-500 via-red-500 to-purple-600 pb-24">
            {/* Celebration overlay */}
            {showCelebration && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-3xl p-8 text-center animate-bounce">
                        <div className="text-6xl mb-4">🎉</div>
                        <p className="text-2xl font-bold text-duo-gray-900">
                            {language === 'id' ? 'Hadiah Diklaim!' : 'Reward Claimed!'}
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="pt-8 pb-6 px-4">
                <button
                    onClick={() => router.push('/student/dashboard')}
                    className="text-white/80 hover:text-white mb-4"
                >
                    ← {t('action.back')}
                </button>

                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-white mb-2">
                        🔥 Streak Quest
                    </h1>
                    <p className="text-white/80">
                        {language === 'id'
                            ? 'Jaga streak-mu dan dapatkan hadiah!'
                            : 'Keep your streak and earn rewards!'}
                    </p>
                </div>
            </header>

            {/* Current Streak Card */}
            <div className="px-4 mb-6">
                <div className="bg-white rounded-3xl p-6 text-center shadow-xl">
                    <div className="text-6xl mb-2">🔥</div>
                    <div className="text-5xl font-extrabold text-orange-500 mb-1">{streak}</div>
                    <p className="text-duo-gray-500">
                        {language === 'id' ? 'Hari Beruntun' : 'Day Streak'}
                    </p>

                    {nextMilestone && (
                        <div className="mt-4 bg-duo-gray-100 rounded-xl p-3">
                            <p className="text-sm text-duo-gray-600">
                                {language === 'id'
                                    ? `${daysToNext} hari lagi untuk ${nextMilestone.name.id}`
                                    : `${daysToNext} days to ${nextMilestone.name.en}`}
                            </p>
                            <div className="mt-2 h-2 bg-duo-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-500 transition-all"
                                    style={{ width: `${(streak / nextMilestone.days) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Milestones */}
            <section className="px-4 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">
                    🏆 {language === 'id' ? 'Milestone Hadiah' : 'Reward Milestones'}
                </h2>

                <div className="space-y-3">
                    {STREAK_MILESTONES.map(milestone => {
                        const isUnlocked = streak >= milestone.days;
                        const isClaimed = claimedMilestones.includes(milestone.days);

                        return (
                            <div
                                key={milestone.days}
                                className={`bg-white rounded-xl p-4 flex items-center gap-4 ${isUnlocked && !isClaimed ? 'ring-2 ring-duo-yellow' : ''
                                    } ${!isUnlocked ? 'opacity-60' : ''}`}
                            >
                                <div className={`text-4xl ${!isUnlocked ? 'grayscale' : ''}`}>
                                    {milestone.badge}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-duo-gray-900">
                                        {milestone.name[language] || milestone.name.id}
                                    </p>
                                    <p className="text-sm text-duo-gray-500">
                                        {milestone.days} {language === 'id' ? 'hari' : 'days'} • +{milestone.reward} XP
                                    </p>
                                </div>
                                {isClaimed ? (
                                    <span className="text-2xl">✅</span>
                                ) : isUnlocked ? (
                                    <button
                                        onClick={() => handleClaimMilestone(milestone.days)}
                                        className="btn btn-sm bg-duo-yellow text-duo-gray-900 font-bold"
                                    >
                                        {language === 'id' ? 'Klaim!' : 'Claim!'}
                                    </button>
                                ) : (
                                    <span className="text-duo-gray-400">🔒</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Daily Challenges */}
            <section className="px-4">
                <h2 className="text-xl font-bold text-white mb-4">
                    📋 {language === 'id' ? 'Tantangan Harian' : 'Daily Challenges'}
                </h2>

                <div className="space-y-3">
                    {dailyChallenges.map(challenge => {
                        // Simple progress calculation (demo)
                        let progress = 0;
                        if (challenge.type === 'practice') progress = Math.min(quizzesCompleted, challenge.target);
                        if (challenge.type === 'correct') progress = Math.min(quizzesCompleted * 3, challenge.target);

                        const isComplete = progress >= challenge.target;

                        return (
                            <div
                                key={challenge.id}
                                className={`bg-white rounded-xl p-4 ${isComplete ? 'bg-duo-green/10' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold text-duo-gray-900">
                                        {challenge.title[language] || challenge.title.id}
                                    </p>
                                    <span className="text-sm text-duo-yellow-dark font-bold">
                                        +{challenge.xp} XP
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-duo-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${isComplete ? 'bg-duo-green' : 'bg-duo-blue'} transition-all`}
                                            style={{ width: `${Math.min((progress / challenge.target) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-duo-gray-500">
                                        {progress}/{challenge.target}
                                    </span>
                                    {isComplete && <span>✅</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Stats */}
            <section className="px-4 mt-8">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <div className="grid grid-cols-3 gap-4 text-center text-white">
                        <div>
                            <p className="text-2xl font-bold">{xp}</p>
                            <p className="text-xs opacity-80">Total XP</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{quizzesCompleted}</p>
                            <p className="text-xs opacity-80">{language === 'id' ? 'Kuis' : 'Quizzes'}</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{claimedMilestones.length}</p>
                            <p className="text-xs opacity-80">{language === 'id' ? 'Hadiah' : 'Rewards'}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-duo-gray-200 px-4 py-2">
                <div className="flex justify-around max-w-md mx-auto">
                    <NavItem emoji="🏠" label={t('nav.home')} onClick={() => router.push('/student/dashboard')} />
                    <NavItem emoji="📚" label={t('nav.learn')} onClick={() => router.push('/student/learn')} />
                    <NavItem emoji="✏️" label={t('nav.practice')} onClick={() => router.push('/student/practice')} />
                    <NavItem emoji="🏆" label={t('nav.compete')} onClick={() => router.push('/student/compete')} />
                    <NavItem emoji="👤" label={t('nav.profile')} onClick={() => router.push('/student/profile')} />
                </div>
            </nav>
        </div>
    );
}

function NavItem({ emoji, label, active = false, onClick }: { emoji: string; label: string; active?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg ${active ? 'text-duo-blue' : 'text-duo-gray-400 hover:text-duo-gray-600'
                }`}
        >
            <span className="text-xl">{emoji}</span>
            <span className="text-xs font-semibold">{label}</span>
        </button>
    );
}
