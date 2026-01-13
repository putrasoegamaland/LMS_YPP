'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

// Replay quiz with variant questions
interface QuizHistory {
    id: string;
    title: string;
    subject: string;
    originalScore: number;
    bestScore: number;
    attempts: number;
    lastPlayed: string;
}

interface VariantQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    points: number;
}

// Mock quiz history
const MOCK_HISTORY: QuizHistory[] = [
    { id: 'q1', title: 'Aljabar Dasar', subject: 'matematika', originalScore: 70, bestScore: 85, attempts: 3, lastPlayed: '2026-01-12' },
    { id: 'q2', title: 'Geometri Segitiga', subject: 'matematika', originalScore: 60, bestScore: 75, attempts: 2, lastPlayed: '2026-01-10' },
    { id: 'q3', title: 'Statistika Dasar', subject: 'matematika', originalScore: 55, bestScore: 55, attempts: 1, lastPlayed: '2026-01-08' },
    { id: 'q4', title: 'Persamaan Linear', subject: 'matematika', originalScore: 90, bestScore: 95, attempts: 2, lastPlayed: '2026-01-11' },
];

// Function to generate variant questions (same concept, different numbers)
const generateVariant = (quizId: string): VariantQuestion[] => {
    const templates: Record<string, () => VariantQuestion[]> = {
        q1: () => {
            const a = Math.floor(Math.random() * 10) + 2;
            const b = Math.floor(Math.random() * 20) + 5;
            const x = Math.floor(Math.random() * 10) + 1;
            const result = a * x + b;
            return [
                {
                    id: 'v1',
                    question: `Jika ${a}x + ${b} = ${result}, nilai x adalah...`,
                    options: [`${x}`, `${x + 1}`, `${x - 1}`, `${x + 2}`].sort(() => Math.random() - 0.5),
                    correctAnswer: `${x}`,
                    points: 100,
                },
                {
                    id: 'v2',
                    question: `Sederhanakan: ${a}x + ${b}x`,
                    options: [`${a + b}x`, `${a * b}x`, `${a}x${b}`, `x${a + b}`].sort(() => Math.random() - 0.5),
                    correctAnswer: `${a + b}x`,
                    points: 100,
                },
                {
                    id: 'v3',
                    question: `Hasil dari (${a}x)(${b}) adalah...`,
                    options: [`${a * b}x`, `${a + b}x`, `${a}x + ${b}`, `${a * b}`].sort(() => Math.random() - 0.5),
                    correctAnswer: `${a * b}x`,
                    points: 100,
                },
            ];
        },
        q2: () => {
            const base = Math.floor(Math.random() * 10) + 5;
            const height = Math.floor(Math.random() * 10) + 3;
            const area = (base * height) / 2;
            return [
                {
                    id: 'v1',
                    question: `Luas segitiga dengan alas ${base} cm dan tinggi ${height} cm adalah...`,
                    options: [`${area} cm²`, `${base * height} cm²`, `${base + height} cm²`, `${area + 5} cm²`].sort(() => Math.random() - 0.5),
                    correctAnswer: `${area} cm²`,
                    points: 100,
                },
                {
                    id: 'v2',
                    question: `Keliling segitiga sama sisi dengan sisi ${base} cm adalah...`,
                    options: [`${base * 3} cm`, `${base * 2} cm`, `${base * 4} cm`, `${base} cm`].sort(() => Math.random() - 0.5),
                    correctAnswer: `${base * 3} cm`,
                    points: 100,
                },
            ];
        },
        default: () => [
            {
                id: 'v1',
                question: 'Berapa hasil dari 25 × 4?',
                options: ['100', '90', '110', '80'],
                correctAnswer: '100',
                points: 100,
            },
            {
                id: 'v2',
                question: 'Akar kuadrat dari 81 adalah...',
                options: ['9', '8', '10', '7'],
                correctAnswer: '9',
                points: 100,
            },
        ],
    };

    return (templates[quizId] || templates.default)();
};

