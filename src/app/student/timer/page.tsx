'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

type TimerMode = 'focus' | 'break' | 'longBreak';

interface SessionLog {
    id: string;
    mode: TimerMode;
    duration: number;
    completedAt: string;
}

const TIMER_SETTINGS = {
    focus: { duration: 25 * 60, label: { id: 'Fokus', en: 'Focus' }, color: 'duo-red' },
    break: { duration: 5 * 60, label: { id: 'Istirahat', en: 'Break' }, color: 'duo-green' },
    longBreak: { duration: 15 * 60, label: { id: 'Istirahat Panjang', en: 'Long Break' }, color: 'duo-blue' },
};

const STORAGE_KEY = 'lms_ypp_pomodoro_logs';

export default function StudyTimerPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();
    const { addXp } = useGame();

    const [mode, setMode] = useState<TimerMode>('focus');
    const [timeLeft, setTimeLeft] = useState(TIMER_SETTINGS.focus.duration);
    const [isRunning, setIsRunning] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [todayLogs, setTodayLogs] = useState<SessionLog[]>([]);
    const [showSettings, setShowSettings] = useState(false);

    // Custom durations
    const [customFocus, setCustomFocus] = useState(25);
    const [customBreak, setCustomBreak] = useState(5);
    const [customLongBreak, setCustomLongBreak] = useState(15);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load logs from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const logs = JSON.parse(saved);
                const today = new Date().toDateString();
                setTodayLogs(logs.filter((l: SessionLog) =>
                    new Date(l.completedAt).toDateString() === today
                ));
            } catch (e) {
                console.error('Failed to load pomodoro logs:', e);
            }
        }
    }, []);

    // Timer logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            // Timer completed
            handleTimerComplete();
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, timeLeft]);

    const handleTimerComplete = useCallback(() => {
        setIsRunning(false);

        // Play sound
        if (audioRef.current) {
            audioRef.current.play().catch(() => { });
        }

        // Log session
        const log: SessionLog = {
            id: `log-${Date.now()}`,
            mode,
            duration: TIMER_SETTINGS[mode].duration,
            completedAt: new Date().toISOString(),
        };

        const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        localStorage.setItem(STORAGE_KEY, JSON.stringify([log, ...allLogs]));
        setTodayLogs(prev => [log, ...prev]);

        // Award XP for focus sessions
        if (mode === 'focus') {
            addXp(25);
            setSessionsCompleted(prev => prev + 1);

            // After 4 focus sessions, suggest long break
            if ((sessionsCompleted + 1) % 4 === 0) {
                setMode('longBreak');
                setTimeLeft(customLongBreak * 60);
            } else {
                setMode('break');
                setTimeLeft(customBreak * 60);
            }
        } else {
            // After break, go back to focus
            setMode('focus');
            setTimeLeft(customFocus * 60);
        }
    }, [mode, sessionsCompleted, customFocus, customBreak, customLongBreak, addXp]);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStart = () => setIsRunning(true);
    const handlePause = () => setIsRunning(false);
    const handleReset = () => {
        setIsRunning(false);
        setTimeLeft(
            mode === 'focus' ? customFocus * 60 :
                mode === 'break' ? customBreak * 60 :
                    customLongBreak * 60
        );
    };

    const handleModeChange = (newMode: TimerMode) => {
        setIsRunning(false);
        setMode(newMode);
        setTimeLeft(
            newMode === 'focus' ? customFocus * 60 :
                newMode === 'break' ? customBreak * 60 :
                    customLongBreak * 60
        );
    };

    const progress = 1 - (timeLeft / (
        mode === 'focus' ? customFocus * 60 :
            mode === 'break' ? customBreak * 60 :
                customLongBreak * 60
    ));

    const todayFocusMinutes = todayLogs
        .filter(l => l.mode === 'focus')
        .reduce((sum, l) => sum + l.duration / 60, 0);

    const settings = TIMER_SETTINGS[mode];

    return (
        <div className={`min-h-screen bg-gradient-to-br from-${settings.color} to-${settings.color}/80 p-6 transition-colors duration-500`}>
            {/* Hidden audio element */}
            <audio ref={audioRef} src="/notification.mp3" preload="auto" />

            <div className="max-w-md mx-auto">
                <button onClick={() => router.back()} className="text-white/70 hover:text-white mb-4">
                    ← {language === 'id' ? 'Kembali' : 'Back'}
                </button>

                {/* Header */}
                <div className="text-center mb-8 text-white">
                    <h1 className="text-3xl font-extrabold mb-2">
                        ⏱️ {language === 'id' ? 'Timer Belajar' : 'Study Timer'}
                    </h1>
                    <p className="text-white/70">
                        {language === 'id' ? 'Teknik Pomodoro untuk fokus maksimal' : 'Pomodoro technique for maximum focus'}
                    </p>
                </div>

                {/* Mode Selector */}
                <div className="flex gap-2 mb-8">
                    {(['focus', 'break', 'longBreak'] as TimerMode[]).map(m => (
                        <button
                            key={m}
                            onClick={() => handleModeChange(m)}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${mode === m
                                ? 'bg-white text-duo-gray-900'
                                : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            {language === 'id' ? TIMER_SETTINGS[m].label.id : TIMER_SETTINGS[m].label.en}
                        </button>
                    ))}
                </div>

                {/* Timer Display */}
                <div className="bg-white rounded-3xl p-8 mb-6 relative overflow-hidden">
                    {/* Progress ring background */}
                    <div
                        className="absolute inset-0 bg-gradient-to-t from-duo-gray-100 to-transparent"
                        style={{ transform: `translateY(${(1 - progress) * 100}%)` }}
                    />

                    <div className="relative text-center">
                        <div className="text-7xl font-mono font-bold text-duo-gray-900 mb-4">
                            {formatTime(timeLeft)}
                        </div>
                        <p className="text-duo-gray-500 mb-6">
                            {mode === 'focus'
                                ? (language === 'id' ? '💪 Waktunya fokus!' : '💪 Time to focus!')
                                : (language === 'id' ? '☕ Istirahat sebentar' : '☕ Take a break')}
                        </p>

                        {/* Controls */}
                        <div className="flex justify-center gap-4">
                            {!isRunning ? (
                                <button
                                    onClick={handleStart}
                                    className={`px-8 py-4 bg-${settings.color} text-white rounded-2xl font-bold text-xl hover:scale-105 transition-transform`}
                                >
                                    ▶️ {language === 'id' ? 'Mulai' : 'Start'}
                                </button>
                            ) : (
                                <button
                                    onClick={handlePause}
                                    className="px-8 py-4 bg-duo-orange text-white rounded-2xl font-bold text-xl hover:scale-105 transition-transform"
                                >
                                    ⏸️ {language === 'id' ? 'Jeda' : 'Pause'}
                                </button>
                            )}
                            <button
                                onClick={handleReset}
                                className="px-8 py-4 bg-duo-gray-200 rounded-2xl font-bold text-xl hover:scale-105 transition-transform"
                            >
                                🔄
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/20 rounded-2xl p-4 text-center text-white">
                        <div className="text-3xl font-bold">{sessionsCompleted}</div>
                        <div className="text-sm text-white/70">{language === 'id' ? 'Sesi Hari Ini' : 'Sessions Today'}</div>
                    </div>
                    <div className="bg-white/20 rounded-2xl p-4 text-center text-white">
                        <div className="text-3xl font-bold">{Math.round(todayFocusMinutes)}</div>
                        <div className="text-sm text-white/70">{language === 'id' ? 'Menit Fokus' : 'Focus Minutes'}</div>
                    </div>
                </div>

                {/* Settings Button */}
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="w-full py-3 bg-white/20 text-white rounded-xl font-semibold"
                >
                    ⚙️ {language === 'id' ? 'Pengaturan Waktu' : 'Timer Settings'}
                </button>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="bg-white rounded-2xl p-6 mt-4">
                        <h3 className="font-bold text-duo-gray-900 mb-4">{language === 'id' ? 'Durasi (menit)' : 'Duration (minutes)'}</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-duo-gray-700">{language === 'id' ? 'Fokus' : 'Focus'}</span>
                                <input
                                    type="number"
                                    value={customFocus}
                                    onChange={(e) => setCustomFocus(Number(e.target.value))}
                                    className="w-20 px-3 py-2 border-2 border-duo-gray-200 rounded-lg text-center"
                                    min={1}
                                    max={60}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-duo-gray-700">{language === 'id' ? 'Istirahat' : 'Break'}</span>
                                <input
                                    type="number"
                                    value={customBreak}
                                    onChange={(e) => setCustomBreak(Number(e.target.value))}
                                    className="w-20 px-3 py-2 border-2 border-duo-gray-200 rounded-lg text-center"
                                    min={1}
                                    max={30}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-duo-gray-700">{language === 'id' ? 'Istirahat Panjang' : 'Long Break'}</span>
                                <input
                                    type="number"
                                    value={customLongBreak}
                                    onChange={(e) => setCustomLongBreak(Number(e.target.value))}
                                    className="w-20 px-3 py-2 border-2 border-duo-gray-200 rounded-lg text-center"
                                    min={1}
                                    max={60}
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                handleReset();
                                setShowSettings(false);
                            }}
                            className="w-full mt-4 py-2 bg-duo-blue text-white rounded-xl font-bold"
                        >
                            ✓ {language === 'id' ? 'Terapkan' : 'Apply'}
                        </button>
                    </div>
                )}

                {/* Tips */}
                <div className="mt-6 text-center text-white/70 text-sm">
                    <p>💡 {language === 'id'
                        ? 'Tips: Setiap 4 sesi fokus, ambil istirahat panjang!'
                        : 'Tip: Take a long break every 4 focus sessions!'}</p>
                </div>
            </div>
        </div>
    );
}
