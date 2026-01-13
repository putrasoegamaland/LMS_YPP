'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

// Demo leaderboard data
const DEMO_LEADERBOARD = [
    { rank: 1, userId: 'user-1', userName: 'Andi Pratama', avatar: '🦁', xp: 2450, streak: 15, change: 0 },
    { rank: 2, userId: 'user-2', userName: 'Siti Nurhaliza', avatar: '🦊', xp: 2320, streak: 12, change: 2 },
    { rank: 3, userId: 'user-3', userName: 'Budi Santoso', avatar: '🐼', xp: 2180, streak: 8, change: -1 },
    { rank: 4, userId: 'user-4', userName: 'Dewi Lestari', avatar: '🐰', xp: 1950, streak: 10, change: 1 },
    { rank: 5, userId: 'user-5', userName: 'Rizki Ramadhan', avatar: '🐻', xp: 1820, streak: 5, change: -2 },
    { rank: 6, userId: 'user-6', userName: 'Putri Handayani', avatar: '🦋', xp: 1750, streak: 7, change: 0 },
    { rank: 7, userId: 'user-7', userName: 'Ahmad Fauzi', avatar: '🦅', xp: 1680, streak: 4, change: 3 },
    { rank: 8, userId: 'student-1', userName: 'Budi Santoso', avatar: '🦊', xp: 0, streak: 0, change: 0 }, // Current user placeholder
];

const CLASS_LEADERBOARD = [
    { rank: 1, classId: 'class-1', className: 'Kelas 9A', avgXp: 1850, studentCount: 32, topStudent: 'Andi P.' },
    { rank: 2, classId: 'class-2', className: 'Kelas 9B', avgXp: 1720, studentCount: 30, topStudent: 'Siti N.' },
    { rank: 3, classId: 'class-3', className: 'Kelas 9C', avgXp: 1650, studentCount: 28, topStudent: 'Dewi L.' },
    { rank: 4, classId: 'class-4', className: 'Kelas 10A', avgXp: 1580, studentCount: 30, topStudent: 'Rizki R.' },
];

const SKILL_LEADERBOARD = {
    matematika: [
        { rank: 1, userName: 'Andi Pratama', avatar: '🦁', mastery: 92 },
        { rank: 2, userName: 'Siti Nurhaliza', avatar: '🦊', mastery: 88 },
        { rank: 3, userName: 'Budi Santoso', avatar: '🐼', mastery: 85 },
    ],
    bahasa_inggris: [
        { rank: 1, userName: 'Dewi Lestari', avatar: '🐰', mastery: 95 },
        { rank: 2, userName: 'Putri Handayani', avatar: '🦋', mastery: 90 },
        { rank: 3, userName: 'Ahmad Fauzi', avatar: '🦅', mastery: 82 },
    ],
};

type LeaderboardType = 'individual' | 'class' | 'skill' | 'improvement';

