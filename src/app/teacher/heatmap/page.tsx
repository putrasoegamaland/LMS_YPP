'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

// Mock data for the heatmap
interface StudentMastery {
    id: string;
    name: string;
    avatar: string;
    classId: string;
    topics: Record<string, number>; // topic -> score (0-100)
}

interface Topic {
    id: string;
    name: string;
    subject: string;
}

const TOPICS: Topic[] = [
    { id: 'aljabar', name: 'Aljabar', subject: 'matematika' },
    { id: 'geometri', name: 'Geometri', subject: 'matematika' },
    { id: 'statistika', name: 'Statistika', subject: 'matematika' },
    { id: 'trigonometri', name: 'Trigonometri', subject: 'matematika' },
    { id: 'kalkulus', name: 'Kalkulus', subject: 'matematika' },
    { id: 'lingkaran', name: 'Lingkaran', subject: 'matematika' },
    { id: 'persamaan_linear', name: 'Persamaan Linear', subject: 'matematika' },
    { id: 'bangun_ruang', name: 'Bangun Ruang', subject: 'matematika' },
];

const MOCK_STUDENTS: StudentMastery[] = [
    { id: 's1', name: 'Budi Santoso', avatar: '👦', classId: 'c1', topics: { aljabar: 85, geometri: 72, statistika: 45, trigonometri: 60, kalkulus: 55, lingkaran: 78, persamaan_linear: 90, bangun_ruang: 65 } },
    { id: 's2', name: 'Siti Aminah', avatar: '👧', classId: 'c1', topics: { aljabar: 95, geometri: 88, statistika: 82, trigonometri: 75, kalkulus: 70, lingkaran: 92, persamaan_linear: 98, bangun_ruang: 85 } },
    { id: 's3', name: 'Andi Pratama', avatar: '👦', classId: 'c1', topics: { aljabar: 45, geometri: 52, statistika: 38, trigonometri: 35, kalkulus: 28, lingkaran: 55, persamaan_linear: 60, bangun_ruang: 42 } },
    { id: 's4', name: 'Dewi Kartika', avatar: '👧', classId: 'c1', topics: { aljabar: 78, geometri: 65, statistika: 88, trigonometri: 55, kalkulus: 48, lingkaran: 70, persamaan_linear: 82, bangun_ruang: 60 } },
    { id: 's5', name: 'Rudi Hermawan', avatar: '👦', classId: 'c1', topics: { aljabar: 62, geometri: 75, statistika: 55, trigonometri: 68, kalkulus: 45, lingkaran: 72, persamaan_linear: 70, bangun_ruang: 80 } },
    { id: 's6', name: 'Fitri Wulandari', avatar: '👧', classId: 'c1', topics: { aljabar: 88, geometri: 92, statistika: 75, trigonometri: 82, kalkulus: 78, lingkaran: 85, persamaan_linear: 95, bangun_ruang: 88 } },
    { id: 's7', name: 'Agus Prasetyo', avatar: '👦', classId: 'c1', topics: { aljabar: 55, geometri: 48, statistika: 62, trigonometri: 42, kalkulus: 35, lingkaran: 58, persamaan_linear: 65, bangun_ruang: 52 } },
    { id: 's8', name: 'Maya Sari', avatar: '👧', classId: 'c1', topics: { aljabar: 72, geometri: 68, statistika: 70, trigonometri: 65, kalkulus: 58, lingkaran: 75, persamaan_linear: 78, bangun_ruang: 72 } },
];

const CLASSES = [
    { id: 'c1', name: 'Kelas 9A', grade: 9 },
    { id: 'c2', name: 'Kelas 9B', grade: 9 },
];

