'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

export default function HomePage() {
    const router = useRouter();
    const { isLoggedIn, isStudent, isTeacher, isLoading } = useAuth();
    const { t, language, toggleLanguage } = useLanguage();

    // Redirect if already logged in
    useEffect(() => {
        if (!isLoading && isLoggedIn) {
            if (isStudent) {
                router.push('/student/dashboard');
            } else if (isTeacher) {
                router.push('/teacher/dashboard');
            }
        }
    }, [isLoggedIn, isStudent, isTeacher, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-duo-blue via-duo-purple to-duo-pink">
            {/* Navigation */}
            <nav className="flex items-center justify-between p-4 md:p-6">
                <div className="flex items-center gap-3">
                    <Image
                        src="/icon.png"
                        alt="LMS YPP"
                        width={40}
                        height={40}
                        className="rounded-lg"
                    />
                    <span className="text-white font-extrabold text-xl md:text-2xl">
                        LMS YPP
                    </span>
                </div>
                <button
                    onClick={toggleLanguage}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white font-bold transition-all"
                >
                    {language === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
                </button>
            </nav>

            {/* Hero Section */}
            <main className="container mx-auto px-4 py-12 md:py-20">
                <div className="text-center max-w-3xl mx-auto">
                    {/* Tagline Badge */}
                    <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold mb-6 animate-fade-in">
                        ✨ {t('app.tagline')}
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight animate-slide-up">
                        {language === 'id'
                            ? 'Belajar Jadi Lebih Seru dengan AI'
                            : 'Learning Becomes More Fun with AI'}
                    </h1>

                    {/* Subheading */}
                    <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                        {language === 'id'
                            ? 'Platform pembelajaran interaktif untuk siswa SMP & SMA Indonesia. AI membantu dengan petunjuk, bukan jawaban!'
                            : 'Interactive learning platform for Indonesian middle & high school students. AI helps with hints, not answers!'}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                        <button
                            onClick={() => router.push('/login?role=student')}
                            className="btn btn-lg bg-duo-yellow text-duo-gray-900 hover:bg-duo-yellow-dark w-full sm:w-auto"
                            style={{ boxShadow: '0 4px 0 #E0B000' }}
                        >
                            🎓 {t('auth.login_as_student')}
                        </button>
                        <button
                            onClick={() => router.push('/login?role=teacher')}
                            className="btn btn-lg bg-white text-duo-purple hover:bg-duo-gray-100 w-full sm:w-auto"
                            style={{ boxShadow: '0 4px 0 #E5E5E5' }}
                        >
                            👩‍🏫 {t('auth.login_as_teacher')}
                        </button>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                        <FeatureCard
                            emoji="🤖"
                            title={language === 'id' ? 'AI Sebagai Coach' : 'AI as Coach'}
                            description={language === 'id'
                                ? 'AI memberi petunjuk dan pertanyaan pemandu, bukan jawaban langsung'
                                : 'AI gives hints and guiding questions, not direct answers'}
                        />
                        <FeatureCard
                            emoji="🏆"
                            title={language === 'id' ? 'Kompetisi Seru' : 'Fun Competition'}
                            description={language === 'id'
                                ? 'Daily Sprint, Class Battle, dan Tournament untuk motivasi belajar'
                                : 'Daily Sprint, Class Battle, and Tournament for learning motivation'}
                        />
                        <FeatureCard
                            emoji="🎮"
                            title={language === 'id' ? 'Gamifikasi' : 'Gamification'}
                            description={language === 'id'
                                ? 'XP, level, badge, dan streak membuat belajar seperti bermain game'
                                : 'XP, levels, badges, and streaks make learning feel like gaming'}
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center py-8 text-white/70">
                <p>
                    © 2024 LMS YPP • {language === 'id' ? 'Dibuat untuk pendidikan Indonesia' : 'Made for Indonesian education'}
                </p>
            </footer>
        </div>
    );
}

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left hover:bg-white/20 transition-all">
            <div className="text-4xl mb-4">{emoji}</div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-white/80">{description}</p>
        </div>
    );
}
