'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

// Power-up types
interface PowerUp {
    id: string;
    name: { id: string; en: string };
    description: { id: string; en: string };
    icon: string;
    type: 'instant' | 'passive' | 'team';
    effect: {
        type: 'xp_boost' | 'hint_bonus' | 'time_extend' | 'score_multiplier' | 'streak_shield';
        value: number;
        duration?: number; // in minutes
    };
    cost: number; // XP cost
    cooldown?: number; // in hours
}

interface ActivePowerUp extends PowerUp {
    activatedAt: string;
    expiresAt?: string;
}

const POWER_UPS: PowerUp[] = [
    {
        id: 'xp_boost',
        name: { id: 'Boost XP 2x', en: '2x XP Boost' },
        description: { id: 'Dapatkan XP 2x lipat selama 30 menit', en: 'Earn 2x XP for 30 minutes' },
        icon: '⚡',
        type: 'passive',
        effect: { type: 'xp_boost', value: 2, duration: 30 },
        cost: 500,
        cooldown: 24,
    },
    {
        id: 'hint_bonus',
        name: { id: 'Bonus Hint', en: 'Bonus Hints' },
        description: { id: '+5 AI Hint token hari ini', en: '+5 AI Hint tokens today' },
        icon: '💡',
        type: 'instant',
        effect: { type: 'hint_bonus', value: 5 },
        cost: 300,
        cooldown: 24,
    },
    {
        id: 'time_extend',
        name: { id: 'Waktu Tambahan', en: 'Time Extension' },
        description: { id: '+1 menit untuk kuis berikutnya', en: '+1 minute for next quiz' },
        icon: '⏰',
        type: 'instant',
        effect: { type: 'time_extend', value: 60 },
        cost: 200,
    },
    {
        id: 'score_boost',
        name: { id: 'Score Multiplier', en: 'Score Multiplier' },
        description: { id: 'Skor 1.5x untuk kuis berikutnya', en: '1.5x score for next quiz' },
        icon: '🎯',
        type: 'instant',
        effect: { type: 'score_multiplier', value: 1.5 },
        cost: 400,
        cooldown: 12,
    },
    {
        id: 'streak_shield',
        name: { id: 'Streak Shield', en: 'Streak Shield' },
        description: { id: 'Lindungi streak dari putus 1x', en: 'Protect streak from breaking once' },
        icon: '🛡️',
        type: 'passive',
        effect: { type: 'streak_shield', value: 1 },
        cost: 600,
        cooldown: 48,
    },
    {
        id: 'team_boost',
        name: { id: 'Class Power', en: 'Class Power' },
        description: { id: '+10% skor untuk seluruh kelas di battle berikutnya', en: '+10% score for entire class in next battle' },
        icon: '🏆',
        type: 'team',
        effect: { type: 'score_multiplier', value: 1.1 },
        cost: 1000,
        cooldown: 72,
    },
];

const STORAGE_KEY = 'lms_ypp_powerups';

