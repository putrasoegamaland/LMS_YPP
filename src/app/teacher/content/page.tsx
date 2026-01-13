'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

interface QuizQuestion {
    id: string;
    question: string;
    type: 'choice' | 'essay';
    options?: string[];
    correctAnswer?: string;
    points: number;
    // Essay-specific fields
    rubric?: string;
    keywords?: string[];
    minWords?: number;
    // Image support
    questionImage?: string; // base64 image for question
    optionImages?: (string | null)[]; // base64 images for each option
}

// Predefined subjects (teachers can also add custom)
const PREDEFINED_SUBJECTS = [
    'Matematika',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'IPA',
    'IPS',
    'Fisika',
    'Kimia',
    'Biologi',
    'Ekonomi',
    'Sejarah',
    'Geografi',
    'PKN',
    'Seni Budaya',
    'Farmasi',
    'Keperawatan',
];

// Max file size 1MB
const MAX_IMAGE_SIZE = 1 * 1024 * 1024;

interface QuizDraft {
    id: string;
    title: string;
    subject: string;
    grade: number;
    isExamMode: boolean;
    timeLimit?: number;
    aiHintsEnabled: boolean;
    isRepeatable: boolean; // NEW: Allow students to retake
    maxAttempts?: number;  // NEW: Max attempts if repeatable
    questions: QuizQuestion[];
    createdAt: string;
}

const STORAGE_KEY = 'lms_ypp_quiz_drafts';

