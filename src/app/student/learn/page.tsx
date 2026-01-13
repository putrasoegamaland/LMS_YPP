'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

// Demo lessons with Duolingo-style skill tree
const DEMO_UNITS = [
    {
        id: 'unit-1',
        title: { id: 'Dasar Aljabar', en: 'Algebra Basics' },
        description: { id: 'Pelajari dasar-dasar aljabar', en: 'Learn the basics of algebra' },
        lessons: [
            { id: 'lesson-1-1', title: { id: 'Variabel & Konstanta', en: 'Variables & Constants' }, icon: '📐', xp: 20, status: 'completed' as const },
            { id: 'lesson-1-2', title: { id: 'Persamaan Linear', en: 'Linear Equations' }, icon: '➕', xp: 25, status: 'active' as const },
            { id: 'lesson-1-3', title: { id: 'Operasi Aljabar', en: 'Algebraic Operations' }, icon: '✖️', xp: 30, status: 'locked' as const },
            { id: 'lesson-1-4', title: { id: 'Faktorisasi', en: 'Factorization' }, icon: '🧩', xp: 35, status: 'locked' as const },
        ],
    },
    {
        id: 'unit-2',
        title: { id: 'Geometri Dasar', en: 'Basic Geometry' },
        description: { id: 'Bentuk, luas, dan keliling', en: 'Shapes, area, and perimeter' },
        lessons: [
            { id: 'lesson-2-1', title: { id: 'Segitiga', en: 'Triangles' }, icon: '📐', xp: 20, status: 'locked' as const },
            { id: 'lesson-2-2', title: { id: 'Persegi & Persegi Panjang', en: 'Squares & Rectangles' }, icon: '⬜', xp: 20, status: 'locked' as const },
            { id: 'lesson-2-3', title: { id: 'Lingkaran', en: 'Circles' }, icon: '⭕', xp: 25, status: 'locked' as const },
        ],
    },
    {
        id: 'unit-3',
        title: { id: 'Statistika', en: 'Statistics' },
        description: { id: 'Data, rata-rata, dan diagram', en: 'Data, averages, and charts' },
        lessons: [
            { id: 'lesson-3-1', title: { id: 'Mean, Median, Modus', en: 'Mean, Median, Mode' }, icon: '📊', xp: 25, status: 'locked' as const },
            { id: 'lesson-3-2', title: { id: 'Diagram', en: 'Charts' }, icon: '📈', xp: 30, status: 'locked' as const },
        ],
    },
];

export default function LearnPage() {
    const router = useRouter();
    const { isStudent, isLoading: authLoading } = useAuth();
    const { language, t } = useLanguage();
    const { level } = useGame();

    const [expandedUnit, setExpandedUnit] = useState<string | null>('unit-1');

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

    const handleLessonClick = (lessonId: string, status: string) => {
        if (status === 'locked') return;
        // For now, redirect to practice page
        router.push('/student/practice');
    };

    return (
        <div className="min-h-screen bg-duo-gray-100 pb-24">
            {/* Header */}
            <header className="bg-white border-b-2 border-duo-gray-200 sticky top-0 z-50">
                <div className="flex items-center gap-4 px-4 py-3 max-w-4xl mx-auto">
                    <button onClick={() => router.push('/student/dashboard')} className="text-duo-gray-500 hover:text-duo-gray-700">
                        ← {t('action.back')}
                    </button>
                    <h1 className="font-extrabold text-duo-gray-900 flex-1">
                        📚 {t('nav.learn')}
                    </h1>
                    <span className="badge badge-level">Lv. {level}</span>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                {/* Skill Tree */}
                <div className="space-y-6">
                    {DEMO_UNITS.map((unit, unitIndex) => {
                        const isExpanded = expandedUnit === unit.id;
                        const completedCount = unit.lessons.filter(l => l.status === 'completed').length;
                        const progress = (completedCount / unit.lessons.length) * 100;

                        return (
                            <div key={unit.id} className="card">
                                {/* Unit Header */}
                                <button
                                    onClick={() => setExpandedUnit(isExpanded ? null : unit.id)}
                                    className="w-full flex items-center gap-4 text-left"
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${completedCount > 0 ? 'bg-duo-green/20' : 'bg-duo-gray-200'
                                        }`}>
                                        {unitIndex === 0 ? '🧮' : unitIndex === 1 ? '📐' : '📊'}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="font-bold text-duo-gray-900">
                                            {unit.title[language] || unit.title.id}
                                        </h2>
                                        <p className="text-sm text-duo-gray-500">
                                            {unit.description[language] || unit.description.id}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1 h-2 bg-duo-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-duo-green rounded-full transition-all"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-duo-gray-500">
                                                {completedCount}/{unit.lessons.length}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`text-2xl transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>

                                {/* Lessons */}
                                {isExpanded && (
                                    <div className="mt-6 space-y-4">
                                        <div className="flex flex-wrap justify-center gap-4 py-4">
                                            {unit.lessons.map((lesson, lessonIndex) => (
                                                <div key={lesson.id} className="flex flex-col items-center gap-2">
                                                    {/* Connector line */}
                                                    {lessonIndex > 0 && (
                                                        <div className={`w-px h-4 ${lesson.status !== 'locked' ? 'bg-duo-green' : 'bg-duo-gray-300'
                                                            }`} />
                                                    )}

                                                    {/* Lesson Node */}
                                                    <button
                                                        onClick={() => handleLessonClick(lesson.id, lesson.status)}
                                                        disabled={lesson.status === 'locked'}
                                                        className={`lesson-node ${lesson.status === 'completed' ? 'lesson-node-complete' :
                                                                lesson.status === 'active' ? 'lesson-node-active' :
                                                                    'lesson-node-locked'
                                                            }`}
                                                    >
                                                        {lesson.status === 'completed' ? '✓' : lesson.icon}
                                                    </button>

                                                    {/* Lesson Title */}
                                                    <p className={`text-xs font-semibold text-center max-w-[80px] ${lesson.status === 'locked' ? 'text-duo-gray-400' : 'text-duo-gray-700'
                                                        }`}>
                                                        {lesson.title[language] || lesson.title.id}
                                                    </p>

                                                    {/* XP Badge */}
                                                    <span className={`badge text-[10px] py-0.5 px-2 ${lesson.status === 'locked' ? 'bg-duo-gray-200 text-duo-gray-500' : 'badge-xp'
                                                        }`}>
                                                        +{lesson.xp} XP
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Coming Soon Banner */}
                <div className="mt-8 card bg-gradient-to-r from-duo-purple/10 to-duo-blue/10 border-2 border-duo-purple/20 text-center">
                    <p className="text-4xl mb-2">🚀</p>
                    <p className="font-bold text-duo-gray-900">
                        {language === 'id' ? 'Lebih banyak pelajaran segera hadir!' : 'More lessons coming soon!'}
                    </p>
                    <p className="text-sm text-duo-gray-500">
                        {language === 'id' ? 'Selesaikan yang ada dulu untuk unlock yang baru.' : 'Complete current lessons to unlock new ones.'}
                    </p>
                </div>
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-duo-gray-200 px-4 py-2">
                <div className="flex justify-around max-w-md mx-auto">
                    <NavItem emoji="🏠" label={t('nav.home')} onClick={() => router.push('/student/dashboard')} />
                    <NavItem emoji="📚" label={t('nav.learn')} active onClick={() => { }} />
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
