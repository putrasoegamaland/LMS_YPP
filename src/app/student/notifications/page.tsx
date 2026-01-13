'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Notification types
interface Notification {
    id: string;
    type: 'achievement' | 'reminder' | 'announcement' | 'battle' | 'streak' | 'grade';
    title: { id: string; en: string };
    message: { id: string; en: string };
    icon: string;
    createdAt: string;
    read: boolean;
    actionUrl?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'n1',
        type: 'achievement',
        title: { id: 'Pencapaian Baru!', en: 'New Achievement!' },
        message: { id: 'Kamu mendapatkan "Boss Slayer" karena mengalahkan Boss Battle!', en: 'You earned "Boss Slayer" for defeating the Boss Battle!' },
        icon: '🏆',
        createdAt: '2026-01-13T14:30:00',
        read: false,
        actionUrl: '/student/achievements',
    },
    {
        id: 'n2',
        type: 'reminder',
        title: { id: 'Jangan Putus Streak!', en: "Don't Break Your Streak!" },
        message: { id: 'Kamu sudah 5 hari berturut-turut! Selesaikan 1 kuis hari ini.', en: "You're on a 5-day streak! Complete 1 quiz today." },
        icon: '🔥',
        createdAt: '2026-01-13T08:00:00',
        read: false,
        actionUrl: '/student/practice',
    },
    {
        id: 'n3',
        type: 'announcement',
        title: { id: 'Pengumuman Guru', en: 'Teacher Announcement' },
        message: { id: 'Ulangan Matematika minggu depan, Bab 1-5. Persiapkan dirimu!', en: 'Math test next week, Chapters 1-5. Prepare yourself!' },
        icon: '📢',
        createdAt: '2026-01-12T10:00:00',
        read: true,
    },
    {
        id: 'n4',
        type: 'battle',
        title: { id: 'Class Battle Dimulai!', en: 'Class Battle Started!' },
        message: { id: 'Kelas 9A vs 9B sudah dimulai. Bergabung sekarang!', en: 'Class 9A vs 9B has started. Join now!' },
        icon: '⚔️',
        createdAt: '2026-01-12T14:00:00',
        read: true,
        actionUrl: '/student/live-battle',
    },
    {
        id: 'n5',
        type: 'grade',
        title: { id: 'Nilai Kuis Keluar', en: 'Quiz Grade Released' },
        message: { id: 'Nilai kuis Aljabar sudah keluar: 85/100. Bagus sekali!', en: 'Your Algebra quiz grade is out: 85/100. Great job!' },
        icon: '📊',
        createdAt: '2026-01-11T16:00:00',
        read: true,
    },
    {
        id: 'n6',
        type: 'streak',
        title: { id: 'Streak Milestone!', en: 'Streak Milestone!' },
        message: { id: 'Hebat! Kamu mencapai streak 7 hari. Bonus: +100 XP!', en: 'Amazing! You reached a 7-day streak. Bonus: +100 XP!' },
        icon: '🔥',
        createdAt: '2026-01-10T20:00:00',
        read: true,
        actionUrl: '/student/streak-quest',
    },
];

const STORAGE_KEY = 'lms_ypp_notifications';

type FilterType = 'all' | 'unread' | 'achievement' | 'reminder' | 'announcement';

