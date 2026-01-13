'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Types
interface Quiz {
    id: string;
    title: string;
    subject: string;
    questionCount: number;
    isExamMode: boolean;
    createdAt: string;
}

interface ClassInfo {
    id: string;
    name: string;
    studentCount: number;
}

interface Assignment {
    id: string;
    quizId: string;
    quizTitle: string;
    classId: string;
    className: string;
    dueDate: string;
    status: 'active' | 'completed' | 'draft';
    submissionCount: number;
    totalStudents: number;
    createdAt: string;
}

// Mock data
const MOCK_QUIZZES: Quiz[] = [
    { id: 'q1', title: 'Kuis Aljabar Bab 1', subject: 'Matematika', questionCount: 10, isExamMode: false, createdAt: '2026-01-10' },
    { id: 'q2', title: 'UTS Matematika', subject: 'Matematika', questionCount: 25, isExamMode: true, createdAt: '2026-01-08' },
    { id: 'q3', title: 'Latihan IPA: Sistem Pencernaan', subject: 'IPA', questionCount: 15, isExamMode: false, createdAt: '2026-01-07' },
    { id: 'q4', title: 'Kuis Farmasi Dasar', subject: 'Farmasi', questionCount: 12, isExamMode: false, createdAt: '2026-01-12' },
];

const MOCK_CLASSES: ClassInfo[] = [
    { id: 'c1', name: 'Kelas 9A', studentCount: 32 },
    { id: 'c2', name: 'Kelas 9B', studentCount: 30 },
    { id: 'c3', name: 'Kelas 10 IPA 1', studentCount: 28 },
];

const MOCK_ASSIGNMENTS: Assignment[] = [
    { id: 'a1', quizId: 'q1', quizTitle: 'Kuis Aljabar Bab 1', classId: 'c1', className: 'Kelas 9A', dueDate: '2026-01-15', status: 'active', submissionCount: 18, totalStudents: 32, createdAt: '2026-01-10' },
    { id: 'a2', quizId: 'q2', quizTitle: 'UTS Matematika', classId: 'c1', className: 'Kelas 9A', dueDate: '2026-01-20', status: 'active', submissionCount: 5, totalStudents: 32, createdAt: '2026-01-12' },
    { id: 'a3', quizId: 'q3', quizTitle: 'Latihan IPA: Sistem Pencernaan', classId: 'c2', className: 'Kelas 9B', dueDate: '2026-01-14', status: 'completed', submissionCount: 30, totalStudents: 30, createdAt: '2026-01-07' },
];

