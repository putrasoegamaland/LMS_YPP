'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

interface Tournament {
    id: string;
    name: string;
    type: 'class_battle' | 'tournament_week' | 'daily_sprint';
    subject: string;
    grade: number;
    classes: string[]; // class IDs
    startDate: string;
    endDate: string;
    status: 'scheduled' | 'active' | 'completed';
    rounds: TournamentRound[];
    createdAt: string;
}

interface TournamentRound {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questionCount: number;
    timeLimit: number; // minutes
}

// Mock classes data
const MOCK_CLASSES = [
    { id: 'class-9a', name: 'Kelas 9A', grade: 9, students: 32 },
    { id: 'class-9b', name: 'Kelas 9B', grade: 9, students: 30 },
    { id: 'class-10a', name: 'Kelas 10A', grade: 10, students: 28 },
    { id: 'class-10b', name: 'Kelas 10B', grade: 10, students: 31 },
];

const TOURNAMENT_STORAGE_KEY = 'lms_ypp_tournaments';

export default function TeacherTournamentsPage() {
    const router = useRouter();
    const { user, isTeacher, isLoading: authLoading } = useAuth();
    const { language, t } = useLanguage();

    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState<Tournament['type']>('class_battle');
    const [subject, setSubject] = useState('matematika');
    const [grade, setGrade] = useState(9);
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [rounds, setRounds] = useState<TournamentRound[]>([
        { id: 'r1', name: 'Round 1: Easy', startTime: '', endTime: '', difficulty: 'easy', questionCount: 10, timeLimit: 10 },
        { id: 'r2', name: 'Round 2: Medium', startTime: '', endTime: '', difficulty: 'medium', questionCount: 10, timeLimit: 15 },
        { id: 'r3', name: 'Round 3: Hard', startTime: '', endTime: '', difficulty: 'hard', questionCount: 5, timeLimit: 20 },
    ]);

    // Load tournaments
    useEffect(() => {
        const saved = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
        if (saved) {
            try {
                setTournaments(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load tournaments:', e);
            }
        }
    }, []);

    // Auth check
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

    const saveTournaments = (newTournaments: Tournament[]) => {
        localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(newTournaments));
        setTournaments(newTournaments);
    };

    const handleCreateTournament = () => {
        if (!name.trim() || selectedClasses.length < 2) {
            alert(language === 'id' ? 'Nama dan minimal 2 kelas diperlukan!' : 'Name and at least 2 classes required!');
            return;
        }

        const tournament: Tournament = {
            id: `tourney-${Date.now()}`,
            name,
            type,
            subject,
            grade,
            classes: selectedClasses,
            startDate,
            endDate,
            status: 'scheduled',
            rounds,
            createdAt: new Date().toISOString(),
        };

        saveTournaments([tournament, ...tournaments]);
        resetForm();
    };

    const resetForm = () => {
        setIsCreating(false);
        setName('');
        setType('class_battle');
        setSubject('matematika');
        setGrade(9);
        setSelectedClasses([]);
        setStartDate('');
        setEndDate('');
    };

    const handleDeleteTournament = (id: string) => {
        if (confirm(language === 'id' ? 'Hapus turnamen ini?' : 'Delete this tournament?')) {
            saveTournaments(tournaments.filter(t => t.id !== id));
        }
    };

    const handleStartTournament = (id: string) => {
        saveTournaments(tournaments.map(t =>
            t.id === id ? { ...t, status: 'active' as const } : t
        ));
    };

    const handleEndTournament = (id: string) => {
        saveTournaments(tournaments.map(t =>
            t.id === id ? { ...t, status: 'completed' as const } : t
        ));
    };

    const toggleClassSelection = (classId: string) => {
        setSelectedClasses(prev =>
            prev.includes(classId)
                ? prev.filter(c => c !== classId)
                : [...prev, classId]
        );
    };

    const getStatusBadge = (status: Tournament['status']) => {
        const styles = {
            scheduled: 'bg-duo-blue/20 text-duo-blue',
            active: 'bg-duo-green/20 text-duo-green animate-pulse',
            completed: 'bg-duo-gray-200 text-duo-gray-600',
        };
        const labels = {
            scheduled: language === 'id' ? '📅 Terjadwal' : '📅 Scheduled',
            active: language === 'id' ? '🔥 Berlangsung' : '🔥 Active',
            completed: language === 'id' ? '✅ Selesai' : '✅ Completed',
        };
        return <span className={`badge ${styles[status]}`}>{labels[status]}</span>;
    };

    const getTypeBadge = (tournamentType: Tournament['type']) => {
        const labels = {
            class_battle: '⚔️ Class Battle',
            tournament_week: '🏆 Tournament Week',
            daily_sprint: '🏃 Daily Sprint',
        };
        return <span className="badge bg-duo-purple/20 text-duo-purple">{labels[tournamentType]}</span>;
    };

    const filteredClasses = MOCK_CLASSES.filter(c => c.grade === grade);

    return (
        <div className="min-h-screen bg-duo-gray-100">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r-2 border-duo-gray-200 p-6 hidden lg:block">
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
                    <button className="w-full text-left px-4 py-2 rounded-lg bg-duo-purple/10 text-duo-purple font-bold flex items-center gap-3">
                        <span>🏆</span> {language === 'id' ? 'Turnamen' : 'Tournaments'}
                    </button>
                    <button onClick={() => router.push('/teacher/exam-review')} className="w-full text-left px-4 py-2 rounded-lg text-duo-gray-600 hover:bg-duo-gray-100 flex items-center gap-3">
                        <span>🚨</span> {language === 'id' ? 'Review' : 'Review'}
                    </button>
                </nav>
            </aside>

            {/* Main */}
            <main className="lg:ml-64 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-extrabold text-duo-gray-900">
                            🏆 {language === 'id' ? 'Turnamen & Kompetisi' : 'Tournaments & Competitions'}
                        </h1>
                        <p className="text-duo-gray-500">
                            {language === 'id' ? 'Jadwalkan pertandingan antar kelas' : 'Schedule class competitions'}
                        </p>
                    </div>
                    <button onClick={() => setIsCreating(true)} className="btn btn-primary">
                        ➕ {language === 'id' ? 'Buat Turnamen' : 'Create Tournament'}
                    </button>
                </div>

                {/* Tournament List */}
                {tournaments.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-6xl mb-4">🏆</p>
                        <p className="text-xl font-bold text-duo-gray-900 mb-2">
                            {language === 'id' ? 'Belum ada turnamen' : 'No tournaments yet'}
                        </p>
                        <p className="text-duo-gray-500 mb-6">
                            {language === 'id' ? 'Buat turnamen pertama untuk memulai kompetisi!' : 'Create your first tournament to start competing!'}
                        </p>
                        <button onClick={() => setIsCreating(true)} className="btn btn-primary">
                            ➕ {language === 'id' ? 'Buat Turnamen' : 'Create Tournament'}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tournaments.map(tournament => (
                            <div key={tournament.id} className="card">
                                <div className="flex items-center justify-between mb-3">
                                    {getTypeBadge(tournament.type)}
                                    {getStatusBadge(tournament.status)}
                                </div>

                                <h3 className="font-bold text-duo-gray-900 text-lg mb-2">{tournament.name}</h3>

                                <div className="text-sm text-duo-gray-500 mb-4 space-y-1">
                                    <p>📚 {tournament.subject} • Kelas {tournament.grade}</p>
                                    <p>🏫 {tournament.classes.length} kelas terlibat</p>
                                    <p>📅 {new Date(tournament.startDate).toLocaleDateString()}</p>
                                    <p>🎯 {tournament.rounds.length} rounds</p>
                                </div>

                                <div className="flex gap-2">
                                    {tournament.status === 'scheduled' && (
                                        <button
                                            onClick={() => handleStartTournament(tournament.id)}
                                            className="flex-1 btn btn-primary btn-sm"
                                        >
                                            🚀 {language === 'id' ? 'Mulai' : 'Start'}
                                        </button>
                                    )}
                                    {tournament.status === 'active' && (
                                        <button
                                            onClick={() => handleEndTournament(tournament.id)}
                                            className="flex-1 btn bg-duo-red text-white btn-sm"
                                        >
                                            🏁 {language === 'id' ? 'Akhiri' : 'End'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedTournament(tournament)}
                                        className="btn btn-outline btn-sm"
                                    >
                                        👁️
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTournament(tournament.id)}
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

            {/* Create Tournament Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
                        <div className="sticky top-0 bg-white p-6 border-b border-duo-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-duo-gray-900">
                                🏆 {language === 'id' ? 'Buat Turnamen Baru' : 'Create New Tournament'}
                            </h2>
                            <button onClick={resetForm} className="text-duo-gray-400 hover:text-duo-gray-600 text-2xl">✕</button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                    {language === 'id' ? 'Nama Turnamen' : 'Tournament Name'}
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={language === 'id' ? 'Contoh: Battle Matematika Semester 1' : 'Example: Math Battle Semester 1'}
                                    className="input"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                    {language === 'id' ? 'Jenis Kompetisi' : 'Competition Type'}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'class_battle', label: '⚔️ Class Battle', desc: '2 kelas head-to-head' },
                                        { value: 'tournament_week', label: '🏆 Tournament', desc: 'Bracket competition' },
                                        { value: 'daily_sprint', label: '🏃 Daily Sprint', desc: 'Quick daily challenge' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setType(opt.value as Tournament['type'])}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${type === opt.value
                                                    ? 'border-duo-purple bg-duo-purple/10'
                                                    : 'border-duo-gray-200 hover:border-duo-gray-300'
                                                }`}
                                        >
                                            <div className="font-bold text-sm">{opt.label}</div>
                                            <div className="text-xs text-duo-gray-500">{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Subject & Grade */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                        {language === 'id' ? 'Mata Pelajaran' : 'Subject'}
                                    </label>
                                    <select value={subject} onChange={(e) => setSubject(e.target.value)} className="input">
                                        <option value="matematika">Matematika</option>
                                        <option value="bahasa_indonesia">Bahasa Indonesia</option>
                                        <option value="bahasa_inggris">Bahasa Inggris</option>
                                        <option value="ipa">IPA</option>
                                        <option value="ips">IPS</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                        {language === 'id' ? 'Tingkat Kelas' : 'Grade Level'}
                                    </label>
                                    <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className="input">
                                        {[7, 8, 9, 10, 11, 12].map(g => (
                                            <option key={g} value={g}>Kelas {g}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Class Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                    {language === 'id' ? 'Pilih Kelas yang Bertanding' : 'Select Competing Classes'}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {filteredClasses.map(cls => (
                                        <button
                                            key={cls.id}
                                            onClick={() => toggleClassSelection(cls.id)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${selectedClasses.includes(cls.id)
                                                    ? 'border-duo-green bg-duo-green/10'
                                                    : 'border-duo-gray-200 hover:border-duo-gray-300'
                                                }`}
                                        >
                                            <div className="font-bold">{cls.name}</div>
                                            <div className="text-xs text-duo-gray-500">{cls.students} siswa</div>
                                        </button>
                                    ))}
                                </div>
                                {filteredClasses.length === 0 && (
                                    <p className="text-duo-gray-400 text-sm">Tidak ada kelas untuk grade ini</p>
                                )}
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                        {language === 'id' ? 'Tanggal Mulai' : 'Start Date'}
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                        {language === 'id' ? 'Tanggal Selesai' : 'End Date'}
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="input"
                                    />
                                </div>
                            </div>

                            {/* Rounds Preview */}
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                    {language === 'id' ? 'Round Pertandingan' : 'Competition Rounds'}
                                </label>
                                <div className="space-y-2">
                                    {rounds.map((round, idx) => (
                                        <div key={round.id} className="flex items-center gap-3 p-3 bg-duo-gray-100 rounded-xl">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${round.difficulty === 'easy' ? 'bg-duo-green' :
                                                    round.difficulty === 'medium' ? 'bg-duo-yellow' : 'bg-duo-red'
                                                }`}>
                                                {idx + 1}
                                            </span>
                                            <div className="flex-1">
                                                <div className="font-semibold text-sm">{round.name}</div>
                                                <div className="text-xs text-duo-gray-500">
                                                    {round.questionCount} soal • {round.timeLimit} menit
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-white p-6 border-t border-duo-gray-200">
                            <button
                                onClick={handleCreateTournament}
                                className="btn btn-primary btn-full"
                            >
                                🏆 {language === 'id' ? 'Buat Turnamen' : 'Create Tournament'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tournament Detail Modal */}
            {selectedTournament && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-slide-up">
                        <div className="p-6 border-b border-duo-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-duo-gray-900">{selectedTournament.name}</h2>
                            <button onClick={() => setSelectedTournament(null)} className="text-duo-gray-400 hover:text-duo-gray-600 text-2xl">✕</button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex gap-2">
                                {getTypeBadge(selectedTournament.type)}
                                {getStatusBadge(selectedTournament.status)}
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-duo-gray-500">📚 Subject:</span>
                                    <p className="font-semibold">{selectedTournament.subject}</p>
                                </div>
                                <div>
                                    <span className="text-duo-gray-500">🎓 Grade:</span>
                                    <p className="font-semibold">Kelas {selectedTournament.grade}</p>
                                </div>
                                <div>
                                    <span className="text-duo-gray-500">📅 Start:</span>
                                    <p className="font-semibold">{new Date(selectedTournament.startDate).toLocaleString()}</p>
                                </div>
                                <div>
                                    <span className="text-duo-gray-500">🏁 End:</span>
                                    <p className="font-semibold">{new Date(selectedTournament.endDate).toLocaleString()}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold mb-2">🏫 Kelas Peserta</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTournament.classes.map(classId => {
                                        const cls = MOCK_CLASSES.find(c => c.id === classId);
                                        return cls ? (
                                            <span key={classId} className="badge bg-duo-gray-100 text-duo-gray-700">
                                                {cls.name}
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold mb-2">🎯 Rounds</h3>
                                <div className="space-y-2">
                                    {selectedTournament.rounds.map((round, idx) => (
                                        <div key={round.id} className="flex items-center gap-3 p-3 bg-duo-gray-100 rounded-xl">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${round.difficulty === 'easy' ? 'bg-duo-green' :
                                                    round.difficulty === 'medium' ? 'bg-duo-yellow' : 'bg-duo-red'
                                                }`}>
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <div className="font-semibold text-sm">{round.name}</div>
                                                <div className="text-xs text-duo-gray-500">
                                                    {round.questionCount} soal • {round.timeLimit} menit
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
