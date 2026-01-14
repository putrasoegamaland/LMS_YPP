'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRealtime, RoomParticipant } from '@/hooks/useRealtime';
import { isSupabaseConfigured } from '@/lib/supabase';

interface BattleQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    points: number;
}

// Mock questions for the battle
const BATTLE_QUESTIONS: BattleQuestion[] = [
    { id: 'bq1', question: 'Hasil dari 15 × 8 adalah...', options: ['120', '100', '115', '125'], correctAnswer: '120', points: 100 },
    { id: 'bq2', question: 'Berapa akar kuadrat dari 144?', options: ['12', '14', '11', '13'], correctAnswer: '12', points: 100 },
    { id: 'bq3', question: '3/4 + 1/2 = ...', options: ['5/4', '4/6', '1', '2/3'], correctAnswer: '5/4', points: 100 },
    { id: 'bq4', question: 'Luas lingkaran dengan r = 7 (π = 22/7) adalah...', options: ['154', '44', '22', '77'], correctAnswer: '154', points: 120 },
    { id: 'bq5', question: '2⁵ = ...', options: ['32', '16', '64', '10'], correctAnswer: '32', points: 100 },
];

type GamePhase = 'join' | 'waiting' | 'countdown' | 'playing' | 'results';

export default function LiveBattlePage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();

    const [roomCode, setRoomCode] = useState('');
    const [roomId, setRoomId] = useState('');
    const [phase, setPhase] = useState<GamePhase>('join');
    const [isHost, setIsHost] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [timeLeft, setTimeLeft] = useState(15);

    // Real-time connection (only when room is joined)
    const {
        isConnected,
        participants,
        roomStatus,
        updateScore,
        updateRoom,
        changeQuestion,
        setReady,
    } = useRealtime({
        roomId,
        userId: user?.id || 'guest',
        userName: user?.name || 'Guest',
        userAvatar: user?.avatar || '👤',
        onQuestionChange: (idx) => {
            setCurrentQuestionIndex(idx);
            setSelectedAnswer(null);
            setShowResult(false);
            setTimeLeft(15);
        },
        onRoomUpdate: (updates) => {
            if (updates.status === 'starting') {
                setPhase('countdown');
            } else if (updates.status === 'active') {
                setPhase('playing');
            } else if (updates.status === 'finished') {
                setPhase('results');
            }
        },
    });

    // Auth check
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Countdown timer when starting
    useEffect(() => {
        if (phase !== 'countdown') return;
        if (countdown <= 0) {
            setPhase('playing');
            if (isHost) updateRoom({ status: 'active' });
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [phase, countdown, isHost]);

    // Question timer
    useEffect(() => {
        if (phase !== 'playing' || showResult) return;
        if (timeLeft <= 0) {
            handleAnswer(null);
            return;
        }
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [phase, timeLeft, showResult]);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
                <div className="spinner"></div>
            </div>
        );
    }

    const createRoom = () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomCode(code);
        setRoomId(`room-${code}`);
        setIsHost(true);
        setPhase('waiting');
    };

    const joinRoom = () => {
        if (!roomCode.trim()) return;
        setRoomId(`room-${roomCode.toUpperCase()}`);
        setIsHost(false);
        setPhase('waiting');
    };

    const startGame = () => {
        if (!isHost) return;
        updateRoom({ status: 'starting' });
        setPhase('countdown');
        setCountdown(3);
    };

    const handleAnswer = (answer: string | null) => {
        if (showResult) return;

        const currentQuestion = BATTLE_QUESTIONS[currentQuestionIndex];
        const isCorrect = answer === currentQuestion.correctAnswer;

        setSelectedAnswer(answer);
        setShowResult(true);

        if (isCorrect) {
            const newScore = score + currentQuestion.points;
            const newCorrect = correctAnswers + 1;
            setScore(newScore);
            setCorrectAnswers(newCorrect);
            updateScore(newScore, newCorrect, currentQuestionIndex);
        }

        // Move to next question after delay
        setTimeout(() => {
            if (currentQuestionIndex < BATTLE_QUESTIONS.length - 1) {
                const nextIdx = currentQuestionIndex + 1;
                setCurrentQuestionIndex(nextIdx);
                setSelectedAnswer(null);
                setShowResult(false);
                setTimeLeft(15);
                if (isHost) changeQuestion(nextIdx);
            } else {
                setPhase('results');
                if (isHost) updateRoom({ status: 'finished' });
            }
        }, 1500);
    };

    // Join Phase
    if (phase === 'join') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md text-white">
                    <button onClick={() => router.back()} className="text-white/70 hover:text-white mb-4">
                        ← {language === 'id' ? 'Kembali' : 'Back'}
                    </button>

                    <h1 className="text-3xl font-extrabold mb-2 text-center">⚔️ Live Battle</h1>
                    <p className="text-white/70 text-center mb-8">
                        {language === 'id' ? 'Bertanding real-time dengan teman!' : 'Compete in real-time with friends!'}
                    </p>

                    {!isSupabaseConfigured() && (
                        <div className="bg-yellow-500/20 text-yellow-200 p-4 rounded-xl mb-6 text-sm">
                            ⚠️ {language === 'id' ? 'Supabase belum dikonfigurasi. Mode offline.' : 'Supabase not configured. Offline mode.'}
                        </div>
                    )}

                    <div className="space-y-4">
                        <button
                            onClick={createRoom}
                            className="w-full py-4 bg-gradient-to-r from-duo-green to-emerald-500 rounded-2xl font-bold text-lg hover:scale-105 transition-transform"
                        >
                            🏠 {language === 'id' ? 'Buat Room' : 'Create Room'}
                        </button>

                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                placeholder={language === 'id' ? 'Kode room...' : 'Room code...'}
                                className="flex-1 px-4 py-3 bg-white/20 rounded-xl placeholder-white/50 text-center font-mono text-lg"
                                maxLength={6}
                            />
                            <button
                                onClick={joinRoom}
                                disabled={!roomCode.trim()}
                                className="px-6 py-3 bg-duo-blue rounded-xl font-bold disabled:opacity-50"
                            >
                                🚀
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Waiting Room
    if (phase === 'waiting') {
        const allReady = participants.length >= 2 && participants.every(p => p.isReady);

        const handleLeaveRoom = () => {
            setPhase('join');
            setRoomId('');
            setRoomCode('');
            setIsHost(false);
        };

        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-white text-center">
                        {/* Back Button */}
                        <button
                            onClick={handleLeaveRoom}
                            className="absolute top-4 left-4 text-white/70 hover:text-white flex items-center gap-2"
                        >
                            ← {language === 'id' ? 'Keluar Room' : 'Leave Room'}
                        </button>

                        <h2 className="text-2xl font-bold mb-2">
                            🎮 {language === 'id' ? 'Ruang Tunggu' : 'Waiting Room'}
                        </h2>

                        {/* Room Code */}
                        <div className="bg-black/30 rounded-2xl p-6 mb-6">
                            <p className="text-sm text-white/70 mb-2">{language === 'id' ? 'Kode Room:' : 'Room Code:'}</p>
                            <p className="text-4xl font-mono font-bold tracking-wider">{roomCode}</p>
                        </div>

                        {/* Connection Status */}
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${isConnected ? 'bg-green-500/30 text-green-300' : 'bg-yellow-500/30 text-yellow-300'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></span>
                            {isConnected ? (language === 'id' ? 'Terhubung' : 'Connected') : (language === 'id' ? 'Menghubungkan...' : 'Connecting...')}
                        </div>

                        {/* Participants */}
                        <div className="mb-6">
                            <h3 className="font-semibold mb-3">{language === 'id' ? 'Peserta' : 'Participants'} ({participants.length})</h3>
                            <div className="flex flex-wrap justify-center gap-3">
                                {participants.map(p => (
                                    <div key={p.id} className={`flex items-center gap-2 px-4 py-2 rounded-full ${p.isReady ? 'bg-green-500/30' : 'bg-white/20'
                                        }`}>
                                        <span className="text-xl">{p.avatar}</span>
                                        <span className="font-semibold">{p.name}</span>
                                        {p.isReady && <span>✅</span>}
                                    </div>
                                ))}
                                {participants.length === 0 && (
                                    <p className="text-white/50">{language === 'id' ? 'Menunggu pemain...' : 'Waiting for players...'}</p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => setReady(true)}
                                className="px-6 py-3 bg-duo-green rounded-xl font-bold hover:scale-105 transition-transform"
                            >
                                ✅ {language === 'id' ? 'Siap!' : 'Ready!'}
                            </button>

                            {isHost && (
                                <button
                                    onClick={startGame}
                                    disabled={participants.length < 1}
                                    className="px-6 py-3 bg-duo-yellow text-black rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
                                >
                                    🚀 {language === 'id' ? 'Mulai!' : 'Start!'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Countdown
    if (phase === 'countdown') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <p className="text-2xl mb-4">{language === 'id' ? 'Bersiap...' : 'Get Ready...'}</p>
                    <div className="text-9xl font-bold animate-pulse">{countdown}</div>
                </div>
            </div>
        );
    }

    // Playing
    if (phase === 'playing') {
        const currentQuestion = BATTLE_QUESTIONS[currentQuestionIndex];

        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
                {/* Header */}
                <div className="max-w-4xl mx-auto flex items-center justify-between mb-6 text-white">
                    <div className="flex items-center gap-4">
                        {participants.slice(0, 4).map(p => (
                            <div key={p.id} className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                                <span>{p.avatar}</span>
                                <span className="font-bold">{p.score}</span>
                            </div>
                        ))}
                    </div>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-white/30'
                        }`}>
                        {timeLeft}
                    </div>
                </div>

                {/* Question */}
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6 text-white text-center">
                        <p className="text-sm text-white/60 mb-2">
                            Q{currentQuestionIndex + 1}/{BATTLE_QUESTIONS.length}
                        </p>
                        <p className="text-xl font-semibold">{currentQuestion.question}</p>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, idx) => {
                            let buttonStyle = 'bg-white/20 hover:bg-white/30 text-white';
                            if (showResult) {
                                if (option === currentQuestion.correctAnswer) {
                                    buttonStyle = 'bg-green-500 text-white';
                                } else if (option === selectedAnswer) {
                                    buttonStyle = 'bg-red-500 text-white';
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => !showResult && handleAnswer(option)}
                                    disabled={showResult}
                                    className={`py-4 px-6 rounded-xl font-semibold text-lg transition-all ${buttonStyle} ${!showResult ? 'hover:scale-105' : ''}`}
                                >
                                    <span className="opacity-50 mr-2">{String.fromCharCode(65 + idx)}.</span>
                                    {option}
                                </button>
                            );
                        })}
                    </div>

                    {/* Result */}
                    {showResult && (
                        <div className={`mt-6 text-center text-2xl font-bold ${selectedAnswer === currentQuestion.correctAnswer ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {selectedAnswer === currentQuestion.correctAnswer
                                ? `✅ +${currentQuestion.points} pts!`
                                : '❌ Wrong!'}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Results
    if (phase === 'results') {
        const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);
        const myRank = sortedParticipants.findIndex(p => p.id === user.id) + 1;

        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl p-8 w-full max-w-md text-center">
                    <div className="text-6xl mb-4">🏆</div>
                    <h1 className="text-3xl font-extrabold mb-2">
                        {language === 'id' ? 'Hasil Pertandingan' : 'Battle Results'}
                    </h1>

                    {/* Leaderboard */}
                    <div className="space-y-3 my-6">
                        {sortedParticipants.map((p, idx) => (
                            <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl ${p.id === user.id ? 'bg-duo-yellow/30 ring-2 ring-duo-yellow' : 'bg-duo-gray-100'
                                }`}>
                                <span className="text-2xl font-bold w-8">
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                                </span>
                                <span className="text-2xl">{p.avatar}</span>
                                <span className="flex-1 font-semibold text-left">{p.name}</span>
                                <span className="font-bold text-duo-blue">{p.score} pts</span>
                            </div>
                        ))}
                    </div>

                    {/* Personal Stats */}
                    <div className="bg-duo-gray-100 rounded-xl p-4 mb-6">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-duo-blue">{score}</div>
                                <div className="text-sm text-duo-gray-500">{language === 'id' ? 'Skor' : 'Score'}</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-duo-green">{correctAnswers}/{BATTLE_QUESTIONS.length}</div>
                                <div className="text-sm text-duo-gray-500">{language === 'id' ? 'Benar' : 'Correct'}</div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setPhase('join');
                            setRoomId('');
                            setRoomCode('');
                            setScore(0);
                            setCorrectAnswers(0);
                            setCurrentQuestionIndex(0);
                        }}
                        className="w-full py-4 bg-duo-blue text-white rounded-xl font-bold hover:scale-105 transition-transform"
                    >
                        🔄 {language === 'id' ? 'Main Lagi' : 'Play Again'}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
