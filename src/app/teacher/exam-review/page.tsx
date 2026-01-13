'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntegrity, IntegritySession, IntegrityEvent } from '@/contexts/IntegrityContext';
import Image from 'next/image';

// Mock student names for demo
const MOCK_STUDENTS: Record<string, string> = {
    'student-1': 'Budi Santoso',
    'student-2': 'Siti Aminah',
    'student-demo': 'Demo Student',
};

const MOCK_QUIZZES: Record<string, string> = {
    'quiz-1': 'Ujian Matematika Bab 3',
    'quiz-2': 'Kuis Aljabar',
    'exam-demo': 'Demo Exam',
};

type ReviewStatus = 'pending' | 'approved' | 'flagged' | 'dismissed';

export default function TeacherExamReviewPage() {
    const router = useRouter();
    const { user, isTeacher, isLoading: authLoading } = useAuth();
    const { language, t } = useLanguage();
    const { sessions } = useIntegrity();

    const [selectedSession, setSelectedSession] = useState<IntegritySession | null>(null);
    const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
    const [reviewStatuses, setReviewStatuses] = useState<Record<string, ReviewStatus>>({});

    // Redirect if not teacher
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!isTeacher) {
        router.push('/login?role=teacher');
        return null;
    }

    // Filter and sort sessions
    const filteredSessions = useMemo(() => {
        let result = [...sessions];

        // Filter by severity (based on worst event)
        if (filterSeverity !== 'all') {
            result = result.filter(session => {
                const hasHighSeverity = session.events.some(e => e.severity === filterSeverity);
                return hasHighSeverity;
            });
        }

        // Sort
        if (sortBy === 'date') {
            result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        } else {
            result.sort((a, b) => a.overallScore - b.overallScore); // Lower scores first
        }

        return result;
    }, [sessions, filterSeverity, sortBy]);

    const handleReviewAction = (sessionId: string, status: ReviewStatus) => {
        setReviewStatuses(prev => ({ ...prev, [sessionId]: status }));
        // In real app, save to backend
        alert(language === 'id' ? `Status diperbarui: ${status}` : `Status updated: ${status}`);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-duo-green';
        if (score >= 50) return 'text-duo-yellow';
        return 'text-duo-red';
    };

    const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
        const colors = {
            low: 'bg-duo-gray-200 text-duo-gray-600',
            medium: 'bg-duo-yellow/20 text-duo-yellow',
            high: 'bg-duo-red/20 text-duo-red',
        };
        return colors[severity];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-duo-gray-100 flex flex-col lg:flex-row">
            {/* Sidebar */}
            <aside className="w-full lg:w-64 bg-white border-r border-duo-gray-200 hidden lg:block h-screen sticky top-0">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <Image src="/icon.png" alt="LMS YPP" width={40} height={40} className="rounded-lg" />
                        <span className="font-extrabold text-duo-gray-900 text-xl">LMS YPP</span>
                    </div>
                    <nav className="space-y-2">
                        <button onClick={() => router.push('/teacher/dashboard')} className="w-full text-left px-4 py-2 rounded-lg text-duo-gray-600 hover:bg-duo-gray-100 flex items-center gap-3">
                            <span>📊</span> Dashboard
                        </button>
                        <button onClick={() => router.push('/teacher/library')} className="w-full text-left px-4 py-2 rounded-lg text-duo-gray-600 hover:bg-duo-gray-100 flex items-center gap-3">
                            <span>📚</span> Library
                        </button>
                        <button onClick={() => router.push('/teacher/content')} className="w-full text-left px-4 py-2 rounded-lg text-duo-gray-600 hover:bg-duo-gray-100 flex items-center gap-3">
                            <span>📝</span> Content
                        </button>
                        <button className="w-full text-left px-4 py-2 rounded-lg bg-duo-red/10 text-duo-red font-bold flex items-center gap-3">
                            <span>🚨</span> {language === 'id' ? 'Review Integritas' : 'Integrity Review'}
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-duo-gray-900">
                        🚨 {language === 'id' ? 'Review Integritas Ujian' : 'Exam Integrity Review'}
                    </h1>
                    <p className="text-duo-gray-500">
                        {language === 'id'
                            ? 'Tinjau sesi ujian yang terdeteksi aktivitas mencurigakan'
                            : 'Review exam sessions with detected suspicious activity'}
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-duo-gray-600">
                            {language === 'id' ? 'Severitas:' : 'Severity:'}
                        </span>
                        <select
                            value={filterSeverity}
                            onChange={(e) => setFilterSeverity(e.target.value as any)}
                            className="px-3 py-1.5 border-2 border-duo-gray-200 rounded-lg text-sm"
                        >
                            <option value="all">{language === 'id' ? 'Semua' : 'All'}</option>
                            <option value="high">{language === 'id' ? 'Tinggi' : 'High'}</option>
                            <option value="medium">{language === 'id' ? 'Sedang' : 'Medium'}</option>
                            <option value="low">{language === 'id' ? 'Rendah' : 'Low'}</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-duo-gray-600">
                            {language === 'id' ? 'Urutkan:' : 'Sort:'}
                        </span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-3 py-1.5 border-2 border-duo-gray-200 rounded-lg text-sm"
                        >
                            <option value="date">{language === 'id' ? 'Terbaru' : 'Newest'}</option>
                            <option value="score">{language === 'id' ? 'Skor Terendah' : 'Lowest Score'}</option>
                        </select>
                    </div>
                </div>

                {/* Sessions List */}
                {filteredSessions.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-6xl mb-4">✅</p>
                        <p className="text-xl font-bold text-duo-gray-900 mb-2">
                            {language === 'id' ? 'Tidak ada sesi untuk ditinjau' : 'No sessions to review'}
                        </p>
                        <p className="text-duo-gray-500">
                            {language === 'id' ? 'Semua sesi ujian berjalan dengan baik!' : 'All exam sessions are running smoothly!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredSessions.map(session => {
                            const status = reviewStatuses[session.sessionId] || 'pending';
                            const worstSeverity = session.events.reduce((worst, e) => {
                                if (e.severity === 'high') return 'high';
                                if (e.severity === 'medium' && worst !== 'high') return 'medium';
                                return worst;
                            }, 'low' as 'low' | 'medium' | 'high');

                            return (
                                <div
                                    key={session.sessionId}
                                    className={`card border-l-4 ${status === 'approved' ? 'border-l-duo-green' :
                                            status === 'flagged' ? 'border-l-duo-red' :
                                                status === 'dismissed' ? 'border-l-duo-gray-300' :
                                                    'border-l-duo-yellow'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-duo-gray-900">
                                                {MOCK_STUDENTS[session.userId] || session.userId}
                                            </h3>
                                            <p className="text-sm text-duo-gray-500">
                                                {MOCK_QUIZZES[session.quizId] || session.quizId}
                                            </p>
                                            <p className="text-xs text-duo-gray-400 mt-1">
                                                {formatDate(session.startTime)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold ${getScoreColor(session.overallScore)}`}>
                                                {session.overallScore}%
                                            </div>
                                            <span className={`badge ${getSeverityBadge(worstSeverity)} text-xs`}>
                                                {worstSeverity.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Event Summary */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {session.tabSwitchCount > 0 && (
                                            <span className="badge bg-duo-gray-100 text-duo-gray-600 text-xs">
                                                📋 {session.tabSwitchCount} tab switches
                                            </span>
                                        )}
                                        {session.copyAttempts > 0 && (
                                            <span className="badge bg-duo-red/10 text-duo-red text-xs">
                                                📋 {session.copyAttempts} copy attempts
                                            </span>
                                        )}
                                        {session.rapidAnswers > 0 && (
                                            <span className="badge bg-duo-yellow/10 text-duo-yellow text-xs">
                                                ⚡ {session.rapidAnswers} rapid answers
                                            </span>
                                        )}
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedSession(session)}
                                            className="flex-1 py-2 rounded-lg border-2 border-duo-gray-200 font-semibold text-duo-gray-600 hover:border-duo-gray-400 text-sm"
                                        >
                                            👁️ {language === 'id' ? 'Detail' : 'Details'}
                                        </button>
                                        {status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => handleReviewAction(session.sessionId, 'approved')}
                                                    className="px-4 py-2 rounded-lg bg-duo-green text-white font-bold text-sm hover:bg-duo-green/90"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={() => handleReviewAction(session.sessionId, 'flagged')}
                                                    className="px-4 py-2 rounded-lg bg-duo-red text-white font-bold text-sm hover:bg-duo-red/90"
                                                >
                                                    🚩
                                                </button>
                                            </>
                                        ) : (
                                            <span className={`px-4 py-2 rounded-lg text-sm font-bold ${status === 'approved' ? 'bg-duo-green/10 text-duo-green' :
                                                    status === 'flagged' ? 'bg-duo-red/10 text-duo-red' :
                                                        'bg-duo-gray-100 text-duo-gray-500'
                                                }`}>
                                                {status === 'approved' ? '✓ OK' : status === 'flagged' ? '🚩 Flagged' : 'Dismissed'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Detail Modal */}
            {selectedSession && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
                        <div className="flex justify-between items-center p-6 border-b border-duo-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-duo-gray-900">
                                    📋 {language === 'id' ? 'Detail Sesi' : 'Session Details'}
                                </h2>
                                <p className="text-sm text-duo-gray-500">
                                    {MOCK_STUDENTS[selectedSession.userId] || selectedSession.userId} • {formatDate(selectedSession.startTime)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedSession(null)}
                                className="text-duo-gray-400 hover:text-duo-gray-600 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Score Overview */}
                            <div className="flex items-center gap-6 mb-6 p-4 bg-duo-gray-100 rounded-xl">
                                <div className={`text-4xl font-bold ${getScoreColor(selectedSession.overallScore)}`}>
                                    {selectedSession.overallScore}%
                                </div>
                                <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-xl font-bold">{selectedSession.tabSwitchCount}</div>
                                        <div className="text-xs text-duo-gray-500">Tab Switches</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold">{selectedSession.copyAttempts}</div>
                                        <div className="text-xs text-duo-gray-500">Copy Attempts</div>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold">{selectedSession.rapidAnswers}</div>
                                        <div className="text-xs text-duo-gray-500">Rapid Answers</div>
                                    </div>
                                </div>
                            </div>

                            {/* Event Timeline */}
                            <h3 className="font-bold text-duo-gray-900 mb-3">
                                🕐 {language === 'id' ? 'Timeline Kejadian' : 'Event Timeline'}
                            </h3>
                            <div className="space-y-2">
                                {selectedSession.events.map((event, idx) => (
                                    <div
                                        key={event.id}
                                        className={`flex items-start gap-3 p-3 rounded-lg ${event.severity === 'high' ? 'bg-duo-red/5' :
                                                event.severity === 'medium' ? 'bg-duo-yellow/5' :
                                                    'bg-duo-gray-50'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full mt-2 ${event.severity === 'high' ? 'bg-duo-red' :
                                                event.severity === 'medium' ? 'bg-duo-yellow' :
                                                    'bg-duo-gray-300'
                                            }`} />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-sm">
                                                    {event.type.replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                                <span className="text-xs text-duo-gray-400">
                                                    {new Date(event.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            {event.details && (
                                                <p className="text-sm text-duo-gray-500 mt-1">{event.details}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="p-6 border-t border-duo-gray-200 flex gap-3">
                            <button
                                onClick={() => {
                                    handleReviewAction(selectedSession.sessionId, 'approved');
                                    setSelectedSession(null);
                                }}
                                className="flex-1 btn btn-primary"
                            >
                                ✓ {language === 'id' ? 'Setujui' : 'Approve'}
                            </button>
                            <button
                                onClick={() => {
                                    handleReviewAction(selectedSession.sessionId, 'flagged');
                                    setSelectedSession(null);
                                }}
                                className="flex-1 btn bg-duo-red text-white hover:bg-duo-red/90"
                            >
                                🚩 {language === 'id' ? 'Tandai' : 'Flag'}
                            </button>
                            <button
                                onClick={() => {
                                    handleReviewAction(selectedSession.sessionId, 'dismissed');
                                    setSelectedSession(null);
                                }}
                                className="btn btn-outline"
                            >
                                {language === 'id' ? 'Abaikan' : 'Dismiss'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