export default function NotificationsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();

    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const [filter, setFilter] = useState<FilterType>('all');

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setNotifications(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load notifications:', e);
            }
        }
    }, []);

    // Save to localStorage
    const saveNotifications = (newNotifications: Notification[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifications));
        setNotifications(newNotifications);
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.read;
        return n.type === filter;
    });

    const handleMarkAsRead = (id: string) => {
        saveNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const handleMarkAllAsRead = () => {
        saveNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const handleNotificationClick = (notification: Notification) => {
        handleMarkAsRead(notification.id);
        if (notification.actionUrl) {
            router.push(notification.actionUrl);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);

        if (mins < 1) return language === 'id' ? 'Baru saja' : 'Just now';
        if (mins < 60) return `${mins} ${language === 'id' ? 'menit lalu' : 'min ago'}`;
        if (hours < 24) return `${hours} ${language === 'id' ? 'jam lalu' : 'hours ago'}`;
        if (days < 7) return `${days} ${language === 'id' ? 'hari lalu' : 'days ago'}`;
        return date.toLocaleDateString();
    };

    const getTypeColor = (type: Notification['type']) => {
        switch (type) {
            case 'achievement': return 'bg-duo-yellow/20 text-duo-yellow';
            case 'reminder': return 'bg-duo-orange/20 text-duo-orange';
            case 'announcement': return 'bg-duo-blue/20 text-duo-blue';
            case 'battle': return 'bg-duo-red/20 text-duo-red';
            case 'streak': return 'bg-duo-orange/20 text-duo-orange';
            case 'grade': return 'bg-duo-green/20 text-duo-green';
            default: return 'bg-duo-gray-200 text-duo-gray-600';
        }
    };

    return (
        <div className="min-h-screen bg-duo-gray-100 p-6">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => router.back()} className="text-duo-gray-500 hover:text-duo-gray-700 mb-4">
                    ← {language === 'id' ? 'Kembali' : 'Back'}
                </button>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-duo-gray-900">
                            🔔 {language === 'id' ? 'Notifikasi' : 'Notifications'}
                        </h1>
                        {unreadCount > 0 && (
                            <p className="text-duo-gray-500">
                                {unreadCount} {language === 'id' ? 'belum dibaca' : 'unread'}
                            </p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-duo-blue font-semibold text-sm"
                        >
                            ✓ {language === 'id' ? 'Tandai semua dibaca' : 'Mark all as read'}
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                    {[
                        { id: 'all', icon: '📋', label: { id: 'Semua', en: 'All' } },
                        { id: 'unread', icon: '🔵', label: { id: 'Belum Dibaca', en: 'Unread' } },
                        { id: 'achievement', icon: '🏆', label: { id: 'Pencapaian', en: 'Achievements' } },
                        { id: 'reminder', icon: '⏰', label: { id: 'Pengingat', en: 'Reminders' } },
                        { id: 'announcement', icon: '📢', label: { id: 'Pengumuman', en: 'Announcements' } },
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as FilterType)}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold transition-all ${filter === f.id
                                    ? 'bg-duo-blue text-white'
                                    : 'bg-white text-duo-gray-600 hover:bg-duo-gray-100'
                                }`}
                        >
                            {f.icon} {language === 'id' ? f.label.id : f.label.en}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                        <div className="card text-center py-12">
                            <span className="text-5xl block mb-3">📭</span>
                            <p className="text-duo-gray-500">
                                {language === 'id' ? 'Tidak ada notifikasi' : 'No notifications'}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map(notification => (
                            <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`w-full card text-left transition-all hover:scale-[1.01] ${!notification.read ? 'border-l-4 border-duo-blue bg-duo-blue/5' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className={`text-3xl p-2 rounded-xl ${getTypeColor(notification.type)}`}>
                                        {notification.icon}
                                    </span>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={`font-bold ${!notification.read ? 'text-duo-gray-900' : 'text-duo-gray-700'}`}>
                                                {language === 'id' ? notification.title.id : notification.title.en}
                                            </h3>
                                            {!notification.read && (
                                                <span className="w-2 h-2 bg-duo-blue rounded-full" />
                                            )}
                                        </div>
                                        <p className="text-sm text-duo-gray-600 mb-2">
                                            {language === 'id' ? notification.message.id : notification.message.en}
                                        </p>
                                        <p className="text-xs text-duo-gray-400">
                                            {formatTime(notification.createdAt)}
                                        </p>
                                    </div>
                                    {notification.actionUrl && (
                                        <span className="text-duo-gray-400">→</span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
