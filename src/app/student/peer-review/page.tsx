'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

// Peer review types
interface Submission {
    id: string;
    studentId: string;
    studentName: string;
    studentAvatar: string;
    quizTitle: string;
    answer: string;
    submittedAt: string;
    reviewed: boolean;
    myReview?: {
        rating: number;
        feedback: string;
        helpful: boolean;
    };
}

interface Review {
    id: string;
    reviewerId: string;
    reviewerName: string;
    reviewerAvatar: string;
    rating: number;
    feedback: string;
    helpful: boolean;
    createdAt: string;
}

// Mock data for submissions to review
const MOCK_SUBMISSIONS: Submission[] = [
    {
        id: 's1',
        studentId: 'u1',
        studentName: 'Budi Santoso',
        studentAvatar: '👦',
        quizTitle: 'Essay: Penjelasan Fotosintesis',
        answer: 'Fotosintesis adalah proses dimana tumbuhan mengubah cahaya matahari, air, dan karbon dioksida menjadi glukosa dan oksigen. Proses ini terjadi di kloroplas yang mengandung klorofil. Rumusnya adalah 6CO2 + 6H2O + cahaya → C6H12O6 + 6O2.',
        submittedAt: '2026-01-13T10:30:00',
        reviewed: false,
    },
    {
        id: 's2',
        studentId: 'u2',
        studentName: 'Siti Aminah',
        studentAvatar: '👧',
        quizTitle: 'Essay: Jelaskan Hukum Newton',
        answer: 'Hukum Newton pertama menyatakan bahwa benda akan tetap diam atau bergerak lurus beraturan jika tidak ada gaya yang bekerja padanya. Hukum kedua menjelaskan bahwa F = m × a. Hukum ketiga adalah aksi-reaksi, dimana setiap aksi akan ada reaksi yang sama besar tapi berlawanan arah.',
        submittedAt: '2026-01-13T11:15:00',
        reviewed: false,
    },
    {
        id: 's3',
        studentId: 'u3',
        studentName: 'Andi Pratama',
        studentAvatar: '👦',
        quizTitle: 'Essay: Analisis Puisi',
        answer: 'Puisi "Aku" karya Chairil Anwar menggambarkan semangat individualisme dan kebebasan. Kata "kalau sampai waktuku" menunjukkan kesadaran akan kematian, sementara "aku mau tak seorang kan merayu" menunjukkan kemandirian.',
        submittedAt: '2026-01-13T09:45:00',
        reviewed: true,
        myReview: {
            rating: 4,
            feedback: 'Analisis bagus! Bisa ditambahkan konteks sejarah.',
            helpful: true,
        },
    },
];

// Mock reviews I received
const MOCK_MY_REVIEWS: Review[] = [
    {
        id: 'r1',
        reviewerId: 'u4',
        reviewerName: 'Dewi Kartika',
        reviewerAvatar: '👧',
        rating: 5,
        feedback: 'Penjelasanmu sangat jelas dan mudah dipahami! Contoh yang diberikan juga relevan.',
        helpful: true,
        createdAt: '2026-01-12T14:30:00',
    },
    {
        id: 'r2',
        reviewerId: 'u5',
        reviewerName: 'Rudi Hermawan',
        reviewerAvatar: '👦',
        rating: 4,
        feedback: 'Bagus, tapi mungkin bisa ditambahkan diagram untuk memperjelas.',
        helpful: true,
        createdAt: '2026-01-12T15:45:00',
    },
];

const STORAGE_KEY = 'lms_ypp_peer_reviews';

type View = 'pending' | 'reviewing' | 'received';

