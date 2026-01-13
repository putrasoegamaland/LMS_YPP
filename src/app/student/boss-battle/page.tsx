'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

// Boss data - weekly themed bosses
const BOSS_DATA = [
    {
        id: 'dragon-math',
        name: { id: 'Naga Aljabar', en: 'Algebra Dragon' },
        icon: '🐉',
        subject: 'matematika',
        hp: 1000,
        difficulty: 'BOSS',
        xpReward: 500,
        description: {
            id: 'Kalahkan naga dengan menjawab soal aljabar dengan benar!',
            en: 'Defeat the dragon by answering algebra questions correctly!'
        }
    },
    {
        id: 'sphinx-geometry',
        name: { id: 'Sphinx Geometri', en: 'Geometry Sphinx' },
        icon: '🦁',
        subject: 'matematika',
        hp: 800,
        difficulty: 'BOSS',
        xpReward: 400,
        description: {
            id: 'Pecahkan teka-teki geometri sang Sphinx!',
            en: 'Solve the geometry riddles of the Sphinx!'
        }
    },
];

// Boss questions - harder than regular
const BOSS_QUESTIONS = [
    {
        id: 'boss-1',
        question: { id: 'Jika 2x² + 5x - 3 = 0, salah satu nilai x adalah...', en: 'If 2x² + 5x - 3 = 0, one value of x is...' },
        options: ['1/2', '-3', '3', '-1/2'],
        correctAnswer: '1/2',
        damage: 150,
    },
    {
        id: 'boss-2',
        question: { id: 'Luas permukaan kubus dengan volume 64 cm³ adalah...', en: 'Surface area of cube with volume 64 cm³ is...' },
        options: ['64 cm²', '96 cm²', '128 cm²', '256 cm²'],
        correctAnswer: '96 cm²',
        damage: 120,
    },
    {
        id: 'boss-3',
        question: { id: 'Jika log₂ 8 + log₂ 4 = ...', en: 'If log₂ 8 + log₂ 4 = ...' },
        options: ['5', '6', '7', '12'],
        correctAnswer: '5',
        damage: 180,
    },
    {
        id: 'boss-4',
        question: { id: 'Nilai dari sin 30° × cos 60° adalah...', en: 'Value of sin 30° × cos 60° is...' },
        options: ['1/4', '1/2', '√3/4', '√3/2'],
        correctAnswer: '1/4',
        damage: 200,
    },
    {
        id: 'boss-5',
        question: { id: 'Jumlah 20 suku pertama deret 3, 6, 9, 12, ... adalah...', en: 'Sum of first 20 terms of sequence 3, 6, 9, 12, ... is...' },
        options: ['600', '630', '660', '690'],
        correctAnswer: '630',
        damage: 250,
    },
];

type BattlePhase = 'intro' | 'battle' | 'victory' | 'defeat';

