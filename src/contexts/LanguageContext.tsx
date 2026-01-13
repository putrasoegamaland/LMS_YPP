'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { LocalizedText } from '@/types';

type Language = 'id' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    t: (key: string) => string;
    getText: (text: LocalizedText) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations: Record<string, LocalizedText> = {
    // Common
    'app.name': { id: 'LMS YPP', en: 'LMS YPP' },
    'app.tagline': { id: 'Belajar Bareng AI, Tetap Pakai Otak', en: 'Learn with AI, Still Use Your Brain' },

    // Navigation
    'nav.home': { id: 'Beranda', en: 'Home' },
    'nav.learn': { id: 'Belajar', en: 'Learn' },
    'nav.practice': { id: 'Latihan', en: 'Practice' },
    'nav.compete': { id: 'Kompetisi', en: 'Compete' },
    'nav.profile': { id: 'Profil', en: 'Profile' },
    'nav.dashboard': { id: 'Dasbor', en: 'Dashboard' },
    'nav.classes': { id: 'Kelas', en: 'Classes' },
    'nav.content': { id: 'Konten', en: 'Content' },
    'nav.assignments': { id: 'Tugas', en: 'Assignments' },

    // Auth
    'auth.login': { id: 'Masuk', en: 'Login' },
    'auth.logout': { id: 'Keluar', en: 'Logout' },
    'auth.register': { id: 'Daftar', en: 'Register' },
    'auth.email': { id: 'Email', en: 'Email' },
    'auth.password': { id: 'Kata Sandi', en: 'Password' },
    'auth.student': { id: 'Siswa', en: 'Student' },
    'auth.teacher': { id: 'Guru', en: 'Teacher' },
    'auth.login_as_student': { id: 'Masuk sebagai Siswa', en: 'Login as Student' },
    'auth.login_as_teacher': { id: 'Masuk sebagai Guru', en: 'Login as Teacher' },

    // Game/XP
    'game.xp': { id: 'XP', en: 'XP' },
    'game.level': { id: 'Level', en: 'Level' },
    'game.streak': { id: 'Hari Berturut', en: 'Day Streak' },
    'game.badges': { id: 'Lencana', en: 'Badges' },
    'game.leaderboard': { id: 'Papan Peringkat', en: 'Leaderboard' },

    // AI Hints
    'ai.get_hint': { id: 'Minta Petunjuk', en: 'Get Hint' },
    'ai.hints_remaining': { id: 'Petunjuk tersisa', en: 'Hints remaining' },
    'ai.locked': { id: 'AI Terkunci', en: 'AI Locked' },
    'ai.exam_mode': { id: 'Mode Ujian - AI tidak tersedia', en: 'Exam Mode - AI unavailable' },
    'ai.show_work': { id: 'Tunjukkan pekerjaanmu dulu', en: 'Show your work first' },

    // Quiz
    'quiz.check': { id: 'Periksa', en: 'Check' },
    'quiz.submit': { id: 'Kirim', en: 'Submit' },
    'quiz.next': { id: 'Lanjutkan', en: 'Continue' },
    'quiz.skip': { id: 'Lewati', en: 'Skip' },
    'quiz.try_again': { id: 'Coba Lagi', en: 'Try Again' },
    'quiz.correct': { id: 'Benar!', en: 'Correct!' },
    'quiz.incorrect': { id: 'Kurang Tepat', en: 'Incorrect' },
    'quiz.explain_thinking': { id: 'Jelaskan pemikiranmu', en: 'Explain your thinking' },
    'quiz.confidence': { id: 'Tingkat Keyakinan', en: 'Confidence Level' },

    // Competition
    'compete.daily_sprint': { id: 'Sprint Harian', en: 'Daily Sprint' },
    'compete.class_battle': { id: 'Pertarungan Kelas', en: 'Class Battle' },
    'compete.tournament': { id: 'Turnamen', en: 'Tournament' },
    'compete.join': { id: 'Ikut', en: 'Join' },
    'compete.rank': { id: 'Peringkat', en: 'Rank' },

    // Results
    'result.amazing': { id: 'Luar Biasa!', en: 'Amazing!' },
    'result.good': { id: 'Bagus!', en: 'Good Job!' },
    'result.keep_going': { id: 'Terus Semangat!', en: 'Keep Going!' },
    'result.score': { id: 'Skor', en: 'Score' },
    'result.accuracy': { id: 'Akurasi', en: 'Accuracy' },

    // Common actions
    'action.save': { id: 'Simpan', en: 'Save' },
    'action.cancel': { id: 'Batal', en: 'Cancel' },
    'action.create': { id: 'Buat', en: 'Create' },
    'action.edit': { id: 'Edit', en: 'Edit' },
    'action.delete': { id: 'Hapus', en: 'Delete' },
    'action.view': { id: 'Lihat', en: 'View' },
    'action.back': { id: 'Kembali', en: 'Back' },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('id');

    // Load language preference from localStorage
    useEffect(() => {
        const savedLang = localStorage.getItem('lms_ypp_language') as Language;
        if (savedLang && (savedLang === 'id' || savedLang === 'en')) {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('lms_ypp_language', lang);
    };

    const toggleLanguage = () => {
        const newLang = language === 'id' ? 'en' : 'id';
        setLanguage(newLang);
    };

    // Get translation by key
    const t = (key: string): string => {
        const translation = translations[key];
        if (!translation) {
            console.warn(`Translation missing for key: ${key}`);
            return key;
        }
        return translation[language];
    };

    // Get text from LocalizedText object
    const getText = (text: LocalizedText): string => {
        return text[language] || text.id;
    };

    const value: LanguageContextType = {
        language,
        setLanguage,
        toggleLanguage,
        t,
        getText,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export default LanguageContext;