export default function PeerReviewPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();
    const { addXp } = useGame();

    const [view, setView] = useState<View>('pending');
    const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
    const [myReviews, setMyReviews] = useState<Review[]>(MOCK_MY_REVIEWS);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

    // Review form state
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [helpful, setHelpful] = useState(false);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const pendingCount = submissions.filter(s => !s.reviewed).length;

    const handleStartReview = (submission: Submission) => {
        setSelectedSubmission(submission);
        setRating(0);
        setFeedback('');
        setHelpful(false);
        setView('reviewing');
    };

    const handleSubmitReview = () => {
        if (!selectedSubmission || rating === 0) return;

        // Update submission with review
        setSubmissions(prev => prev.map(s =>
            s.id === selectedSubmission.id
                ? { ...s, reviewed: true, myReview: { rating, feedback, helpful } }
                : s
        ));

        // Award XP for reviewing
        addXp(20);

        // Reset and go back
        setSelectedSubmission(null);
        setView('pending');
    };

    const averageRating = myReviews.length > 0
        ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1)
        : '0.0';

    // Reviewing View
    if (view === 'reviewing' && selectedSubmission) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-duo-blue to-duo-purple p-6">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={() => setView('pending')}
                        className="text-white/70 hover:text-white mb-4"
                    >
                        ← {language === 'id' ? 'Kembali' : 'Back'}
                    </button>

                    {/* Submission Card */}
                    <div className="bg-white rounded-2xl p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-4xl">{selectedSubmission.studentAvatar}</span>
                            <div>
                                <p className="font-bold text-duo-gray-900">{selectedSubmission.studentName}</p>
                                <p className="text-sm text-duo-gray-500">{selectedSubmission.quizTitle}</p>
                            </div>
                        </div>

                        <div className="bg-duo-gray-100 rounded-xl p-4 mb-4">
                            <p className="text-duo-gray-700 whitespace-pre-wrap">{selectedSubmission.answer}</p>
                        </div>

                        <p className="text-xs text-duo-gray-400 text-right">
                            {new Date(selectedSubmission.submittedAt).toLocaleString()}
                        </p>
                    </div>

                    {/* Review Form */}
                    <div className="bg-white rounded-2xl p-6">
                        <h2 className="font-bold text-lg text-duo-gray-900 mb-4">
                            ✍️ {language === 'id' ? 'Berikan Review' : 'Write Review'}
                        </h2>

                        {/* Star Rating */}
                        <div className="mb-6">
                            <p className="text-sm font-semibold text-duo-gray-700 mb-2">
                                {language === 'id' ? 'Rating' : 'Rating'}
                            </p>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`text-3xl transition-transform hover:scale-110 ${star <= rating ? '' : 'opacity-30'
                                            }`}
                                    >
                                        ⭐
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Feedback */}
                        <div className="mb-6">
                            <p className="text-sm font-semibold text-duo-gray-700 mb-2">
                                {language === 'id' ? 'Komentar (opsional)' : 'Feedback (optional)'}
                            </p>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder={language === 'id' ? 'Berikan saran atau pujian...' : 'Give suggestions or praise...'}
                                className="w-full px-4 py-3 border-2 border-duo-gray-200 rounded-xl resize-none h-24"
                            />
                        </div>

                        {/* Helpful checkbox */}
                        <label className="flex items-center gap-3 mb-6 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={helpful}
                                onChange={(e) => setHelpful(e.target.checked)}
                                className="w-5 h-5"
                            />
                            <span className="text-duo-gray-700">
                                {language === 'id' ? 'Jawaban ini membantu saya memahami materi' : 'This answer helped me understand the material'}
                            </span>
                        </label>

                        {/* Submit */}
                        <button
                            onClick={handleSubmitReview}
                            disabled={rating === 0}
                            className="btn btn-primary btn-full disabled:opacity-50"
                        >
                            ✅ {language === 'id' ? 'Kirim Review (+20 XP)' : 'Submit Review (+20 XP)'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main View
    return (
        <div className="min-h-screen bg-duo-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => router.back()} className="text-duo-gray-500 hover:text-duo-gray-700 mb-4">
                    ← {language === 'id' ? 'Kembali' : 'Back'}
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-extrabold text-duo-gray-900 mb-2">
                        👥 {language === 'id' ? 'Peer Review' : 'Peer Review'}
                    </h1>
                    <p className="text-duo-gray-500">
                        {language === 'id' ? 'Bantu teman belajar dengan memberikan feedback!' : 'Help friends learn by giving feedback!'}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="card text-center">
                        <div className="text-2xl font-bold text-duo-blue">{pendingCount}</div>
                        <div className="text-sm text-duo-gray-500">{language === 'id' ? 'Menunggu Review' : 'Pending'}</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-2xl font-bold text-duo-green">{submissions.filter(s => s.reviewed).length}</div>
                        <div className="text-sm text-duo-gray-500">{language === 'id' ? 'Sudah Review' : 'Reviewed'}</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-2xl font-bold text-duo-yellow">⭐ {averageRating}</div>
                        <div className="text-sm text-duo-gray-500">{language === 'id' ? 'Rating Saya' : 'My Rating'}</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setView('pending')}
                        className={`px-4 py-2 rounded-lg font-semibold ${view === 'pending' ? 'bg-duo-blue text-white' : 'bg-white text-duo-gray-600'
                            }`}
                    >
                        📝 {language === 'id' ? 'Review Teman' : 'Review Others'} {pendingCount > 0 && `(${pendingCount})`}
                    </button>
                    <button
                        onClick={() => setView('received')}
                        className={`px-4 py-2 rounded-lg font-semibold ${view === 'received' ? 'bg-duo-green text-white' : 'bg-white text-duo-gray-600'
                            }`}
                    >
                        📬 {language === 'id' ? 'Review untuk Saya' : 'Reviews for Me'} ({myReviews.length})
                    </button>
                </div>

                {/* Reviews to do */}
                {view === 'pending' && (
                    <div className="space-y-4">
                        {submissions.filter(s => !s.reviewed).map(submission => (
                            <div key={submission.id} className="card">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{submission.studentAvatar}</span>
                                        <div>
                                            <p className="font-bold text-duo-gray-900">{submission.studentName}</p>
                                            <p className="text-sm text-duo-gray-500">{submission.quizTitle}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleStartReview(submission)}
                                        className="btn btn-primary btn-sm"
                                    >
                                        ✍️ Review
                                    </button>
                                </div>
                                <div className="mt-3 p-3 bg-duo-gray-100 rounded-lg">
                                    <p className="text-sm text-duo-gray-600 line-clamp-2">
                                        {submission.answer}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {submissions.filter(s => !s.reviewed).length === 0 && (
                            <div className="card text-center py-8">
                                <span className="text-4xl block mb-2">🎉</span>
                                <p className="text-duo-gray-500">
                                    {language === 'id' ? 'Tidak ada yang perlu di-review!' : 'Nothing to review!'}
                                </p>
                            </div>
                        )}

                        {/* Completed Reviews */}
                        {submissions.filter(s => s.reviewed).length > 0 && (
                            <>
                                <h3 className="font-bold text-duo-gray-700 mt-6">{language === 'id' ? '✅ Sudah Di-review' : '✅ Already Reviewed'}</h3>
                                {submissions.filter(s => s.reviewed).map(submission => (
                                    <div key={submission.id} className="card opacity-60">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{submission.studentAvatar}</span>
                                                <div>
                                                    <p className="font-semibold text-duo-gray-900">{submission.studentName}</p>
                                                    <p className="text-xs text-duo-gray-500">{submission.quizTitle}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-duo-yellow">
                                                    {'⭐'.repeat(submission.myReview?.rating || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* Reviews I received */}
                {view === 'received' && (
                    <div className="space-y-4">
                        {myReviews.map(review => (
                            <div key={review.id} className="card">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{review.reviewerAvatar}</span>
                                        <div>
                                            <p className="font-bold text-duo-gray-900">{review.reviewerName}</p>
                                            <p className="text-xs text-duo-gray-500">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-duo-yellow">
                                        {'⭐'.repeat(review.rating)}
                                    </span>
                                </div>
                                <p className="text-duo-gray-700 bg-duo-gray-100 rounded-lg p-3">
                                    {review.feedback}
                                </p>
                                {review.helpful && (
                                    <p className="text-xs text-duo-green mt-2">
                                        ✅ {language === 'id' ? 'Jawaban ini membantu reviewer' : 'This was helpful to the reviewer'}
                                    </p>
                                )}
                            </div>
                        ))}

                        {myReviews.length === 0 && (
                            <div className="card text-center py-8">
                                <span className="text-4xl block mb-2">📭</span>
                                <p className="text-duo-gray-500">
                                    {language === 'id' ? 'Belum ada review untuk kamu' : 'No reviews for you yet'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
