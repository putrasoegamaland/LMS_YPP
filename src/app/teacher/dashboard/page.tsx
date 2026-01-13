'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { quizService, bookService, tournamentService } from '@/lib/db';
import Image from 'next/image';

// Demo data for classes (will be replaced when class management is added)
const DEMO_CLASSES = [
    { id: 'class-1', name: 'Kelas 9A', code: 'K9A2024', grade: 9, studentCount: 32, activeStudents: 28 },
    { id: 'class-2', name: 'Kelas 9B', code: 'K9B2024', grade: 9, studentCount: 30, activeStudents: 25 },
    { id: 'class-3', name: 'Kelas 10A', code: 'K10A2024', grade: 10, studentCount: 28, activeStudents: 26 },
];

export default function TeacherDashboard() {
    const router = useRouter();
    const { user, isTeacher, isLoading, logout } = useAuth();
    const { language, toggleLanguage, t } = useLanguage();

    // Real data state
    const [quizCount, setQuizCount] = useState(0);
    const [bookCount, setBookCount] = useState(0);
    const [tournamentCount, setTournamentCount] = useState(0);
    const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);

    // Fetch real data
    useEffect(() => {
        async function fetchData() {
            try {
                const quizzes = await quizService.getAll();
                const books = await bookService.getAll();
                const tournaments = await tournamentService.getAll();
                setQuizCount(quizzes.length);
                setBookCount(books.length);
                setTournamentCount(tournaments.filter(t => t.status === 'active').length);
                setRecentQuizzes(quizzes.slice(0, 3));
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            }
        }
        if (isTeacher) {
            fetchData();
        }
    }, [isTeacher]);

    // Redirect if not teacher
    useEffect(() => {
        if (!isLoading && !isTeacher) {
            router.push('/login?role=teacher');
        }
    }, [isTeacher, isLoading, router]);

    if (isLoading || !isTeacher) {
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

    const totalStudents = DEMO_CLASSES.reduce((acc, c) => acc + c.studentCount, 0);
    const activeStudents = DEMO_CLASSES.reduce((acc, c) => acc + c.activeStudents, 0);

    return (
        <div className="min-h-screen bg-duo-gray-100">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r-2 border-duo-gray-200 p-6 hidden lg:block">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                    <Image src="/icon.png" alt="LMS YPP" width={40} height={40} className="rounded-lg" />
                    <span className="font-extrabold text-duo-gray-900 text-xl">LMS YPP</span>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                    <NavLink emoji="📊" label={t('nav.dashboard')} active href="/teacher/dashboard" />
                    <NavLink emoji="📈" label={language === 'id' ? 'Analitik' : 'Analytics'} href="/teacher/analytics" />
                    <NavLink emoji="🔥" label={language === 'id' ? 'Heatmap' : 'Heatmap'} href="/teacher/heatmap" />
                    <NavLink emoji="📚" label={language === 'id' ? 'Perpustakaan' : 'Library'} href="/teacher/library" />
                    <NavLink emoji="📝" label={t('nav.content')} href="/teacher/content" />
                    <NavLink emoji="🏆" label={language === 'id' ? 'Turnamen' : 'Tournaments'} href="/teacher/tournaments" />
                    <NavLink emoji="🚨" label={language === 'id' ? 'Review' : 'Review'} href="/teacher/exam-review" />
                </nav>

                {/* Footer */}
                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                    <button onClick={toggleLanguage} className="btn btn-ghost btn-sm btn-full justify-start">
                        {language === 'id' ? '🇮🇩 Indonesia' : '🇬🇧 English'}
                    </button>
                    <button onClick={handleLogout} className="btn btn-ghost btn-sm btn-full justify-start text-duo-red">
                        🚪 {t('auth.logout')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 p-6">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Image src="/icon.png" alt="LMS YPP" width={32} height={32} className="rounded-lg" />
                        <span className="font-extrabold text-duo-gray-900">LMS YPP</span>
                    </div>
                    <button onClick={toggleLanguage} className="p-2 hover:bg-duo-gray-200 rounded-lg">
                        {language === 'id' ? '🇮🇩' : '🇬🇧'}
                    </button>
                </header>

                {/* Welcome */}
                <section className="mb-8">
                    <h1 className="text-2xl font-extrabold text-duo-gray-900 mb-1">
                        {language === 'id' ? `Halo, ${user?.name}! 👋` : `Hello, ${user?.name}! 👋`}
                    </h1>
                    <p className="text-duo-gray-500">
                        {language === 'id' ? 'Ringkasan hari ini' : "Today's overview"}
                    </p>
                </section>

                {/* Stats Grid */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard emoji="🏫" value={DEMO_CLASSES.length} label={language === 'id' ? 'Kelas Aktif' : 'Active Classes'} />
                    <StatCard emoji="👨‍🎓" value={`${activeStudents}/${totalStudents}`} label={language === 'id' ? 'Siswa Aktif' : 'Active Students'} />
                    <StatCard emoji="📝" value={quizCount} label={language === 'id' ? 'Total Kuis' : 'Total Quizzes'} />
                    <StatCard emoji="📚" value={bookCount} label={language === 'id' ? 'Total Buku' : 'Total Books'} />
                </section>

                {/* Quick Actions */}
                <section className="mb-8">
                    <h2 className="font-bold text-duo-gray-900 mb-4">
                        {language === 'id' ? '⚡ Aksi Cepat' : '⚡ Quick Actions'}
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => router.push('/teacher/content')} className="btn btn-primary">
                            📝 {language === 'id' ? 'Buat Kuis' : 'Create Quiz'}
                        </button>
                        <button onClick={() => router.push('/teacher/library')} className="btn btn-secondary">
                            📚 {language === 'id' ? 'Upload Buku' : 'Upload Book'}
                        </button>
                        <button onClick={() => router.push('/teacher/classes')} className="btn btn-secondary">
                            ➕ {language === 'id' ? 'Tambah Kelas' : 'Add Class'}
                        </button>
                        <button onClick={() => router.push('/teacher/tournaments')} className="btn btn-accent">
                            🏆 {language === 'id' ? 'Buat Turnamen' : 'Create Tournament'}
                        </button>
                    </div>
                </section>

                {/* Classes */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-duo-gray-900">
                            🏫 {language === 'id' ? 'Kelas Saya' : 'My Classes'}
                        </h2>
                        <button onClick={() => router.push('/teacher/classes')} className="text-duo-blue font-bold text-sm">
                            {language === 'id' ? 'Lihat Semua' : 'View All'} →
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {DEMO_CLASSES.map(cls => (
                            <div key={cls.id} className="card">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-2xl">📚</span>
                                    <span className="badge bg-duo-blue/10 text-duo-blue">{cls.code}</span>
                                </div>
                                <h3 className="font-bold text-duo-gray-900 mb-2">{cls.name}</h3>
                                <div className="flex items-center justify-between text-sm text-duo-gray-500">
                                    <span>👨‍🎓 {cls.activeStudents}/{cls.studentCount}</span>
                                    <span className="badge bg-duo-green/10 text-duo-green">Grade {cls.grade}</span>
                                </div>
                                <button className="btn btn-outline btn-sm btn-full mt-4">
                                    {language === 'id' ? 'Lihat Kelas' : 'View Class'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Recent Quizzes */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-duo-gray-900">
                            📝 {language === 'id' ? 'Kuis Terbaru' : 'Recent Quizzes'}
                        </h2>
                        <button onClick={() => router.push('/teacher/content')} className="text-duo-blue font-bold text-sm">
                            {language === 'id' ? 'Lihat Semua' : 'View All'} →
                        </button>
                    </div>
                    <div className="card">
                        {recentQuizzes.length === 0 ? (
                            <div className="text-center py-8 text-duo-gray-500">
                                <span className="text-4xl block mb-2">📝</span>
                                <p>{language === 'id' ? 'Belum ada kuis. Buat kuis pertamamu!' : 'No quizzes yet. Create your first quiz!'}</p>
                                <button onClick={() => router.push('/teacher/content')} className="btn btn-primary mt-4">
                                    {language === 'id' ? 'Buat Kuis' : 'Create Quiz'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentQuizzes.map((quiz: any) => (
                                    <div key={quiz.id} className="flex items-center justify-between py-3 border-b border-duo-gray-200 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">📝</span>
                                            <div>
                                                <h4 className="font-semibold text-duo-gray-900">{quiz.title}</h4>
                                                <p className="text-sm text-duo-gray-500">
                                                    {quiz.subject} • {quiz.questions?.length || 0} {language === 'id' ? 'soal' : 'questions'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {quiz.isExamMode && (
                                                <span className="badge bg-duo-red/10 text-duo-red">Exam</span>
                                            )}
                                            <button onClick={() => router.push('/teacher/content')} className="btn btn-outline btn-sm">
                                                {language === 'id' ? 'Edit' : 'Edit'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-duo-gray-200 px-4 py-2">
                <div className="flex justify-around">
                    <MobileNavItem emoji="📊" label={t('nav.dashboard')} active onClick={() => { }} />
                    <MobileNavItem emoji="📚" label={language === 'id' ? 'Lib' : 'Lib'} onClick={() => router.push('/teacher/library')} />
                    <MobileNavItem emoji="📝" label={t('nav.content')} onClick={() => router.push('/teacher/content')} />
                    <MobileNavItem emoji="🏫" label={t('nav.classes')} onClick={() => router.push('/teacher/classes')} />
                </div>
            </nav>
        </div>
    );
}

function NavLink({ emoji, label, href, active = false }: { emoji: string; label: string; href: string; active?: boolean }) {
    const router = useRouter();
    return (
        <button
            onClick={() => router.push(href)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold transition-all ${active
                ? 'bg-duo-blue/10 text-duo-blue'
                : 'text-duo-gray-500 hover:bg-duo-gray-100 hover:text-duo-gray-700'
                }`}
        >
            <span>{emoji}</span>
            <span>{label}</span>
        </button>
    );
}

function StatCard({ emoji, value, label }: { emoji: string; value: string | number; label: string }) {
    return (
        <div className="card">
            <div className="text-2xl mb-2">{emoji}</div>
            <div className="text-2xl font-extrabold text-duo-gray-900">{value}</div>
            <div className="text-sm text-duo-gray-500">{label}</div>
        </div>
    );
}

function MobileNavItem({ emoji, label, active = false, onClick }: { emoji: string; label: string; active?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg ${active ? 'text-duo-purple' : 'text-duo-gray-400'
                }`}
        >
            <span className="text-xl">{emoji}</span>
            <span className="text-xs font-semibold">{label}</span>
        </button>
    );
}
