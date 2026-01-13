'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import Image from 'next/image';

interface RaidBoss {
    id: string;
    name: string;
    nameId: string;
    emoji: string;
    maxHp: number;
    currentHp: number;
    difficulty: 'normal' | 'hard' | 'legendary';
    rewards: {
        xp: number;
        badge?: string;
    };
}

interface RaidQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    damage: number;
    timeLimit: number; // seconds
}

interface RaidMember {
    id: string;
    name: string;
    avatar: string;
    damageDealt: number;
    correctAnswers: number;
    isActive: boolean;
}

// Mock raid bosses
const RAID_BOSSES: RaidBoss[] = [
    {
        id: 'dragon-algebra',
        name: 'Dragon of Algebra',
        nameId: 'Naga Aljabar',
        emoji: '🐉',
        maxHp: 1000,
        currentHp: 1000,
        difficulty: 'normal',
        rewards: { xp: 500, badge: 'dragon_slayer' }
    },
    {
        id: 'sphinx-geometry',
        name: 'Geometry Sphinx',
        nameId: 'Sphinx Geometri',
        emoji: '🦁',
        maxHp: 1500,
        currentHp: 1500,
        difficulty: 'hard',
        rewards: { xp: 800, badge: 'sphinx_master' }
    },
    {
        id: 'kraken-calculus',
        name: 'Calculus Kraken',
        nameId: 'Kraken Kalkulus',
        emoji: '🐙',
        maxHp: 2500,
        currentHp: 2500,
        difficulty: 'legendary',
        rewards: { xp: 1500, badge: 'kraken_conqueror' }
    },
];

// Mock questions
const RAID_QUESTIONS: RaidQuestion[] = [
    { id: 'q1', question: 'Berapakah hasil dari 5x + 3 = 18? Nilai x adalah...', options: ['3', '5', '15', '2'], correctAnswer: '3', damage: 100, timeLimit: 30 },
    { id: 'q2', question: 'Luas segitiga dengan alas 10 dan tinggi 6 adalah...', options: ['30', '60', '16', '45'], correctAnswer: '30', damage: 100, timeLimit: 30 },
    { id: 'q3', question: 'Hasil dari 2³ × 3² adalah...', options: ['36', '72', '48', '54'], correctAnswer: '72', damage: 120, timeLimit: 25 },
    { id: 'q4', question: 'Jika a = 4, b = 3, maka a² + b² = ...', options: ['25', '12', '49', '7'], correctAnswer: '25', damage: 100, timeLimit: 30 },
    { id: 'q5', question: 'Keliling persegi dengan sisi 7 cm adalah...', options: ['28 cm', '49 cm', '14 cm', '21 cm'], correctAnswer: '28 cm', damage: 80, timeLimit: 30 },
];

// Mock class members
const MOCK_MEMBERS: RaidMember[] = [
    { id: 'm1', name: 'Budi S.', avatar: '👦', damageDealt: 0, correctAnswers: 0, isActive: true },
    { id: 'm2', name: 'Siti A.', avatar: '👧', damageDealt: 0, correctAnswers: 0, isActive: true },
    { id: 'm3', name: 'Andi P.', avatar: '👦', damageDealt: 0, correctAnswers: 0, isActive: false },
    { id: 'm4', name: 'Dewi K.', avatar: '👧', damageDealt: 0, correctAnswers: 0, isActive: true },
];

type RaidPhase = 'lobby' | 'battle' | 'victory' | 'defeat';

