'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { quizService, classService, assignmentService, AssignmentData, QuizData, ClassData } from '@/lib/db';

export default function TeacherAssignmentPage() {
    const router = useRouter();
    const { user, isTeacher, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();

    const [assignments, setAssignments] = useState<AssignmentData[]>([]);
    const [quizzes, setQuizzes] = useState<QuizData[]>([]);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [dueDate, setDueDate] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [quizData, classData, assignmentData] = await Promise.all([
                    quizService.getAll(user?.id),
                    classService.getAll(user?.id),
                    user?.id ? assignmentService.getByTeacher(user.id) : assignmentService.getAll()
                ]);
                setQuizzes(quizData);
                setClasses(classData);
                setAssignments(assignmentData);
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchData();
    }, [user]);

    // Redirect if not teacher
    useEffect(() => {
        if (!authLoading && (!user || !isTeacher)) {
            router.push('/login');
        }
    }, [user, isTeacher, authLoading, router]);

    if (authLoading || !user || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    const handleCreateAssignment = async () => {
        if (!selectedQuiz || !selectedClass || !dueDate) {
            alert(language === 'id' ? 'Lengkapi semua field!' : 'Please fill all fields!');
            return;
        }

        const quiz = quizzes.find(q => q.id === selectedQuiz);
        const classInfo = classes.find(c => c.id === selectedClass);

        if (!quiz || !classInfo) return;

        const newAssignment: AssignmentData = {
            id: `assignment-${Date.now()}`,
            quizId: selectedQuiz,
            quizTitle: quiz.title,
            classId: selectedClass,
            className: classInfo.name,
            dueDate,
            status: 'active',
            submissionCount: 0,
            totalStudents: classInfo.studentIds?.length || 0,
            createdBy: user.id,
            createdAt: new Date().toISOString().split('T')[0],
        };

        await assignmentService.create(newAssignment);
        setAssignments([newAssignment, ...assignments]);
        setIsCreateModalOpen(false);
        setSelectedQuiz('');
        setSelectedClass('');
        setDueDate('');
    };

    const handleCompleteAssignment = async (id: string) => {
        await assignmentService.update(id, { status: 'completed' });
        setAssignments(prev => prev.map(a =>
            a.id === id ? { ...a, status: 'completed' } : a
        ));
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
                                                onClick={() => handleCompleteAssignment(assignment.id)}
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
                                    {quizzes.map(quiz => (
                                        <option key={quiz.id} value={quiz.id}>
                                            {quiz.title} ({quiz.questions.length} soal)
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
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name} ({cls.studentIds?.length || 0} siswa)
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
