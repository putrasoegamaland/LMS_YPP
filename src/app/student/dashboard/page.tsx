'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { useAIHint } from '@/contexts/AIHintContext';
import Image from 'next/image';

export default function StudentDashboard() {
    const router = useRouter();
    const { user, isStudent, isLoading, logout } = useAuth();
    const { language, toggleLanguage, t } = useLanguage();
    const { xp, level, streak, levelProgress, dailyProgress, dailyGoal, dailyXp, allBadges } = useGame();
    const { totalTokens, isExamMode } = useAIHint();

    // Redirect if not student
    useEffect(() => {
        if (!isLoading && !isStudent) {
            router.push('/login?role=student');
        }
    }, [isStudent, isLoading, router]);

    if (isLoading || !isStudent) {
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

    return (
        <div className="min-h-screen bg-duo-gray-100 pb-24">
            {/* Top Header */}
            <header className="bg-white border-b-2 border-duo-gray-200 sticky top-0 z-50">
                <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Image src="/icon.png" alt="LMS YPP" width={32} height={32} className="rounded-lg" />
                        <span className="font-extrabold text-duo-gray-900 hidden sm:inline">LMS YPP</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3">
                        {/* AI Hints */}
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${isExamMode ? 'bg-duo-gray-200 text-duo-gray-400' : 'bg-duo-purple/10 text-duo-purple'
                            }`}>
                            {isExamMode ? '🔒' : '💡'} {totalTokens}
                        </div>

                        {/* Streak */}
                        <div className="streak-display text-sm">
                            🔥 {streak}
                        </div>

                        {/* XP */}
                        <div className="xp-display text-sm">
                            ⭐ {xp}
                        </div>
                    </div>

                    {/* Profile & Settings */}
                    <div className="flex items-center gap-2">
                        <button onClick={toggleLanguage} className="p-2 hover:bg-duo-gray-100 rounded-lg">
                            {language === 'id' ? '🇮🇩' : '🇬🇧'}
                        </button>
                        <button onClick={handleLogout} className="p-2 hover:bg-duo-gray-100 rounded-lg text-duo-gray-500">
                            🚪
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-6">
                {/* Welcome Section */}
                <section className="mb-8">
                    <div className="card bg-gradient-to-r from-duo-blue to-duo-purple text-white p-6">
                        <div className="flex items-center gap-4">
                            <div className="avatar avatar-lg bg-white/20 border-white/30">
                                {user?.avatar || '🦊'}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-extrabold mb-1">
                                    {language === 'id' ? `Halo, ${user?.name}! 👋` : `Hello, ${user?.name}! 👋`}
                                </h1>
                                <p className="text-white/80">
                                    {user?.className} • Level {level}
                                </p>
                            </div>
                        </div>

                        {/* Level Progress */}
                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span>Level {level}</span>
                                <span>Level {level + 1}</span>
                            </div>
                            <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-duo-yellow rounded-full transition-all"
                                    style={{ width: `${levelProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Daily Goal */}
                <section className="mb-8">
                    <div className="card">
                        <div className="flex items-center justify-between mb,4">
                            <h2 className="font-bold text-duo-gray-900">
                                {language === 'id' ? '🎯 Target Harian' : '🎯 Daily Goal'}
                            </h2>
                            <span className="text-sm text-duo-gray-500">
                                {dailyXp}/{dailyGoal} XP
                            </span>
                        </div>
                        <div className="progress-bar mt-3">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${dailyProgress}%` }}
                            />
                        </div>
                        {dailyProgress >= 100 && (
                            <p className="text-duo-green font-bold text-sm mt-2">
                                ✅ {language === 'id' ? 'Target tercapai! Luar biasa!' : 'Goal achieved! Amazing!'}
                            </p>
                        )}
                    </div>
                </section>

                {/* Quick Actions Grid */}
                <section className="mb-8">
                    <h2 className="font-bold text-duo-gray-900 mb-4">
                        {language === 'id' ? '⚡ Mulai Belajar' : '⚡ Start Learning'}
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <ActionCard
                            emoji="📚"
                            title={language === 'id' ? 'Pelajaran' : 'Lessons'}
                            description={language === 'id' ? 'Materi interaktif' : 'Interactive content'}
                            color="blue"
                            onClick={() => router.push('/student/learn')}
                        />
                        <ActionCard
                            emoji="✏️"
                            title={language === 'id' ? 'Latihan' : 'Practice'}
                            description={language === 'id' ? 'Kuis & soal' : 'Quiz & problems'}
                            color="green"
                            onClick={() => router.push('/student/practice')}
                        />
                        <ActionCard
                            emoji="⚔️"
                            title={language === 'id' ? 'Raid Co-op' : 'Co-op Raid'}
                            description={language === 'id' ? 'Lawan boss bersama' : 'Fight boss together'}
                            color="purple"
                            onClick={() => router.push('/student/coop-raid')}
                        />
                        <ActionCard
                            emoji="⚡"
                            title={language === 'id' ? 'Power-Ups' : 'Power-Ups'}
                            description={language === 'id' ? 'Boost kemampuanmu' : 'Boost your abilities'}
                            color="orange"
                            onClick={() => router.push('/student/powerups')}
                        />
                    </div>

                    {/* Secondary Actions */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <button
                            onClick={() => router.push('/student/simulations')}
                            className="p-3 bg-white rounded-xl text-center border-2 border-duo-gray-200 hover:border-duo-blue transition-colors"
                        >
                            <span className="text-2xl block">🧪</span>
                            <span className="text-xs font-semibold text-duo-gray-600">{language === 'id' ? 'Simulasi' : 'Simulation'}</span>
                        </button>
                        <button
                            onClick={() => router.push('/student/dragdrop')}
                            className="p-3 bg-white rounded-xl text-center border-2 border-duo-gray-200 hover:border-duo-blue transition-colors"
                        >
                            <span className="text-2xl block">🎯</span>
                            <span className="text-xs font-semibold text-duo-gray-600">{language === 'id' ? 'Drag-Drop' : 'Drag-Drop'}</span>
                        </button>
                        <button
                            onClick={() => router.push('/student/replay')}
                            className="p-3 bg-white rounded-xl text-center border-2 border-duo-gray-200 hover:border-duo-blue transition-colors"
                        >
                            <span className="text-2xl block">🔄</span>
                            <span className="text-xs font-semibold text-duo-gray-600">{language === 'id' ? 'Replay' : 'Replay'}</span>
                        </button>
                        <button
                            onClick={() => router.push('/student/peer-review')}
                            className="p-3 bg-white rounded-xl text-center border-2 border-duo-gray-200 hover:border-duo-blue transition-colors"
                        >
                            <span className="text-2xl block">👥</span>
                            <span className="text-xs font-semibold text-duo-gray-600">{language === 'id' ? 'Review' : 'Review'}</span>
                        </button>
                    </div>

                    {/* More Features Row */}
                    <div className="grid grid-cols-4 gap-2 mt-3">
                        <button
                            onClick={() => router.push('/student/skill-tree')}
                            className="p-2 bg-duo-green/10 rounded-xl text-center hover:bg-duo-green/20 transition-colors"
                        >
                            <span className="text-xl block">🌳</span>
                            <span className="text-xs font-semibold text-duo-green">{language === 'id' ? 'Skill' : 'Skills'}</span>
                        </button>
                        <button
                            onClick={() => router.push('/student/achievements')}
                            className="p-2 bg-duo-yellow/10 rounded-xl text-center hover:bg-duo-yellow/20 transition-colors"
                        >
                            <span className="text-xl block">🏅</span>
                            <span className="text-xs font-semibold text-duo-yellow">{language === 'id' ? 'Prestasi' : 'Achieve'}</span>
                        </button>
                        <button
                            onClick={() => router.push('/student/forum')}
                            className="p-2 bg-duo-purple/10 rounded-xl text-center hover:bg-duo-purple/20 transition-colors"
                        >
                            <span className="text-xl block">💬</span>
                            <span className="text-xs font-semibold text-duo-purple">{language === 'id' ? 'Forum' : 'Forum'}</span>
                        </button>
                        <button
                            onClick={() => router.push('/student/timer')}
                            className="p-2 bg-duo-red/10 rounded-xl text-center hover:bg-duo-red/20 transition-colors"
                        >
                            <span className="text-xl block">⏱️</span>
                            <span className="text-xs font-semibold text-duo-red">{language === 'id' ? 'Timer' : 'Timer'}</span>
                        </button>
                    </div>

                    {/* Extra Row */}
                    <div className="flex justify-center gap-3 mt-3">
                        <button
                            onClick={() => router.push('/student/notifications')}
                            className="px-4 py-2 bg-duo-blue/10 rounded-xl text-center hover:bg-duo-blue/20 transition-colors flex items-center gap-2"
                        >
                            <span className="text-lg">🔔</span>
                            <span className="text-xs font-semibold text-duo-blue">{language === 'id' ? 'Notifikasi' : 'Notifications'}</span>
                        </button>
                        <button
                            onClick={() => router.push('/student/live-battle')}
                            className="px-4 py-2 bg-duo-red/10 rounded-xl text-center hover:bg-duo-red/20 transition-colors flex items-center gap-2"
                        >
                            <span className="text-lg">⚔️</span>
                            <span className="text-xs font-semibold text-duo-red">{language === 'id' ? 'Battle' : 'Battle'}</span>
                        </button>
                    </div>
                </section>

                {/* Badges Section */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-duo-gray-900">
                            🏅 {language === 'id' ? 'Lencana' : 'Badges'} ({unlockedBadges.length}/{allBadges.length})
                        </h2>
                        <button
                            onClick={() => router.push('/student/badges')}
                            className="text-duo-blue font-bold text-sm"
                        >
                            {language === 'id' ? 'Lihat Semua' : 'View All'} →
                        </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {allBadges.slice(0, 6).map(badge => (
                            <div
                                key={badge.id}
                                className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${badge.unlocked
                                    ? 'bg-duo-yellow/20 border-2 border-duo-yellow'
                                    : 'bg-duo-gray-200 opacity-40'
                                    }`}
                                title={badge.name[language]}
                            >
                                {badge.icon}
                            </div>
                        ))}
                    </div>
                </section>

                {/* AI Hint Info */}
                <section>
                    <div className="card bg-gradient-to-r from-duo-purple/10 to-duo-blue/10 border-2 border-duo-purple/20">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl">🤖</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-duo-gray-900">
                                    {language === 'id' ? 'AI Hint Assistant' : 'AI Hint Assistant'}
                                </h3>
                                <p className="text-sm text-duo-gray-500">
                                    {language === 'id'
                                        ? `${totalTokens} petunjuk tersedia hari ini`
                                        : `${totalTokens} hints available today`}
                                </p>
                            </div>
                            <div className="badge badge-level">
                                💡 {totalTokens}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-duo-gray-200 px-4 py-2 z-50">
                <div className="flex justify-around max-w-md mx-auto">
                    <NavItem emoji="🏠" label={t('nav.home')} active onClick={() => { }} />
                    <NavItem emoji="📚" label={t('nav.learn')} onClick={() => router.push('/student/learn')} />
                    <NavItem emoji="⚔️" label={language === 'id' ? 'Battle' : 'Battle'} onClick={() => router.push('/student/live-battle')} />
                    <NavItem emoji="🏆" label={t('nav.compete')} onClick={() => router.push('/student/compete')} />
                    <NavItem emoji="👤" label={t('nav.profile')} onClick={() => router.push('/student/profile')} />
                </div>
            </nav>
        </div>
    );
}

