'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { useAIHint } from '@/contexts/AIHintContext';
import AIHintPanel from '@/components/AIHintPanel';
import Image from 'next/image';

// Demo quiz data
const PRACTICE_QUIZZES = [
    {
        id: 'math-algebra',
        title: { id: 'Aljabar Dasar', en: 'Basic Algebra' },
        subject: 'matematika',
        icon: '🧮',
        questionCount: 5,
        difficulty: 'medium' as const,
        xpReward: 50,
        isExamMode: false,
    },
    {
        id: 'math-geometry',
        title: { id: 'Geometri', en: 'Geometry' },
        subject: 'matematika',
        icon: '📐',
        questionCount: 5,
        difficulty: 'easy' as const,
        xpReward: 40,
        isExamMode: false,
    },
    {
        id: 'exam-1',
        title: { id: '🔒 Ujian Matematika', en: '🔒 Math Exam' },
        subject: 'matematika',
        icon: '📝',
        questionCount: 10,
        difficulty: 'hard' as const,
        xpReward: 100,
        isExamMode: true,
        timeLimit: 30, // minutes
    },
];

const QUIZ_QUESTIONS: Record<string, Array<{
    id: string;
    question: { id: string; en: string };
    type: 'choice' | 'essay';
    options?: string[];
    correctAnswer?: string;
    points: number;
    hints?: { level1: { id: string; en: string }; level2: { id: string; en: string }; level3: { id: string; en: string } };
    // Essay fields
    minWords?: number;
    rubric?: { id: string; en: string };
    keywords?: string[];
}>> = {
    'math-algebra': [
        {
            id: 'alg-1',
            question: { id: 'Jika 3x + 6 = 15, maka x = ?', en: 'If 3x + 6 = 15, then x = ?' },
            type: 'choice',
            options: ['2', '3', '4', '5'],
            correctAnswer: '3',
            points: 10,
            hints: {
                level1: { id: 'Ingat cara mengisolasi variabel x.', en: 'Remember how to isolate variable x.' },
                level2: { id: 'Coba pindahkan angka 6 ke sisi lain persamaan.', en: 'Try moving 6 to the other side.' },
                level3: { id: 'Kurangi 6 dari kedua sisi: 3x = 9. Lalu bagi dengan 3.', en: 'Subtract 6 from both sides: 3x = 9. Then divide by 3.' },
            },
        },
        {
            id: 'alg-2',
            question: { id: '2x - 4 = 10. Berapa nilai x?', en: '2x - 4 = 10. What is x?' },
            type: 'choice',
            options: ['5', '6', '7', '8'],
            correctAnswer: '7',
            points: 10,
            hints: {
                level1: { id: 'Operasi invers adalah kunci!', en: 'Inverse operations are key!' },
                level2: { id: 'Tambahkan 4 ke kedua sisi dulu.', en: 'Add 4 to both sides first.' },
                level3: { id: '2x = 14, maka x = 14/2 = ...', en: '2x = 14, so x = 14/2 = ...' },
            },
        },
        {
            id: 'alg-3',
            question: { id: 'Sederhanakan: 5a + 3b - 2a + b', en: 'Simplify: 5a + 3b - 2a + b' },
            type: 'choice',
            options: ['3a + 4b', '3a + 2b', '7a + 4b', '3a + 3b'],
            correctAnswer: '3a + 4b',
            points: 15,
            hints: {
                level1: { id: 'Kelompokkan suku sejenis.', en: 'Group like terms.' },
                level2: { id: 'Suku dengan "a" dan suku dengan "b" dikelompokkan.', en: 'Group terms with "a" and terms with "b".' },
                level3: { id: '(5a - 2a) + (3b + b) = ?', en: '(5a - 2a) + (3b + b) = ?' },
            },
        },
        {
            id: 'alg-4',
            question: { id: 'Jika y = 2x + 3 dan x = 4, maka y = ?', en: 'If y = 2x + 3 and x = 4, then y = ?' },
            type: 'choice',
            options: ['9', '10', '11', '12'],
            correctAnswer: '11',
            points: 10,
        },
        {
            id: 'alg-5',
            question: { id: 'Faktorkan: x² - 9', en: 'Factor: x² - 9' },
            type: 'choice',
            options: ['(x-3)(x-3)', '(x+3)(x-3)', '(x+9)(x-1)', '(x-9)(x+1)'],
            correctAnswer: '(x+3)(x-3)',
            points: 20,
            hints: {
                level1: { id: 'Ini adalah selisih dua kuadrat.', en: 'This is a difference of squares.' },
                level2: { id: 'Rumus: a² - b² = (a+b)(a-b)', en: 'Formula: a² - b² = (a+b)(a-b)' },
                level3: { id: 'x² = x², dan 9 = 3². Jadi...', en: 'x² = x², and 9 = 3². So...' },
            },
        },
        {
            id: 'alg-essay-1',
            question: {
                id: 'Jelaskan dengan kata-katamu sendiri, apa yang dimaksud dengan variabel dalam aljabar? Berikan minimal 2 contoh penggunaan variabel dalam kehidupan sehari-hari.',
                en: 'Explain in your own words, what is a variable in algebra? Give at least 2 examples of variables used in daily life.'
            },
            type: 'essay',
            points: 25,
            minWords: 30,
            rubric: {
                id: 'Jawaban harus mencakup: (1) Definisi variabel (2) Minimal 2 contoh nyata',
                en: 'Answer must include: (1) Variable definition (2) At least 2 real examples'
            },
            keywords: ['variabel', 'simbol', 'nilai', 'belum diketahui', 'huruf'],
        },
    ],
    'math-geometry': [
        {
            id: 'geo-1',
            question: { id: 'Luas persegi dengan sisi 8 cm adalah...', en: 'Area of square with side 8 cm is...' },
            type: 'choice',
            options: ['32 cm²', '48 cm²', '64 cm²', '72 cm²'],
            correctAnswer: '64 cm²',
            points: 10,
        },
        {
            id: 'geo-2',
            question: { id: 'Keliling lingkaran dengan diameter 14 cm adalah... (π = 22/7)', en: 'Circumference of circle with diameter 14 cm is... (π = 22/7)' },
            type: 'choice',
            options: ['22 cm', '44 cm', '88 cm', '154 cm'],
            correctAnswer: '44 cm',
            points: 15,
        },
        {
            id: 'geo-3',
            question: { id: 'Luas segitiga dengan alas 10 cm dan tinggi 6 cm adalah...', en: 'Area of triangle with base 10 cm and height 6 cm is...' },
            type: 'choice',
            options: ['30 cm²', '60 cm²', '16 cm²', '20 cm²'],
            correctAnswer: '30 cm²',
            points: 10,
        },
        {
            id: 'geo-4',
            question: { id: 'Volume kubus dengan sisi 5 cm adalah...', en: 'Volume of cube with side 5 cm is...' },
            type: 'choice',
            options: ['25 cm³', '75 cm³', '100 cm³', '125 cm³'],
            correctAnswer: '125 cm³',
            points: 15,
        },
        {
            id: 'geo-5',
            question: { id: 'Jumlah sudut dalam segitiga adalah...', en: 'Sum of interior angles in a triangle is...' },
            type: 'choice',
            options: ['90°', '180°', '270°', '360°'],
            correctAnswer: '180°',
            points: 10,
        },
    ],
    'exam-1': [
        {
            id: 'exam-1',
            question: { id: 'Jika 5x - 10 = 25, maka x = ?', en: 'If 5x - 10 = 25, then x = ?' },
            type: 'choice',
            options: ['5', '6', '7', '8'],
            correctAnswer: '7',
            points: 10,
        },
        {
            id: 'exam-2',
            question: { id: 'Luas lingkaran dengan jari-jari 7 cm adalah... (π = 22/7)', en: 'Area of circle with radius 7 cm is... (π = 22/7)' },
            type: 'choice',
            options: ['44 cm²', '88 cm²', '154 cm²', '308 cm²'],
            correctAnswer: '154 cm²',
            points: 10,
        },
    ],
};

