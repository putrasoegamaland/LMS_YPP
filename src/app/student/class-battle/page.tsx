'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

// Demo class battle data
const DEMO_BATTLES = [
    {
        id: 'battle-1',
        status: 'live' as const,
        classA: { id: 'class-1', name: 'Kelas 9A', score: 1250, studentCount: 32 },
        classB: { id: 'class-2', name: 'Kelas 9B', score: 1180, studentCount: 30 },
        round: 2,
        totalRounds: 3,
        timeLeft: 180, // seconds
        subject: 'Matematika',
    },
    {
        id: 'battle-2',
        status: 'upcoming' as const,
        classA: { id: 'class-1', name: 'Kelas 9A', score: 0, studentCount: 32 },
        classB: { id: 'class-3', name: 'Kelas 10A', score: 0, studentCount: 28 },
        scheduledTime: '2024-01-15T09:00:00',
        subject: 'Bahasa Inggris',
    },
    {
        id: 'battle-3',
        status: 'completed' as const,
        classA: { id: 'class-1', name: 'Kelas 9A', score: 2450, studentCount: 32 },
        classB: { id: 'class-4', name: 'Kelas 10B', score: 2100, studentCount: 30 },
        winner: 'class-1',
        subject: 'Matematika',
    },
];

const DEMO_QUESTIONS = [
    {
        id: 'q1',
        question: 'Berapa hasil dari 15² - 10²?',
        options: ['25', '75', '125', '225'],
        correctAnswer: '125',
        points: 100,
        difficulty: 'medium',
    },
    {
        id: 'q2',
        question: 'Jika 2x + 6 = 18, maka x = ?',
        options: ['4', '5', '6', '7'],
        correctAnswer: '6',
        points: 100,
        difficulty: 'easy',
    },
];

type BattlePhase = 'lobby' | 'warmup' | 'battle' | 'results';

