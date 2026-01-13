'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

// Mock analytics data
interface StudentAnalytics {
    id: string;
    name: string;
    avatar: string;
    classId: string;
    xp: number;
    level: number;
    streak: number;
    quizzesCompleted: number;
    averageScore: number;
    aiHintsUsed: number;
    timeSpentMinutes: number;
    strengths: string[];
    weaknesses: string[];
    lastActive: string;
}

interface ClassAnalytics {
    id: string;
    name: string;
    grade: number;
    studentCount: number;
    averageScore: number;
    averageXp: number;
    activeStudents: number;
    topPerformers: string[];
    needsHelp: string[];
}

interface SubjectPerformance {
    subject: string;
    averageScore: number;
    questionsAttempted: number;
    correctRate: number;
}

// Mock data
const MOCK_STUDENTS: StudentAnalytics[] = [
    { id: 's1', name: 'Budi Santoso', avatar: '👦', classId: 'c1', xp: 2450, level: 8, streak: 12, quizzesCompleted: 45, averageScore: 82, aiHintsUsed: 34, timeSpentMinutes: 420, strengths: ['Aljabar', 'Geometri'], weaknesses: ['Statistika'], lastActive: '2026-01-13T10:30:00Z' },
    { id: 's2', name: 'Siti Aminah', avatar: '👧', classId: 'c1', xp: 3200, level: 10, streak: 21, quizzesCompleted: 62, averageScore: 91, aiHintsUsed: 18, timeSpentMinutes: 580, strengths: ['Kalkulus', 'Aljabar'], weaknesses: [], lastActive: '2026-01-13T09:15:00Z' },
    { id: 's3', name: 'Andi Pratama', avatar: '👦', classId: 'c1', xp: 1200, level: 5, streak: 3, quizzesCompleted: 28, averageScore: 65, aiHintsUsed: 78, timeSpentMinutes: 310, strengths: [], weaknesses: ['Aljabar', 'Geometri'], lastActive: '2026-01-12T14:00:00Z' },
    { id: 's4', name: 'Dewi Kartika', avatar: '👧', classId: 'c1', xp: 2100, level: 7, streak: 8, quizzesCompleted: 38, averageScore: 77, aiHintsUsed: 45, timeSpentMinutes: 390, strengths: ['Statistika'], weaknesses: ['Kalkulus'], lastActive: '2026-01-13T11:00:00Z' },
    { id: 's5', name: 'Rudi Hermawan', avatar: '👦', classId: 'c2', xp: 1800, level: 6, streak: 5, quizzesCompleted: 32, averageScore: 72, aiHintsUsed: 52, timeSpentMinutes: 350, strengths: ['Geometri'], weaknesses: ['Aljabar'], lastActive: '2026-01-13T08:30:00Z' },
];

const MOCK_CLASSES: ClassAnalytics[] = [
    { id: 'c1', name: 'Kelas 9A', grade: 9, studentCount: 32, averageScore: 79, averageXp: 2237, activeStudents: 28, topPerformers: ['Siti Aminah', 'Budi Santoso'], needsHelp: ['Andi Pratama'] },
    { id: 'c2', name: 'Kelas 9B', grade: 9, studentCount: 30, averageScore: 74, averageXp: 1800, activeStudents: 25, topPerformers: ['Rudi Hermawan'], needsHelp: [] },
];

const MOCK_SUBJECT_PERFORMANCE: SubjectPerformance[] = [
    { subject: 'Aljabar', averageScore: 76, questionsAttempted: 450, correctRate: 72 },
    { subject: 'Geometri', averageScore: 81, questionsAttempted: 380, correctRate: 78 },
    { subject: 'Statistika', averageScore: 68, questionsAttempted: 220, correctRate: 65 },
    { subject: 'Kalkulus', averageScore: 72, questionsAttempted: 180, correctRate: 68 },
];