interface PracticeState {
    phase: 'list' | 'quiz' | 'results';
    activeQuiz: string | null;
    currentQuestion: number;
    answers: Record<string, string>;
    startTime: number | null;
}

export default function PracticePage() {
    const router = useRouter();
    const { isStudent, isLoading: authLoading } = useAuth();
    const { language, t } = useLanguage();
    const { addXp, completeQuiz, isQuizCompleted } = useGame();
    const { setExamMode, totalTokens, requestHint, isExamMode } = useAIHint();

    const [state, setState] = useState<PracticeState>({
        phase: 'list',
        activeQuiz: null,
        currentQuestion: 0,
        answers: {},
        startTime: null,
    });
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [essayAnswer, setEssayAnswer] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [currentHint, setCurrentHint] = useState<string | null>(null);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);

    // Redirect if not student
    useEffect(() => {
        if (!authLoading && !isStudent) {
            router.push('/login?role=student');
        }
    }, [isStudent, authLoading, router]);

    // Clean up exam mode on unmount
    useEffect(() => {
        return () => {
            setExamMode(false);
        };
    }, [setExamMode]);

    if (authLoading || !isStudent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const activeQuizData = state.activeQuiz ? PRACTICE_QUIZZES.find(q => q.id === state.activeQuiz) : null;
    const questions = state.activeQuiz ? QUIZ_QUESTIONS[state.activeQuiz] || [] : [];
    const currentQ = questions[state.currentQuestion];

    const handleStartQuiz = (quizId: string) => {
        const quiz = PRACTICE_QUIZZES.find(q => q.id === quizId);
        if (quiz?.isExamMode) {
            setExamMode(true);
        }
        setState({
            phase: 'quiz',
            activeQuiz: quizId,
            currentQuestion: 0,
            answers: {},
            startTime: Date.now(),
        });
        setScore(0);
        setCorrectCount(0);
        setHintsUsed(0);
    };

    const handleSelectAnswer = (answer: string) => {
        if (isAnswered) return;
        setSelectedAnswer(answer);
    };

    const handleCheck = () => {
        if (!currentQ) return;

        // For choice questions
        if (currentQ.type === 'choice') {
            if (!selectedAnswer) return;
            const correct = selectedAnswer === currentQ.correctAnswer;
            setIsCorrect(correct);
            setIsAnswered(true);

            if (correct) {
                setScore(prev => prev + currentQ.points);
                setCorrectCount(prev => prev + 1);
            }

            setState(prev => ({
                ...prev,
                answers: { ...prev.answers, [currentQ.id]: selectedAnswer },
            }));
        }
        // For essay questions
        else if (currentQ.type === 'essay') {
            const wordCount = essayAnswer.trim().split(/\s+/).filter(w => w).length;
            const meetsMinWords = wordCount >= (currentQ.minWords || 30);

            // For essays, we auto-approve if meets word count (teacher grades later)
            setIsCorrect(meetsMinWords);
            setIsAnswered(true);

            // Award points for completing essay (reduced if under word count)
            const earnedPoints = meetsMinWords ? currentQ.points : Math.floor(currentQ.points * 0.5);
            setScore(prev => prev + earnedPoints);
            if (meetsMinWords) {
                setCorrectCount(prev => prev + 1);
            }

            setState(prev => ({
                ...prev,
                answers: { ...prev.answers, [currentQ.id]: essayAnswer },
            }));
        }
    };

    const handleNext = () => {
        if (state.currentQuestion < questions.length - 1) {
            setState(prev => ({ ...prev, currentQuestion: prev.currentQuestion + 1 }));
            setSelectedAnswer(null);
            setEssayAnswer('');
            setIsAnswered(false);
            setIsCorrect(false);
            setShowHint(false);
            setCurrentHint(null);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        setState(prev => ({ ...prev, phase: 'results' }));
        setExamMode(false);

        if (state.activeQuiz && activeQuizData) {
            addXp(score);
            completeQuiz(state.activeQuiz, correctCount, questions.length);
        }
    };

    const handleRequestHint = () => {
        if (!currentQ || isExamMode) return;

        const response = requestHint({
            questionId: currentQ.id,
            attemptCount: hintsUsed + 1,
        });

        if (response.allowed && currentQ.hints) {
            const hintLevel = response.level;
            const hint = hintLevel === 1
                ? currentQ.hints.level1
                : hintLevel === 2
                    ? currentQ.hints.level2
                    : currentQ.hints.level3;
            setCurrentHint(hint[language] || hint.id);
            setShowHint(true);
            setHintsUsed(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (state.phase === 'quiz') {
            setExamMode(false);
            setState({ phase: 'list', activeQuiz: null, currentQuestion: 0, answers: {}, startTime: null });
        } else if (state.phase === 'results') {
            setState({ phase: 'list', activeQuiz: null, currentQuestion: 0, answers: {}, startTime: null });
        } else {
            router.push('/student/dashboard');
        }
    };

    // Quiz List View
    if (state.phase === 'list') {
        return (
            <div className="min-h-screen bg-duo-gray-100 pb-24">
                {/* Header */}
                <header className="bg-white border-b-2 border-duo-gray-200 sticky top-0 z-50">
                    <div className="flex items-center gap-4 px-4 py-3 max-w-4xl mx-auto">
                        <button onClick={handleBack} className="text-duo-gray-500 hover:text-duo-gray-700">
                            ← {t('action.back')}
                        </button>
                        <h1 className="font-extrabold text-duo-gray-900 flex-1">
                            ✏️ {t('nav.practice')}
                        </h1>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 py-6">
                    <p className="text-duo-gray-500 mb-6">
                        {language === 'id'
                            ? 'Pilih kuis untuk mulai berlatih. Gunakan AI Hint jika butuh bantuan!'
                            : 'Choose a quiz to start practicing. Use AI Hint if you need help!'}
                    </p>

                    <div className="space-y-4">
                        {PRACTICE_QUIZZES.map(quiz => {
                            const completed = isQuizCompleted(quiz.id);
                            return (
                                <div
                                    key={quiz.id}
                                    className={`card card-interactive ${quiz.isExamMode ? 'border-2 border-duo-red/30 bg-duo-red/5' : ''}`}
                                    onClick={() => handleStartQuiz(quiz.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl">{quiz.icon}</div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-duo-gray-900">
                                                {quiz.title[language] || quiz.title.id}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-duo-gray-500">
                                                <span>{quiz.questionCount} {language === 'id' ? 'soal' : 'questions'}</span>
                                                <span>•</span>
                                                <span className={`badge ${quiz.difficulty === 'easy' ? 'bg-duo-green/20 text-duo-green' :
                                                    quiz.difficulty === 'medium' ? 'bg-duo-yellow/20 text-duo-yellow-dark' :
                                                        'bg-duo-red/20 text-duo-red'
                                                    }`}>
                                                    {quiz.difficulty.toUpperCase()}
                                                </span>
                                                <span>•</span>
                                                <span>+{quiz.xpReward} XP</span>
                                            </div>
                                            {quiz.isExamMode && (
                                                <p className="text-xs text-duo-red mt-1 font-semibold">
                                                    🔒 {language === 'id' ? 'Mode Ujian - AI Terkunci' : 'Exam Mode - AI Locked'}
                                                    {quiz.timeLimit && ` • ${quiz.timeLimit} ${language === 'id' ? 'menit' : 'min'}`}
                                                </p>
                                            )}
                                        </div>
                                        {completed ? (
                                            <span className="text-2xl">✅</span>
                                        ) : (
                                            <span className="text-duo-blue text-xl">→</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>

                {/* Bottom Nav */}
                <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-duo-gray-200 px-4 py-2">
                    <div className="flex justify-around max-w-md mx-auto">
                        <NavItem emoji="🏠" label={t('nav.home')} onClick={() => router.push('/student/dashboard')} />
                        <NavItem emoji="📚" label={t('nav.learn')} onClick={() => router.push('/student/learn')} />
                        <NavItem emoji="✏️" label={t('nav.practice')} active onClick={() => { }} />
                        <NavItem emoji="🏆" label={t('nav.compete')} onClick={() => router.push('/student/compete')} />
                        <NavItem emoji="👤" label={t('nav.profile')} onClick={() => router.push('/student/profile')} />
                    </div>
                </nav>
            </div>
        );
    }

    // Results View
    if (state.phase === 'results') {
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
                    <p className="text-duo-gray-500 mb-6">
                        {activeQuizData?.title[language] || activeQuizData?.title.id}
                    </p>

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

                    {activeQuizData?.isExamMode && (
                        <div className="bg-duo-gray-100 rounded-xl p-4 mb-4 text-sm text-duo-gray-600">
                            🔒 {language === 'id' ? 'Diselesaikan dalam Mode Ujian' : 'Completed in Exam Mode'}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button onClick={handleBack} className="btn btn-primary btn-full">
                            {language === 'id' ? 'Kembali ke Daftar' : 'Back to List'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Quiz View
    if (!currentQ) return null;
    const progress = ((state.currentQuestion + 1) / questions.length) * 100;

    return (
        <div className="min-h-screen bg-duo-gray-100 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b-2 border-duo-gray-200 p-4">
                <div className="flex items-center gap-4 max-w-2xl mx-auto">
                    <button onClick={handleBack} className="text-duo-gray-500 hover:text-duo-gray-700">
                        ✕
                    </button>
                    <div className="flex-1 h-3 bg-duo-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${isExamMode ? 'bg-duo-red' : 'bg-duo-green'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {isExamMode && (
                        <span className="text-duo-red font-bold text-sm">🔒 EXAM</span>
                    )}
                </div>
            </header>

            {/* Question */}
            <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
                {/* Exam mode warning */}
                {isExamMode && (
                    <div className="bg-duo-red/10 border-2 border-duo-red/30 rounded-xl p-3 mb-4 text-center">
                        <p className="text-duo-red font-semibold text-sm">
                            🔒 {language === 'id' ? 'Mode Ujian Aktif - AI Hint Terkunci' : 'Exam Mode Active - AI Hints Locked'}
                        </p>
                    </div>
                )}

                {/* Question number */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="badge bg-duo-blue/20 text-duo-blue">
                        {language === 'id' ? 'Soal' : 'Q'} {state.currentQuestion + 1}/{questions.length}
                    </span>
                    <span className="text-sm text-duo-gray-500">+{currentQ.points} XP</span>
                </div>

                {/* Question text */}
                <div className="card mb-6">
                    <h2 className="text-xl font-bold text-duo-gray-900">
                        {currentQ.question[language] || currentQ.question.id}
                    </h2>
                </div>

                {/* Multiple Choice Options */}
                {currentQ.type === 'choice' && currentQ.options && (
                    <div className="space-y-3 mb-6">
                        {currentQ.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectAnswer(option)}
                                disabled={isAnswered}
                                className={`quiz-option w-full ${selectedAnswer === option ? 'selected' : ''
                                    } ${isAnswered && option === currentQ.correctAnswer ? 'correct' : ''
                                    } ${isAnswered && selectedAnswer === option && !isCorrect ? 'incorrect' : ''
                                    }`}
                            >
                                <span className="w-8 h-8 rounded-full bg-duo-gray-200 flex items-center justify-center font-bold text-sm">
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <span className="font-semibold">{option}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Essay Answer */}
                {currentQ.type === 'essay' && (
                    <div className="mb-6">
                        {/* Rubric hint */}
                        {currentQ.rubric && !isAnswered && (
                            <div className="bg-duo-blue/10 border-2 border-duo-blue/20 rounded-xl p-3 mb-4">
                                <p className="text-duo-blue text-sm font-medium">
                                    📋 {currentQ.rubric[language] || currentQ.rubric.id}
                                </p>
                            </div>
                        )}

                        <textarea
                            value={essayAnswer}
                            onChange={(e) => setEssayAnswer(e.target.value)}
                            disabled={isAnswered}
                            placeholder={language === 'id'
                                ? 'Tulis jawabanmu di sini...'
                                : 'Write your answer here...'}
                            className="w-full min-h-[180px] p-4 border-2 border-duo-gray-200 rounded-xl resize-y focus:border-duo-purple focus:outline-none disabled:bg-duo-gray-100"
                            rows={6}
                        />

                        {/* Word count */}
                        <div className="flex items-center justify-between mt-2 text-sm">
                            <span className={`${essayAnswer.trim().split(/\s+/).filter(w => w).length >= (currentQ.minWords || 30)
                                ? 'text-duo-green'
                                : 'text-duo-gray-500'
                                }`}>
                                📝 {essayAnswer.trim().split(/\s+/).filter(w => w).length} {language === 'id' ? 'kata' : 'words'}
                                {currentQ.minWords && ` / ${currentQ.minWords} min`}
                            </span>
                            {!isAnswered && essayAnswer.trim().split(/\s+/).filter(w => w).length >= (currentQ.minWords || 30) && (
                                <span className="text-duo-green font-semibold">✓ {language === 'id' ? 'Cukup' : 'Enough'}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Hint button (only if not exam mode) */}
                {!isExamMode && !isAnswered && currentQ.hints && totalTokens > 0 && (
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
                            <span className="text-2xl">{isCorrect ? '✅' : (currentQ.type === 'essay' ? '📝' : '❌')}</span>
                            <div>
                                <p className="font-bold">
                                    {currentQ.type === 'essay'
                                        ? (isCorrect
                                            ? (language === 'id' ? 'Jawaban Dikirim!' : 'Answer Submitted!')
                                            : (language === 'id' ? 'Perlu Lebih Banyak Kata' : 'Need More Words'))
                                        : (isCorrect
                                            ? (language === 'id' ? 'Benar!' : 'Correct!')
                                            : (language === 'id' ? 'Kurang Tepat' : 'Incorrect'))}
                                </p>
                                {currentQ.type === 'essay' && isCorrect && (
                                    <p className="text-sm text-duo-gray-500">
                                        {language === 'id' ? 'Guru akan menilai jawabanmu.' : 'Teacher will grade your answer.'}
                                    </p>
                                )}
                                {currentQ.type === 'choice' && !isCorrect && (
                                    <p className="text-sm text-duo-gray-500">
                                        {language === 'id' ? 'Jawaban: ' : 'Answer: '}{currentQ.correctAnswer}
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
                            disabled={currentQ.type === 'choice' ? !selectedAnswer : essayAnswer.trim().length === 0}
                            className={`btn btn-lg btn-full ${isExamMode ? 'bg-duo-red text-white' : 'btn-primary'}`}
                            style={{ boxShadow: isExamMode ? '0 4px 0 #EA2B2B' : undefined }}
                        >
                            {currentQ.type === 'essay'
                                ? (language === 'id' ? '📝 Kirim Jawaban' : '📝 Submit Answer')
                                : t('quiz.check')}
                        </button>
                    ) : (
                        <button onClick={handleNext} className="btn btn-primary btn-lg btn-full">
                            {state.currentQuestion < questions.length - 1
                                ? t('quiz.next')
                                : (language === 'id' ? 'Selesai' : 'Finish')}
                        </button>
                    )}
                </div>
            </footer>

            {/* AI Hint Panel (hidden in exam mode) */}
            {!isExamMode && (
                <AIHintPanel
                    currentQuestion={currentQ.question[language] || currentQ.question.id}
                    subject={activeQuizData?.subject || 'Matematika'}
                    context={{
                        options: currentQ.options,
                        rubric: typeof currentQ.rubric === 'object'
                            ? (currentQ.rubric[language as 'id' | 'en'] || currentQ.rubric.id)
                            : currentQ.rubric,
                        type: currentQ.type
                    }}
                />
            )}
        </div>
    );
}

function NavItem({ emoji, label, active = false, onClick }: { emoji: string; label: string; active?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg ${active ? 'text-duo-blue' : 'text-duo-gray-400 hover:text-duo-gray-600'
                }`}
        >
            <span className="text-xl">{emoji}</span>
            <span className="text-xs font-semibold">{label}</span>
        </button>
    );
}
