'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

// Parent portal types
interface ChildData {
    id: string;
    name: string;
    avatar: string;
    grade: number;
    className: string;
    xp: number;
    level: number;
    streak: number;
    weeklyProgress: {
        day: string;
        quizzes: number;
        xp: number;
    }[];
    recentActivity: {
        id: string;
        type: 'quiz' | 'battle' | 'achievement' | 'streak';
        description: { id: string; en: string };
        timestamp: string;
        score?: number;
    }[];
    subjects: {
        name: string;
        average: number;
        lastQuiz: number;
        trend: 'up' | 'down' | 'stable';
    }[];
    badges: { id: string; icon: string; name: string; }[];
}

const MOCK_CHILD: ChildData = {
    id: 'child1',
    name: 'Budi Santoso',
    avatar: '👦',
    grade: 9,
    className: '9A',
    xp: 2450,
    level: 12,
    streak: 5,
    weeklyProgress: [
        { day: 'Sen', quizzes: 3, xp: 150 },
        { day: 'Sel', quizzes: 2, xp: 100 },
        { day: 'Rab', quizzes: 4, xp: 200 },
        { day: 'Kam', quizzes: 1, xp: 50 },
        { day: 'Jum', quizzes: 5, xp: 250 },
        { day: 'Sab', quizzes: 2, xp: 100 },
        { day: 'Min', quizzes: 0, xp: 0 },
    ],
    recentActivity: [
        { id: 'a1', type: 'quiz', description: { id: 'Menyelesaikan kuis Aljabar', en: 'Completed Algebra quiz' }, timestamp: '2026-01-13T14:30:00', score: 85 },
        { id: 'a2', type: 'achievement', description: { id: 'Mendapatkan badge "Boss Slayer"', en: 'Earned "Boss Slayer" badge' }, timestamp: '2026-01-13T10:00:00' },
        { id: 'a3', type: 'battle', description: { id: 'Ikut Class Battle 9A vs 9B', en: 'Joined Class Battle 9A vs 9B' }, timestamp: '2026-01-12T14:00:00' },
        { id: 'a4', type: 'streak', description: { id: 'Streak 5 hari tercapai!', en: '5-day streak achieved!' }, timestamp: '2026-01-12T08:00:00' },
        { id: 'a5', type: 'quiz', description: { id: 'Menyelesaikan kuis Geometri', en: 'Completed Geometry quiz' }, timestamp: '2026-01-11T15:00:00', score: 92 },
    ],
    subjects: [
        { name: 'Matematika', average: 87, lastQuiz: 85, trend: 'stable' },
        { name: 'IPA', average: 82, lastQuiz: 88, trend: 'up' },
        { name: 'Bahasa Indonesia', average: 90, lastQuiz: 85, trend: 'down' },
        { name: 'Bahasa Inggris', average: 78, lastQuiz: 82, trend: 'up' },
    ],
    badges: [
        { id: 'b1', icon: '🐉', name: 'Boss Slayer' },
        { id: 'b2', icon: '🔥', name: 'Streak 5' },
        { id: 'b3', icon: '💯', name: 'Perfect Score' },
        { id: 'b4', icon: '⚔️', name: 'Battle Ready' },
    ],
};

