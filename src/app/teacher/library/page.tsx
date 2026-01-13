'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Book, Subject } from '@/types';

// Mock data for classes and students
const MOCK_CLASSES = [
    { id: 'c1', name: 'Kelas 7A - Matematika' },
    { id: 'c2', name: 'Kelas 8B - IPA' },
    { id: 'c3', name: 'Kelas 9C - Bahasa Indonesia' },
];

const MOCK_STUDENTS = [
    { id: 's1', name: 'Budi Santoso', classId: 'c1' },
    { id: 's2', name: 'Siti Aminah', classId: 'c1' },
    { id: 's3', name: 'Rizky Ramadhan', classId: 'c2' },
    { id: 's4', name: 'Dewi Putri', classId: 'c3' },
];

export default function TeacherLibraryPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { language, t } = useLanguage();

    const [books, setBooks] = useState<Book[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);

    // Upload Form State
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        subject: 'matematika' as Subject,
        file: null as File | null
    });

    // Assignment State
    const [assignTarget, setAssignTarget] = useState<'class' | 'student'>('class');
    const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

    // Redirect if not teacher
    useEffect(() => {
        if (!authLoading && user?.role !== 'teacher') {
            router.push('/login?role=teacher');
        }
    }, [user, authLoading, router]);

    // Load books from localStorage
    useEffect(() => {
        const savedBooks = localStorage.getItem('lms_ypp_books');
        if (savedBooks) {
            try {
                setBooks(JSON.parse(savedBooks));
            } catch (e) {
                console.error('Failed to parse books', e);
            }
        } else {
            // Add some demo books if empty
            const demoBooks: Book[] = [
                {
                    id: 'b1',
                    title: 'Modul Matematika Aljabar',
                    description: 'Panduan lengkap belajar aljabar untuk SMP',
                    fileUrl: '#',
                    subject: 'matematika',
                    assignedTo: [],
                    uploadedAt: new Date().toISOString()
                },
                {
                    id: 'b2',
                    title: 'Kumpulan Cerpen Nusantara',
                    description: 'Bahan bacaan untuk literasi Bahasa Indonesia',
                    fileUrl: '#',
                    subject: 'bahasa_indonesia',
                    assignedTo: [],
                    uploadedAt: new Date().toISOString()
                }
            ];
            setBooks(demoBooks);
            localStorage.setItem('lms_ypp_books', JSON.stringify(demoBooks));
        }
    }, []);

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadData.title || !uploadData.file) return;

        const newBook: Book = {
            id: `b-${Date.now()}`,
            title: uploadData.title,
            description: uploadData.description,
            subject: uploadData.subject,
            fileUrl: URL.createObjectURL(uploadData.file), // In real app, upload to S3
            assignedTo: [],
            uploadedAt: new Date().toISOString()
        };

        const updatedBooks = [...books, newBook];
        setBooks(updatedBooks);
        localStorage.setItem('lms_ypp_books', JSON.stringify(updatedBooks));

        setIsUploadModalOpen(false);
        setUploadData({ title: '', description: '', subject: 'matematika', file: null });

        // Show success
        alert(language === 'id' ? 'Buku berhasil diunggah!' : 'Book uploaded successfully!');
    };

    const handleAssign = () => {
        if (!selectedBook || selectedTargets.length === 0) return;

        const targets = selectedTargets.map(id => {
            const cls = MOCK_CLASSES.find(c => c.id === id);
            const std = MOCK_STUDENTS.find(s => s.id === id);
            return {
                type: assignTarget,
                id: id,
                name: cls ? cls.name : (std ? std.name : 'Unknown')
            };
        });

        const updatedBooks = books.map(b => {
            if (b.id === selectedBook.id) {
                // Merge assignments without duplicates
                const existingIds = b.assignedTo.map(a => a.id);
                const newAssignments = targets.filter(t => !existingIds.includes(t.id));
                return { ...b, assignedTo: [...b.assignedTo, ...newAssignments] };
            }
            return b;
        });

        setBooks(updatedBooks);
        localStorage.setItem('lms_ypp_books', JSON.stringify(updatedBooks));

        setIsAssignModalOpen(false);
        setSelectedTargets([]);

        alert(language === 'id' ? 'Buku berhasil ditugaskan!' : 'Book assigned successfully!');
    };

    if (authLoading || user?.role !== 'teacher') return null;

    return (
        <div className="min-h-screen bg-duo-gray-100 flex flex-col md:flex-row">
            {/* Sidebar Placeholder (Reuse TeacherDashboard Sidebar in real app) */}
            <aside className="w-full md:w-64 bg-white border-r border-duo-gray-200 hidden md:block h-screen sticky top-0">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-duo-purple mb-8">LMS YPP</h1>
                    <nav className="space-y-2">
                        <button onClick={() => router.push('/teacher/dashboard')} className="w-full text-left px-4 py-2 rounded-lg text-duo-gray-600 hover:bg-duo-gray-100">
                            📊 Dashboard
                        </button>
                        <button onClick={() => router.push('/teacher/content')} className="w-full text-left px-4 py-2 rounded-lg text-duo-gray-600 hover:bg-duo-gray-100">
                            📝 Content
                        </button>
                        <button className="w-full text-left px-4 py-2 rounded-lg bg-duo-purple/10 text-duo-purple font-bold">
                            📚 Library
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-duo-gray-900">
                            {language === 'id' ? 'Perpustakaan Buku' : 'Book Library'}
                        </h1>
                        <p className="text-duo-gray-500">
                            {language === 'id' ? 'Kelola dan bagikan materi belajar' : 'Manage and share learning materials'}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="btn btn-primary px-6 py-2 flex items-center gap-2"
                    >
                        <span>📤</span>
                        {language === 'id' ? 'Upload Buku' : 'Upload Book'}
                    </button>
                </div>

                {/* Books Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {books.map(book => (
                        <div key={book.id} className="bg-white rounded-xl shadow-sm border-2 border-duo-gray-200 p-4 hover:border-duo-purple transition-all">
                            <div className="h-40 bg-duo-gray-100 rounded-lg mb-4 flex items-center justify-center text-4xl">
                                📕
                            </div>
                            <h3 className="font-bold text-lg text-duo-gray-900 mb-1">{book.title}</h3>
                            <p className="text-sm text-duo-gray-500 mb-4 line-clamp-2">{book.description}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="badge bg-duo-blue/10 text-duo-blue text-xs uppercase">
                                    {book.subject.replace('_', ' ')}
                                </span>
                                {book.assignedTo.length > 0 && (
                                    <span className="badge bg-duo-green/10 text-duo-green text-xs">
                                        Assigned to {book.assignedTo.length}
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 py-2 rounded-lg border-2 border-duo-gray-200 font-semibold text-duo-gray-600 hover:border-duo-gray-400">
                                    👁️ {language === 'id' ? 'Lihat' : 'View'}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedBook(book);
                                        setIsAssignModalOpen(true);
                                    }}
                                    className="flex-1 py-2 rounded-lg bg-duo-purple text-white font-bold hover:bg-duo-purple-dark"
                                >
                                    📢 {language === 'id' ? 'Tugaskan' : 'Assign'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-duo-gray-900">
                                {language === 'id' ? 'Upload Buku Baru' : 'Upload New Book'}
                            </h2>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-duo-gray-400 hover:text-duo-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                    {language === 'id' ? 'Judul Buku' : 'Book Title'}
                                </label>
                                <input
                                    type="text"
                                    value={uploadData.title}
                                    onChange={e => setUploadData({ ...uploadData, title: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-duo-gray-200 rounded-xl focus:border-duo-purple focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                    {language === 'id' ? 'Deskripsi' : 'Description'}
                                </label>
                                <textarea
                                    value={uploadData.description}
                                    onChange={e => setUploadData({ ...uploadData, description: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-duo-gray-200 rounded-xl focus:border-duo-purple focus:outline-none"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                    {language === 'id' ? 'Mata Pelajaran' : 'Subject'}
                                </label>
                                <select
                                    value={uploadData.subject}
                                    onChange={e => setUploadData({ ...uploadData, subject: e.target.value as Subject })}
                                    className="w-full px-4 py-2 border-2 border-duo-gray-200 rounded-xl focus:border-duo-purple focus:outline-none"
                                >
                                    <option value="matematika">Matematika</option>
                                    <option value="bahasa_indonesia">Bahasa Indonesia</option>
                                    <option value="bahasa_inggris">Bahasa Inggris</option>
                                    <option value="ipa">IPA (Sains)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-1">
                                    {language === 'id' ? 'File PDF/Dokumen' : 'PDF/Document'}
                                </label>
                                <div className="border-2 border-dashed border-duo-gray-300 rounded-xl p-6 text-center hover:bg-duo-gray-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        onChange={e => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept=".pdf,.doc,.docx"
                                        required
                                    />
                                    <p className="text-2xl mb-2">📄</p>
                                    <p className="text-sm text-duo-gray-500">
                                        {uploadData.file
                                            ? uploadData.file.name
                                            : (language === 'id' ? 'Klik untuk pilih file' : 'Click to select file')}
                                    </p>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-full mt-6">
                                {language === 'id' ? 'Upload Sekarang' : 'Upload Now'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {isAssignModalOpen && selectedBook && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-duo-gray-900">
                                {language === 'id' ? 'Tugaskan Buku' : 'Assign Book'}
                            </h2>
                            <button onClick={() => setIsAssignModalOpen(false)} className="text-duo-gray-400 hover:text-duo-gray-600">✕</button>
                        </div>

                        <p className="mb-4 font-semibold text-duo-purple">📖 {selectedBook.title}</p>

                        <div className="flex bg-duo-gray-100 p-1 rounded-xl mb-4">
                            <button
                                onClick={() => setAssignTarget('class')}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${assignTarget === 'class' ? 'bg-white shadow-sm text-duo-gray-900' : 'text-duo-gray-500'
                                    }`}
                            >
                                {language === 'id' ? 'Kelas' : 'Classes'}
                            </button>
                            <button
                                onClick={() => setAssignTarget('student')}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${assignTarget === 'student' ? 'bg-white shadow-sm text-duo-gray-900' : 'text-duo-gray-500'
                                    }`}
                            >
                                {language === 'id' ? 'Siswa' : 'Students'}
                            </button>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
                            {(assignTarget === 'class' ? MOCK_CLASSES : MOCK_STUDENTS).map((item) => {
                                const isSelected = selectedTargets.includes(item.id);
                                const isAlreadyAssigned = selectedBook.assignedTo.some(a => a.id === item.id);

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            if (isAlreadyAssigned) return;
                                            if (isSelected) {
                                                setSelectedTargets(prev => prev.filter(t => t !== item.id));
                                            } else {
                                                setSelectedTargets(prev => [...prev, item.id]);
                                            }
                                        }}
                                        className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${isAlreadyAssigned
                                                ? 'bg-duo-gray-100 border-transparent opacity-60 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-duo-purple/10 border-duo-purple'
                                                    : 'bg-white border-duo-gray-200 hover:border-duo-gray-300'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected || isAlreadyAssigned ? 'bg-duo-purple border-duo-purple text-white' : 'border-duo-gray-300'
                                            }`}>
                                            {(isSelected || isAlreadyAssigned) && '✓'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{item.name}</p>
                                            {isAlreadyAssigned && (
                                                <p className="text-xs text-duo-green font-bold">
                                                    {language === 'id' ? 'Sudah ditugaskan' : 'Already Assigned'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleAssign}
                            disabled={selectedTargets.length === 0}
                            className="btn btn-primary btn-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {language === 'id' ? 'Simpan Penugasan' : 'Save Assignment'} ({selectedTargets.length})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
