'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

// Discussion types
interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    authorRole: 'student' | 'teacher';
    content: string;
    topic: string;
    createdAt: string;
    likes: number;
    replies: Reply[];
    isLiked: boolean;
    isPinned: boolean;
    isModerated: boolean;
}

interface Reply {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    authorRole: 'student' | 'teacher';
    content: string;
    createdAt: string;
    likes: number;
    isLiked: boolean;
    isBestAnswer: boolean;
}

const TOPICS = [
    { id: 'all', name: { id: 'Semua', en: 'All' }, icon: '💬' },
    { id: 'matematika', name: { id: 'Matematika', en: 'Math' }, icon: '🔢' },
    { id: 'ipa', name: { id: 'IPA', en: 'Science' }, icon: '🔬' },
    { id: 'bahasa', name: { id: 'Bahasa', en: 'Language' }, icon: '📚' },
    { id: 'general', name: { id: 'Umum', en: 'General' }, icon: '🗣️' },
];

const MOCK_POSTS: Post[] = [
    {
        id: 'p1',
        authorId: 'u1',
        authorName: 'Guru Matematika',
        authorAvatar: '👩‍🏫',
        authorRole: 'teacher',
        content: '📌 Selamat datang di Forum Diskusi! Silakan bertanya atau berbagi tips belajar di sini. Ingat untuk menjaga sopan santun ya! 🙏',
        topic: 'general',
        createdAt: '2026-01-10T08:00:00',
        likes: 15,
        replies: [],
        isLiked: true,
        isPinned: true,
        isModerated: false,
    },
    {
        id: 'p2',
        authorId: 'u2',
        authorName: 'Budi Santoso',
        authorAvatar: '👦',
        authorRole: 'student',
        content: 'Ada yang bisa bantu jelaskan cara menghitung luas trapesium? Saya masih bingung dengan rumusnya 🤔',
        topic: 'matematika',
        createdAt: '2026-01-13T10:30:00',
        likes: 3,
        replies: [
            {
                id: 'r1',
                authorId: 'u3',
                authorName: 'Siti Aminah',
                authorAvatar: '👧',
                authorRole: 'student',
                content: 'Rumusnya: L = ½ × (a + b) × t\nDimana a dan b adalah sisi sejajar, t adalah tinggi',
                createdAt: '2026-01-13T11:00:00',
                likes: 5,
                isLiked: true,
                isBestAnswer: true,
            },
            {
                id: 'r2',
                authorId: 'u1',
                authorName: 'Guru Matematika',
                authorAvatar: '👩‍🏫',
                authorRole: 'teacher',
                content: 'Betul sekali Siti! Penjelasan yang bagus 👏',
                createdAt: '2026-01-13T11:30:00',
                likes: 2,
                isLiked: false,
                isBestAnswer: false,
            },
        ],
        isLiked: false,
        isPinned: false,
        isModerated: false,
    },
    {
        id: 'p3',
        authorId: 'u4',
        authorName: 'Andi Pratama',
        authorAvatar: '👦',
        authorRole: 'student',
        content: 'Tips belajar untuk menghadapi UTS minggu depan? Bagi dong strateginya! 📖✨',
        topic: 'general',
        createdAt: '2026-01-13T09:00:00',
        likes: 8,
        replies: [
            {
                id: 'r3',
                authorId: 'u5',
                authorName: 'Dewi Kartika',
                authorAvatar: '👧',
                authorRole: 'student',
                content: 'Saya biasanya bikin mind map untuk setiap bab, membantu banget!',
                createdAt: '2026-01-13T09:30:00',
                likes: 4,
                isLiked: false,
                isBestAnswer: false,
            },
        ],
        isLiked: true,
        isPinned: false,
        isModerated: false,
    },
];

const STORAGE_KEY = 'lms_ypp_forum_posts';

// Simple AI moderation check (in production, use actual AI)
const checkModeration = (text: string): { safe: boolean; reason?: string } => {
    const badWords = ['bodoh', 'goblok', 'bego', 'stupid', 'idiot'];
    const lowerText = text.toLowerCase();
    for (const word of badWords) {
        if (lowerText.includes(word)) {
            return { safe: false, reason: 'Mengandung kata tidak sopan' };
        }
    }
    return { safe: true };
};