export default function ClassBattlePage() {
    const router = useRouter();
    const { user, isStudent, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();
    const { addXp } = useGame();

    const [selectedBattle, setSelectedBattle] = useState<typeof DEMO_BATTLES[0] | null>(null);
    const [phase, setPhase] = useState<BattlePhase>('lobby');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [myScore, setMyScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);

    // Redirect if not student
    useEffect(() => {
        if (!authLoading && !isStudent) {
            router.push('/login?role=student');
        }
    }, [isStudent, authLoading, router]);

    // Timer for battle
    useEffect(() => {
        if (phase !== 'battle' || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, timeLeft]);

    if (authLoading || !isStudent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const handleJoinBattle = (battle: typeof DEMO_BATTLES[0]) => {
        if (battle.status !== 'live') return;
        setSelectedBattle(battle);
        setPhase('warmup');

        // Start battle after 3 seconds warmup
        setTimeout(() => {
            setPhase('battle');
            setTimeLeft(30);
        }, 3000);
    };

    const handleSelectAnswer = (answer: string) => {
        if (isAnswered) return;
        setSelectedAnswer(answer);
    };

    const handleSubmitAnswer = () => {
        if (!selectedAnswer) return;

        const question = DEMO_QUESTIONS[currentQuestion];
        const isCorrect = selectedAnswer === question.correctAnswer;
        setIsAnswered(true);

        if (isCorrect) {
            const timeBonus = Math.floor(timeLeft * 2);
            const points = question.points + timeBonus;
            setMyScore(prev => prev + points);
        }

        // Move to next question or end
        setTimeout(() => {
            if (currentQuestion < DEMO_QUESTIONS.length - 1) {
                setCurrentQuestion(prev => prev + 1);
                setSelectedAnswer(null);
                setIsAnswered(false);
                setTimeLeft(30);
            } else {
                handleBattleEnd();
            }
        }, 1500);
    };

    const handleTimeUp = () => {
        setIsAnswered(true);
        setTimeout(() => {
            if (currentQuestion < DEMO_QUESTIONS.length - 1) {
                setCurrentQuestion(prev => prev + 1);
                setSelectedAnswer(null);
                setIsAnswered(false);
                setTimeLeft(30);
            } else {
                handleBattleEnd();
            }
        }, 1000);
    };

    const handleBattleEnd = () => {
        setPhase('results');
        addXp(myScore);
    };

    const handleExit = () => {
        if (phase === 'battle') {
            // Confirm exit
            if (!confirm(language === 'id' ? 'Yakin keluar? Skor kamu akan hilang!' : 'Sure to exit? Your score will be lost!')) {
                return;
            }
        }
        setSelectedBattle(null);
        setPhase('lobby');
        setCurrentQuestion(0);
        setMyScore(0);
        router.push('/student/compete');
    };

    // Lobby View
    if (phase === 'lobby' && !selectedBattle) {
        return (
            <div className="min-h-screen bg-duo-gray-100 pb-24">
                {/* Header */}
                <header className="bg-gradient-to-r from-duo-red to-duo-orange text-white">
                    <div className="max-w-4xl mx-auto px-4 py-6">
                        <div className="flex items-center gap-4 mb-4">
                            <button onClick={() => router.push('/student/compete')} className="text-white/80 hover:text-white">
                                ← Back
                            </button>
                            <h1 className="font-extrabold text-xl flex-1">⚔️ Class Battle</h1>
                        </div>
                        <p className="text-white/80">
                            {language === 'id' ? 'Bertarung melawan kelas lain secara real-time!' : 'Battle against other classes in real-time!'}
                        </p>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 py-6">
                    {/* Live Battles */}
                    <section className="mb-8">
                        <h2 className="font-bold text-duo-gray-900 mb-4">
                            🔴 {language === 'id' ? 'Pertandingan Berlangsung' : 'Live Battles'}
                        </h2>
                        {DEMO_BATTLES.filter(b => b.status === 'live').map(battle => (
                            <div key={battle.id} className="card border-2 border-duo-red mb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="badge bg-duo-red text-white animate-pulse">🔴 LIVE</span>
                                    <span className="text-sm text-duo-gray-500">
                                        {language === 'id' ? 'Ronde' : 'Round'} {battle.round}/{battle.totalRounds}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-center flex-1">
                                        <p className="font-bold text-duo-gray-900">{battle.classA.name}</p>
                                        <p className="text-2xl font-extrabold text-duo-blue">{battle.classA.score}</p>
                                    </div>
                                    <div className="text-2xl font-bold text-duo-gray-400 px-4">VS</div>
                                    <div className="text-center flex-1">
                                        <p className="font-bold text-duo-gray-900">{battle.classB.name}</p>
                                        <p className="text-2xl font-extrabold text-duo-orange">{battle.classB.score}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleJoinBattle(battle)}
                                    className="btn btn-warning btn-full"
                                >
                                    ⚔️ {language === 'id' ? 'Gabung Pertandingan' : 'Join Battle'}
                                </button>
                            </div>
                        ))}
                    </section>

                    {/* Upcoming Battles */}
                    <section className="mb-8">
                        <h2 className="font-bold text-duo-gray-900 mb-4">
                            📅 {language === 'id' ? 'Pertandingan Mendatang' : 'Upcoming Battles'}
                        </h2>
                        {DEMO_BATTLES.filter(b => b.status === 'upcoming').map(battle => (
                            <div key={battle.id} className="card mb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="badge bg-duo-blue/20 text-duo-blue">📅 Upcoming</span>
                                    <span className="text-sm text-duo-gray-500">{battle.subject}</span>
                                </div>

                                <div className="flex items-center justify-between text-center">
                                    <div className="flex-1">
                                        <p className="font-bold text-duo-gray-900">{battle.classA.name}</p>
                                        <p className="text-sm text-duo-gray-500">{battle.classA.studentCount} siswa</p>
                                    </div>
                                    <div className="text-xl font-bold text-duo-gray-400 px-4">VS</div>
                                    <div className="flex-1">
                                        <p className="font-bold text-duo-gray-900">{battle.classB.name}</p>
                                        <p className="text-sm text-duo-gray-500">{battle.classB.studentCount} siswa</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Past Battles */}
                    <section>
                        <h2 className="font-bold text-duo-gray-900 mb-4">
                            🏆 {language === 'id' ? 'Riwayat Pertandingan' : 'Past Battles'}
                        </h2>
                        {DEMO_BATTLES.filter(b => b.status === 'completed').map(battle => (
                            <div key={battle.id} className="card mb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="badge bg-duo-green/20 text-duo-green">✅ Selesai</span>
                                    <span className="text-sm text-duo-gray-500">{battle.subject}</span>
                                </div>

                                <div className="flex items-center justify-between text-center">
                                    <div className={`flex-1 ${battle.winner === battle.classA.id ? 'text-duo-green' : ''}`}>
                                        <p className="font-bold">{battle.classA.name}</p>
                                        <p className="text-xl font-extrabold">{battle.classA.score}</p>
                                        {battle.winner === battle.classA.id && <span className="text-sm">🏆 Winner</span>}
                                    </div>
                                    <div className="text-xl font-bold text-duo-gray-400 px-4">VS</div>
                                    <div className={`flex-1 ${battle.winner === battle.classB.id ? 'text-duo-green' : ''}`}>
                                        <p className="font-bold">{battle.classB.name}</p>
                                        <p className="text-xl font-extrabold">{battle.classB.score}</p>
                                        {battle.winner === battle.classB.id && <span className="text-sm">🏆 Winner</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>
                </main>
            </div>
        );
    }

    // Warmup View
    if (phase === 'warmup') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-duo-red to-duo-orange flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="text-6xl mb-4 animate-bounce">⚔️</div>
                    <h1 className="text-3xl font-extrabold mb-2">
                        {language === 'id' ? 'Bersiap-siap!' : 'Get Ready!'}
                    </h1>
                    <p className="text-xl opacity-80">
                        {language === 'id' ? 'Pertandingan dimulai dalam 3 detik...' : 'Battle starts in 3 seconds...'}
                    </p>
                </div>
            </div>
        );
    }

    // Battle View
    if (phase === 'battle' && selectedBattle) {
        const question = DEMO_QUESTIONS[currentQuestion];
        const progress = ((currentQuestion + 1) / DEMO_QUESTIONS.length) * 100;
        const isCorrect = selectedAnswer === question.correctAnswer;

        return (
            <div className="min-h-screen bg-duo-gray-100 flex flex-col">
                {/* Header with scores */}
                <header className="bg-gradient-to-r from-duo-blue to-duo-orange p-4">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center justify-between text-white mb-2">
                            <div className="text-center">
                                <p className="text-xs opacity-80">{selectedBattle.classA.name}</p>
                                <p className="text-xl font-bold">{selectedBattle.classA.score + myScore}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs opacity-80">VS</p>
                                <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-duo-yellow animate-pulse' : ''}`}>
                                    {timeLeft}s
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs opacity-80">{selectedBattle.classB.name}</p>
                                <p className="text-xl font-bold">{selectedBattle.classB.score}</p>
                            </div>
                        </div>
                        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </header>

                {/* Question */}
                <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
                    <div className="card mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="badge bg-duo-purple/20 text-duo-purple">
                                Q{currentQuestion + 1}
                            </span>
                            <span className="text-sm text-duo-gray-500">+{question.points} pts</span>
                        </div>
                        <h2 className="text-xl font-bold text-duo-gray-900">{question.question}</h2>
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
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <span className="font-semibold">{option}</span>
                            </button>
                        ))}
                    </div>

                    {/* My Score */}
                    <div className="text-center">
                        <p className="text-sm text-duo-gray-500">
                            {language === 'id' ? 'Skor Kamu:' : 'Your Score:'}
                        </p>
                        <p className="text-2xl font-bold text-duo-green">{myScore}</p>
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white border-t-2 border-duo-gray-200 p-4">
                    <div className="max-w-2xl mx-auto">
                        <button
                            onClick={handleSubmitAnswer}
                            disabled={!selectedAnswer || isAnswered}
                            className="btn btn-warning btn-lg btn-full"
                        >
                            {isAnswered
                                ? (isCorrect ? '✅ Benar!' : '❌ Salah')
                                : (language === 'id' ? 'Submit Jawaban' : 'Submit Answer')}
                        </button>
                    </div>
                </footer>
            </div>
        );
    }

    // Results View
    if (phase === 'results') {
        const finalClassAScore = (selectedBattle?.classA.score || 0) + myScore;
        const finalClassBScore = selectedBattle?.classB.score || 0;
        const won = finalClassAScore > finalClassBScore;

        return (
            <div className="min-h-screen bg-duo-gray-100 flex items-center justify-center p-4">
                <div className="card max-w-md w-full text-center">
                    <div className="text-6xl mb-4">{won ? '🏆' : '💪'}</div>
                    <h1 className="text-2xl font-extrabold text-duo-gray-900 mb-2">
                        {won
                            ? (language === 'id' ? 'Kelas Kamu Menang!' : 'Your Class Won!')
                            : (language === 'id' ? 'Pertandingan Selesai!' : 'Battle Complete!')}
                    </h1>

                    <div className="flex items-center justify-around my-6">
                        <div className={`text-center ${won ? 'text-duo-green' : ''}`}>
                            <p className="font-bold">{selectedBattle?.classA.name}</p>
                            <p className="text-3xl font-extrabold">{finalClassAScore}</p>
                        </div>
                        <div className="text-2xl font-bold text-duo-gray-400">VS</div>
                        <div className={`text-center ${!won ? 'text-duo-green' : ''}`}>
                            <p className="font-bold">{selectedBattle?.classB.name}</p>
                            <p className="text-3xl font-extrabold">{finalClassBScore}</p>
                        </div>
                    </div>

                    <div className="bg-duo-yellow/10 rounded-xl p-4 mb-6">
                        <p className="text-sm text-duo-gray-500">
                            {language === 'id' ? 'Kontribusimu:' : 'Your Contribution:'}
                        </p>
                        <p className="text-2xl font-bold text-duo-yellow-dark">+{myScore} pts</p>
                    </div>

                    <button onClick={handleExit} className="btn btn-primary btn-full">
                        {language === 'id' ? 'Kembali ke Lobi' : 'Back to Lobby'}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
