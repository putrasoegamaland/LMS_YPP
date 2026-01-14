'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { useAIHint } from '@/contexts/AIHintContext';
import AIHintPanel from '@/components/AIHintPanel';
import { quizService } from '@/lib/db';

// Default questions for Daily Sprint (fallback if no quizzes in DB)
const DEFAULT_SPRINT_QUESTIONS = [
    {
        id: 'sprint-1',
        question: { id: 'Berapa hasil dari 7 × 8?', en: 'What is 7 × 8?' },
        options: ['54', '56', '58', '64'],
        correctAnswer: '56',
        difficulty: 'easy' as const,
        points: 10,
    },
    {
        id: 'sprint-2',
        question: { id: 'Jika x + 5 = 12, maka x = ?', en: 'If x + 5 = 12, then x = ?' },
        options: ['5', '6', '7', '8'],
        correctAnswer: '7',
        difficulty: 'easy' as const,
        points: 10,
    },
    {
        id: 'sprint-3',
        question: { id: 'Luas persegi dengan sisi 6 cm adalah...', en: 'The area of a square with side 6 cm is...' },
        options: ['24 cm²', '30 cm²', '36 cm²', '42 cm²'],
        correctAnswer: '36 cm²',
        difficulty: 'medium' as const,
        points: 15,
    },
    {
        id: 'sprint-4',
        question: { id: 'Berapa 25% dari 80?', en: 'What is 25% of 80?' },
        options: ['15', '20', '25', '30'],
        correctAnswer: '20',
        difficulty: 'medium' as const,
        points: 15,
    },
    {
        id: 'sprint-5',
        question: { id: 'Jika 2x - 4 = 10, maka x = ?', en: 'If 2x - 4 = 10, then x = ?' },
        options: ['5', '6', '7', '8'],
        correctAnswer: '7',
        difficulty: 'hard' as const,
        points: 20,
    },
];

type SprintQuestion = {
    id: string;
    question: { id: string; en: string };
    options: string[];
    correctAnswer: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
};