export default function CoopRaidPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();
    const { addXp } = useGame();

    const [phase, setPhase] = useState<RaidPhase>('lobby');
    const [selectedBoss, setSelectedBoss] = useState<RaidBoss | null>(null);
    const [currentBoss, setCurrentBoss] = useState<RaidBoss | null>(null);
    const [members, setMembers] = useState<RaidMember[]>(MOCK_MEMBERS);
    const [currentQuestion, setCurrentQuestion] = useState<RaidQuestion | null>(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [totalDamage, setTotalDamage] = useState(0);
    const [combo, setCombo] = useState(0);

    // Timer countdown
    useEffect(() => {
        if (phase !== 'battle' || !currentQuestion || showResult) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleAnswer(null); // Time's up
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, currentQuestion, showResult]);

    // Auth check
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
                <div className="spinner"></div>
            </div>
        );
    }

    const startRaid = () => {
        if (!selectedBoss) return;
        setCurrentBoss({ ...selectedBoss });
        setPhase('battle');
        setQuestionIndex(0);
        setCurrentQuestion(RAID_QUESTIONS[0]);
        setTimeLeft(RAID_QUESTIONS[0].timeLimit);
        setTotalDamage(0);
        setCombo(0);
    };

    const handleAnswer = (answer: string | null) => {
        if (!currentQuestion || !currentBoss) return;

        const correct = answer === currentQuestion.correctAnswer;
        setIsCorrect(correct);
        setSelectedAnswer(answer);
        setShowResult(true);

        if (correct) {
            // Calculate damage with combo bonus
            const comboDamage = Math.floor(currentQuestion.damage * (1 + combo * 0.1));
            setTotalDamage(prev => prev + comboDamage);
            setCombo(prev => prev + 1);

            // Deal damage to boss
            setCurrentBoss(prev => {
                if (!prev) return null;
                const newHp = Math.max(0, prev.currentHp - comboDamage);
                return { ...prev, currentHp: newHp };
            });

            // Update member stats
            setMembers(prev => prev.map(m =>
                m.id === 'm1' // Assuming current user is first member
                    ? { ...m, damageDealt: m.damageDealt + comboDamage, correctAnswers: m.correctAnswers + 1 }
                    : m
            ));
        } else {
            setCombo(0);
        }

        // Move to next question after delay
        setTimeout(() => {
            if (currentBoss && currentBoss.currentHp - (correct ? currentQuestion.damage : 0) <= 0) {
                setPhase('victory');
                addXp(currentBoss.rewards.xp);
            } else if (questionIndex < RAID_QUESTIONS.length - 1) {
                const nextIndex = questionIndex + 1;
                setQuestionIndex(nextIndex);
                setCurrentQuestion(RAID_QUESTIONS[nextIndex]);
                setTimeLeft(RAID_QUESTIONS[nextIndex].timeLimit);
                setSelectedAnswer(null);
                setShowResult(false);
            } else {
                setPhase('defeat');
            }
        }, 1500);
    };

    const resetRaid = () => {
        setPhase('lobby');
        setSelectedBoss(null);
        setCurrentBoss(null);
        setCurrentQuestion(null);
        setQuestionIndex(0);
        setTotalDamage(0);
        setCombo(0);
        setMembers(MOCK_MEMBERS);
    };

    const getDifficultyStyle = (difficulty: RaidBoss['difficulty']) => {
        const styles = {
            normal: 'from-green-500 to-emerald-600',
            hard: 'from-orange-500 to-red-600',
            legendary: 'from-purple-500 to-pink-600 animate-pulse',
        };
        return styles[difficulty];
    };

    const getHpPercent = () => {
        if (!currentBoss) return 100;
        return (currentBoss.currentHp / currentBoss.maxHp) * 100;
    };

    const getHpColor = () => {
        const percent = getHpPercent();
        if (percent > 50) return 'bg-duo-green';
        if (percent > 25) return 'bg-duo-yellow';
        return 'bg-duo-red';
    };

    // Lobby Phase
    if (phase === 'lobby') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white p-6">
                {/* Header */}
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => router.push('/student/dashboard')} className="text-white/70 hover:text-white mb-6 flex items-center gap-2">
                        ← {language === 'id' ? 'Kembali' : 'Back'}
                    </button>

                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-extrabold mb-2">
                            ⚔️ {language === 'id' ? 'Raid Co-op' : 'Co-op Raid'}
                        </h1>
                        <p className="text-white/70">
                            {language === 'id' ? 'Kalahkan boss bersama kelasmu!' : 'Defeat the boss with your class!'}
                        </p>
                    </div>

                    {/* Boss Selection */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4">
                            🎯 {language === 'id' ? 'Pilih Boss' : 'Select Boss'}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {RAID_BOSSES.map(boss => (
                                <button
                                    key={boss.id}
                                    onClick={() => setSelectedBoss(boss)}
                                    className={`p-6 rounded-2xl bg-gradient-to-br ${getDifficultyStyle(boss.difficulty)} 
                                        ${selectedBoss?.id === boss.id ? 'ring-4 ring-white scale-105' : 'opacity-80 hover:opacity-100'}
                                        transition-all duration-300`}
                                >
                                    <div className="text-5xl mb-3">{boss.emoji}</div>
                                    <h3 className="text-lg font-bold">{language === 'id' ? boss.nameId : boss.name}</h3>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <span>❤️ {boss.maxHp} HP</span>
                                    </div>
                                    <div className="mt-2 text-sm opacity-80">
                                        🎁 {boss.rewards.xp} XP
                                    </div>
                                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${boss.difficulty === 'normal' ? 'bg-green-400/30' :
                                        boss.difficulty === 'hard' ? 'bg-orange-400/30' : 'bg-purple-400/30'
                                        }`}>
                                        {boss.difficulty}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Team Members */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4">
                            👥 {language === 'id' ? 'Tim Kamu' : 'Your Team'} ({members.filter(m => m.isActive).length}/{members.length})
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {members.map(member => (
                                <div
                                    key={member.id}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${member.isActive ? 'bg-white/20' : 'bg-white/5 opacity-50'
                                        }`}
                                >
                                    <span className="text-2xl">{member.avatar}</span>
                                    <span className="font-semibold">{member.name}</span>
                                    {member.isActive && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={startRaid}
                        disabled={!selectedBoss}
                        className={`w-full py-4 rounded-2xl font-bold text-xl transition-all ${selectedBoss
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:scale-105 text-black'
                            : 'bg-white/20 cursor-not-allowed'
                            }`}
                    >
                        ⚔️ {language === 'id' ? 'MULAI RAID!' : 'START RAID!'}
                    </button>
                </div>
            </div>
        );
    }

    // Battle Phase
    if (phase === 'battle' && currentBoss && currentQuestion) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
                {/* Boss Section */}
                <div className="p-6 bg-black/30">
                    <div className="max-w-4xl mx-auto">
                        {/* Boss HP Bar */}
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-4xl">{currentBoss.emoji}</span>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold">{language === 'id' ? currentBoss.nameId : currentBoss.name}</span>
                                    <span className="text-sm">{currentBoss.currentHp} / {currentBoss.maxHp} HP</span>
                                </div>
                                <div className="h-4 bg-black/50 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getHpColor()} transition-all duration-500`}
                                        style={{ width: `${getHpPercent()}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Combo & Stats */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {combo > 0 && (
                                    <span className="px-3 py-1 bg-yellow-500 text-black font-bold rounded-full animate-bounce">
                                        🔥 {combo}x COMBO!
                                    </span>
                                )}
                                <span className="text-sm opacity-70">
                                    💥 Total: {totalDamage} damage
                                </span>
                            </div>
                            <span className="text-sm opacity-70">
                                Q {questionIndex + 1}/{RAID_QUESTIONS.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Question Section */}
                <div className="max-w-4xl mx-auto p-6">
                    {/* Timer */}
                    <div className="flex justify-center mb-6">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold
                            ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}>
                            {timeLeft}
                        </div>
                    </div>

                    {/* Question */}
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
                        <p className="text-xl font-semibold text-center">{currentQuestion.question}</p>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, idx) => {
                            let buttonStyle = 'bg-white/10 hover:bg-white/20';
                            if (showResult) {
                                if (option === currentQuestion.correctAnswer) {
                                    buttonStyle = 'bg-green-500';
                                } else if (option === selectedAnswer && !isCorrect) {
                                    buttonStyle = 'bg-red-500';
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => !showResult && handleAnswer(option)}
                                    disabled={showResult}
                                    className={`p-4 rounded-xl font-semibold text-lg transition-all ${buttonStyle}
                                        ${showResult ? '' : 'hover:scale-105'}`}
                                >
                                    <span className="mr-2 opacity-50">{String.fromCharCode(65 + idx)}.</span>
                                    {option}
                                </button>
                            );
                        })}
                    </div>

                    {/* Result Feedback */}
                    {showResult && (
                        <div className={`mt-6 text-center text-2xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {isCorrect ? (
                                <>💥 {language === 'id' ? 'BENAR!' : 'CORRECT!'} +{currentQuestion.damage} damage</>
                            ) : (
                                <>{language === 'id' ? '❌ Salah!' : '❌ Wrong!'}</>
                            )}
                        </div>
                    )}
                </div>

                {/* Team Strip */}
                <div className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur p-4">
                    <div className="max-w-4xl mx-auto flex justify-center gap-4">
                        {members.filter(m => m.isActive).map(member => (
                            <div key={member.id} className="text-center">
                                <div className="text-2xl mb-1">{member.avatar}</div>
                                <div className="text-xs opacity-70">{member.damageDealt}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Victory Phase
    if (phase === 'victory' && currentBoss) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center p-6">
                <div className="text-center text-white">
                    <div className="text-8xl mb-6 animate-bounce">🏆</div>
                    <h1 className="text-4xl font-extrabold mb-4">
                        {language === 'id' ? 'KEMENANGAN!' : 'VICTORY!'}
                    </h1>
                    <p className="text-xl mb-2">
                        {language === 'id' ? currentBoss.nameId : currentBoss.name} {language === 'id' ? 'telah dikalahkan!' : 'has been defeated!'}
                    </p>
                    <div className="bg-white/20 rounded-2xl p-6 mb-8 inline-block">
                        <div className="text-3xl mb-2">💥 {totalDamage} Total Damage</div>
                        <div className="text-xl">🎁 +{currentBoss.rewards.xp} XP</div>
                        {currentBoss.rewards.badge && (
                            <div className="text-lg mt-2">🏅 Badge: {currentBoss.rewards.badge}</div>
                        )}
                    </div>
                    <button
                        onClick={resetRaid}
                        className="px-8 py-4 bg-white text-orange-500 font-bold rounded-2xl hover:scale-105 transition-transform"
                    >
                        {language === 'id' ? 'Main Lagi' : 'Play Again'}
                    </button>
                </div>
            </div>
        );
    }

    // Defeat Phase
    if (phase === 'defeat') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center p-6">
                <div className="text-center text-white">
                    <div className="text-8xl mb-6">💀</div>
                    <h1 className="text-4xl font-extrabold mb-4">
                        {language === 'id' ? 'KALAH...' : 'DEFEAT...'}
                    </h1>
                    <p className="text-xl opacity-70 mb-8">
                        {language === 'id' ? 'Boss masih terlalu kuat. Coba lagi!' : 'The boss was too strong. Try again!'}
                    </p>
                    <div className="bg-white/10 rounded-2xl p-6 mb-8 inline-block">
                        <div className="text-2xl">💥 {totalDamage} Total Damage</div>
                    </div>
                    <br />
                    <button
                        onClick={resetRaid}
                        className="px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:scale-105 transition-transform"
                    >
                        {language === 'id' ? 'Coba Lagi' : 'Try Again'}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
