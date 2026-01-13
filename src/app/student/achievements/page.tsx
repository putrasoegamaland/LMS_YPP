'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

// Achievement types
interface Achievement {
    id: string;
    name: { id: string; en: string };
    description: { id: string; en: string };
    icon: string;
    category: 'learning' | 'social' | 'competition' | 'streak' | 'special';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    requirement: { type: string; value: number };
    progress: number;
    unlocked: boolean;
    unlockedAt?: string;
}

const ACHIEVEMENTS: Achievement[] = [
    // Learning
    { id: 'first-quiz', name: { id: 'Langkah Pertama', en: 'First Steps' }, description: { id: 'Selesaikan kuis pertamamu', en: 'Complete your first quiz' }, icon: '🎯', category: 'learning', rarity: 'common', requirement: { type: 'quizzes', value: 1 }, progress: 1, unlocked: true, unlockedAt: '2026-01-10' },
    { id: 'quiz-10', name: { id: 'Pembelajar Aktif', en: 'Active Learner' }, description: { id: 'Selesaikan 10 kuis', en: 'Complete 10 quizzes' }, icon: '📚', category: 'learning', rarity: 'common', requirement: { type: 'quizzes', value: 10 }, progress: 8, unlocked: false },
    { id: 'quiz-50', name: { id: 'Ilmuwan Muda', en: 'Young Scholar' }, description: { id: 'Selesaikan 50 kuis', en: 'Complete 50 quizzes' }, icon: '🎓', category: 'learning', rarity: 'rare', requirement: { type: 'quizzes', value: 50 }, progress: 8, unlocked: false },
    { id: 'perfect-score', name: { id: 'Sempurna!', en: 'Perfect!' }, description: { id: 'Dapatkan skor 100% di kuis apapun', en: 'Get 100% on any quiz' }, icon: '💯', category: 'learning', rarity: 'rare', requirement: { type: 'perfect', value: 1 }, progress: 1, unlocked: true, unlockedAt: '2026-01-12' },
    { id: 'master-skill', name: { id: 'Master Skill', en: 'Skill Master' }, description: { id: 'Kuasai sebuah skill hingga 100%', en: 'Master a skill to 100%' }, icon: '🌟', category: 'learning', rarity: 'epic', requirement: { type: 'skills', value: 1 }, progress: 1, unlocked: true, unlockedAt: '2026-01-13' },

    // Competition
    { id: 'first-battle', name: { id: 'Petarung Baru', en: 'New Fighter' }, description: { id: 'Ikuti Class Battle pertamamu', en: 'Join your first Class Battle' }, icon: '⚔️', category: 'competition', rarity: 'common', requirement: { type: 'battles', value: 1 }, progress: 1, unlocked: true, unlockedAt: '2026-01-11' },
    { id: 'battle-winner', name: { id: 'Pemenang!', en: 'Winner!' }, description: { id: 'Menangkan Class Battle', en: 'Win a Class Battle' }, icon: '🏆', category: 'competition', rarity: 'rare', requirement: { type: 'wins', value: 1 }, progress: 0, unlocked: false },
    { id: 'top-10', name: { id: 'Top 10', en: 'Top 10' }, description: { id: 'Masuk 10 besar leaderboard', en: 'Reach top 10 on leaderboard' }, icon: '🔟', category: 'competition', rarity: 'rare', requirement: { type: 'rank', value: 10 }, progress: 5, unlocked: true, unlockedAt: '2026-01-12' },
    { id: 'boss-slayer', name: { id: 'Pembunuh Boss', en: 'Boss Slayer' }, description: { id: 'Kalahkan Boss Battle', en: 'Defeat a Boss Battle' }, icon: '🐉', category: 'competition', rarity: 'epic', requirement: { type: 'boss', value: 1 }, progress: 1, unlocked: true, unlockedAt: '2026-01-13' },

    // Streak
    { id: 'streak-3', name: { id: 'Konsisten', en: 'Consistent' }, description: { id: 'Pertahankan streak 3 hari', en: 'Maintain a 3-day streak' }, icon: '🔥', category: 'streak', rarity: 'common', requirement: { type: 'streak', value: 3 }, progress: 3, unlocked: true, unlockedAt: '2026-01-12' },
    { id: 'streak-7', name: { id: 'Semangat Api!', en: 'On Fire!' }, description: { id: 'Pertahankan streak 7 hari', en: 'Maintain a 7-day streak' }, icon: '🔥🔥', category: 'streak', rarity: 'rare', requirement: { type: 'streak', value: 7 }, progress: 5, unlocked: false },
    { id: 'streak-30', name: { id: 'Legenda Streak', en: 'Streak Legend' }, description: { id: 'Pertahankan streak 30 hari', en: 'Maintain a 30-day streak' }, icon: '🔥🔥🔥', category: 'streak', rarity: 'legendary', requirement: { type: 'streak', value: 30 }, progress: 5, unlocked: false },

    // Social
    { id: 'first-review', name: { id: 'Reviewer', en: 'Reviewer' }, description: { id: 'Berikan review pertamamu', en: 'Give your first peer review' }, icon: '👥', category: 'social', rarity: 'common', requirement: { type: 'reviews', value: 1 }, progress: 1, unlocked: true, unlockedAt: '2026-01-13' },
    { id: 'helpful-5', name: { id: 'Sangat Membantu', en: 'Very Helpful' }, description: { id: 'Dapatkan 5 "helpful" dari review', en: 'Get 5 "helpful" from reviews' }, icon: '💪', category: 'social', rarity: 'rare', requirement: { type: 'helpful', value: 5 }, progress: 2, unlocked: false },
    { id: 'coop-raid', name: { id: 'Tim Player', en: 'Team Player' }, description: { id: 'Ikuti Co-op Raid', en: 'Join a Co-op Raid' }, icon: '🤝', category: 'social', rarity: 'rare', requirement: { type: 'coop', value: 1 }, progress: 0, unlocked: false },

    // Special
    { id: 'early-adopter', name: { id: 'Early Adopter', en: 'Early Adopter' }, description: { id: 'Bergabung di bulan pertama', en: 'Joined in the first month' }, icon: '🌟', category: 'special', rarity: 'legendary', requirement: { type: 'special', value: 1 }, progress: 1, unlocked: true, unlockedAt: '2026-01-01' },
    { id: 'night-owl', name: { id: 'Burung Hantu', en: 'Night Owl' }, description: { id: 'Belajar setelah jam 12 malam', en: 'Study after midnight' }, icon: '🦉', category: 'special', rarity: 'epic', requirement: { type: 'special', value: 1 }, progress: 1, unlocked: true, unlockedAt: '2026-01-11' },
];

