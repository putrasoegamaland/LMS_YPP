'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, isLoggedIn, isStudent, isTeacher, isLoading: authLoading } = useAuth();
    const { t, language, toggleLanguage } = useLanguage();

    const roleParam = searchParams.get('role') as 'student' | 'teacher' | null;
    const [role, setRole] = useState<'student' | 'teacher'>(roleParam || 'student');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && isLoggedIn) {
            if (isStudent) {
                router.push('/student/dashboard');
            } else if (isTeacher) {
                router.push('/teacher/dashboard');
            }
        }
    }, [isLoggedIn, isStudent, isTeacher, authLoading, router]);

    // Update role when URL param changes
    useEffect(() => {
        if (roleParam === 'student' || roleParam === 'teacher') {
            setRole(roleParam);
        }
    }, [roleParam]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const success = await login(email, password, role);

        if (success) {
            router.push(role === 'student' ? '/student/dashboard' : '/teacher/dashboard');
        } else {
            setError(language === 'id' ? 'Email atau password salah' : 'Invalid email or password');
        }

        setIsLoading(false);
    };

    const handleDemoLogin = async (demoRole: 'student' | 'teacher') => {
        setIsLoading(true);
        const demoEmail = demoRole === 'student' ? 'student@demo.com' : 'teacher@demo.com';
        const success = await login(demoEmail, 'demo', demoRole);

        if (success) {
            router.push(demoRole === 'student' ? '/student/dashboard' : '/teacher/dashboard');
        }
        setIsLoading(false);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-duo-gray-100 flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between p-4">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-duo-gray-500 hover:text-duo-gray-800 transition-colors"
                >
                    ← {t('action.back')}
                </button>
                <button
                    onClick={toggleLanguage}
                    className="px-3 py-1.5 bg-duo-gray-200 hover:bg-duo-gray-300 rounded-full text-sm font-bold transition-all"
                >
                    {language === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
                </button>
            </header>

            {/* Login Card */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <Image
                            src="/icon.png"
                            alt="LMS YPP"
                            width={80}
                            height={80}
                            className="mx-auto mb-4 rounded-2xl"
                        />
                        <h1 className="text-2xl font-extrabold text-duo-gray-900">
                            {t('auth.login')}
                        </h1>
                        <p className="text-duo-gray-400 mt-2">
                            {language === 'id' ? 'Masuk ke akun LMS YPP kamu' : 'Sign in to your LMS YPP account'}
                        </p>
                    </div>

                    {/* Role Toggle */}
                    <div className="flex bg-duo-gray-200 rounded-xl p-1 mb-6">
                        <button
                            onClick={() => setRole('student')}
                            className={`flex-1 py-3 rounded-lg font-bold transition-all ${role === 'student'
                                    ? 'bg-white text-duo-blue shadow-sm'
                                    : 'text-duo-gray-500 hover:text-duo-gray-700'
                                }`}
                        >
                            🎓 {t('auth.student')}
                        </button>
                        <button
                            onClick={() => setRole('teacher')}
                            className={`flex-1 py-3 rounded-lg font-bold transition-all ${role === 'teacher'
                                    ? 'bg-white text-duo-purple shadow-sm'
                                    : 'text-duo-gray-500 hover:text-duo-gray-700'
                                }`}
                        >
                            👩‍🏫 {t('auth.teacher')}
                        </button>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="card">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-duo-gray-700 mb-2">
                                    {t('auth.email')}
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input"
                                    placeholder={role === 'student' ? 'siswa@email.com' : 'guru@email.com'}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-duo-gray-700 mb-2">
                                    {t('auth.password')}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input"
                                    placeholder="••••••••"
                                    required
                                    minLength={4}
                                />
                            </div>

                            {error && (
                                <div className="text-duo-red text-sm font-semibold text-center py-2 bg-duo-red/10 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`btn btn-lg btn-full ${role === 'student' ? 'btn-secondary' : 'btn-accent'
                                    }`}
                            >
                                {isLoading ? (
                                    <span className="spinner w-5 h-5 border-2"></span>
                                ) : (
                                    t('auth.login')
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Demo Login */}
                    <div className="mt-6 text-center">
                        <p className="text-duo-gray-400 text-sm mb-3">
                            {language === 'id' ? 'Atau coba demo:' : 'Or try demo:'}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => handleDemoLogin('student')}
                                disabled={isLoading}
                                className="btn btn-outline btn-sm"
                            >
                                🎓 Demo {t('auth.student')}
                            </button>
                            <button
                                onClick={() => handleDemoLogin('teacher')}
                                disabled={isLoading}
                                className="btn btn-outline btn-sm"
                            >
                                👩‍🏫 Demo {t('auth.teacher')}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