export default function CompetePage() {
    const router = useRouter();
    const { user, isStudent, isLoading: authLoading } = useAuth();
    const { language, t } = useLanguage();
    const { xp, streak, level } = useGame();

    const [activeTab, setActiveTab] = useState<LeaderboardType>('individual');

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

    // Update current user's data in leaderboard
    const leaderboard = DEMO_LEADERBOARD.map(entry =>
        entry.userId === 'student-1'
            ? { ...entry, userName: user?.name || 'You', xp, streak }
            : entry
    ).sort((a, b) => b.xp - a.xp).map((entry, index) => ({ ...entry, rank: index + 1 }));

    const currentUserRank = leaderboard.find(e => e.userId === 'student-1')?.rank || 0;

    return (
        <div className="min-h-screen bg-duo-gray-100 pb-24">
            {/* Header */}
            <header className="bg-gradient-to-r from-duo-purple to-duo-blue text-white">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => router.push('/student/dashboard')} className="text-white/80 hover:text-white">
                            ← {t('action.back')}
                        </button>
                        <h1 className="font-extrabold text-xl">🏆 {t('nav.compete')}</h1>
                        <div></div>
                    </div>

                    {/* Current user rank card */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center text-3xl">
                                {user?.avatar || '🦊'}
                            </div>
                            <div className="flex-1">
                                <p className="text-white/80 text-sm">{language === 'id' ? 'Peringkatmu' : 'Your Rank'}</p>
                                <p className="text-3xl font-extrabold">#{currentUserRank}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">{xp} XP</p>
                                <p className="text-white/80 text-sm">🔥 {streak} {language === 'id' ? 'hari' : 'days'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b-2 border-duo-gray-200 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex gap-1 overflow-x-auto py-2">
                        <TabButton
                            active={activeTab === 'individual'}
                            onClick={() => setActiveTab('individual')}
                            emoji="👤"
                            label={language === 'id' ? 'Individual' : 'Individual'}
                        />
                        <TabButton
                            active={activeTab === 'class'}
                            onClick={() => setActiveTab('class')}
                            emoji="🏫"
                            label={language === 'id' ? 'Kelas' : 'Class'}
                        />
                        <TabButton
                            active={activeTab === 'skill'}
                            onClick={() => setActiveTab('skill')}
                            emoji="🎯"
                            label={language === 'id' ? 'Skill' : 'Skill'}
                        />
                        <TabButton
                            active={activeTab === 'improvement'}
                            onClick={() => setActiveTab('improvement')}
                            emoji="📈"
                            label={language === 'id' ? 'Kemajuan' : 'Improvement'}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-6">
                {/* Quick Actions */}
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => router.push('/student/daily-sprint')}
                        className="btn btn-warning btn-sm whitespace-nowrap"
                    >
                        ⚡ {language === 'id' ? 'Sprint Harian' : 'Daily Sprint'}
                    </button>
                    <button className="btn btn-outline btn-sm whitespace-nowrap">
                        ⚔️ {language === 'id' ? 'Class Battle' : 'Class Battle'}
                    </button>
                    <button className="btn btn-outline btn-sm whitespace-nowrap">
                        🏅 {language === 'id' ? 'Turnamen' : 'Tournament'}
                    </button>
                </div>

                {/* Individual Leaderboard */}
                {activeTab === 'individual' && (
                    <div className="space-y-3">
                        <h2 className="font-bold text-duo-gray-900 mb-4">
                            {language === 'id' ? '🏆 Top Learners Minggu Ini' : '🏆 Top Learners This Week'}
                        </h2>
                        {leaderboard.slice(0, 10).map((entry) => (
                            <div
                                key={entry.userId}
                                className={`leaderboard-item ${entry.userId === 'student-1' ? 'current-user' : ''}`}
                            >
                                <div className={`rank-badge ${entry.rank === 1 ? 'rank-1' : entry.rank === 2 ? 'rank-2' : entry.rank === 3 ? 'rank-3' : 'bg-duo-gray-200 text-duo-gray-700'
                                    }`}>
                                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                                </div>
                                <div className="text-2xl">{entry.avatar}</div>
                                <div className="flex-1">
                                    <p className="font-bold text-duo-gray-900">
                                        {entry.userName}
                                        {entry.userId === 'student-1' && (
                                            <span className="text-duo-blue ml-2 text-sm">({language === 'id' ? 'Kamu' : 'You'})</span>
                                        )}
                                    </p>
                                    <p className="text-sm text-duo-gray-500">🔥 {entry.streak} {language === 'id' ? 'hari' : 'days'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-duo-yellow-dark">{entry.xp} XP</p>
                                    {entry.change !== 0 && (
                                        <p className={`text-xs font-semibold ${entry.change > 0 ? 'text-duo-green' : 'text-duo-red'}`}>
                                            {entry.change > 0 ? '↑' : '↓'} {Math.abs(entry.change)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Class Leaderboard */}
                {activeTab === 'class' && (
                    <div className="space-y-3">
                        <h2 className="font-bold text-duo-gray-900 mb-4">
                            {language === 'id' ? '🏫 Peringkat Kelas' : '🏫 Class Rankings'}
                        </h2>
                        {CLASS_LEADERBOARD.map((entry) => (
                            <div
                                key={entry.classId}
                                className={`leaderboard-item ${entry.classId === 'class-1' ? 'current-user' : ''}`}
                            >
                                <div className={`rank-badge ${entry.rank === 1 ? 'rank-1' : entry.rank === 2 ? 'rank-2' : entry.rank === 3 ? 'rank-3' : 'bg-duo-gray-200 text-duo-gray-700'
                                    }`}>
                                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                                </div>
                                <div className="text-2xl">🏫</div>
                                <div className="flex-1">
                                    <p className="font-bold text-duo-gray-900">
                                        {entry.className}
                                        {entry.classId === 'class-1' && user?.classId === 'class-1' && (
                                            <span className="text-duo-blue ml-2 text-sm">({language === 'id' ? 'Kelasmu' : 'Your Class'})</span>
                                        )}
                                    </p>
                                    <p className="text-sm text-duo-gray-500">👨‍🎓 {entry.studentCount} • ⭐ {entry.topStudent}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-duo-purple">{entry.avgXp}</p>
                                    <p className="text-xs text-duo-gray-500">{language === 'id' ? 'Rata-rata XP' : 'Avg XP'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Skill Leaderboard */}
                {activeTab === 'skill' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="font-bold text-duo-gray-900 mb-4">🧮 {language === 'id' ? 'Matematika' : 'Mathematics'}</h2>
                            <div className="space-y-3">
                                {SKILL_LEADERBOARD.matematika.map((entry) => (
                                    <div key={entry.userName} className="card flex items-center gap-4">
                                        <div className={`rank-badge ${entry.rank === 1 ? 'rank-1' : entry.rank === 2 ? 'rank-2' : 'rank-3'
                                            }`}>
                                            {['🥇', '🥈', '🥉'][entry.rank - 1]}
                                        </div>
                                        <div className="text-2xl">{entry.avatar}</div>
                                        <div className="flex-1">
                                            <p className="font-bold text-duo-gray-900">{entry.userName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-duo-green">{entry.mastery}%</p>
                                            <p className="text-xs text-duo-gray-500">{language === 'id' ? 'Penguasaan' : 'Mastery'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="font-bold text-duo-gray-900 mb-4">🌐 {language === 'id' ? 'Bahasa Inggris' : 'English'}</h2>
                            <div className="space-y-3">
                                {SKILL_LEADERBOARD.bahasa_inggris.map((entry) => (
                                    <div key={entry.userName} className="card flex items-center gap-4">
                                        <div className={`rank-badge ${entry.rank === 1 ? 'rank-1' : entry.rank === 2 ? 'rank-2' : 'rank-3'
                                            }`}>
                                            {['🥇', '🥈', '🥉'][entry.rank - 1]}
                                        </div>
                                        <div className="text-2xl">{entry.avatar}</div>
                                        <div className="flex-1">
                                            <p className="font-bold text-duo-gray-900">{entry.userName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-duo-blue">{entry.mastery}%</p>
                                            <p className="text-xs text-duo-gray-500">{language === 'id' ? 'Penguasaan' : 'Mastery'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Improvement Leaderboard */}
                {activeTab === 'improvement' && (
                    <div className="space-y-3">
                        <h2 className="font-bold text-duo-gray-900 mb-4">
                            📈 {language === 'id' ? 'Peningkatan Terbesar Minggu Ini' : 'Most Improved This Week'}
                        </h2>
                        <p className="text-duo-gray-500 text-sm mb-4">
                            {language === 'id'
                                ? 'Peringkat berdasarkan kemajuan, bukan total XP. Adil untuk semua!'
                                : 'Ranked by progress, not total XP. Fair for everyone!'}
                        </p>
                        {[
                            { rank: 1, userName: 'Rizki Ramadhan', avatar: '🐻', improvement: '+320 XP', percentage: '+45%' },
                            { rank: 2, userName: 'Dewi Lestari', avatar: '🐰', improvement: '+280 XP', percentage: '+38%' },
                            { rank: 3, userName: 'Ahmad Fauzi', avatar: '🦅', improvement: '+250 XP', percentage: '+35%' },
                            { rank: 4, userName: 'Putri Handayani', avatar: '🦋', improvement: '+220 XP', percentage: '+30%' },
                            { rank: 5, userName: user?.name || 'You', avatar: user?.avatar || '🦊', improvement: '+0 XP', percentage: '+0%' },
                        ].map((entry, index) => (
                            <div
                                key={entry.userName}
                                className={`leaderboard-item ${entry.userName === user?.name ? 'current-user' : ''}`}
                            >
                                <div className={`rank-badge ${entry.rank === 1 ? 'rank-1' : entry.rank === 2 ? 'rank-2' : entry.rank === 3 ? 'rank-3' : 'bg-duo-gray-200 text-duo-gray-700'
                                    }`}>
                                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                                </div>
                                <div className="text-2xl">{entry.avatar}</div>
                                <div className="flex-1">
                                    <p className="font-bold text-duo-gray-900">{entry.userName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-duo-green">{entry.improvement}</p>
                                    <p className="text-xs text-duo-gray-500">{entry.percentage}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-duo-gray-200 px-4 py-2">
                <div className="flex justify-around max-w-md mx-auto">
                    <NavItem emoji="🏠" label={t('nav.home')} onClick={() => router.push('/student/dashboard')} />
                    <NavItem emoji="📚" label={t('nav.learn')} onClick={() => router.push('/student/learn')} />
                    <NavItem emoji="✏️" label={t('nav.practice')} onClick={() => router.push('/student/practice')} />
                    <NavItem emoji="🏆" label={t('nav.compete')} active onClick={() => { }} />
                    <NavItem emoji="👤" label={t('nav.profile')} onClick={() => router.push('/student/profile')} />
                </div>
            </nav>
        </div>
    );
}

function TabButton({ active, onClick, emoji, label }: { active: boolean; onClick: () => void; emoji: string; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${active
                    ? 'bg-duo-purple text-white'
                    : 'bg-duo-gray-100 text-duo-gray-600 hover:bg-duo-gray-200'
                }`}
        >
            {emoji} {label}
        </button>
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