export default function TeacherContentPage() {
    const router = useRouter();
    const { user, isTeacher, isLoading: authLoading } = useAuth();
    const { language, t } = useLanguage();

    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [scanImage, setScanImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    // AI Clarification preferences
    const [scanStep, setScanStep] = useState<'upload' | 'preferences' | 'processing'>('upload');
    const [scanPreferences, setScanPreferences] = useState({
        questionType: 'mixed' as 'choice' | 'essay' | 'mixed',
        difficulty: 'medium' as 'easy' | 'medium' | 'hard',
        count: 5
    });

    const [drafts, setDrafts] = useState<QuizDraft[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingDraft, setEditingDraft] = useState<QuizDraft | null>(null);

    // New quiz form state
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('matematika');
    const [grade, setGrade] = useState(9);
    const [isExamMode, setIsExamMode] = useState(false);
    const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
    const [aiHintsEnabled, setAiHintsEnabled] = useState(true);
    const [isRepeatable, setIsRepeatable] = useState(true); // NEW
    const [maxAttempts, setMaxAttempts] = useState<number | undefined>(undefined); // NEW
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);

    // Load drafts from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setDrafts(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load drafts:', e);
            }
        }
    }, []);

    // Save drafts to localStorage
    const saveDrafts = (newDrafts: QuizDraft[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newDrafts));
        setDrafts(newDrafts);
    };

    // Redirect if not teacher
    useEffect(() => {
        if (!authLoading && !isTeacher) {
            router.push('/login?role=teacher');
        }
    }, [isTeacher, authLoading, router]);

    if (authLoading || !isTeacher) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }
    const handleScanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setScanImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProcessScan = async () => {
        if (!scanImage) return;

        setIsScanning(true);
        setScanStep('processing');
        try {
            const response = await fetch('/api/quiz-ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: scanImage,
                    preferences: scanPreferences
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to scan');
            }

            if (!data.questions || data.questions.length === 0) {
                alert(language === 'id'
                    ? 'Tidak ada soal yang terdeteksi. Coba dengan gambar yang lebih jelas.'
                    : 'No questions detected. Try with a clearer image.');
                setScanStep('upload');
                return;
            }

            // Transform and add questions
            const newQuestions = data.questions.map((q: any) => ({
                id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                question: typeof q.question === 'object' ? (q.question.id || q.question.en) : q.question,
                type: q.type,
                options: q.type === 'choice' ? (q.options || ['', '', '', '']) : undefined,
                optionImages: q.type === 'choice' ? [null, null, null, null] : undefined,
                correctAnswer: q.correctAnswer || '',
                points: q.points || (q.type === 'essay' ? 20 : 10),
                rubric: q.type === 'essay' ? '' : undefined,
                keywords: [],
                minWords: 50
            }));

            // Set detected subject if available
            if (data.metadata?.subject) {
                setSubject(data.metadata.subject);
            }

            // Append to existing questions
            setQuestions([...questions, ...newQuestions]);
            setIsScanModalOpen(false);
            setScanImage(null);
            setScanStep('upload');

            alert(language === 'id'
                ? `${newQuestions.length} soal berhasil diekstrak dari ${data.metadata?.subject || 'materi'}!`
                : `${newQuestions.length} questions extracted successfully!`);

        } catch (error: any) {
            console.error('Scan failed:', error);
            alert(error.message || (language === 'id' ? 'Gagal memproses gambar.' : 'Failed to process image.'));
            setScanStep('preferences');
        } finally {
            setIsScanning(false);
        }
    };

    // Handle image upload for questions/options
    const handleImageUpload = (
        file: File,
        onSuccess: (base64: string) => void
    ) => {
        if (file.size > MAX_IMAGE_SIZE) {
            alert(language === 'id'
                ? 'Ukuran gambar maksimal 1MB!'
                : 'Maximum image size is 1MB!');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            onSuccess(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // List View logic remains...

    const handleAddQuestion = (type: 'choice' | 'essay' = 'choice') => {
        const baseQuestion = {
            id: `q-${Date.now()}`,
            question: '',
            type,
            points: type === 'essay' ? 20 : 10,
        };

        const newQuestion: QuizQuestion = type === 'choice'
            ? { ...baseQuestion, options: ['', '', '', ''], correctAnswer: '', optionImages: [null, null, null, null] }
            : { ...baseQuestion, rubric: '', keywords: [], minWords: 50 };

        setQuestions([...questions, newQuestion]);
    };

    const handleUpdateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], ...updates };
        setQuestions(updated);
    };

    const handleUpdateOption = (qIndex: number, oIndex: number, value: string) => {
        const updated = [...questions];
        if (updated[qIndex].options) {
            updated[qIndex].options![oIndex] = value;
            setQuestions(updated);
        }
    };

    const handleRemoveQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSaveDraft = () => {
        if (!title.trim() || questions.length === 0) {
            alert(language === 'id' ? 'Judul dan minimal 1 soal diperlukan!' : 'Title and at least 1 question required!');
            return;
        }

        const draft: QuizDraft = {
            id: editingDraft?.id || `draft-${Date.now()}`,
            title,
            subject,
            grade,
            isExamMode,
            timeLimit,
            aiHintsEnabled: isExamMode ? false : aiHintsEnabled,
            isRepeatable,
            maxAttempts: isRepeatable ? maxAttempts : 1,
            questions,
            createdAt: editingDraft?.createdAt || new Date().toISOString(),
        };

        if (editingDraft) {
            saveDrafts(drafts.map(d => d.id === draft.id ? draft : d));
        } else {
            saveDrafts([draft, ...drafts]);
        }

        resetForm();
    };

    const handleEditDraft = (draft: QuizDraft) => {
        setEditingDraft(draft);
        setTitle(draft.title);
        setSubject(draft.subject);
        setGrade(draft.grade);
        setIsExamMode(draft.isExamMode);
        setTimeLimit(draft.timeLimit);
        setAiHintsEnabled(draft.aiHintsEnabled);
        setIsRepeatable(draft.isRepeatable ?? true);
        setMaxAttempts(draft.maxAttempts);
        setQuestions(draft.questions);
        setIsCreating(true);
    };

    const handleDeleteDraft = (id: string) => {
        if (confirm(language === 'id' ? 'Hapus kuis ini?' : 'Delete this quiz?')) {
            saveDrafts(drafts.filter(d => d.id !== id));
        }
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditingDraft(null);
        setTitle('');
        setSubject('matematika');
        setGrade(9);
        setIsExamMode(false);
        setTimeLimit(undefined);
        setAiHintsEnabled(true);
        setIsRepeatable(true);
        setMaxAttempts(undefined);
        setQuestions([]);
    };

    // Quiz Builder View
    if (isCreating) {
        return (
            <div className="min-h-screen bg-duo-gray-100 pb-8">
                {/* Header */}
                <header className="bg-white border-b-2 border-duo-gray-200 sticky top-0 z-50">
                    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
                        <button onClick={resetForm} className="text-duo-gray-500 hover:text-duo-gray-700">
                            ← {t('action.back')}
                        </button>
                        <h1 className="font-extrabold text-duo-gray-900 flex-1">
                            📝 {editingDraft ? (language === 'id' ? 'Edit Kuis' : 'Edit Quiz') : (language === 'id' ? 'Buat Kuis Baru' : 'Create New Quiz')}
                        </h1>
                        <button onClick={handleSaveDraft} className="btn btn-primary btn-sm">
                            💾 {language === 'id' ? 'Simpan' : 'Save'}
                        </button>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 py-6">
                    {/* Basic Info */}
                    <section className="card mb-6">
                        <h2 className="font-bold text-duo-gray-900 mb-4">📋 {language === 'id' ? 'Informasi Dasar' : 'Basic Info'}</h2>
                        {/* ... existing basic info inputs ... */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                    {language === 'id' ? 'Judul Kuis' : 'Quiz Title'}
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={language === 'id' ? 'Contoh: Kuis Aljabar Bab 1' : 'Example: Algebra Quiz Chapter 1'}
                                    className="input"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                        {language === 'id' ? 'Mata Pelajaran' : 'Subject'}
                                    </label>
                                    <input
                                        type="text"
                                        list="subject-list"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder={language === 'id' ? 'Pilih atau ketik mata pelajaran' : 'Select or type subject'}
                                        className="input"
                                    />
                                    <datalist id="subject-list">
                                        {PREDEFINED_SUBJECTS.map(s => (
                                            <option key={s} value={s} />
                                        ))}
                                    </datalist>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                        {language === 'id' ? 'Kelas' : 'Grade'}
                                    </label>
                                    <select
                                        value={grade}
                                        onChange={(e) => setGrade(Number(e.target.value))}
                                        className="input"
                                    >
                                        {[7, 8, 9, 10, 11, 12].map(g => (
                                            <option key={g} value={g}>Kelas {g}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Settings */}
                    <section className="card mb-6">
                        {/* ... existing settings ... */}
                        <h2 className="font-bold text-duo-gray-900 mb-4">⚙️ {language === 'id' ? 'Pengaturan' : 'Settings'}</h2>
                        <div className="space-y-4">
                            {/* Exam Mode Toggle */}
                            <div className="flex items-center justify-between p-3 bg-duo-gray-100 rounded-xl">
                                <div>
                                    <p className="font-semibold text-duo-gray-900">🔒 {language === 'id' ? 'Mode Ujian' : 'Exam Mode'}</p>
                                    <p className="text-xs text-duo-gray-500">
                                        {language === 'id' ? 'AI Hint akan dinonaktifkan sepenuhnya' : 'AI Hints will be completely disabled'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsExamMode(!isExamMode)}
                                    className={`w-14 h-8 rounded-full transition-colors ${isExamMode ? 'bg-duo-red' : 'bg-duo-gray-300'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${isExamMode ? 'translate-x-7' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Time Limit */}
                            <div className="flex items-center justify-between p-3 bg-duo-gray-100 rounded-xl">
                                <div>
                                    <p className="font-semibold text-duo-gray-900">⏱️ {language === 'id' ? 'Batas Waktu' : 'Time Limit'}</p>
                                    <p className="text-xs text-duo-gray-500">
                                        {language === 'id' ? 'Kosongkan jika tidak ada batas waktu' : 'Leave empty for no time limit'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={timeLimit || ''}
                                        onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="0"
                                        className="w-20 px-3 py-2 border-2 border-duo-gray-200 rounded-lg text-center"
                                        min={0}
                                    />
                                    <span className="text-duo-gray-500">{language === 'id' ? 'menit' : 'min'}</span>
                                </div>
                            </div>

                            {/* AI Hints Toggle (disabled in exam mode) */}
                            <div className={`flex items-center justify-between p-3 bg-duo-gray-100 rounded-xl ${isExamMode ? 'opacity-50' : ''}`}>
                                <div>
                                    <p className="font-semibold text-duo-gray-900">🤖 {language === 'id' ? 'AI Hint' : 'AI Hints'}</p>
                                    <p className="text-xs text-duo-gray-500">
                                        {language === 'id' ? 'Izinkan siswa meminta petunjuk dari AI' : 'Allow students to request hints from AI'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => !isExamMode && setAiHintsEnabled(!aiHintsEnabled)}
                                    disabled={isExamMode}
                                    className={`w-14 h-8 rounded-full transition-colors ${aiHintsEnabled && !isExamMode ? 'bg-duo-green' : 'bg-duo-gray-300'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${aiHintsEnabled && !isExamMode ? 'translate-x-7' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Repeatable Toggle - NEW */}
                            <div className="flex items-center justify-between p-3 bg-duo-gray-100 rounded-xl">
                                <div>
                                    <p className="font-semibold text-duo-gray-900">🔄 {language === 'id' ? 'Bisa Diulang' : 'Repeatable'}</p>
                                    <p className="text-xs text-duo-gray-500">
                                        {language === 'id' ? 'Izinkan siswa mengerjakan ulang kuis' : 'Allow students to retake this quiz'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsRepeatable(!isRepeatable)}
                                    className={`w-14 h-8 rounded-full transition-colors ${isRepeatable ? 'bg-duo-green' : 'bg-duo-gray-300'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${isRepeatable ? 'translate-x-7' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Max Attempts (only if repeatable) */}
                            {isRepeatable && (
                                <div className="flex items-center justify-between p-3 bg-duo-gray-100 rounded-xl">
                                    <div>
                                        <p className="font-semibold text-duo-gray-900">🎯 {language === 'id' ? 'Maks. Percobaan' : 'Max Attempts'}</p>
                                        <p className="text-xs text-duo-gray-500">
                                            {language === 'id' ? 'Kosongkan untuk unlimited' : 'Leave empty for unlimited'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={maxAttempts || ''}
                                            onChange={(e) => setMaxAttempts(e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="∞"
                                            className="w-20 px-3 py-2 border-2 border-duo-gray-200 rounded-lg text-center"
                                            min={1}
                                        />
                                        <span className="text-duo-gray-500">{language === 'id' ? 'kali' : 'times'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Questions */}
                    <section className="card mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-duo-gray-900">❓ {language === 'id' ? 'Soal-soal' : 'Questions'} ({questions.length})</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsScanModalOpen(true)}
                                    className="btn bg-gradient-to-r from-duo-purple to-duo-purple/80 text-white btn-sm animate-pulse-gentle"
                                >
                                    📸 {language === 'id' ? 'Scan Soal' : 'Scan Quiz'}
                                </button>
                                <button onClick={() => handleAddQuestion('choice')} className="btn btn-secondary btn-sm">
                                    ➕ {language === 'id' ? 'Pilihan Ganda' : 'Multiple Choice'}
                                </button>
                                <button onClick={() => handleAddQuestion('essay')} className="btn btn-outline btn-sm">
                                    📝 {language === 'id' ? 'Essay' : 'Essay'}
                                </button>
                            </div>
                        </div>

                        {questions.length === 0 ? (
                            <div className="text-center py-8 text-duo-gray-400">
                                <p className="text-4xl mb-2">📸 / 📝</p>
                                <p>{language === 'id' ? 'Belum ada soal. Scan gambar atau tambah manual.' : 'No questions yet. Scan a manual or add manually.'}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {questions.map((q, qIndex) => (
                                    <div key={q.id} className={`bg-duo-gray-100 rounded-xl p-4 ${q.type === 'essay' ? 'border-l-4 border-duo-purple' : ''}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`badge ${q.type === 'essay' ? 'bg-duo-purple/20 text-duo-purple' : 'bg-duo-blue/20 text-duo-blue'}`}>
                                                    {q.type === 'essay' ? '📝' : '🔘'} {language === 'id' ? 'Soal' : 'Q'} {qIndex + 1}
                                                </span>
                                                <span className="text-xs text-duo-gray-500">
                                                    {q.type === 'essay'
                                                        ? (language === 'id' ? 'Essay' : 'Essay')
                                                        : (language === 'id' ? 'Pilihan Ganda' : 'Multiple Choice')}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveQuestion(qIndex)}
                                                className="text-duo-red hover:bg-duo-red/10 p-2 rounded-lg"
                                            >
                                                🗑️
                                            </button>
                                        </div>

                                        {/* Question text */}
                                        <textarea
                                            value={q.question}
                                            onChange={(e) => handleUpdateQuestion(qIndex, { question: e.target.value })}
                                            placeholder={language === 'id' ? 'Tulis pertanyaan...' : 'Write your question...'}
                                            className="input mb-3 min-h-[80px] resize-y"
                                            rows={2}
                                        />

                                        {/* Question Image Upload */}
                                        <div className="mb-3">
                                            {q.questionImage ? (
                                                <div className="relative inline-block">
                                                    <Image
                                                        src={q.questionImage}
                                                        alt="Question image"
                                                        width={200}
                                                        height={150}
                                                        className="rounded-lg object-cover"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateQuestion(qIndex, { questionImage: undefined })}
                                                        className="absolute -top-2 -right-2 bg-duo-red text-white w-6 h-6 rounded-full text-xs flex items-center justify-center"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="inline-flex items-center gap-2 px-3 py-2 bg-duo-gray-200 rounded-lg cursor-pointer hover:bg-duo-gray-300 text-sm">
                                                    <span>🖼️</span>
                                                    <span>{language === 'id' ? 'Tambah Gambar Soal' : 'Add Question Image'}</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                handleImageUpload(file, (base64) => {
                                                                    handleUpdateQuestion(qIndex, { questionImage: base64 });
                                                                });
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            )}
                                            <span className="text-xs text-duo-gray-400 ml-2">(Max 1MB)</span>
                                        </div>

                                        {/* Multiple Choice Options */}
                                        {q.type === 'choice' && (
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                {q.options?.map((opt, oIndex) => (
                                                    <div key={oIndex} className="bg-white p-3 rounded-lg border-2 border-duo-gray-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <input
                                                                type="radio"
                                                                name={`correct-${q.id}`}
                                                                checked={q.correctAnswer === opt && opt !== ''}
                                                                onChange={() => handleUpdateQuestion(qIndex, { correctAnswer: opt })}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-xs font-bold text-duo-gray-500">
                                                                {String.fromCharCode(65 + oIndex)}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={opt}
                                                                onChange={(e) => handleUpdateOption(qIndex, oIndex, e.target.value)}
                                                                placeholder={`${language === 'id' ? 'Pilihan' : 'Option'} ${String.fromCharCode(65 + oIndex)}`}
                                                                className="flex-1 px-2 py-1 border-2 border-duo-gray-200 rounded-lg text-sm"
                                                            />
                                                        </div>
                                                        {/* Option Image */}
                                                        {q.optionImages?.[oIndex] ? (
                                                            <div className="relative inline-block mt-2">
                                                                <Image
                                                                    src={q.optionImages[oIndex]!}
                                                                    alt={`Option ${String.fromCharCode(65 + oIndex)}`}
                                                                    width={100}
                                                                    height={75}
                                                                    className="rounded object-cover"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const newOptionImages = [...(q.optionImages || [])];
                                                                        newOptionImages[oIndex] = null;
                                                                        handleUpdateQuestion(qIndex, { optionImages: newOptionImages });
                                                                    }}
                                                                    className="absolute -top-1 -right-1 bg-duo-red text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <label className="inline-flex items-center gap-1 px-2 py-1 bg-duo-gray-100 rounded cursor-pointer hover:bg-duo-gray-200 text-xs mt-1">
                                                                <span>🖼️</span>
                                                                <span>{language === 'id' ? 'Gambar' : 'Image'}</span>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            handleImageUpload(file, (base64) => {
                                                                                const newOptionImages = [...(q.optionImages || [null, null, null, null])];
                                                                                newOptionImages[oIndex] = base64;
                                                                                handleUpdateQuestion(qIndex, { optionImages: newOptionImages });
                                                                            });
                                                                        }
                                                                    }}
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Essay Fields */}
                                        {q.type === 'essay' && (
                                            <div className="space-y-3 mb-3">
                                                {/* Rubric */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-duo-gray-600 mb-1">
                                                        📋 {language === 'id' ? 'Rubrik Penilaian' : 'Grading Rubric'}
                                                    </label>
                                                    <textarea
                                                        value={q.rubric || ''}
                                                        onChange={(e) => handleUpdateQuestion(qIndex, { rubric: e.target.value })}
                                                        placeholder={language === 'id'
                                                            ? 'Contoh: Jawaban harus mencakup definisi, contoh, dan penerapan...'
                                                            : 'Example: Answer must include definition, example, and application...'}
                                                        className="w-full px-3 py-2 border-2 border-duo-gray-200 rounded-lg text-sm min-h-[60px] resize-y"
                                                        rows={2}
                                                    />
                                                </div>

                                                {/* Keywords */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-duo-gray-600 mb-1">
                                                        🔑 {language === 'id' ? 'Kata Kunci (pisahkan dengan koma)' : 'Keywords (separate with commas)'}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={q.keywords?.join(', ') || ''}
                                                        onChange={(e) => handleUpdateQuestion(qIndex, {
                                                            keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                                                        })}
                                                        placeholder={language === 'id' ? 'aljabar, variabel, persamaan' : 'algebra, variable, equation'}
                                                        className="w-full px-3 py-2 border-2 border-duo-gray-200 rounded-lg text-sm"
                                                    />
                                                </div>

                                                {/* Min Words */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-duo-gray-500">
                                                        {language === 'id' ? 'Minimal kata:' : 'Min words:'}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={q.minWords || 50}
                                                        onChange={(e) => handleUpdateQuestion(qIndex, { minWords: Number(e.target.value) })}
                                                        className="w-20 px-2 py-1 border-2 border-duo-gray-200 rounded-lg text-sm text-center"
                                                        min={10}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Points */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-duo-gray-500">{language === 'id' ? 'Poin:' : 'Points:'}</span>
                                            <input
                                                type="number"
                                                value={q.points}
                                                onChange={(e) => handleUpdateQuestion(qIndex, { points: Number(e.target.value) })}
                                                className="w-20 px-2 py-1 border-2 border-duo-gray-200 rounded-lg text-sm text-center"
                                                min={1}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </main>

                {/* Scan Modal - Multi-step */}
                {isScanModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-slide-up">
                            {/* Header with step indicator */}
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-duo-gray-900">
                                        📸 {language === 'id' ? 'Buat Soal dari Foto' : 'Create Quiz from Photo'}
                                    </h2>
                                    <div className="flex gap-2 mt-2">
                                        {['upload', 'preferences', 'processing'].map((step, idx) => (
                                            <div key={step} className={`h-1 w-12 rounded-full ${scanStep === step ? 'bg-duo-blue' :
                                                    (['upload', 'preferences', 'processing'].indexOf(scanStep) > idx) ? 'bg-duo-green' : 'bg-duo-gray-200'
                                                }`} />
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setIsScanModalOpen(false); setScanStep('upload'); setScanImage(null); }}
                                    className="text-duo-gray-400 hover:text-duo-gray-600 text-xl"
                                >✕</button>
                            </div>

                            {/* Step 1: Upload */}
                            {scanStep === 'upload' && (
                                <>
                                    <p className="text-duo-gray-500 mb-4 text-sm">
                                        {language === 'id'
                                            ? 'Upload foto materi atau soal (buku, kertas ujian, dll).'
                                            : 'Upload a photo of material or quiz (book, exam paper, etc).'}
                                    </p>

                                    <div className="border-2 border-dashed border-duo-gray-300 rounded-xl p-6 text-center hover:bg-duo-gray-50 transition-colors cursor-pointer relative mb-4">
                                        <input
                                            type="file"
                                            onChange={handleScanUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            accept="image/*"
                                        />
                                        {scanImage ? (
                                            <div className="relative h-48 w-full">
                                                <Image src={scanImage} alt="Preview" fill className="object-contain rounded-lg" />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setScanImage(null); }}
                                                    className="absolute top-2 right-2 bg-duo-red text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-duo-red/80 z-10"
                                                >✕</button>
                                            </div>
                                        ) : (
                                            <div className="py-8">
                                                <p className="text-4xl mb-2">🖼️</p>
                                                <p className="text-sm font-bold text-duo-purple">
                                                    {language === 'id' ? 'Klik untuk ambil foto / upload' : 'Click to take photo / upload'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setScanStep('preferences')}
                                        disabled={!scanImage}
                                        className="btn btn-primary btn-full"
                                    >
                                        {language === 'id' ? 'Lanjut →' : 'Continue →'}
                                    </button>
                                </>
                            )}

                            {/* Step 2: AI Preferences */}
                            {scanStep === 'preferences' && (
                                <>
                                    <p className="text-duo-gray-500 mb-4 text-sm">
                                        {language === 'id'
                                            ? '🤖 Tentukan jenis soal yang ingin dibuat dari materi ini.'
                                            : '🤖 Choose what type of questions to generate from this material.'}
                                    </p>

                                    {/* Preview image */}
                                    {scanImage && (
                                        <div className="relative h-32 w-full mb-4 bg-duo-gray-100 rounded-lg overflow-hidden">
                                            <Image src={scanImage} alt="Preview" fill className="object-contain" />
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {/* Question Type */}
                                        <div>
                                            <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                                {language === 'id' ? 'Jenis Soal' : 'Question Type'}
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { value: 'choice', label: language === 'id' ? '🔘 Pilihan Ganda' : '🔘 Multiple Choice', labelShort: 'PG' },
                                                    { value: 'essay', label: language === 'id' ? '📝 Essay' : '📝 Essay', labelShort: 'Essay' },
                                                    { value: 'mixed', label: language === 'id' ? '🔀 Campuran' : '🔀 Mixed', labelShort: 'Mix' },
                                                ].map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setScanPreferences(p => ({ ...p, questionType: opt.value as any }))}
                                                        className={`p-3 rounded-xl text-center transition-all ${scanPreferences.questionType === opt.value
                                                                ? 'bg-duo-blue text-white'
                                                                : 'bg-duo-gray-100 hover:bg-duo-gray-200'
                                                            }`}
                                                    >
                                                        <div className="text-lg">{opt.label.split(' ')[0]}</div>
                                                        <div className="text-xs">{opt.label.split(' ').slice(1).join(' ')}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Difficulty */}
                                        <div>
                                            <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                                {language === 'id' ? 'Tingkat Kesulitan' : 'Difficulty'}
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { value: 'easy', label: language === 'id' ? '🌱 Mudah' : '🌱 Easy' },
                                                    { value: 'medium', label: language === 'id' ? '🌿 Sedang' : '🌿 Medium' },
                                                    { value: 'hard', label: language === 'id' ? '🌳 Sulit' : '🌳 Hard' },
                                                ].map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setScanPreferences(p => ({ ...p, difficulty: opt.value as any }))}
                                                        className={`p-2 rounded-lg text-sm transition-all ${scanPreferences.difficulty === opt.value
                                                                ? 'bg-duo-green text-white'
                                                                : 'bg-duo-gray-100 hover:bg-duo-gray-200'
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Count */}
                                        <div>
                                            <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                                {language === 'id' ? 'Jumlah Soal' : 'Number of Questions'}
                                            </label>
                                            <div className="flex gap-2">
                                                {[5, 10, 15, 20].map(num => (
                                                    <button
                                                        key={num}
                                                        onClick={() => setScanPreferences(p => ({ ...p, count: num }))}
                                                        className={`flex-1 py-2 rounded-lg font-bold transition-all ${scanPreferences.count === num
                                                                ? 'bg-duo-purple text-white'
                                                                : 'bg-duo-gray-100 hover:bg-duo-gray-200'
                                                            }`}
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-6">
                                        <button
                                            onClick={() => setScanStep('upload')}
                                            className="btn btn-outline flex-1"
                                        >
                                            ← {language === 'id' ? 'Kembali' : 'Back'}
                                        </button>
                                        <button
                                            onClick={handleProcessScan}
                                            disabled={isScanning}
                                            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                                        >
                                            ✨ {language === 'id' ? 'Buat Soal' : 'Generate'}
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Step 3: Processing */}
                            {scanStep === 'processing' && (
                                <div className="py-12 text-center">
                                    <div className="text-6xl mb-4 animate-bounce">🤖</div>
                                    <p className="text-lg font-bold text-duo-gray-900 mb-2">
                                        {language === 'id' ? 'AI sedang membaca materi...' : 'AI is reading the material...'}
                                    </p>
                                    <p className="text-sm text-duo-gray-500">
                                        {language === 'id'
                                            ? `Membuat ${scanPreferences.count} soal ${scanPreferences.questionType === 'choice' ? 'pilihan ganda' : scanPreferences.questionType === 'essay' ? 'essay' : 'campuran'}`
                                            : `Creating ${scanPreferences.count} ${scanPreferences.questionType} questions`}
                                    </p>
                                    <div className="mt-4 flex justify-center">
                                        <div className="w-48 h-2 bg-duo-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-duo-blue animate-pulse" style={{ width: '60%' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // List View logic remains...


    // List View
    return (
        <div className="min-h-screen bg-duo-gray-100">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r-2 border-duo-gray-200 p-6 hidden lg:block">
                <div className="flex items-center gap-3 mb-8">
                    <Image src="/icon.png" alt="LMS YPP" width={40} height={40} className="rounded-lg" />
                    <span className="font-extrabold text-duo-gray-900 text-xl">LMS YPP</span>
                </div>

                <nav className="space-y-2">
                    <NavLink emoji="📊" label={t('nav.dashboard')} href="/teacher/dashboard" />
                    <NavLink emoji="🏫" label={t('nav.classes')} href="/teacher/classes" />
                    <NavLink emoji="📝" label={t('nav.content')} active href="/teacher/content" />
                    <NavLink emoji="📋" label={t('nav.assignments')} href="/teacher/assignments" />
                </nav>
            </aside>

            {/* Main */}
            <main className="lg:ml-64 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-extrabold text-duo-gray-900">
                            📝 {language === 'id' ? 'Konten & Kuis' : 'Content & Quizzes'}
                        </h1>
                        <p className="text-duo-gray-500">
                            {language === 'id' ? 'Buat dan kelola kuis untuk kelasmu' : 'Create and manage quizzes for your classes'}
                        </p>
                    </div>
                    <button onClick={() => setIsCreating(true)} className="btn btn-primary">
                        ➕ {language === 'id' ? 'Buat Kuis Baru' : 'Create New Quiz'}
                    </button>
                </div>

                {/* Quiz List */}
                {drafts.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-6xl mb-4">📝</p>
                        <p className="text-xl font-bold text-duo-gray-900 mb-2">
                            {language === 'id' ? 'Belum ada kuis' : 'No quizzes yet'}
                        </p>
                        <p className="text-duo-gray-500 mb-6">
                            {language === 'id' ? 'Buat kuis pertamamu untuk siswa!' : 'Create your first quiz for students!'}
                        </p>
                        <button onClick={() => setIsCreating(true)} className="btn btn-primary">
                            ➕ {language === 'id' ? 'Buat Kuis Baru' : 'Create New Quiz'}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {drafts.map(draft => (
                            <div key={draft.id} className="card">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`badge ${draft.isExamMode ? 'bg-duo-red/20 text-duo-red' : 'bg-duo-blue/20 text-duo-blue'}`}>
                                        {draft.isExamMode ? '🔒 Exam' : '📝 Quiz'}
                                    </span>
                                    <span className="text-xs text-duo-gray-500">Kelas {draft.grade}</span>
                                </div>

                                <h3 className="font-bold text-duo-gray-900 mb-2">{draft.title}</h3>
                                <p className="text-sm text-duo-gray-500 mb-2">
                                    {draft.questions.length} {language === 'id' ? 'soal' : 'questions'}
                                    {draft.timeLimit && ` • ${draft.timeLimit} min`}
                                </p>

                                {/* Repeatability Info */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`text-xs px-2 py-1 rounded-full ${draft.isRepeatable
                                        ? 'bg-duo-green/20 text-duo-green'
                                        : 'bg-duo-orange/20 text-duo-orange'
                                        }`}>
                                        {draft.isRepeatable
                                            ? `🔄 ${draft.maxAttempts ? `${draft.maxAttempts}x` : '∞'}`
                                            : '🔒 1x'
                                        }
                                    </span>
                                    {draft.aiHintsEnabled && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-duo-purple/20 text-duo-purple">
                                            🤖 AI
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditDraft(draft)}
                                        className="btn btn-outline btn-sm flex-1"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDraft(draft.id)}
                                        className="btn btn-ghost btn-sm text-duo-red"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function NavLink({ emoji, label, href, active = false }: { emoji: string; label: string; href: string; active?: boolean }) {
    const router = useRouter();
    return (
        <button
            onClick={() => router.push(href)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold transition-all ${active
                ? 'bg-duo-blue/10 text-duo-blue'
                : 'text-duo-gray-500 hover:bg-duo-gray-100 hover:text-duo-gray-700'
                }`}
        >
            <span>{emoji}</span>
            <span>{label}</span>
        </button>
    );
}