const CATEGORIES = [
    { id: 'all', name: { id: 'Semua', en: 'All' }, icon: '🏅' },
    { id: 'learning', name: { id: 'Belajar', en: 'Learning' }, icon: '📚' },
    { id: 'competition', name: { id: 'Kompetisi', en: 'Competition' }, icon: '🏆' },
    { id: 'streak', name: { id: 'Streak', en: 'Streak' }, icon: '🔥' },
    { id: 'social', name: { id: 'Sosial', en: 'Social' }, icon: '👥' },
    { id: 'special', name: { id: 'Spesial', en: 'Special' }, icon: '✨' },
];

const RARITY_COLORS = {
    common: { bg: 'bg-duo-gray-200', text: 'text-duo-gray-700', border: 'border-duo-gray-300' },
    rare: { bg: 'bg-duo-blue/20', text: 'text-duo-blue', border: 'border-duo-blue' },
    epic: { bg: 'bg-duo-purple/20', text: 'text-duo-purple', border: 'border-duo-purple' },
    legendary: { bg: 'bg-duo-yellow/20', text: 'text-duo-yellow', border: 'border-duo-yellow' },
};

export default function AchievementsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [sortBy, setSortBy] = useState<'date' | 'rarity'>('date');

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const filteredAchievements = selectedCategory === 'all'
        ? ACHIEVEMENTS
        : ACHIEVEMENTS.filter(a => a.category === selectedCategory);

    const sortedAchievements = [...filteredAchievements].sort((a, b) => {
        if (sortBy === 'date') {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            if (a.unlockedAt && b.unlockedAt) return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
            return 0;
        }
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });

    const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;
    const totalCount = ACHIEVEMENTS.length;

    const stats = {
        common: ACHIEVEMENTS.filter(a => a.rarity === 'common' && a.unlocked).length,
        rare: ACHIEVEMENTS.filter(a => a.rarity === 'rare' && a.unlocked).length,
        epic: ACHIEVEMENTS.filter(a => a.rarity === 'epic' && a.unlocked).length,
        legendary: ACHIEVEMENTS.filter(a => a.rarity === 'legendary' && a.unlocked).length,
    };

    return (
        <div className="min-h-screen bg-duo-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => router.back()} className="text-duo-gray-500 hover:text-duo-gray-700 mb-4">
                    ← {language === 'id' ? 'Kembali' : 'Back'}
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-extrabold text-duo-gray-900 mb-2">
                        🏅 {language === 'id' ? 'Pencapaian' : 'Achievements'}
                    </h1>
                    <p className="text-duo-gray-500">
                        {language === 'id' ? 'Koleksi pencapaianmu!' : 'Your achievement collection!'}
                    </p>
                </div>

                {/* Progress */}
                <div className="card mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-duo-gray-900">{language === 'id' ? 'Progress' : 'Progress'}</h2>
                        <span className="font-bold text-duo-blue">{unlockedCount} / {totalCount}</span>
                    </div>
                    <div className="h-4 bg-duo-gray-200 rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full bg-gradient-to-r from-duo-green to-duo-blue"
                            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-around">
                        <div className="text-center">
                            <span className={`text-lg font-bold ${RARITY_COLORS.common.text}`}>{stats.common}</span>
                            <p className="text-xs text-duo-gray-500">Common</p>
                        </div>
                        <div className="text-center">
                            <span className={`text-lg font-bold ${RARITY_COLORS.rare.text}`}>{stats.rare}</span>
                            <p className="text-xs text-duo-gray-500">Rare</p>
                        </div>
                        <div className="text-center">
                            <span className={`text-lg font-bold ${RARITY_COLORS.epic.text}`}>{stats.epic}</span>
                            <p className="text-xs text-duo-gray-500">Epic</p>
                        </div>
                        <div className="text-center">
                            <span className={`text-lg font-bold ${RARITY_COLORS.legendary.text}`}>{stats.legendary}</span>
                            <p className="text-xs text-duo-gray-500">Legendary</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedCategory === cat.id
                                    ? 'bg-duo-blue text-white'
                                    : 'bg-white text-duo-gray-600 hover:bg-duo-gray-100'
                                }`}
                        >
                            {cat.icon} {language === 'id' ? cat.name.id : cat.name.en}
                        </button>
                    ))}
                </div>

                {/* Sort */}
                <div className="flex justify-end mb-4">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 border-2 border-duo-gray-200 rounded-lg text-sm"
                    >
                        <option value="date">{language === 'id' ? 'Urut: Terbaru' : 'Sort: Newest'}</option>
                        <option value="rarity">{language === 'id' ? 'Urut: Kelangkaan' : 'Sort: Rarity'}</option>
                    </select>
                </div>

                {/* Achievements Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sortedAchievements.map(achievement => {
                        const colors = RARITY_COLORS[achievement.rarity];
                        return (
                            <button
                                key={achievement.id}
                                onClick={() => setSelectedAchievement(achievement)}
                                className={`p-4 rounded-2xl text-center transition-all border-2 ${achievement.unlocked
                                        ? `${colors.bg} ${colors.border} hover:scale-105`
                                        : 'bg-duo-gray-100 border-duo-gray-200 opacity-50'
                                    }`}
                            >
                                <span className={`text-4xl block mb-2 ${!achievement.unlocked ? 'grayscale' : ''}`}>
                                    {achievement.unlocked ? achievement.icon : '🔒'}
                                </span>
                                <p className={`font-bold text-sm ${achievement.unlocked ? colors.text : 'text-duo-gray-500'}`}>
                                    {language === 'id' ? achievement.name.id : achievement.name.en}
                                </p>
                                {!achievement.unlocked && (
                                    <div className="h-1 bg-duo-gray-200 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-duo-blue"
                                            style={{ width: `${(achievement.progress / achievement.requirement.value) * 100}%` }}
                                        />
                                    </div>
                                )}
                                {achievement.unlocked && (
                                    <span className={`text-xs ${colors.text} capitalize`}>
                                        {achievement.rarity}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Achievement Detail Modal */}
            {selectedAchievement && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAchievement(null)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className={`text-center p-4 rounded-xl mb-4 ${RARITY_COLORS[selectedAchievement.rarity].bg}`}>
                            <span className="text-6xl block mb-2">{selectedAchievement.icon}</span>
                            <h2 className={`text-xl font-bold ${RARITY_COLORS[selectedAchievement.rarity].text}`}>
                                {language === 'id' ? selectedAchievement.name.id : selectedAchievement.name.en}
                            </h2>
                            <span className={`text-xs uppercase font-bold ${RARITY_COLORS[selectedAchievement.rarity].text}`}>
                                {selectedAchievement.rarity}
                            </span>
                        </div>

                        <p className="text-duo-gray-600 text-center mb-4">
                            {language === 'id' ? selectedAchievement.description.id : selectedAchievement.description.en}
                        </p>

                        {selectedAchievement.unlocked ? (
                            <div className="bg-duo-green/20 text-duo-green text-center py-3 rounded-xl font-bold">
                                ✅ {language === 'id' ? 'Didapatkan' : 'Unlocked'} {selectedAchievement.unlockedAt && `- ${new Date(selectedAchievement.unlockedAt).toLocaleDateString()}`}
                            </div>
                        ) : (
                            <div className="bg-duo-gray-100 rounded-xl p-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span>{language === 'id' ? 'Progress' : 'Progress'}</span>
                                    <span className="font-bold">{selectedAchievement.progress} / {selectedAchievement.requirement.value}</span>
                                </div>
                                <div className="h-3 bg-duo-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-duo-blue"
                                        style={{ width: `${(selectedAchievement.progress / selectedAchievement.requirement.value) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setSelectedAchievement(null)}
                            className="w-full mt-4 py-3 bg-duo-gray-200 rounded-xl font-bold"
                        >
                            {language === 'id' ? 'Tutup' : 'Close'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