export default function ParentPortalPage() {
    const router = useRouter();
    const { language } = useLanguage();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [parentCode, setParentCode] = useState('');
    const [child, setChild] = useState<ChildData | null>(null);
    const [error, setError] = useState('');

    const handleLogin = () => {
        // Simple demo login - parent code PARENT123
        if (parentCode.toUpperCase() === 'PARENT123') {
            setIsLoggedIn(true);
            setChild(MOCK_CHILD);
            setError('');
        } else {
            setError(language === 'id' ? 'Kode tidak valid' : 'Invalid code');
        }
    };

    // Login Screen
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-duo-blue to-duo-purple flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl p-8 w-full max-w-md">
                    <div className="text-center mb-8">
                        <span className="text-6xl block mb-4">👨‍👩‍👧‍👦</span>
                        <h1 className="text-2xl font-extrabold text-duo-gray-900 mb-2">
                            {language === 'id' ? 'Portal Orang Tua' : 'Parent Portal'}
                        </h1>
                        <p className="text-duo-gray-500">
                            {language === 'id' ? 'Pantau progress belajar anak Anda' : 'Monitor your child\'s learning progress'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                {language === 'id' ? 'Kode Orang Tua' : 'Parent Code'}
                            </label>
                            <input
                                type="text"
                                value={parentCode}
                                onChange={(e) => setParentCode(e.target.value)}
                                placeholder="PARENT123"
                                className="w-full px-4 py-3 border-2 border-duo-gray-200 rounded-xl text-center text-lg font-mono uppercase"
                            />
                            {error && <p className="text-duo-red text-sm mt-1">{error}</p>}
                        </div>

                        <button
                            onClick={handleLogin}
                            className="btn btn-primary btn-full"
                        >
                            {language === 'id' ? 'Masuk' : 'Enter'}
                        </button>

                        <p className="text-xs text-duo-gray-400 text-center">
                            {language === 'id' ? 'Kode diberikan oleh anak Anda dari halaman profil' : 'Code is provided by your child from their profile page'}
                        </p>
                    </div>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full mt-6 text-duo-gray-500 text-sm"
                    >
                        ← {language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
                    </button>
                </div>
            </div>
        );
    }

    if (!child) return null;

    const maxXp = Math.max(...child.weeklyProgress.map(d => d.xp), 1);

    return (
        <div className="min-h-screen bg-duo-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setIsLoggedIn(false)} className="text-duo-gray-500 hover:text-duo-gray-700">
                        ← {language === 'id' ? 'Keluar' : 'Logout'}
                    </button>
                    <span className="text-sm text-duo-gray-400">
                        👨‍👩‍👧‍👦 {language === 'id' ? 'Portal Orang Tua' : 'Parent Portal'}
                    </span>
                </div>

                {/* Child Profile Card */}
                <div className="card bg-gradient-to-r from-duo-blue to-duo-purple text-white mb-6">
                    <div className="flex items-center gap-4">
                        <span className="text-6xl">{child.avatar}</span>
                        <div>
                            <h1 className="text-2xl font-extrabold">{child.name}</h1>
                            <p className="text-white/80">Kelas {child.grade}{child.className} • Level {child.level}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <div className="text-3xl font-bold">{child.xp.toLocaleString()}</div>
                            <div className="text-sm text-white/70">XP</div>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="bg-white/20 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold">{child.streak}</div>
                            <div className="text-xs text-white/70">🔥 Streak</div>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold">{child.badges.length}</div>
                            <div className="text-xs text-white/70">🏅 Badges</div>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold">{Math.round(child.subjects.reduce((sum, s) => sum + s.average, 0) / child.subjects.length)}%</div>
                            <div className="text-xs text-white/70">📊 Average</div>
                        </div>
                    </div>
                </div>

                {/* Weekly Activity Chart */}
                <div className="card mb-6">
                    <h2 className="font-bold text-duo-gray-900 mb-4">📈 {language === 'id' ? 'Aktivitas Minggu Ini' : 'This Week\'s Activity'}</h2>
                    <div className="flex items-end justify-between h-32 gap-2">
                        {child.weeklyProgress.map((day, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-duo-blue rounded-t transition-all"
                                    style={{ height: `${(day.xp / maxXp) * 100}%`, minHeight: day.xp > 0 ? '8px' : '0' }}
                                />
                                <span className="text-xs mt-2 text-duo-gray-500">{day.day}</span>
                                <span className="text-xs text-duo-blue font-bold">{day.xp}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-center gap-4 text-sm text-duo-gray-500">
                        <span>📚 Total: {child.weeklyProgress.reduce((sum, d) => sum + d.quizzes, 0)} kuis</span>
                        <span>⚡ Total: {child.weeklyProgress.reduce((sum, d) => sum + d.xp, 0)} XP</span>
                    </div>
                </div>

                {/* Two column layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Subject Performance */}
                    <div className="card">
                        <h2 className="font-bold text-duo-gray-900 mb-4">📚 {language === 'id' ? 'Nilai per Mapel' : 'Subject Grades'}</h2>
                        <div className="space-y-3">
                            {child.subjects.map((subject, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold">{subject.name}</span>
                                            <span className={`text-sm font-bold ${subject.trend === 'up' ? 'text-duo-green' :
                                                    subject.trend === 'down' ? 'text-duo-red' : 'text-duo-gray-500'
                                                }`}>
                                                {subject.trend === 'up' ? '↑' : subject.trend === 'down' ? '↓' : '→'} {subject.average}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-duo-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${subject.average >= 80 ? 'bg-duo-green' :
                                                        subject.average >= 60 ? 'bg-duo-yellow' : 'bg-duo-red'
                                                    }`}
                                                style={{ width: `${subject.average}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card">
                        <h2 className="font-bold text-duo-gray-900 mb-4">🕐 {language === 'id' ? 'Aktivitas Terbaru' : 'Recent Activity'}</h2>
                        <div className="space-y-3">
                            {child.recentActivity.slice(0, 5).map(activity => (
                                <div key={activity.id} className="flex items-start gap-3">
                                    <span className="text-xl">
                                        {activity.type === 'quiz' ? '📝' :
                                            activity.type === 'battle' ? '⚔️' :
                                                activity.type === 'achievement' ? '🏆' : '🔥'}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm text-duo-gray-700">
                                            {language === 'id' ? activity.description.id : activity.description.en}
                                            {activity.score && <span className="font-bold text-duo-blue"> ({activity.score}%)</span>}
                                        </p>
                                        <p className="text-xs text-duo-gray-400">
                                            {new Date(activity.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Badges */}
                <div className="card mt-6">
                    <h2 className="font-bold text-duo-gray-900 mb-4">🏅 {language === 'id' ? 'Lencana Terbaru' : 'Recent Badges'}</h2>
                    <div className="flex gap-4 overflow-x-auto">
                        {child.badges.map(badge => (
                            <div key={badge.id} className="flex-shrink-0 w-20 text-center">
                                <div className="w-16 h-16 bg-duo-yellow/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-2">
                                    {badge.icon}
                                </div>
                                <span className="text-xs text-duo-gray-600">{badge.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