type Phase = 'list' | 'playing' | 'results';

export default function ReplayModePage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();
    const { addXp } = useGame();

    const [phase, setPhase] = useState<Phase>('list');
    const [selectedQuiz, setSelectedQuiz] = useState<QuizHistory | null>(null);
    const [questions, setQuestions] = useState<VariantQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [filter, setFilter] = useState<'all' | 'improvement'>('all');

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const filteredHistory = filter === 'all'
        ? MOCK_HISTORY
        : MOCK_HISTORY.filter(q => q.bestScore < 80);

    const startReplay = (quiz: QuizHistory) => {
        setSelectedQuiz(quiz);
        setQuestions(generateVariant(quiz.id));
        setCurrentIndex(0);
        setScore(0);
        setPhase('playing');
    };

    const handleAnswer = (answer: string) => {
        if (showResult) return;

        const current = questions[currentIndex];
        const correct = answer === current.correctAnswer;
        setIsCorrect(correct);
        setSelectedAnswer(answer);
        setShowResult(true);

        if (correct) {
            setScore(prev => prev + current.points);
        }

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setShowResult(false);
            } else {
                setPhase('results');
                // Give reduced XP for replays
                const xpEarned = Math.round((score + (correct ? current.points : 0)) * 0.5);
                addXp(xpEarned);
            }
        }, 1500);
    };

    // List Phase
    if (phase === 'list') {
        return (
            <div className="min-h-screen bg-duo-gray-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => router.back()} className="text-duo-gray-500 hover:text-duo-gray-700 mb-4">
                        ← {language === 'id' ? 'Kembali' : 'Back'}
                    </button>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-duo-gray-900 mb-2">
                            🔄 {language === 'id' ? 'Mode Replay' : 'Replay Mode'}
                        </h1>
                        <p className="text-duo-gray-500">
                            {language === 'id'
                                ? 'Ulangi kuis dengan soal varian baru! XP 50% untuk replay.'
                                : 'Repeat quizzes with new variant questions! 50% XP for replays.'}
                        </p>
                    </div>

                    {/* Filter */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-semibold ${filter === 'all' ? 'bg-duo-blue text-white' : 'bg-white text-duo-gray-600'
                                }`}
                        >
                            {language === 'id' ? 'Semua' : 'All'}
                        </button>
                        <button
                            onClick={() => setFilter('improvement')}
                            className={`px-4 py-2 rounded-lg font-semibold ${filter === 'improvement' ? 'bg-duo-orange text-white' : 'bg-white text-duo-gray-600'
                                }`}
                        >
                            ⚠️ {language === 'id' ? 'Perlu Perbaikan (<80%)' : 'Need Improvement (<80%)'}
                        </button>
                    </div>

                    {/* Quiz List */}
                    <div className="space-y-4">
                        {filteredHistory.map(quiz => (
                            <div key={quiz.id} className="card hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-duo-gray-900 text-lg">{quiz.title}</h3>
                                        <p className="text-sm text-duo-gray-500">
                                            📚 {quiz.subject} • 🔄 {quiz.attempts} {language === 'id' ? 'percobaan' : 'attempts'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-sm text-duo-gray-500">Original:</span>
                                            <span className={`font-bold ${quiz.originalScore >= 80 ? 'text-duo-green' : quiz.originalScore >= 60 ? 'text-duo-yellow' : 'text-duo-red'}`}>
                                                {quiz.originalScore}%
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-duo-gray-500">Best:</span>
                                            <span className={`font-bold ${quiz.bestScore >= 80 ? 'text-duo-green' : quiz.bestScore >= 60 ? 'text-duo-yellow' : 'text-duo-red'}`}>
                                                {quiz.bestScore}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-xs text-duo-gray-400">
                                        {language === 'id' ? 'Terakhir:' : 'Last:'} {new Date(quiz.lastPlayed).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={() => startReplay(quiz)}
                                        className="btn btn-primary btn-sm"
                                    >
                                        🔄 {language === 'id' ? 'Replay' : 'Replay'}
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredHistory.length === 0 && (
                            <div className="card text-center py-8">
                                <p className="text-duo-gray-500">
                                    {language === 'id' ? 'Tidak ada kuis yang perlu diperbaiki!' : 'No quizzes need improvement!'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Playing Phase
    if (phase === 'playing' && selectedQuiz && questions.length > 0) {
        const current = questions[currentIndex];

        return (
            <div className="min-h-screen bg-gradient-to-br from-duo-blue to-duo-purple p-6">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 text-white">
                        <div>
                            <span className="text-sm opacity-70">🔄 Replay: {selectedQuiz.title}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-sm opacity-70">Q {currentIndex + 1}/{questions.length}</span>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="h-2 bg-white/30 rounded-full mb-8 overflow-hidden">
                        <div
                            className="h-full bg-duo-yellow transition-all"
                            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                        />
                    </div>

                    {/* Question */}
                    <div className="bg-white rounded-2xl p-6 mb-6">
                        <p className="text-xl font-semibold text-duo-gray-900 text-center">
                            {current.question}
                        </p>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-4">
                        {current.options.map((option, idx) => {
                            let buttonStyle = 'bg-white text-duo-gray-900 hover:bg-duo-gray-100';
                            if (showResult) {
                                if (option === current.correctAnswer) {
                                    buttonStyle = 'bg-duo-green text-white';
                                } else if (option === selectedAnswer) {
                                    buttonStyle = 'bg-duo-red text-white';
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(option)}
                                    disabled={showResult}
                                    className={`p-4 rounded-xl font-semibold text-lg transition-all ${buttonStyle}`}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>

                    {/* Result feedback */}
                    {showResult && (
                        <div className={`mt-6 text-center text-2xl font-bold ${isCorrect ? 'text-duo-green' : 'text-duo-red'}`}>
                            {isCorrect ? '✅ Benar!' : '❌ Salah!'}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Results Phase
    if (phase === 'results' && selectedQuiz) {
        const percentage = Math.round((score / (questions.length * 100)) * 100);
        const xpEarned = Math.round(score * 0.5);
        const improved = percentage > selectedQuiz.bestScore;

        return (
            <div className="min-h-screen bg-gradient-to-br from-duo-green to-emerald-500 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center">
                    <div className="text-6xl mb-4">{improved ? '🎉' : '👍'}</div>
                    <h1 className="text-2xl font-extrabold text-duo-gray-900 mb-2">
                        {language === 'id' ? 'Replay Selesai!' : 'Replay Complete!'}
                    </h1>

                    <div className="bg-duo-gray-100 rounded-xl p-4 my-6">
                        <div className="text-4xl font-bold text-duo-blue">{percentage}%</div>
                        <div className="text-sm text-duo-gray-500">
                            {language === 'id' ? 'Skor Replay' : 'Replay Score'}
                        </div>
                    </div>

                    {improved && (
                        <div className="bg-duo-green/20 text-duo-green rounded-xl p-3 mb-4 font-bold">
                            🎯 {language === 'id' ? 'Personal Best Baru!' : 'New Personal Best!'} ({selectedQuiz.bestScore}% → {percentage}%)
                        </div>
                    )}

                    <div className="text-lg mb-6">
                        <span className="font-bold text-duo-yellow">+{xpEarned} XP</span>
                        <span className="text-duo-gray-500 text-sm"> (50% replay bonus)</span>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => startReplay(selectedQuiz)}
                            className="flex-1 py-3 bg-duo-blue text-white rounded-xl font-bold"
                        >
                            🔄 {language === 'id' ? 'Replay Lagi' : 'Replay Again'}
                        </button>
                        <button
                            onClick={() => setPhase('list')}
                            className="flex-1 py-3 bg-duo-gray-200 rounded-xl font-bold"
                        >
                            📚 {language === 'id' ? 'Pilih Kuis' : 'Choose Quiz'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