function ActionCard({
    emoji,
    title,
    description,
    color,
    onClick
}: {
    emoji: string;
    title: string;
    description: string;
    color: 'blue' | 'green' | 'orange' | 'purple';
    onClick: () => void;
}) {
    const colorClasses = {
        blue: 'bg-duo-blue/10 hover:bg-duo-blue/20 border-duo-blue/20',
        green: 'bg-duo-green/10 hover:bg-duo-green/20 border-duo-green/20',
        orange: 'bg-duo-orange/10 hover:bg-duo-orange/20 border-duo-orange/20',
        purple: 'bg-duo-purple/10 hover:bg-duo-purple/20 border-duo-purple/20',
    };

    return (
        <button
            onClick={onClick}
            className={`card card-interactive text-left border-2 ${colorClasses[color]}`}
        >
            <div className="text-3xl mb-2">{emoji}</div>
            <h3 className="font-bold text-duo-gray-900">{title}</h3>
            <p className="text-sm text-duo-gray-500">{description}</p>
        </button>
    );
}

function NavItem({
    emoji,
    label,
    active = false,
    onClick
}: {
    emoji: string;
    label: string;
    active?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${active
                ? 'text-duo-blue'
                : 'text-duo-gray-400 hover:text-duo-gray-600'
                }`}
        >
            <span className="text-xl">{emoji}</span>
            <span className="text-xs font-semibold">{label}</span>
        </button>
    );
}