export default function TeacherAnalyticsPage() {
    const router = useRouter();
    const { user, isTeacher, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();

    const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'subjects'>('overview');
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [selectedStudent, setSelectedStudent] = useState<StudentAnalytics | null>(null);

    const filteredStudents = selectedClass === 'all'
        ? MOCK_STUDENTS
        : MOCK_STUDENTS.filter(s => s.classId === selectedClass);

    const overallStats = useMemo(() => ({
        totalStudents: MOCK_STUDENTS.length,
        activeToday: MOCK_STUDENTS.filter(s => s.lastActive.startsWith('2026-01-13')).length,
        averageScore: Math.round(MOCK_STUDENTS.reduce((acc, s) => acc + s.averageScore, 0) / MOCK_STUDENTS.length),
        totalXp: MOCK_STUDENTS.reduce((acc, s) => acc + s.xp, 0),
        needsAttention: MOCK_STUDENTS.filter(s => s.averageScore < 70).length,
    }), []);

    // Auth check
    useEffect(() => {
        if (!authLoading && !isTeacher) {
            router.push('/login?role=teacher');
        }
    }, [isTeacher, authLoading, router]);

    if (authLoading || !isTeacher) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-duo-green';
        if (score >= 60) return 'text-duo-yellow';
        return 'text-duo-red';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-duo-green';
        if (score >= 60) return 'bg-duo-yellow';
        return 'bg-duo-red';
    };

    return (
        <div className="min-h-screen bg-duo-gray-100">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r-2 border-duo-gray-200 p-6 hidden lg:block">
                <div className="flex items-center gap-3 mb-8">
                    <Image src="/icon.png" alt="LMS YPP" width={40} height={40} className="rounded-lg" />
                    <span className="font-extrabold text-duo-gray-900 text-xl">LMS YPP</span>
                </div>
                <nav className="space-y-2">
                    <button onClick={() => router.push('/teacher/dashboard')} className="w-full text-left px-4 py-2 rounded-lg text-duo-gray-600 hover:bg-duo-gray-100 flex items-center gap-3">
                        <span>📊</span> Dashboard
                    </button>
                    <button className="w-full text-left px-4 py-2 rounded-lg bg-duo-blue/10 text-duo-blue font-bold flex items-center gap-3">
                        <span>📈</span> {language === 'id' ? 'Analitik' : 'Analytics'}
                    </button>
                    <button onClick={() => router.push('/teacher/content')} className="w-full text-left px-4 py-2 rounded-lg text-duo-gray-600 hover:bg-duo-gray-100 flex items-center gap-3">
                        <span>📝</span> Content
                    </button>
                    <button onClick={() => router.push('/teacher/tournaments')} className="w-full text-left px-4 py-2 rounded-lg text-duo-gray-600 hover:bg-duo-gray-100 flex items-center gap-3">
                        <span>🏆</span> Tournaments
                    </button>
                    <button onClick={() => router.push('/teacher/exam-review')} className="w-full text-left px-4 py-2 rounded-lg text-duo-gray-600 hover:bg-duo-gray-100 flex items-center gap-3">
                        <span>🚨</span> Review
                    </button>
                </nav>
            </aside>

            {/* Main */}
            <main className="lg:ml-64 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-extrabold text-duo-gray-900">
                            📈 {language === 'id' ? 'Analitik & Performa' : 'Analytics & Performance'}
                        </h1>
                        <p className="text-duo-gray-500">
                            {language === 'id' ? 'Pantau kemajuan siswa dan identifikasi area perbaikan' : 'Monitor student progress and identify improvement areas'}
                        </p>
                    </div>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="px-4 py-2 border-2 border-duo-gray-200 rounded-lg"
                    >
                        <option value="all">{language === 'id' ? 'Semua Kelas' : 'All Classes'}</option>
                        {MOCK_CLASSES.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { id: 'overview', label: language === 'id' ? '📊 Ringkasan' : '📊 Overview' },
                        { id: 'students', label: language === 'id' ? '👥 Siswa' : '👥 Students' },
                        { id: 'subjects', label: language === 'id' ? '📚 Mata Pelajaran' : '📚 Subjects' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === tab.id
                                ? 'bg-duo-blue text-white'
                                : 'bg-white text-duo-gray-600 hover:bg-duo-gray-100'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="card bg-gradient-to-br from-duo-blue to-duo-purple text-white">
                                <div className="text-3xl mb-2">👥</div>
                                <div className="text-3xl font-bold">{overallStats.totalStudents}</div>
                                <div className="text-sm opacity-80">{language === 'id' ? 'Total Siswa' : 'Total Students'}</div>
                            </div>
                            <div className="card bg-gradient-to-br from-duo-green to-emerald-500 text-white">
                                <div className="text-3xl mb-2">✅</div>
                                <div className="text-3xl font-bold">{overallStats.activeToday}</div>
                                <div className="text-sm opacity-80">{language === 'id' ? 'Aktif Hari Ini' : 'Active Today'}</div>
                            </div>
                            <div className="card bg-gradient-to-br from-duo-yellow to-orange-500 text-white">
                                <div className="text-3xl mb-2">📊</div>
                                <div className="text-3xl font-bold">{overallStats.averageScore}%</div>
                                <div className="text-sm opacity-80">{language === 'id' ? 'Rata-rata Skor' : 'Average Score'}</div>
                            </div>
                            <div className="card bg-gradient-to-br from-duo-red to-pink-500 text-white">
                                <div className="text-3xl mb-2">⚠️</div>
                                <div className="text-3xl font-bold">{overallStats.needsAttention}</div>
                                <div className="text-sm opacity-80">{language === 'id' ? 'Perlu Perhatian' : 'Need Attention'}</div>
                            </div>
                        </div>

                        {/* Class Performance */}
                        <div className="card">
                            <h2 className="text-lg font-bold text-duo-gray-900 mb-4">
                                🏫 {language === 'id' ? 'Performa Kelas' : 'Class Performance'}
                            </h2>
                            <div className="space-y-4">
                                {MOCK_CLASSES.map(cls => (
                                    <div key={cls.id} className="p-4 bg-duo-gray-100 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h3 className="font-bold">{cls.name}</h3>
                                                <p className="text-sm text-duo-gray-500">{cls.studentCount} siswa • {cls.activeStudents} aktif</p>
                                            </div>
                                            <div className={`text-2xl font-bold ${getScoreColor(cls.averageScore)}`}>
                                                {cls.averageScore}%
                                            </div>
                                        </div>
                                        <div className="h-2 bg-duo-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full ${getScoreBg(cls.averageScore)}`} style={{ width: `${cls.averageScore}%` }} />
                                        </div>
                                        <div className="flex gap-4 mt-3 text-sm">
                                            <div>
                                                <span className="text-duo-gray-500">🌟 Top: </span>
                                                <span className="font-semibold">{cls.topPerformers.join(', ') || '-'}</span>
                                            </div>
                                            {cls.needsHelp.length > 0 && (
                                                <div>
                                                    <span className="text-duo-red">⚠️ Perlu bantuan: </span>
                                                    <span className="font-semibold">{cls.needsHelp.join(', ')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Students Tab */}
                {activeTab === 'students' && (
                    <div className="card">
                        <h2 className="text-lg font-bold text-duo-gray-900 mb-4">
                            👥 {language === 'id' ? 'Daftar Siswa' : 'Student List'}
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-duo-gray-500 border-b border-duo-gray-200">
                                        <th className="pb-3 font-semibold">{language === 'id' ? 'Siswa' : 'Student'}</th>
                                        <th className="pb-3 font-semibold">Level</th>
                                        <th className="pb-3 font-semibold">XP</th>
                                        <th className="pb-3 font-semibold">🔥</th>
                                        <th className="pb-3 font-semibold">{language === 'id' ? 'Skor' : 'Score'}</th>
                                        <th className="pb-3 font-semibold">{language === 'id' ? 'Kuis' : 'Quizzes'}</th>
                                        <th className="pb-3 font-semibold">AI Hints</th>
                                        <th className="pb-3 font-semibold"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(student => (
                                        <tr key={student.id} className="border-b border-duo-gray-100 hover:bg-duo-gray-50">
                                            <td className="py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{student.avatar}</span>
                                                    <div>
                                                        <div className="font-semibold">{student.name}</div>
                                                        <div className="text-xs text-duo-gray-400">
                                                            {language === 'id' ? 'Aktif' : 'Active'}: {new Date(student.lastActive).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 font-bold">{student.level}</td>
                                            <td className="py-3">{student.xp.toLocaleString()}</td>
                                            <td className="py-3">{student.streak}</td>
                                            <td className="py-3">
                                                <span className={`font-bold ${getScoreColor(student.averageScore)}`}>
                                                    {student.averageScore}%
                                                </span>
                                            </td>
                                            <td className="py-3">{student.quizzesCompleted}</td>
                                            <td className="py-3">
                                                <span className={student.aiHintsUsed > 50 ? 'text-duo-yellow' : ''}>
                                                    {student.aiHintsUsed}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <button
                                                    onClick={() => setSelectedStudent(student)}
                                                    className="text-duo-blue hover:underline text-sm"
                                                >
                                                    {language === 'id' ? 'Detail' : 'Details'} →
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Subjects Tab */}
                {activeTab === 'subjects' && (
                    <div className="card">
                        <h2 className="text-lg font-bold text-duo-gray-900 mb-4">
                            📚 {language === 'id' ? 'Performa per Mata Pelajaran' : 'Performance by Subject'}
                        </h2>
                        <div className="space-y-4">
                            {MOCK_SUBJECT_PERFORMANCE.map(subj => (
                                <div key={subj.subject} className="p-4 bg-duo-gray-100 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold">{subj.subject}</h3>
                                        <div className={`text-xl font-bold ${getScoreColor(subj.averageScore)}`}>
                                            {subj.averageScore}%
                                        </div>
                                    </div>
                                    <div className="h-3 bg-duo-gray-200 rounded-full overflow-hidden mb-2">
                                        <div className={`h-full ${getScoreBg(subj.averageScore)}`} style={{ width: `${subj.averageScore}%` }} />
                                    </div>
                                    <div className="flex gap-6 text-sm text-duo-gray-500">
                                        <span>📝 {subj.questionsAttempted} soal dijawab</span>
                                        <span>✅ {subj.correctRate}% benar</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Student Detail Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-slide-up">
                        <div className="p-6 border-b border-duo-gray-200 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-4xl">{selectedStudent.avatar}</span>
                                <div>
                                    <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                                    <p className="text-sm text-duo-gray-500">Level {selectedStudent.level} • {selectedStudent.xp} XP</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="text-duo-gray-400 hover:text-duo-gray-600 text-2xl">✕</button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-3 bg-duo-gray-100 rounded-xl">
                                    <div className="text-2xl font-bold">{selectedStudent.streak}</div>
                                    <div className="text-xs text-duo-gray-500">🔥 Streak</div>
                                </div>
                                <div className="p-3 bg-duo-gray-100 rounded-xl">
                                    <div className={`text-2xl font-bold ${getScoreColor(selectedStudent.averageScore)}`}>{selectedStudent.averageScore}%</div>
                                    <div className="text-xs text-duo-gray-500">📊 Skor</div>
                                </div>
                                <div className="p-3 bg-duo-gray-100 rounded-xl">
                                    <div className="text-2xl font-bold">{selectedStudent.quizzesCompleted}</div>
                                    <div className="text-xs text-duo-gray-500">📝 Kuis</div>
                                </div>
                            </div>

                            {/* Time & AI */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-duo-blue/10 rounded-xl">
                                    <div className="text-lg font-bold text-duo-blue">{Math.round(selectedStudent.timeSpentMinutes / 60)}h {selectedStudent.timeSpentMinutes % 60}m</div>
                                    <div className="text-xs text-duo-gray-500">⏱️ Waktu belajar</div>
                                </div>
                                <div className="p-3 bg-duo-purple/10 rounded-xl">
                                    <div className="text-lg font-bold text-duo-purple">{selectedStudent.aiHintsUsed}</div>
                                    <div className="text-xs text-duo-gray-500">💡 AI Hints dipakai</div>
                                </div>
                            </div>

                            {/* Strengths */}
                            {selectedStudent.strengths.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-duo-gray-700 mb-2">✅ {language === 'id' ? 'Kekuatan' : 'Strengths'}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStudent.strengths.map(s => (
                                            <span key={s} className="px-3 py-1 bg-duo-green/20 text-duo-green rounded-full text-sm font-semibold">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Weaknesses */}
                            {selectedStudent.weaknesses.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-duo-gray-700 mb-2">⚠️ {language === 'id' ? 'Perlu Ditingkatkan' : 'Needs Improvement'}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStudent.weaknesses.map(w => (
                                            <span key={w} className="px-3 py-1 bg-duo-red/20 text-duo-red rounded-full text-sm font-semibold">{w}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