export default function DailySprintPage() {
    const router = useRouter();
    const { isStudent, isLoading: authLoading } = useAuth();
    const { language, t } = useLanguage();
    const { addXp, completeQuiz, unlockBadge, hasBadge } = useGame();
    const { totalTokens, requestHint, isLocked } = useAIHint();

    // Sprint state
    const [phase, setPhase] = useState<'intro' | 'playing' | 'results'>('intro');
    const [questions, setQuestions] = useState<SprintQuestion[]>(DEFAULT_SPRINT_QUESTIONS);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [showHint, setShowHint] = useState(false);
    const [currentHint, setCurrentHint] = useState<string | null>(null);
    const [hintsUsed, setHintsUsed] = useState(0);

    // Redirect if not student
    useEffect(() => {
        if (!authLoading && !isStudent) {
            router.push('/login?role=student');
        }
    }, [isStudent, authLoading, router]);

    // Fetch questions from quizService
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const quizzes = await quizService.getAll();
                // Collect all choice questions from all quizzes
                const allQuestions: SprintQuestion[] = [];

                for (const quiz of quizzes) {
                    if (quiz.questions && Array.isArray(quiz.questions)) {
                        for (const q of quiz.questions) {
                            if (q.type === 'choice' && q.options && q.options.length >= 2) {
                                allQuestions.push({
                                    id: q.id || `q-${Date.now()}-${Math.random()}`,
                                    question: { id: q.text || '', en: q.text || '' },
                                    options: q.options,
                                    correctAnswer: q.correctAnswer || q.options[q.correctOption] || q.options[0],
                                    difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
                                    points: q.difficulty === 'easy' ? 10 : q.difficulty === 'hard' ? 20 : 15,
                                });
                            }
                        }
                    }
                }

                // Shuffle and pick 5 random questions, or use defaults
                if (allQuestions.length >= 5) {
                    const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, 5);
                    setQuestions(shuffled);
                }
            } catch (err) {
                console.error('Failed to fetch sprint questions:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    // Timer
    useEffect(() => {
        if (phase !== 'playing' || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleFinish();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, timeLeft]);

    if (authLoading || !isStudent || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const question = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const handleStart = () => {
        setPhase('playing');
        setTimeLeft(300);
    };

    const handleSelectAnswer = (answer: string) => {
        if (isAnswered) return;
        setSelectedAnswer(answer);
    };

    const handleCheck = () => {
        if (!selectedAnswer) return;

        const correct = selectedAnswer === question.correctAnswer;
        setIsCorrect(correct);
        setIsAnswered(true);

        if (correct) {
            const streakBonus = streak >= 2 ? Math.min(streak * 2, 10) : 0;
            const points = question.points + streakBonus;
            setScore(prev => prev + points);
            setCorrectCount(prev => prev + 1);
            setStreak(prev => prev + 1);
        } else {
            setStreak(0);
        }
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setIsCorrect(false);
            setShowHint(false);
            setCurrentHint(null);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        setPhase('results');

        // Add XP based on score
        addXp(score);

        // Complete quiz for stats
        completeQuiz('daily-sprint', correctCount, questions.length);

        // Check for sprinter badge
        if (!hasBadge('sprinter') && correctCount >= 4) {
            unlockBadge('sprinter');
        }
    };

    const handleRequestHint = () => {
        if (isLocked || totalTokens <= 0) return;

        const response = requestHint({
            questionId: question.id,
            attemptCount: hintsUsed + 1,
        });

        if (response.allowed && response.hint) {
            setCurrentHint(response.hint[language] || response.hint.id);
            setShowHint(true);
            setHintsUsed(prev => prev + 1);
        }
    };

    const handleExit = () => router.push('/student/dashboard');

    // Intro Phase
    if (phase === 'intro') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-duo-orange to-duo-yellow flex items-center justify-center p-4">
                <div className="card max-w-md w-full text-center">
                    <div className="text-6xl mb-4">⚡</div>
                    <h1 className="text-2xl font-extrabold text-duo-gray-900 mb-2">
                        {language === 'id' ? 'Sprint Harian' : 'Daily Sprint'}
                    </h1>
                    <p className="text-duo-gray-500 mb-6">
                        {language === 'id'
                            ? '5 soal dalam 5 menit. Jawab cepat dan tepat!'
                            : '5 questions in 5 minutes. Answer fast and correctly!'}
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-duo-gray-100 rounded-xl p-3">
                            <div className="text-2xl font-bold text-duo-orange">5</div>
                            <div className="text-xs text-duo-gray-500">
                                {language === 'id' ? 'Soal' : 'Questions'}
                            </div>
                        </div>
                        <div className="bg-duo-gray-100 rounded-xl p-3">
                            <div className="text-2xl font-bold text-duo-orange">5:00</div>
                            <div className="text-xs text-duo-gray-500">
                                {language === 'id' ? 'Menit' : 'Minutes'}
                            </div>
                        </div>
                        <div className="bg-duo-gray-100 rounded-xl p-3">
                            <div className="text-2xl font-bold text-duo-orange">70</div>
                            <div className="text-xs text-duo-gray-500">
                                {language === 'id' ? 'Max XP' : 'Max XP'}
                            </div>
                        </div>
                    </div>

                    <button onClick={handleStart} className="btn btn-warning btn-lg btn-full">
                        🚀 {language === 'id' ? 'Mulai Sprint!' : 'Start Sprint!'}
                    </button>
                    <button onClick={handleExit} className="btn btn-ghost btn-full mt-2">
                        {t('action.back')}
                    </button>
                </div>
            </div>
        );
    }

    // Results Phase
    if (phase === 'results') {
        const percentage = Math.round((correctCount / questions.length) * 100);
        const rating = percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪';
        const message = percentage >= 80
            ? (language === 'id' ? 'Luar Biasa!' : 'Amazing!')
            : percentage >= 60
                ? (language === 'id' ? 'Bagus!' : 'Good Job!')
                : (language === 'id' ? 'Terus Semangat!' : 'Keep Going!');

        return (
            <div className="min-h-screen bg-duo-gray-100 flex items-center justify-center p-4">
                <div className="card max-w-md w-full text-center">
                    <div className="text-6xl mb-4">{rating}</div>
                    <h1 className="text-2xl font-extrabold text-duo-gray-900 mb-2">{message}</h1>

                    <div className="grid grid-cols-2 gap-4 my-6">
                        <div className="bg-duo-green/10 rounded-xl p-4">
                            <div className="text-3xl font-bold text-duo-green">{correctCount}/{questions.length}</div>
                            <div className="text-sm text-duo-gray-500">
                                {language === 'id' ? 'Benar' : 'Correct'}
                            </div>
                        </div>
                        <div className="bg-duo-yellow/10 rounded-xl p-4">
                            <div className="text-3xl font-bold text-duo-yellow-dark">+{score}</div>
                            <div className="text-sm text-duo-gray-500">XP</div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={() => {
                            setPhase('intro');
                            setCurrentQuestion(0);
                            setScore(0);
                            setCorrectCount(0);
                            setStreak(0);
                            setSelectedAnswer(null);
                            setIsAnswered(false);
                            setHintsUsed(0);
                        }} className="btn btn-warning btn-full">
                            🔄 {language === 'id' ? 'Main Lagi' : 'Play Again'}
                        </button>
                        <button onClick={handleExit} className="btn btn-outline btn-full">
                            {t('action.back')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Playing Phase
    return (
        <div className="min-h-screen bg-duo-gray-100 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b-2 border-duo-gray-200 p-4">
                <div className="flex items-center gap-4 max-w-2xl mx-auto">
                    <button onClick={handleExit} className="text-duo-gray-500 hover:text-duo-gray-700">
                        ✕
                    </button>
                    <div className="flex-1 h-3 bg-duo-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-duo-orange rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className={`font-bold ${timeLeft <= 30 ? 'text-duo-red animate-pulse' : 'text-duo-gray-700'}`}>
                        {minutes}:{seconds.toString().padStart(2, '0')}
                    </div>
                </div>
            </header>

            {/* Question */}
            <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
                {/* Streak indicator */}
                {streak >= 2 && (
                    <div className="text-center mb-4">
                        <span className="inline-block px-3 py-1 bg-duo-orange text-white rounded-full text-sm font-bold animate-bounce-once">
                            🔥 {streak} {language === 'id' ? 'berturut-turut!' : 'in a row!'}
                        </span>
                    </div>
                )}

                {/* Difficulty badge */}
                <div className="flex items-center gap-2 mb-4">
                    <span className={`badge ${question.difficulty === 'easy' ? 'bg-duo-green/20 text-duo-green' :
                        question.difficulty === 'medium' ? 'bg-duo-yellow/20 text-duo-yellow-dark' :
                            'bg-duo-red/20 text-duo-red'
                        }`}>
                        {question.difficulty === 'easy' ? '🟢' : question.difficulty === 'medium' ? '🟡' : '🔴'}
                        {question.difficulty.toUpperCase()}
                    </span>
                    <span className="text-sm text-duo-gray-500">+{question.points} XP</span>
                </div>

                {/* Question text */}
                <div className="card mb-6">
                    <h2 className="text-xl font-bold text-duo-gray-900">
                        {question.question[language] || question.question.id}
                    </h2>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-6">
                    {question.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleSelectAnswer(option)}
                            disabled={isAnswered}
                            className={`quiz-option w-full ${selectedAnswer === option ? 'selected' : ''
                                } ${isAnswered && option === question.correctAnswer ? 'correct' : ''
                                } ${isAnswered && selectedAnswer === option && !isCorrect ? 'incorrect' : ''
                                }`}
                        >
                            <span className="w-8 h-8 rounded-full bg-duo-gray-200 flex items-center justify-center font-bold text-sm">
                                {index + 1}
                            </span>
                            <span className="font-semibold">{option}</span>
                        </button>
                    ))}
                </div>

                {/* Hint */}
                {!isLocked && !isAnswered && totalTokens > 0 && (
                    <button
                        onClick={handleRequestHint}
                        className="btn btn-ghost btn-sm mb-4"
                    >
                        💡 {language === 'id' ? 'Minta Petunjuk' : 'Get Hint'} ({totalTokens})
                    </button>
                )}

                {showHint && currentHint && (
                    <div className="card bg-duo-purple/10 border-2 border-duo-purple/20 mb-4">
                        <p className="text-duo-purple font-medium">💡 {currentHint}</p>
                    </div>
                )}

                {/* Feedback */}
                {isAnswered && (
                    <div className={`card ${isCorrect ? 'bg-duo-green/10 border-duo-green' : 'bg-duo-red/10 border-duo-red'} border-2 mb-4`}>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
                            <div>
                                <p className="font-bold">
                                    {isCorrect
                                        ? (language === 'id' ? 'Benar!' : 'Correct!')
                                        : (language === 'id' ? 'Kurang Tepat' : 'Incorrect')}
                                </p>
                                {!isCorrect && (
                                    <p className="text-sm text-duo-gray-500">
                                        {language === 'id' ? 'Jawaban: ' : 'Answer: '}{question.correctAnswer}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t-2 border-duo-gray-200 p-4">
                <div className="max-w-2xl mx-auto">
                    {!isAnswered ? (
                        <button
                            onClick={handleCheck}
                            disabled={!selectedAnswer}
                            className="btn btn-warning btn-lg btn-full"
                        >
                            {t('quiz.check')}
                        </button>
                    ) : (
                        <button onClick={handleNext} className="btn btn-warning btn-lg btn-full">
                            {currentQuestion < questions.length - 1
                                ? t('quiz.next')
                                : (language === 'id' ? 'Selesai' : 'Finish')}
                        </button>
                    )}
                </div>
            </footer>

            {/* AI Hint Panel */}
            <AIHintPanel />
        </div>
    );
}