export default function DiscussionPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, isTeacher } = useAuth();
    const { language } = useLanguage();
    const { addXp } = useGame();

    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
    const [selectedTopic, setSelectedTopic] = useState('all');
    const [newPost, setNewPost] = useState('');
    const [newPostTopic, setNewPostTopic] = useState('general');
    const [expandedPost, setExpandedPost] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [moderationWarning, setModerationWarning] = useState<string | null>(null);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const filteredPosts = selectedTopic === 'all'
        ? posts
        : posts.filter(p => p.topic === selectedTopic);

    const sortedPosts = [...filteredPosts].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const handleCreatePost = () => {
        if (!newPost.trim()) return;

        // AI moderation check
        const modResult = checkModeration(newPost);
        if (!modResult.safe) {
            setModerationWarning(modResult.reason || 'Post tidak dapat dikirim');
            return;
        }

        const post: Post = {
            id: `p-${Date.now()}`,
            authorId: user.id || 'current-user',
            authorName: user.name || 'Kamu',
            authorAvatar: '😊',
            authorRole: isTeacher ? 'teacher' : 'student',
            content: newPost,
            topic: newPostTopic,
            createdAt: new Date().toISOString(),
            likes: 0,
            replies: [],
            isLiked: false,
            isPinned: false,
            isModerated: false,
        };

        setPosts([post, ...posts]);
        setNewPost('');
        addXp(10); // XP for posting
    };

    const handleReply = (postId: string) => {
        if (!replyContent.trim()) return;

        // AI moderation check
        const modResult = checkModeration(replyContent);
        if (!modResult.safe) {
            setModerationWarning(modResult.reason || 'Reply tidak dapat dikirim');
            return;
        }

        const reply: Reply = {
            id: `r-${Date.now()}`,
            authorId: user.id || 'current-user',
            authorName: user.name || 'Kamu',
            authorAvatar: '😊',
            authorRole: isTeacher ? 'teacher' : 'student',
            content: replyContent,
            createdAt: new Date().toISOString(),
            likes: 0,
            isLiked: false,
            isBestAnswer: false,
        };

        setPosts(posts.map(p =>
            p.id === postId
                ? { ...p, replies: [...p.replies, reply] }
                : p
        ));
        setReplyContent('');
        addXp(5); // XP for replying
    };

    const handleLikePost = (postId: string) => {
        setPosts(posts.map(p =>
            p.id === postId
                ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
                : p
        ));
    };

    const handleLikeReply = (postId: string, replyId: string) => {
        setPosts(posts.map(p =>
            p.id === postId
                ? {
                    ...p,
                    replies: p.replies.map(r =>
                        r.id === replyId
                            ? { ...r, isLiked: !r.isLiked, likes: r.isLiked ? r.likes - 1 : r.likes + 1 }
                            : r
                    )
                }
                : p
        ));
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);

        if (mins < 1) return language === 'id' ? 'Baru saja' : 'Just now';
        if (mins < 60) return `${mins}m`;
        if (hours < 24) return `${hours}h`;
        return `${days}d`;
    };

    return (
        <div className="min-h-screen bg-duo-gray-100 p-6">
            <div className="max-w-3xl mx-auto">
                <button onClick={() => router.back()} className="text-duo-gray-500 hover:text-duo-gray-700 mb-4">
                    ← {language === 'id' ? 'Kembali' : 'Back'}
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-extrabold text-duo-gray-900 mb-2">
                        💬 {language === 'id' ? 'Forum Diskusi' : 'Discussion Forum'}
                    </h1>
                    <p className="text-duo-gray-500">
                        {language === 'id' ? 'Tanya, jawab, dan belajar bersama!' : 'Ask, answer, and learn together!'}
                    </p>
                </div>

                {/* Topic Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {TOPICS.map(topic => (
                        <button
                            key={topic.id}
                            onClick={() => setSelectedTopic(topic.id)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedTopic === topic.id
                                    ? 'bg-duo-blue text-white'
                                    : 'bg-white text-duo-gray-600 hover:bg-duo-gray-100'
                                }`}
                        >
                            {topic.icon} {language === 'id' ? topic.name.id : topic.name.en}
                        </button>
                    ))}
                </div>

                {/* Moderation Warning */}
                {moderationWarning && (
                    <div className="bg-duo-red/20 text-duo-red p-4 rounded-xl mb-4 flex items-center justify-between">
                        <span>⚠️ {moderationWarning}</span>
                        <button onClick={() => setModerationWarning(null)} className="text-xl">×</button>
                    </div>
                )}

                {/* New Post Form */}
                <div className="card mb-6">
                    <div className="flex gap-3 mb-3">
                        <span className="text-3xl">😊</span>
                        <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder={language === 'id' ? 'Tulis pertanyaan atau diskusi...' : 'Write a question or discussion...'}
                            className="flex-1 px-4 py-3 border-2 border-duo-gray-200 rounded-xl resize-none h-20"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <select
                            value={newPostTopic}
                            onChange={(e) => setNewPostTopic(e.target.value)}
                            className="px-3 py-2 border-2 border-duo-gray-200 rounded-lg"
                        >
                            {TOPICS.filter(t => t.id !== 'all').map(topic => (
                                <option key={topic.id} value={topic.id}>
                                    {topic.icon} {language === 'id' ? topic.name.id : topic.name.en}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleCreatePost}
                            disabled={!newPost.trim()}
                            className="btn btn-primary disabled:opacity-50"
                        >
                            📤 {language === 'id' ? 'Kirim (+10 XP)' : 'Post (+10 XP)'}
                        </button>
                    </div>
                </div>

                {/* Posts List */}
                <div className="space-y-4">
                    {sortedPosts.map(post => (
                        <div key={post.id} className={`card ${post.isPinned ? 'border-2 border-duo-yellow' : ''}`}>
                            {/* Post Header */}
                            <div className="flex items-start gap-3 mb-3">
                                <span className="text-3xl">{post.authorAvatar}</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-duo-gray-900">{post.authorName}</span>
                                        {post.authorRole === 'teacher' && (
                                            <span className="text-xs px-2 py-0.5 bg-duo-purple/20 text-duo-purple rounded-full">Guru</span>
                                        )}
                                        {post.isPinned && (
                                            <span className="text-xs px-2 py-0.5 bg-duo-yellow/20 text-duo-yellow rounded-full">📌 Pinned</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-duo-gray-500">{formatTime(post.createdAt)}</span>
                                </div>
                                <span className="text-xs px-2 py-1 bg-duo-gray-100 rounded-full">
                                    {TOPICS.find(t => t.id === post.topic)?.icon}
                                </span>
                            </div>

                            {/* Post Content */}
                            <p className="text-duo-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>

                            {/* Post Actions */}
                            <div className="flex items-center gap-4 border-t border-duo-gray-200 pt-3">
                                <button
                                    onClick={() => handleLikePost(post.id)}
                                    className={`flex items-center gap-1 ${post.isLiked ? 'text-duo-red' : 'text-duo-gray-500'}`}
                                >
                                    {post.isLiked ? '❤️' : '🤍'} {post.likes}
                                </button>
                                <button
                                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                                    className="flex items-center gap-1 text-duo-gray-500"
                                >
                                    💬 {post.replies.length} {language === 'id' ? 'balasan' : 'replies'}
                                </button>
                            </div>

                            {/* Replies */}
                            {expandedPost === post.id && (
                                <div className="mt-4 pl-4 border-l-2 border-duo-gray-200 space-y-3">
                                    {post.replies.map(reply => (
                                        <div key={reply.id} className={`p-3 rounded-lg ${reply.isBestAnswer ? 'bg-duo-green/10 border border-duo-green' : 'bg-duo-gray-100'}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xl">{reply.authorAvatar}</span>
                                                <span className="font-semibold text-sm">{reply.authorName}</span>
                                                {reply.authorRole === 'teacher' && (
                                                    <span className="text-xs px-2 py-0.5 bg-duo-purple/20 text-duo-purple rounded-full">Guru</span>
                                                )}
                                                {reply.isBestAnswer && (
                                                    <span className="text-xs px-2 py-0.5 bg-duo-green/20 text-duo-green rounded-full">✅ Best Answer</span>
                                                )}
                                                <span className="text-xs text-duo-gray-400">{formatTime(reply.createdAt)}</span>
                                            </div>
                                            <p className="text-sm text-duo-gray-700 whitespace-pre-wrap">{reply.content}</p>
                                            <button
                                                onClick={() => handleLikeReply(post.id, reply.id)}
                                                className={`text-sm mt-2 ${reply.isLiked ? 'text-duo-red' : 'text-duo-gray-500'}`}
                                            >
                                                {reply.isLiked ? '❤️' : '🤍'} {reply.likes}
                                            </button>
                                        </div>
                                    ))}

                                    {/* Reply Form */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder={language === 'id' ? 'Tulis balasan...' : 'Write a reply...'}
                                            className="flex-1 px-3 py-2 border-2 border-duo-gray-200 rounded-lg text-sm"
                                        />
                                        <button
                                            onClick={() => handleReply(post.id)}
                                            disabled={!replyContent.trim()}
                                            className="btn btn-sm btn-primary disabled:opacity-50"
                                        >
                                            {language === 'id' ? 'Balas' : 'Reply'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