export default function TeacherHeatmapPage() {
    const router = useRouter();
    const { isTeacher, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();

    const [selectedClass, setSelectedClass] = useState('c1');
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'average'>('name');

    const filteredStudents = MOCK_STUDENTS.filter(s => s.classId === selectedClass);

    const sortedStudents = useMemo(() => {
        return [...filteredStudents].sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            const avgA = Object.values(a.topics).reduce((sum, v) => sum + v, 0) / Object.values(a.topics).length;
            const avgB = Object.values(b.topics).reduce((sum, v) => sum + v, 0) / Object.values(b.topics).length;
            return avgB - avgA;
        });
    }, [filteredStudents, sortBy]);

    const topicAverages = useMemo(() => {
        const avgs: Record<string, number> = {};
        for (const topic of TOPICS) {
            const scores = filteredStudents.map(s => s.topics[topic.id] || 0);
            avgs[topic.id] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        }
        return avgs;
    }, [filteredStudents]);

    if (authLoading || !isTeacher) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const getHeatColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-400';
        if (score >= 40) return 'bg-orange-400';
        return 'bg-red-500';
    };

    const getTextColor = (score: number) => {
        if (score >= 80) return 'text-green-700';
        if (score >= 60) return 'text-yellow-700';
        if (score >= 40) return 'text-orange-700';
        return 'text-red-700';
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
                    <button onClick={() => router.push('/teacher/analytics')} className="w-full text-left px-4 py-2 rounded-lg text-duo-gray-600 hover:bg-duo-gray-100 flex items-center gap-3">
                        <span>📈</span> Analytics
                    </button>
                    <button className="w-full text-left px-4 py-2 rounded-lg bg-duo-orange/10 text-duo-orange font-bold flex items-center gap-3">
                        <span>🔥</span> {language === 'id' ? 'Heatmap' : 'Heatmap'}
                    </button>
                    <button onClick={() => router.push('/teacher/content')} className="w-full text-left px-4 py-2 rounded-lg text-duo-gray-600 hover:bg-duo-gray-100 flex items-center gap-3">
                        <span>📝</span> Content
                    </button>
                </nav>
            </aside>

            {/* Main */}
            <main className="lg:ml-64 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-duo-gray-900">
                            🔥 {language === 'id' ? 'Heatmap Kelas' : 'Class Heatmap'}
                        </h1>
                        <p className="text-duo-gray-500">
                            {language === 'id' ? 'Visualisasi penguasaan topik per siswa' : 'Topic mastery visualization per student'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="px-4 py-2 border-2 border-duo-gray-200 rounded-lg"
                        >
                            {CLASSES.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-4 py-2 border-2 border-duo-gray-200 rounded-lg"
                        >
                            <option value="name">{language === 'id' ? 'Urut: Nama' : 'Sort: Name'}</option>
                            <option value="average">{language === 'id' ? 'Urut: Rata-rata' : 'Sort: Average'}</option>
                        </select>
                    </div>
                </div>

                {/* Legend */}
                <div className="card mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-6">
                            <span className="font-semibold text-duo-gray-700">{language === 'id' ? 'Legenda:' : 'Legend:'}</span>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-green-500"></div>
                                <span className="text-sm">80-100%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-yellow-400"></div>
                                <span className="text-sm">60-79%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-orange-400"></div>
                                <span className="text-sm">40-59%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-red-500"></div>
                                <span className="text-sm">0-39%</span>
                            </div>
                        </div>
                        <div className="text-sm text-duo-gray-500">
                            💡 {language === 'id' ? 'Klik sel untuk detail' : 'Click cell for details'}
                        </div>
                    </div>
                </div>

                {/* Heatmap Table */}
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-duo-gray-100">
                                    <th className="p-3 text-left font-bold text-duo-gray-700 sticky left-0 bg-duo-gray-100 z-10">
                                        {language === 'id' ? 'Siswa' : 'Student'}
                                    </th>
                                    {TOPICS.map(topic => (
                                        <th
                                            key={topic.id}
                                            className={`p-3 text-center font-semibold text-sm cursor-pointer transition-colors ${selectedTopic === topic.id ? 'bg-duo-blue/20' : ''
                                                }`}
                                            onClick={() => setSelectedTopic(selectedTopic === topic.id ? null : topic.id)}
                                        >
                                            <div>{topic.name}</div>
                                            <div className={`text-xs mt-1 ${getTextColor(topicAverages[topic.id])}`}>
                                                Avg: {topicAverages[topic.id]}%
                                            </div>
                                        </th>
                                    ))}
                                    <th className="p-3 text-center font-bold">Avg</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedStudents.map(student => {
                                    const avg = Math.round(
                                        Object.values(student.topics).reduce((a, b) => a + b, 0) / Object.values(student.topics).length
                                    );
                                    return (
                                        <tr key={student.id} className="border-t border-duo-gray-200 hover:bg-duo-gray-50">
                                            <td className="p-3 sticky left-0 bg-white z-10">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{student.avatar}</span>
                                                    <span className="font-semibold text-sm">{student.name}</span>
                                                </div>
                                            </td>
                                            {TOPICS.map(topic => {
                                                const score = student.topics[topic.id] || 0;
                                                return (
                                                    <td
                                                        key={topic.id}
                                                        className={`p-2 text-center ${selectedTopic === topic.id ? 'ring-2 ring-duo-blue ring-inset' : ''
                                                            }`}
                                                    >
                                                        <div
                                                            className={`w-12 h-10 mx-auto rounded-lg flex items-center justify-center font-bold text-white text-sm ${getHeatColor(score)}`}
                                                            title={`${student.name} - ${topic.name}: ${score}%`}
                                                        >
                                                            {score}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className="p-3 text-center">
                                                <span className={`font-bold ${getTextColor(avg)}`}>{avg}%</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-duo-gray-100 border-t-2 border-duo-gray-300">
                                    <td className="p-3 font-bold sticky left-0 bg-duo-gray-100 z-10">
                                        {language === 'id' ? 'Rata-rata Kelas' : 'Class Average'}
                                    </td>
                                    {TOPICS.map(topic => (
                                        <td key={topic.id} className="p-3 text-center">
                                            <span className={`font-bold ${getTextColor(topicAverages[topic.id])}`}>
                                                {topicAverages[topic.id]}%
                                            </span>
                                        </td>
                                    ))}
                                    <td className="p-3 text-center">
                                        <span className="font-bold text-duo-blue">
                                            {Math.round(Object.values(topicAverages).reduce((a, b) => a + b, 0) / Object.values(topicAverages).length)}%
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="card">
                        <h3 className="font-bold text-duo-gray-900 mb-3">
                            ⚠️ {language === 'id' ? 'Topik Perlu Perhatian' : 'Topics Need Attention'}
                        </h3>
                        <div className="space-y-2">
                            {TOPICS.filter(t => topicAverages[t.id] < 60)
                                .sort((a, b) => topicAverages[a.id] - topicAverages[b.id])
                                .map(topic => (
                                    <div key={topic.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                                        <span className="font-semibold">{topic.name}</span>
                                        <span className="text-red-600 font-bold">{topicAverages[topic.id]}%</span>
                                    </div>
                                ))}
                            {TOPICS.filter(t => topicAverages[t.id] < 60).length === 0 && (
                                <p className="text-duo-gray-500 text-center py-4">
                                    ✅ {language === 'id' ? 'Semua topik di atas 60%!' : 'All topics above 60%!'}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="font-bold text-duo-gray-900 mb-3">
                            🎯 {language === 'id' ? 'Siswa Perlu Bantuan' : 'Students Need Help'}
                        </h3>
                        <div className="space-y-2">
                            {sortedStudents
                                .filter(s => {
                                    const avg = Object.values(s.topics).reduce((a, b) => a + b, 0) / Object.values(s.topics).length;
                                    return avg < 60;
                                })
                                .map(student => {
                                    const avg = Math.round(Object.values(student.topics).reduce((a, b) => a + b, 0) / Object.values(student.topics).length);
                                    return (
                                        <div key={student.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span>{student.avatar}</span>
                                                <span className="font-semibold">{student.name}</span>
                                            </div>
                                            <span className="text-orange-600 font-bold">{avg}%</span>
                                        </div>
                                    );
                                })}
                            {sortedStudents.filter(s => Object.values(s.topics).reduce((a, b) => a + b, 0) / Object.values(s.topics).length < 60).length === 0 && (
                                <p className="text-duo-gray-500 text-center py-4">
                                    ✅ {language === 'id' ? 'Semua siswa di atas 60%!' : 'All students above 60%!'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