export default function BossBattlePage() {
    const router = useRouter();
    const { isStudent, isLoading: authLoading } = useAuth();
    const { language, t } = useLanguage();
    const { addXp, streak } = useGame();

    const [phase, setPhase] = useState<BattlePhase>('intro');
    const [currentBoss, setCurrentBoss] = useState(BOSS_DATA[0]);
    const [bossHp, setBossHp] = useState(BOSS_DATA[0].hp);
    const [playerHp, setPlayerHp] = useState(100);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [combo, setCombo] = useState(0);
    const [totalDamage, setTotalDamage] = useState(0);
    const [shake, setShake] = useState(false);
    const [showDamage, setShowDamage] = useState<number | null>(null);

    // Check if today is Friday (Boss Battle day)
    const today = new Date();
    const isFriday = today.getDay() === 5;

    const currentQ = BOSS_QUESTIONS[currentQuestion];

    const handleNext = useCallback(() => {
        // Check win/lose conditions
        if (bossHp <= 0) {
            setPhase('victory');
            addXp(currentBoss.xpReward);
            return;
        }

        if (playerHp <= 0) {
            setPhase('defeat');
            return;
        }

        // Next question or cycle
        if (currentQuestion < BOSS_QUESTIONS.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            setCurrentQuestion(0);
        }

        setSelectedAnswer(null);
        setIsAnswered(false);
        setIsCorrect(false);
    }, [bossHp, playerHp, currentQuestion, addXp, currentBoss.xpReward]);

    // Redirect if not student
    useEffect(() => {
        if (!authLoading && !isStudent) {
            router.push('/login?role=student');
        }
    }, [isStudent, authLoading, router]);

    // Auto-proceed after showing result
    useEffect(() => {
        if (isAnswered && phase === 'battle') {
            const timer = setTimeout(handleNext, 1500);
            return () => clearTimeout(timer);
        }
    }, [isAnswered, handleNext, phase]);

    if (authLoading || !isStudent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const handleStartBattle = () => {
        setPhase('battle');
        setBossHp(currentBoss.hp);
        setPlayerHp(100);
        setCurrentQuestion(0);
        setCombo(0);
        setTotalDamage(0);
    };

    const handleSelectAnswer = (answer: string) => {
        if (isAnswered) return;
        setSelectedAnswer(answer);
    };

    const handleAttack = () => {
        if (!selectedAnswer || !currentQ) return;

        const correct = selectedAnswer === currentQ.correctAnswer;
        setIsCorrect(correct);
        setIsAnswered(true);

        if (correct) {
            // Calculate damage with combo bonus
            const comboMultiplier = 1 + (combo * 0.2);
            const streakBonus = streak > 0 ? 1.1 : 1;
            const damage = Math.floor(currentQ.damage * comboMultiplier * streakBonus);

            setTotalDamage(prev => prev + damage);
            setBossHp(prev => Math.max(0, prev - damage));
            setCombo(prev => prev + 1);
            setShowDamage(damage);

            // Shake effect
            setShake(true);
            setTimeout(() => setShake(false), 300);
            setTimeout(() => setShowDamage(null), 1000);
        } else {
            // Boss counterattack
            setPlayerHp(prev => Math.max(0, prev - 20));
            setCombo(0);
        }
    };

    // Intro View
    if (phase === 'intro') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-duo-gray-900 via-purple-900 to-duo-gray-900 flex flex-col items-center justify-center p-4">
                {/* Warning if not Friday */}
                {!isFriday && (
                    <div className="bg-duo-yellow/20 border-2 border-duo-yellow rounded-xl p-4 mb-6 max-w-md text-center">
                        <p className="text-duo-yellow font-bold">
                            ⚠️ {language === 'id' ? 'Boss Battle khusus hari Jumat! Ini mode demo.' : 'Boss Battle is Friday-only! This is demo mode.'}
                        </p>
                    </div>
                )}

                {/* Boss Card */}
                <div className="text-center mb-8">
                    <div className="text-8xl mb-4 animate-pulse">{currentBoss.icon}</div>
                    <h1 className="text-4xl font-extrabold text-white mb-2">
                        {currentBoss.name[language] || currentBoss.name.id}
                    </h1>
                    <span className="badge bg-duo-red text-white text-lg px-4 py-2">
                        🔥 {currentBoss.difficulty}
                    </span>
                </div>

                {/* Boss Stats */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full mb-8">
                    <div className="grid grid-cols-2 gap-4 text-white text-center">
                        <div>
                            <p className="text-3xl font-bold text-duo-red">❤️ {currentBoss.hp}</p>
                            <p className="text-sm opacity-70">HP</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-duo-yellow">⭐ {currentBoss.xpReward}</p>
                            <p className="text-sm opacity-70">XP Reward</p>
                        </div>
                    </div>
                    <p className="text-white/80 text-center mt-4">
                        {currentBoss.description[language] || currentBoss.description.id}
                    </p>
                </div>

                {/* Start Button */}
                <button
                    onClick={handleStartBattle}
                    className="btn bg-duo-red text-white px-12 py-4 text-xl font-bold"
                    style={{ boxShadow: '0 6px 0 #c41e3a' }}
                >
                    ⚔️ {language === 'id' ? 'MULAI PERTARUNGAN!' : 'START BATTLE!'}
                </button>

                <button
                    onClick={() => router.push('/student/dashboard')}
                    className="mt-4 text-white/60 hover:text-white"
                >
                    ← {t('action.back')}
                </button>
            </div>
        );
    }

    // Victory View
    if (phase === 'victory') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-duo-green to-emerald-700 flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <div className="text-8xl mb-4">🏆</div>
                    <h1 className="text-4xl font-extrabold text-white mb-2">
                        {language === 'id' ? 'MENANG!' : 'VICTORY!'}
                    </h1>
                    <p className="text-white/80 text-xl mb-8">
                        {language === 'id'
                            ? `Kamu mengalahkan ${currentBoss.name.id}!`
                            : `You defeated ${currentBoss.name.en}!`}
                    </p>

                    <div className="bg-white/20 rounded-2xl p-6 inline-block mb-8">
                        <div className="grid grid-cols-2 gap-6 text-white text-center">
                            <div>
                                <p className="text-4xl font-bold">⚔️ {totalDamage}</p>
                                <p className="text-sm">{language === 'id' ? 'Total Damage' : 'Total Damage'}</p>
                            </div>
                            <div>
                                <p className="text-4xl font-bold">+{currentBoss.xpReward}</p>
                                <p className="text-sm">XP</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/student/dashboard')}
                        className="btn btn-primary px-8 py-3 text-lg"
                    >
                        🏠 {language === 'id' ? 'Kembali' : 'Return Home'}
                    </button>
                </div>
            </div>
        );
    }

    // Defeat View
    if (phase === 'defeat') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-duo-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <div className="text-8xl mb-4">💀</div>
                    <h1 className="text-4xl font-extrabold text-white mb-2">
                        {language === 'id' ? 'KALAH...' : 'DEFEATED...'}
                    </h1>
                    <p className="text-white/60 text-xl mb-8">
                        {language === 'id'
                            ? 'Jangan menyerah! Belajar lagi dan coba lagi!'
                            : "Don't give up! Study more and try again!"}
                    </p>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={handleStartBattle}
                            className="btn bg-duo-red text-white px-6 py-3"
                        >
                            🔄 {language === 'id' ? 'Coba Lagi' : 'Try Again'}
                        </button>
                        <button
                            onClick={() => router.push('/student/dashboard')}
                            className="btn btn-ghost text-white px-6 py-3"
                        >
                            🏠 {language === 'id' ? 'Kembali' : 'Return'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Battle View
    return (
        <div className="min-h-screen bg-gradient-to-b from-duo-gray-900 via-purple-900 to-duo-gray-900 flex flex-col">
            {/* Top Bar - HP Bars */}
            <div className="p-4">
                {/* Boss HP */}
                <div className="max-w-md mx-auto mb-4">
                    <div className="flex items-center gap-3">
                        <span className={`text-4xl ${shake ? 'animate-bounce' : ''}`}>{currentBoss.icon}</span>
                        <div className="flex-1">
                            <div className="flex justify-between text-white text-sm mb-1">
                                <span className="font-bold">{currentBoss.name[language] || currentBoss.name.id}</span>
                                <span>❤️ {bossHp}/{currentBoss.hp}</span>
                            </div>
                            <div className="h-4 bg-duo-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-duo-red transition-all duration-300"
                                    style={{ width: `${(bossHp / currentBoss.hp) * 100}%` }}
                                />
                            </div>
                        </div>
                        {showDamage && (
                            <span className="text-duo-yellow font-bold text-xl animate-bounce">
                                -{showDamage}
                            </span>
                        )}
                    </div>
                </div>

                {/* Player HP */}
                <div className="max-w-md mx-auto">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🧑‍🎓</span>
                        <div className="flex-1">
                            <div className="flex justify-between text-white text-sm mb-1">
                                <span className="font-bold">{language === 'id' ? 'Kamu' : 'You'}</span>
                                <span>❤️ {playerHp}/100</span>
                            </div>
                            <div className="h-3 bg-duo-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-duo-green transition-all"
                                    style={{ width: `${playerHp}%` }}
                                />
                            </div>
                        </div>
                        {combo > 0 && (
                            <span className="badge bg-duo-yellow text-duo-gray-900 font-bold">
                                🔥 {combo}x
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Question Card */}
            <div className="flex-1 p-4 flex flex-col justify-center">
                <div className="bg-white rounded-2xl p-6 max-w-md mx-auto w-full shadow-2xl">
                    <h2 className="text-lg font-bold text-duo-gray-900 mb-6 text-center">
                        {currentQ.question[language] || currentQ.question.id}
                    </h2>

                    <div className="space-y-3">
                        {currentQ.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectAnswer(option)}
                                disabled={isAnswered}
                                className={`quiz-option w-full ${selectedAnswer === option ? 'selected' : ''
                                    } ${isAnswered && option === currentQ.correctAnswer ? 'correct' : ''
                                    } ${isAnswered && selectedAnswer === option && !isCorrect ? 'incorrect' : ''}`}
                            >
                                <span className="w-8 h-8 rounded-full bg-duo-gray-200 flex items-center justify-center font-bold text-sm">
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <span className="font-semibold">{option}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Attack Button */}
            <div className="p-4">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={handleAttack}
                        disabled={!selectedAnswer || isAnswered}
                        className="w-full py-4 rounded-xl font-bold text-lg text-white bg-duo-red disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ boxShadow: '0 4px 0 #c41e3a' }}
                    >
                        ⚔️ {language === 'id' ? 'SERANG!' : 'ATTACK!'}
                    </button>
                </div>
            </div>
        </div>
    );
}
