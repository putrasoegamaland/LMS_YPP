'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { useAIHint } from '@/contexts/AIHintContext';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isStudent, isLoading: authLoading, logout } = useAuth();
    const { language, t, toggleLanguage } = useLanguage();
    const { xp, level, streak, levelProgress, allBadges, completedQuizzes, dailyXp, dailyGoal } = useGame();
    const { totalTokens, hintHistory } = useAIHint();

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

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const unlockedBadges = allBadges.filter(b => b.unlocked);
    const lockedBadges = allBadges.filter(b => !b.unlocked);

    return (
        <div className="min-h-screen bg-duo-gray-100 pb-24">
            {/* Header */}
            <header className="bg-gradient-to-r from-duo-blue to-duo-purple text-white">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => router.push('/student/dashboard')} className="text-white/80 hover:text-white">
                            ← {t('action.back')}
                        </button>
                        <h1 className="font-extrabold text-xl flex-1">{t('nav.profile')}</h1>
                    </div>

                    {/* Profile Card */}
                    <div className="flex items-center gap-6">
                        <div className="avatar avatar-lg bg-white/30 border-white/50">{user?.avatar || '🦊'}</div>
                        <div>
                            <h2 className="text-2xl font-extrabold">{user?.name}</h2>
                            <p className="text-white/80">{user?.className || 'Student'} • Level {level}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 -mt-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <StatCard emoji="⭐" value={xp} label="XP" color="yellow" />
                    <StatCard emoji="🔥" value={streak} label={language === 'id' ? 'Hari' : 'Days'} color="orange" />
                    <StatCard emoji="📝" value={completedQuizzes.length} label={language === 'id' ? 'Kuis' : 'Quizzes'} color="green" />
                    <StatCard emoji="💡" value={totalTokens} label={language === 'id' ? 'Hints' : 'Hints'} color="purple" />
                </div>

                {/* Level Progress */}
                <section className="card mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-duo-gray-900">Level {level}</h3>
                        <span className="text-sm text-duo-gray-500">{Math.round(levelProgress)}%</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${levelProgress}%` }} />
                    </div>
                    <p className="text-xs text-duo-gray-500 mt-2">
                        {language === 'id' ? 'Terus kumpulkan XP untuk naik level!' : 'Keep earning XP to level up!'}
                    </p>
                </section>

                {/* Daily Goal */}
                <section className="card mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-duo-gray-900">🎯 {language === 'id' ? 'Target Harian' : 'Daily Goal'}</h3>
                        <span className="text-sm text-duo-gray-500">{dailyXp}/{dailyGoal} XP</span>
                    </div>
                    <div className="h-3 bg-duo-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-duo-green rounded-full transition-all"
                            style={{ width: `${Math.min((dailyXp / dailyGoal) * 100, 100)}%` }}
                        />
                    </div>
                </section>

                {/* Badges */}
                <section className="mb-6">
                    <h3 className="font-bold text-duo-gray-900 mb-4">
                        🏅 {language === 'id' ? 'Lencana' : 'Badges'} ({unlockedBadges.length}/{allBadges.length})
                    </h3>

                    {/* Unlocked */}
                    {unlockedBadges.length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-4">
                            {unlockedBadges.map(badge => (
                                <div
                                    key={badge.id}
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-duo-yellow/20 border-2 border-duo-yellow"
                                    title={badge.name[language]}
                                >
                                    {badge.icon}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Locked */}
                    <div className="flex flex-wrap gap-3">
                        {lockedBadges.map(badge => (
                            <div
                                key={badge.id}
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-duo-gray-200 opacity-40"
                                title={badge.name[language]}
                            >
                                {badge.icon}
                            </div>
                        ))}
                    </div>
                </section>

                {/* AI Hint Usage */}
                <section className="card mb-6">
                    <h3 className="font-bold text-duo-gray-900 mb-3">
                        🤖 {language === 'id' ? 'Penggunaan AI Hint' : 'AI Hint Usage'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-duo-purple/10 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-duo-purple">{totalTokens}</p>
                            <p className="text-xs text-duo-gray-500">{language === 'id' ? 'Tersisa Hari Ini' : 'Left Today'}</p>
                        </div>
                        <div className="bg-duo-blue/10 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-duo-blue">{hintHistory.length}</p>
                            <p className="text-xs text-duo-gray-500">{language === 'id' ? 'Total Digunakan' : 'Total Used'}</p>
                        </div>
                    </div>
                    <p className="text-xs text-duo-gray-500 mt-3">
                        💡 {language === 'id'
                            ? 'Gunakan hint dengan bijak! Coba dulu sebelum minta bantuan.'
                            : 'Use hints wisely! Try first before asking for help.'}
                    </p>
                </section>

                {/* Settings */}
                <section className="card">
                    <h3 className="font-bold text-duo-gray-900 mb-4">⚙️ {language === 'id' ? 'Pengaturan' : 'Settings'}</h3>

                    <div className="space-y-3">
                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-duo-gray-100 transition-colors"
                        >
                            <span className="flex items-center gap-3">
                                <span>🌐</span>
                                <span className="font-semibold">{language === 'id' ? 'Bahasa' : 'Language'}</span>
                            </span>
                            <span className="text-duo-gray-500">
                                {language === 'id' ? '🇮🇩 Indonesia' : '🇬🇧 English'}
                            </span>
                        </button>

                        {/* Account */}
                        <div className="p-3 rounded-xl bg-duo-gray-100">
                            <span className="flex items-center gap-3">
                                <span>📧</span>
                                <span className="font-semibold">{user?.email}</span>
                            </span>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-duo-red/10 text-duo-red transition-colors"
                        >
                            <span className="flex items-center gap-3">
                                <span>🚪</span>
                                <span className="font-semibold">{t('auth.logout')}</span>
                            </span>
                        </button>
                    </div>
                </section>
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-duo-gray-200 px-4 py-2">
                <div className="flex justify-around max-w-md mx-auto">
                    <NavItem emoji="🏠" label={t('nav.home')} onClick={() => router.push('/student/dashboard')} />
                    <NavItem emoji="📚" label={t('nav.learn')} onClick={() => router.push('/student/learn')} />
                    <NavItem emoji="✏️" label={t('nav.practice')} onClick={() => router.push('/student/practice')} />
                    <NavItem emoji="🏆" label={t('nav.compete')} onClick={() => router.push('/student/compete')} />
                    <NavItem emoji="👤" label={t('nav.profile')} active onClick={() => { }} />
                </div>
            </nav>
        </div>
    );
}

function StatCard({ emoji, value, label, color }: { emoji: string; value: number; label: string; color: 'yellow' | 'orange' | 'green' | 'purple' }) {
    const colorClasses = {
        yellow: 'bg-duo-yellow/10',
        orange: 'bg-duo-orange/10',
        green: 'bg-duo-green/10',
        purple: 'bg-duo-purple/10',
    };

    return (
        <div className={`card p-4 text-center ${colorClasses[color]}`}>
            <p className="text-2xl">{emoji}</p>
            <p className="text-2xl font-extrabold text-duo-gray-900">{value}</p>
            <p className="text-xs text-duo-gray-500">{label}</p>
        </div>
    );
}

function NavItem({ emoji, label, active = false, onClick }: { emoji: string; label: string; active?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg ${active ? 'text-duo-purple' : 'text-duo-gray-400 hover:text-duo-gray-600'
                }`}
        >
            <span className="text-xl">{emoji}</span>
            <span className="text-xs font-semibold">{label}</span>
        </button>
    );
}