export default function TeacherAssignmentPage() {
    const router = useRouter();
    const { user, isTeacher, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();

    const [assignments, setAssignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [dueDate, setDueDate] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

    // Redirect if not teacher
    useEffect(() => {
        if (!authLoading && (!user || !isTeacher)) {
            router.push('/login');
        }
    }, [user, isTeacher, authLoading, router]);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    const handleCreateAssignment = () => {
        if (!selectedQuiz || !selectedClass || !dueDate) {
            alert(language === 'id' ? 'Lengkapi semua field!' : 'Please fill all fields!');
            return;
        }

        const quiz = MOCK_QUIZZES.find(q => q.id === selectedQuiz);
        const classInfo = MOCK_CLASSES.find(c => c.id === selectedClass);

        if (!quiz || !classInfo) return;

        const newAssignment: Assignment = {
            id: `a-${Date.now()}`,
            quizId: selectedQuiz,
            quizTitle: quiz.title,
            classId: selectedClass,
            className: classInfo.name,
            dueDate,
            status: 'active',
            submissionCount: 0,
            totalStudents: classInfo.studentCount,
            createdAt: new Date().toISOString().split('T')[0],
        };

        setAssignments([newAssignment, ...assignments]);
        setIsCreateModalOpen(false);
        setSelectedQuiz('');
        setSelectedClass('');
        setDueDate('');
    };

    const filteredAssignments = assignments.filter(a =>
        filterStatus === 'all' || a.status === filterStatus
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-duo-blue/20 text-duo-blue';
            case 'completed': return 'bg-duo-green/20 text-duo-green';
            case 'draft': return 'bg-duo-gray-300 text-duo-gray-600';
            default: return 'bg-duo-gray-200';
        }
    };

    const getProgressColor = (submitted: number, total: number) => {
        const percent = (submitted / total) * 100;
        if (percent >= 80) return 'bg-duo-green';
        if (percent >= 50) return 'bg-duo-yellow';
        return 'bg-duo-orange';
    };

    return (
        <div className="min-h-screen bg-duo-gray-100">
            {/* Header */}
            <header className="bg-white border-b-2 border-duo-gray-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/teacher/dashboard')} className="text-duo-gray-500 hover:text-duo-gray-700">
                            ← {language === 'id' ? 'Dashboard' : 'Dashboard'}
                        </button>
                        <h1 className="font-extrabold text-duo-gray-900 text-xl">
                            📋 {language === 'id' ? 'Penugasan' : 'Assignments'}
                        </h1>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn btn-primary btn-sm"
                    >
                        ➕ {language === 'id' ? 'Buat Tugas' : 'New Assignment'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="card text-center">
                        <p className="text-3xl font-bold text-duo-blue">{assignments.filter(a => a.status === 'active').length}</p>
                        <p className="text-sm text-duo-gray-500">{language === 'id' ? 'Tugas Aktif' : 'Active'}</p>
                    </div>
                    <div className="card text-center">
                        <p className="text-3xl font-bold text-duo-green">{assignments.filter(a => a.status === 'completed').length}</p>
                        <p className="text-sm text-duo-gray-500">{language === 'id' ? 'Selesai' : 'Completed'}</p>
                    </div>
                    <div className="card text-center">
                        <p className="text-3xl font-bold text-duo-purple">
                            {Math.round(assignments.reduce((acc, a) => acc + (a.submissionCount / a.totalStudents) * 100, 0) / assignments.length)}%
                        </p>
                        <p className="text-sm text-duo-gray-500">{language === 'id' ? 'Rata-rata Submit' : 'Avg Submission'}</p>
                    </div>
                </div>

                {/* Filter */}
                <div className="flex gap-2 mb-4">
                    {(['all', 'active', 'completed'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filterStatus === status
                                    ? 'bg-duo-blue text-white'
                                    : 'bg-white text-duo-gray-600 hover:bg-duo-gray-100'
                                }`}
                        >
                            {status === 'all' ? (language === 'id' ? 'Semua' : 'All') :
                                status === 'active' ? (language === 'id' ? 'Aktif' : 'Active') :
                                    (language === 'id' ? 'Selesai' : 'Completed')}
                        </button>
                    ))}
                </div>

                {/* Assignments List */}
                <div className="space-y-4">
                    {filteredAssignments.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-4xl mb-4">📭</p>
                            <p className="text-duo-gray-500">
                                {language === 'id' ? 'Belum ada tugas' : 'No assignments yet'}
                            </p>
                        </div>
                    ) : (
                        filteredAssignments.map(assignment => (
                            <div key={assignment.id} className="card">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`badge ${getStatusColor(assignment.status)}`}>
                                                {assignment.status === 'active' ? '🟢' : '✅'} {assignment.status}
                                            </span>
                                            <span className="text-xs text-duo-gray-400">
                                                {assignment.className}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-duo-gray-900 text-lg mb-1">
                                            {assignment.quizTitle}
                                        </h3>
                                        <p className="text-sm text-duo-gray-500 mb-3">
                                            📅 {language === 'id' ? 'Deadline' : 'Due'}: {assignment.dueDate}
                                        </p>

                                        {/* Progress Bar */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-3 bg-duo-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${getProgressColor(assignment.submissionCount, assignment.totalStudents)} transition-all`}
                                                    style={{ width: `${(assignment.submissionCount / assignment.totalStudents) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-duo-gray-600">
                                                {assignment.submissionCount}/{assignment.totalStudents}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <button className="btn btn-outline btn-sm">
                                            👁️ {language === 'id' ? 'Lihat' : 'View'}
                                        </button>
                                        {assignment.status === 'active' && (
                                            <button
                                                onClick={() => {
                                                    setAssignments(prev => prev.map(a =>
                                                        a.id === assignment.id ? { ...a, status: 'completed' } : a
                                                    ));
                                                }}
                                                className="btn btn-ghost btn-sm text-duo-green"
                                            >
                                                ✅
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Create Assignment Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-duo-gray-900">
                                ➕ {language === 'id' ? 'Buat Tugas Baru' : 'Create Assignment'}
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-duo-gray-400 hover:text-duo-gray-600">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Select Quiz */}
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                    📝 {language === 'id' ? 'Pilih Kuis' : 'Select Quiz'}
                                </label>
                                <select
                                    value={selectedQuiz}
                                    onChange={(e) => setSelectedQuiz(e.target.value)}
                                    className="input"
                                >
                                    <option value="">{language === 'id' ? '-- Pilih kuis --' : '-- Select quiz --'}</option>
                                    {MOCK_QUIZZES.map(quiz => (
                                        <option key={quiz.id} value={quiz.id}>
                                            {quiz.title} ({quiz.questionCount} soal)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Select Class */}
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                    🏫 {language === 'id' ? 'Pilih Kelas' : 'Select Class'}
                                </label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="input"
                                >
                                    <option value="">{language === 'id' ? '-- Pilih kelas --' : '-- Select class --'}</option>
                                    {MOCK_CLASSES.map(cls => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name} ({cls.studentCount} siswa)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                    📅 {language === 'id' ? 'Deadline' : 'Due Date'}
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="input"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="btn btn-outline flex-1"
                            >
                                {language === 'id' ? 'Batal' : 'Cancel'}
                            </button>
                            <button
                                onClick={handleCreateAssignment}
                                className="btn btn-primary flex-1"
                            >
                                ✅ {language === 'id' ? 'Buat Tugas' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
