'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { classService, studentService, ClassData, StudentData } from '@/lib/db';

const AVATARS = ['👦', '👧', '🧑', '👨', '👩', '🧒', '👶', '🧔', '👱', '🧑‍🎓'];

export default function TeacherClassesPage() {
    const router = useRouter();
    const { user, isTeacher, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();

    const [classes, setClasses] = useState<ClassData[]>([]);
    const [students, setStudents] = useState<StudentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [showCreateClass, setShowCreateClass] = useState(false);
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [showClassDetail, setShowClassDetail] = useState<ClassData | null>(null);

    // Form states
    const [newClassName, setNewClassName] = useState('');
    const [newClassGrade, setNewClassGrade] = useState(9);

    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [selectedClassForStudent, setSelectedClassForStudent] = useState('');

    // Load data
    useEffect(() => {
        async function loadData() {
            if (!user) return;
            try {
                const [classData, studentData] = await Promise.all([
                    classService.getAll(user.id),
                    studentService.getAll()
                ]);
                setClasses(classData);
                setStudents(studentData);
            } catch (error) {
                console.error('Failed to load classes:', error);
            } finally {
                setIsLoading(false);
            }
        }
        if (isTeacher) {
            loadData();
        }
    }, [user, isTeacher]);

    // Redirect if not teacher
    useEffect(() => {
        if (!authLoading && !isTeacher) {
            router.push('/login?role=teacher');
        }
    }, [authLoading, isTeacher, router]);

    if (authLoading || !isTeacher || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const handleCreateClass = async () => {
        if (!newClassName.trim() || !user) return;

        const newClass: ClassData = {
            id: `class-${Date.now()}`,
            name: newClassName,
            code: classService.generateCode(),
            grade: newClassGrade,
            teacherId: user.id || 'teacher-1',
            studentIds: [],
            createdAt: new Date().toISOString(),
        };

        await classService.create(newClass);
        setClasses([newClass, ...classes]);
        setNewClassName('');
        setShowCreateClass(false);
    };

    const handleAddStudent = async () => {
        if (!newStudentName.trim() || !selectedClassForStudent) return;

        const newStudent: StudentData = {
            id: `student-${Date.now()}`,
            name: newStudentName,
            email: newStudentEmail || undefined,
            avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
            classIds: [selectedClassForStudent],
            xp: 0,
            level: 1,
            streak: 0,
            createdAt: new Date().toISOString(),
        };

        await studentService.create(newStudent);
        await classService.addStudent(selectedClassForStudent, newStudent.id);

        setStudents([newStudent, ...students]);
        setClasses(classes.map(c =>
            c.id === selectedClassForStudent
                ? { ...c, studentIds: [...c.studentIds, newStudent.id] }
                : c
        ));

        setNewStudentName('');
        setNewStudentEmail('');
        setShowAddStudent(false);
    };

    const handleRemoveStudent = async (classId: string, studentId: string) => {
        await classService.removeStudent(classId, studentId);
        await studentService.leaveClass(studentId, classId);

        setClasses(classes.map(c =>
            c.id === classId
                ? { ...c, studentIds: c.studentIds.filter(id => id !== studentId) }
                : c
        ));

        if (showClassDetail) {
            setShowClassDetail({
                ...showClassDetail,
                studentIds: showClassDetail.studentIds.filter(id => id !== studentId)
            });
        }
    };

    const handleDeleteClass = async (classId: string) => {
        if (!confirm(language === 'id' ? 'Hapus kelas ini?' : 'Delete this class?')) return;

        await classService.delete(classId);
        setClasses(classes.filter(c => c.id !== classId));
        setShowClassDetail(null);
    };

    const getClassStudents = (classId: string) => {
        const cls = classes.find(c => c.id === classId);
        if (!cls) return [];
        return students.filter(s => cls.studentIds.includes(s.id));
    };

    return (
        <div className="min-h-screen bg-duo-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                <button onClick={() => router.push('/teacher/dashboard')} className="text-duo-gray-500 hover:text-duo-gray-700 mb-4">
                    ← {language === 'id' ? 'Kembali ke Dashboard' : 'Back to Dashboard'}
                </button>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-duo-gray-900">
                            🏫 {language === 'id' ? 'Kelola Kelas' : 'Manage Classes'}
                        </h1>
                        <p className="text-duo-gray-500">
                            {language === 'id' ? 'Buat kelas dan tambahkan siswa' : 'Create classes and add students'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowAddStudent(true)}
                            className="btn btn-secondary"
                        >
                            👤 {language === 'id' ? 'Tambah Siswa' : 'Add Student'}
                        </button>
                        <button
                            onClick={() => setShowCreateClass(true)}
                            className="btn btn-primary"
                        >
                            ➕ {language === 'id' ? 'Buat Kelas' : 'Create Class'}
                        </button>
                    </div>
                </div>

                {/* Classes Grid */}
                {classes.length === 0 ? (
                    <div className="card text-center py-16">
                        <span className="text-6xl block mb-4">🏫</span>
                        <h2 className="text-xl font-bold text-duo-gray-900 mb-2">
                            {language === 'id' ? 'Belum Ada Kelas' : 'No Classes Yet'}
                        </h2>
                        <p className="text-duo-gray-500 mb-6">
                            {language === 'id' ? 'Buat kelas pertamamu untuk mulai mengelola siswa' : 'Create your first class to start managing students'}
                        </p>
                        <button
                            onClick={() => setShowCreateClass(true)}
                            className="btn btn-primary"
                        >
                            ➕ {language === 'id' ? 'Buat Kelas Pertama' : 'Create First Class'}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map(cls => (
                            <div
                                key={cls.id}
                                className="card hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => setShowClassDetail(cls)}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-3xl">📚</span>
                                    <span className="badge bg-duo-blue/10 text-duo-blue font-mono font-bold">
                                        {cls.code}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-duo-gray-900 mb-2">{cls.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-duo-gray-500 mb-4">
                                    <span>🎓 Grade {cls.grade}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-duo-gray-600">
                                        <span className="text-lg">👥</span>
                                        <span className="font-bold">{cls.studentIds.length}</span>
                                        <span>{language === 'id' ? 'siswa' : 'students'}</span>
                                    </span>
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowClassDetail(cls);
                                        }}
                                    >
                                        {language === 'id' ? 'Lihat' : 'View'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats */}
                {classes.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                        <div className="card text-center">
                            <div className="text-3xl font-bold text-duo-blue">{classes.length}</div>
                            <div className="text-sm text-duo-gray-500">{language === 'id' ? 'Total Kelas' : 'Total Classes'}</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-3xl font-bold text-duo-green">{students.length}</div>
                            <div className="text-sm text-duo-gray-500">{language === 'id' ? 'Total Siswa' : 'Total Students'}</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-3xl font-bold text-duo-purple">
                                {classes.reduce((sum, c) => sum + c.studentIds.length, 0)}
                            </div>
                            <div className="text-sm text-duo-gray-500">{language === 'id' ? 'Siswa Terdaftar' : 'Enrolled Students'}</div>
                        </div>
                        <div className="card text-center">
                            <div className="text-3xl font-bold text-duo-yellow">
                                {Math.round(students.reduce((sum, s) => sum + s.xp, 0) / Math.max(students.length, 1))}
                            </div>
                            <div className="text-sm text-duo-gray-500">{language === 'id' ? 'Rata-rata XP' : 'Avg XP'}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Class Modal */}
            {showCreateClass && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-duo-gray-900 mb-6">
                            ➕ {language === 'id' ? 'Buat Kelas Baru' : 'Create New Class'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                    {language === 'id' ? 'Nama Kelas' : 'Class Name'}
                                </label>
                                <input
                                    type="text"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    placeholder="Kelas 9A"
                                    className="w-full px-4 py-3 border-2 border-duo-gray-200 rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                    {language === 'id' ? 'Tingkat' : 'Grade'}
                                </label>
                                <select
                                    value={newClassGrade}
                                    onChange={(e) => setNewClassGrade(Number(e.target.value))}
                                    className="w-full px-4 py-3 border-2 border-duo-gray-200 rounded-xl"
                                >
                                    {[7, 8, 9, 10, 11, 12].map(g => (
                                        <option key={g} value={g}>Grade {g}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateClass(false)}
                                className="flex-1 btn btn-ghost"
                            >
                                {language === 'id' ? 'Batal' : 'Cancel'}
                            </button>
                            <button
                                onClick={handleCreateClass}
                                disabled={!newClassName.trim()}
                                className="flex-1 btn btn-primary disabled:opacity-50"
                            >
                                {language === 'id' ? 'Buat Kelas' : 'Create Class'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {showAddStudent && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-duo-gray-900 mb-6">
                            👤 {language === 'id' ? 'Tambah Siswa Baru' : 'Add New Student'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                    {language === 'id' ? 'Nama Siswa' : 'Student Name'}
                                </label>
                                <input
                                    type="text"
                                    value={newStudentName}
                                    onChange={(e) => setNewStudentName(e.target.value)}
                                    placeholder="Budi Santoso"
                                    className="w-full px-4 py-3 border-2 border-duo-gray-200 rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                    Email (opsional)
                                </label>
                                <input
                                    type="email"
                                    value={newStudentEmail}
                                    onChange={(e) => setNewStudentEmail(e.target.value)}
                                    placeholder="budi@sekolah.com"
                                    className="w-full px-4 py-3 border-2 border-duo-gray-200 rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                    {language === 'id' ? 'Pilih Kelas' : 'Select Class'}
                                </label>
                                <select
                                    value={selectedClassForStudent}
                                    onChange={(e) => setSelectedClassForStudent(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-duo-gray-200 rounded-xl"
                                >
                                    <option value="">{language === 'id' ? '-- Pilih Kelas --' : '-- Select Class --'}</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name} ({cls.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddStudent(false)}
                                className="flex-1 btn btn-ghost"
                            >
                                {language === 'id' ? 'Batal' : 'Cancel'}
                            </button>
                            <button
                                onClick={handleAddStudent}
                                disabled={!newStudentName.trim() || !selectedClassForStudent}
                                className="flex-1 btn btn-primary disabled:opacity-50"
                            >
                                {language === 'id' ? 'Tambah Siswa' : 'Add Student'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Class Detail Modal */}
            {showClassDetail && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-duo-gray-900">{showClassDetail.name}</h2>
                                <p className="text-duo-gray-500">Grade {showClassDetail.grade}</p>
                            </div>
                            <div className="text-right">
                                <div className="badge bg-duo-blue/10 text-duo-blue font-mono font-bold text-lg px-4 py-2">
                                    {showClassDetail.code}
                                </div>
                                <p className="text-xs text-duo-gray-400 mt-1">{language === 'id' ? 'Kode Gabung' : 'Join Code'}</p>
                            </div>
                        </div>

                        {/* Students List */}
                        <div className="bg-duo-gray-100 rounded-xl p-4 mb-6">
                            <h3 className="font-bold text-duo-gray-900 mb-4">
                                👥 {language === 'id' ? 'Daftar Siswa' : 'Students'} ({showClassDetail.studentIds.length})
                            </h3>

                            {showClassDetail.studentIds.length === 0 ? (
                                <p className="text-center py-8 text-duo-gray-500">
                                    {language === 'id' ? 'Belum ada siswa di kelas ini' : 'No students in this class yet'}
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {getClassStudents(showClassDetail.id).map(student => (
                                        <div key={student.id} className="flex items-center justify-between bg-white rounded-xl p-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{student.avatar}</span>
                                                <div>
                                                    <p className="font-semibold text-duo-gray-900">{student.name}</p>
                                                    <p className="text-xs text-duo-gray-500">
                                                        Level {student.level} • {student.xp} XP • 🔥 {student.streak}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveStudent(showClassDetail.id, student.id)}
                                                className="text-duo-red hover:bg-duo-red/10 p-2 rounded-lg"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowClassDetail(null)}
                                className="flex-1 btn btn-ghost"
                            >
                                {language === 'id' ? 'Tutup' : 'Close'}
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedClassForStudent(showClassDetail.id);
                                    setShowAddStudent(true);
                                }}
                                className="flex-1 btn btn-secondary"
                            >
                                👤 {language === 'id' ? 'Tambah Siswa' : 'Add Student'}
                            </button>
                            <button
                                onClick={() => handleDeleteClass(showClassDetail.id)}
                                className="btn btn-ghost text-duo-red"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
