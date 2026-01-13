'use client';

import { useState } from 'react';
import { useAIHint } from '@/contexts/AIHintContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface AIHintPanelProps {
    currentQuestion?: string;
    subject?: string;
    context?: any;
}

export default function AIHintPanel({ currentQuestion, subject, context }: AIHintPanelProps) {
    const {
        totalTokens,
        isExamMode,
        isLocked,
        isPanelOpen,
        togglePanel,
        hintHistory,
        requestAIHint,
        isLoading,
    } = useAIHint();
    const { language } = useLanguage();

    const [inputValue, setInputValue] = useState('');
    const [currentHint, setCurrentHint] = useState<string | null>(null);
    const [attemptCount, setAttemptCount] = useState(1);
    const [followUp, setFollowUp] = useState<string | null>(null);

    const handleRequestHint = async () => {
        if (isLocked || totalTokens <= 0 || isLoading) return;

        const question = currentQuestion || 'Soal matematika umum';
        const result = await requestAIHint(
            question,
            subject || 'Matematika',
            attemptCount,
            inputValue || undefined,
            context
        );

        if (result.success) {
            setCurrentHint(result.hint);
            setFollowUp(result.followUp || null);
            setAttemptCount(prev => prev + 1);
            setInputValue('');
        }
    };

    if (!isPanelOpen) {
        // Floating button
        return (
            <button
                onClick={togglePanel}
                disabled={isExamMode}
                className={`fixed bottom-28 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all z-40 ${isExamMode
                    ? 'bg-duo-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-duo-blue to-duo-purple hover:scale-110'
                    }`}
            >
                {isExamMode ? '🔒' : '🤖'}
                {!isExamMode && totalTokens > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-duo-yellow text-duo-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
                        {totalTokens}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="ai-hint-panel animate-slide-up">
            {/* Header */}
            <div className="ai-hint-header">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <span className="font-bold">AI Hint</span>
                    {isLoading && <span className="text-sm animate-pulse">⏳</span>}
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                        💡 {totalTokens}
                    </span>
                    <button onClick={togglePanel} className="hover:bg-white/20 rounded-full p-1">
                        ✕
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="ai-hint-body">
                {isLocked ? (
                    <div className="text-center py-4">
                        <div className="text-4xl mb-2">🔒</div>
                        <p className="text-duo-gray-500 text-sm">
                            {isExamMode
                                ? (language === 'id' ? 'AI terkunci dalam mode ujian' : 'AI locked in exam mode')
                                : (language === 'id' ? 'Tidak ada petunjuk tersisa' : 'No hints remaining')}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Current Hint */}
                        {currentHint && (
                            <div className="ai-hint-message assistant mb-4">
                                <span className="text-duo-purple font-semibold">💡 AI Hint:</span>
                                <p className="mt-1 whitespace-pre-wrap">{currentHint}</p>
                                {followUp && (
                                    <p className="mt-2 text-sm text-duo-blue italic">💬 {followUp}</p>
                                )}
                            </div>
                        )}

                        {/* Hint History (last 2) */}
                        {!currentHint && hintHistory.length > 0 && (
                            <div className="space-y-2 mb-4">
                                <p className="text-xs text-duo-gray-400 font-semibold">
                                    {language === 'id' ? 'Riwayat Petunjuk:' : 'Hint History:'}
                                </p>
                                {hintHistory.slice(-2).map((item, index) => (
                                    <div key={index} className="ai-hint-message assistant text-sm">
                                        <span className="text-duo-purple font-semibold text-xs">Level {item.level}:</span>
                                        <p className="mt-0.5">{item.hint.id || item.hint.en}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Input for custom question */}
                        <div className="mb-4">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={language === 'id' ? 'Tanya sesuatu (opsional)...' : 'Ask something (optional)...'}
                                className="w-full px-3 py-2 text-sm border-2 border-duo-gray-200 rounded-lg focus:outline-none focus:border-duo-purple"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Request Button */}
                        <button
                            onClick={handleRequestHint}
                            disabled={isLoading || totalTokens <= 0}
                            className="btn btn-accent btn-sm btn-full"
                        >
                            {isLoading
                                ? (language === 'id' ? '⏳ Berpikir...' : '⏳ Thinking...')
                                : (language === 'id' ? '💡 Minta Petunjuk AI' : '💡 Get AI Hint')}
                        </button>

                        {/* Info */}
                        <div className="mt-4 bg-duo-gray-100 rounded-xl p-3 text-xs text-duo-gray-500">
                            <p className="font-semibold text-duo-gray-700 mb-1">
                                {language === 'id' ? '💡 Tips:' : '💡 Tips:'}
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>{language === 'id' ? 'AI memberi petunjuk, bukan jawaban' : 'AI gives hints, not answers'}</li>
                                <li>{language === 'id' ? 'Petunjuk makin detail setiap percobaan' : 'Hints get more detailed each try'}</li>
                                <li>{language === 'id' ? 'Didukung oleh Gemini AI 🚀' : 'Powered by Gemini AI 🚀'}</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