export default function PowerUpsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();
    const { xp } = useGame();

    const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
    const [cooldowns, setCooldowns] = useState<Record<string, string>>({}); // powerupId -> expiresAt
    const [showConfirm, setShowConfirm] = useState<PowerUp | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    // Load saved power-ups
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setActivePowerUps(data.active || []);
                setCooldowns(data.cooldowns || {});
            } catch (e) {
                console.error('Failed to load power-ups:', e);
            }
        }
    }, []);

    // Save power-ups
    const savePowerUps = (active: ActivePowerUp[], cds: Record<string, string>) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ active, cooldowns: cds }));
        setActivePowerUps(active);
        setCooldowns(cds);
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
                <div className="spinner"></div>
            </div>
        );
    }

    const isOnCooldown = (powerUp: PowerUp) => {
        const cd = cooldowns[powerUp.id];
        if (!cd) return false;
        return new Date(cd) > new Date();
    };

    const getCooldownRemaining = (powerUp: PowerUp) => {
        const cd = cooldowns[powerUp.id];
        if (!cd) return null;
        const remaining = new Date(cd).getTime() - Date.now();
        if (remaining <= 0) return null;
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${mins}m`;
    };

    const canAfford = (powerUp: PowerUp) => xp >= powerUp.cost;

    const activatePowerUp = (powerUp: PowerUp) => {
        if (!canAfford(powerUp) || isOnCooldown(powerUp)) return;

        const now = new Date();
        const active: ActivePowerUp = {
            ...powerUp,
            activatedAt: now.toISOString(),
            expiresAt: powerUp.effect.duration
                ? new Date(now.getTime() + powerUp.effect.duration * 60 * 1000).toISOString()
                : undefined,
        };

        const newActive = [...activePowerUps, active];
        const newCooldowns = { ...cooldowns };

        if (powerUp.cooldown) {
            newCooldowns[powerUp.id] = new Date(now.getTime() + powerUp.cooldown * 60 * 60 * 1000).toISOString();
        }

        savePowerUps(newActive, newCooldowns);
        setShowConfirm(null);
        setNotification(language === 'id' ? `${powerUp.name.id} diaktifkan!` : `${powerUp.name.en} activated!`);

        setTimeout(() => setNotification(null), 3000);
    };

    const getActiveForPowerUp = (powerUpId: string) => {
        return activePowerUps.find(ap => ap.id === powerUpId && (!ap.expiresAt || new Date(ap.expiresAt) > new Date()));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white p-6">
            {/* Notification */}
            {notification && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-duo-green text-white px-6 py-3 rounded-full font-bold z-50 animate-bounce">
                    ✅ {notification}
                </div>
            )}

            {/* Header */}
            <div className="max-w-4xl mx-auto">
                <button onClick={() => router.back()} className="text-white/70 hover:text-white mb-4 flex items-center gap-2">
                    ← {language === 'id' ? 'Kembali' : 'Back'}
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold mb-2">⚡ Power-Ups</h1>
                    <p className="text-white/70">
                        {language === 'id' ? 'Tingkatkan kemampuanmu dengan power-up!' : 'Boost your abilities with power-ups!'}
                    </p>
                    <div className="inline-block mt-4 px-6 py-2 bg-duo-yellow text-black font-bold rounded-full">
                        💰 {xp.toLocaleString()} XP
                    </div>
                </div>

                {/* Active Power-ups */}
                {activePowerUps.filter(ap => !ap.expiresAt || new Date(ap.expiresAt) > new Date()).length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4">🔥 {language === 'id' ? 'Aktif Sekarang' : 'Currently Active'}</h2>
                        <div className="flex flex-wrap gap-3">
                            {activePowerUps
                                .filter(ap => !ap.expiresAt || new Date(ap.expiresAt) > new Date())
                                .map(ap => (
                                    <div key={ap.id + ap.activatedAt} className="flex items-center gap-2 px-4 py-2 bg-duo-green/30 rounded-full">
                                        <span className="text-xl">{ap.icon}</span>
                                        <span className="font-semibold">{language === 'id' ? ap.name.id : ap.name.en}</span>
                                        {ap.expiresAt && (
                                            <span className="text-xs opacity-70">
                                                ({Math.round((new Date(ap.expiresAt).getTime() - Date.now()) / 60000)}m)
                                            </span>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Power-up Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {POWER_UPS.map(powerUp => {
                        const onCooldown = isOnCooldown(powerUp);
                        const affordable = canAfford(powerUp);
                        const active = getActiveForPowerUp(powerUp.id);
                        const cooldownRemaining = getCooldownRemaining(powerUp);

                        return (
                            <div
                                key={powerUp.id}
                                className={`bg-white/10 backdrop-blur rounded-2xl p-6 ${active ? 'ring-2 ring-duo-green' : ''
                                    } ${!affordable || onCooldown ? 'opacity-60' : ''}`}
                            >
                                {/* Icon & Badge */}
                                <div className="flex items-start justify-between mb-4">
                                    <span className="text-5xl">{powerUp.icon}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${powerUp.type === 'instant' ? 'bg-duo-blue/30 text-duo-blue' :
                                            powerUp.type === 'passive' ? 'bg-duo-green/30 text-duo-green' :
                                                'bg-duo-purple/30 text-duo-purple'
                                        }`}>
                                        {powerUp.type}
                                    </span>
                                </div>

                                {/* Name & Description */}
                                <h3 className="font-bold text-lg mb-1">
                                    {language === 'id' ? powerUp.name.id : powerUp.name.en}
                                </h3>
                                <p className="text-sm text-white/70 mb-4">
                                    {language === 'id' ? powerUp.description.id : powerUp.description.en}
                                </p>

                                {/* Cost & Button */}
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-duo-yellow">
                                        💰 {powerUp.cost} XP
                                    </span>
                                    {active ? (
                                        <span className="px-4 py-2 bg-duo-green/30 text-duo-green font-bold rounded-lg">
                                            ✅ {language === 'id' ? 'Aktif' : 'Active'}
                                        </span>
                                    ) : onCooldown ? (
                                        <span className="px-4 py-2 bg-white/20 font-bold rounded-lg text-sm">
                                            ⏳ {cooldownRemaining}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => setShowConfirm(powerUp)}
                                            disabled={!affordable}
                                            className={`px-4 py-2 font-bold rounded-lg transition-transform hover:scale-105 ${affordable
                                                    ? 'bg-duo-green text-white'
                                                    : 'bg-white/20 cursor-not-allowed'
                                                }`}
                                        >
                                            {language === 'id' ? 'Aktifkan' : 'Activate'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Confirm Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center text-duo-gray-900">
                        <span className="text-6xl block mb-4">{showConfirm.icon}</span>
                        <h2 className="text-xl font-bold mb-2">
                            {language === 'id' ? showConfirm.name.id : showConfirm.name.en}
                        </h2>
                        <p className="text-duo-gray-500 mb-4">
                            {language === 'id' ? showConfirm.description.id : showConfirm.description.en}
                        </p>
                        <p className="text-lg font-bold text-duo-yellow mb-6">
                            {language === 'id' ? 'Biaya' : 'Cost'}: {showConfirm.cost} XP
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(null)}
                                className="flex-1 py-3 bg-duo-gray-200 rounded-xl font-bold"
                            >
                                {language === 'id' ? 'Batal' : 'Cancel'}
                            </button>
                            <button
                                onClick={() => activatePowerUp(showConfirm)}
                                className="flex-1 py-3 bg-duo-green text-white rounded-xl font-bold"
                            >
                                ✅ {language === 'id' ? 'Konfirmasi' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
