'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

// Drag-drop challenge types
interface DragItem {
    id: string;
    content: string;
    category: string;
}

interface DropZone {
    id: string;
    label: string;
    acceptCategory: string;
    items: DragItem[];
}

interface Challenge {
    id: string;
    title: { id: string; en: string };
    instruction: { id: string; en: string };
    items: DragItem[];
    zones: DropZone[];
    xpReward: number;
}

const CHALLENGES: Challenge[] = [
    {
        id: 'number-types',
        title: { id: 'Jenis Bilangan', en: 'Number Types' },
        instruction: { id: 'Kelompokkan bilangan ke kategori yang benar!', en: 'Group numbers into correct categories!' },
        items: [
            { id: 'n1', content: '7', category: 'prima' },
            { id: 'n2', content: '12', category: 'genap' },
            { id: 'n3', content: '15', category: 'ganjil' },
            { id: 'n4', content: '11', category: 'prima' },
            { id: 'n5', content: '24', category: 'genap' },
            { id: 'n6', content: '9', category: 'ganjil' },
        ],
        zones: [
            { id: 'z1', label: 'Bilangan Prima', acceptCategory: 'prima', items: [] },
            { id: 'z2', label: 'Bilangan Genap', acceptCategory: 'genap', items: [] },
            { id: 'z3', label: 'Bilangan Ganjil', acceptCategory: 'ganjil', items: [] },
        ],
        xpReward: 50,
    },
    {
        id: 'equation-parts',
        title: { id: 'Bagian Persamaan', en: 'Equation Parts' },
        instruction: { id: 'Pasangkan istilah dengan contohnya!', en: 'Match terms with examples!' },
        items: [
            { id: 'e1', content: 'x', category: 'variabel' },
            { id: 'e2', content: '5', category: 'konstanta' },
            { id: 'e3', content: '3x', category: 'suku' },
            { id: 'e4', content: 'y', category: 'variabel' },
            { id: 'e5', content: '-7', category: 'konstanta' },
            { id: 'e6', content: '2xy', category: 'suku' },
        ],
        zones: [
            { id: 'z1', label: 'Variabel', acceptCategory: 'variabel', items: [] },
            { id: 'z2', label: 'Konstanta', acceptCategory: 'konstanta', items: [] },
            { id: 'z3', label: 'Suku', acceptCategory: 'suku', items: [] },
        ],
        xpReward: 60,
    },
    {
        id: 'shape-properties',
        title: { id: 'Sifat Bangun Datar', en: 'Shape Properties' },
        instruction: { id: 'Kelompokkan sifat ke bangun yang tepat!', en: 'Group properties to correct shapes!' },
        items: [
            { id: 's1', content: '4 sisi sama', category: 'persegi' },
            { id: 's2', content: '3 sudut', category: 'segitiga' },
            { id: 's3', content: 'Tanpa sudut', category: 'lingkaran' },
            { id: 's4', content: '4 sudut 90°', category: 'persegi' },
            { id: 's5', content: '3 sisi', category: 'segitiga' },
            { id: 's6', content: 'π × r²', category: 'lingkaran' },
        ],
        zones: [
            { id: 'z1', label: '⬜ Persegi', acceptCategory: 'persegi', items: [] },
            { id: 'z2', label: '🔺 Segitiga', acceptCategory: 'segitiga', items: [] },
            { id: 'z3', label: '⭕ Lingkaran', acceptCategory: 'lingkaran', items: [] },
        ],
        xpReward: 70,
    },
];

type Phase = 'select' | 'playing' | 'complete';

export default function DragDropPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();
    const { addXp } = useGame();

    const [phase, setPhase] = useState<Phase>('select');
    const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
    const [availableItems, setAvailableItems] = useState<DragItem[]>([]);
    const [zones, setZones] = useState<DropZone[]>([]);
    const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
    const [score, setScore] = useState(0);
    const [errors, setErrors] = useState(0);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const startChallenge = (challenge: Challenge) => {
        setCurrentChallenge(challenge);
        setAvailableItems([...challenge.items].sort(() => Math.random() - 0.5));
        setZones(challenge.zones.map(z => ({ ...z, items: [] })));
        setScore(0);
        setErrors(0);
        setPhase('playing');
    };

    const handleDragStart = (item: DragItem) => {
        setDraggedItem(item);
    };

    const handleDrop = (zone: DropZone) => {
        if (!draggedItem) return;

        const isCorrect = draggedItem.category === zone.acceptCategory;

        if (isCorrect) {
            // Add to zone
            setZones(prev => prev.map(z =>
                z.id === zone.id
                    ? { ...z, items: [...z.items, draggedItem] }
                    : z
            ));
            // Remove from available
            setAvailableItems(prev => prev.filter(i => i.id !== draggedItem.id));
            setScore(prev => prev + 10);
        } else {
            setErrors(prev => prev + 1);
        }

        setDraggedItem(null);

        // Check completion
        if (availableItems.length === 1 && isCorrect) {
            setTimeout(() => {
                setPhase('complete');
                addXp(currentChallenge!.xpReward);
            }, 500);
        }
    };

    // Selection Phase
    if (phase === 'select') {
        return (
            <div className="min-h-screen bg-duo-gray-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => router.back()} className="text-duo-gray-500 hover:text-duo-gray-700 mb-4">
                        ← {language === 'id' ? 'Kembali' : 'Back'}
                    </button>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-duo-gray-900 mb-2">
                            🎯 {language === 'id' ? 'Drag & Drop' : 'Drag & Drop'}
                        </h1>
                        <p className="text-duo-gray-500">
                            {language === 'id' ? 'Kelompokkan item ke kategori yang benar!' : 'Group items into correct categories!'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {CHALLENGES.map(challenge => (
                            <button
                                key={challenge.id}
                                onClick={() => startChallenge(challenge)}
                                className="card card-interactive text-left hover:scale-105 transition-transform"
                            >
                                <div className="text-4xl mb-3">🎯</div>
                                <h3 className="font-bold text-lg text-duo-gray-900 mb-1">
                                    {language === 'id' ? challenge.title.id : challenge.title.en}
                                </h3>
                                <p className="text-sm text-duo-gray-500 mb-2">
                                    {challenge.items.length} items → {challenge.zones.length} zones
                                </p>
                                <span className="text-duo-yellow font-bold text-sm">
                                    🎁 +{challenge.xpReward} XP
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Playing Phase
    if (phase === 'playing' && currentChallenge) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-duo-blue to-duo-purple p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 text-white">
                        <button onClick={() => setPhase('select')} className="text-white/70 hover:text-white">
                            ← {language === 'id' ? 'Batal' : 'Cancel'}
                        </button>
                        <div className="flex items-center gap-4">
                            <span className="px-3 py-1 bg-duo-green/30 rounded-full">✅ {score}</span>
                            <span className="px-3 py-1 bg-duo-red/30 rounded-full">❌ {errors}</span>
                        </div>
                    </div>

                    {/* Title & Instruction */}
                    <div className="text-center mb-6 text-white">
                        <h2 className="text-2xl font-bold mb-1">
                            {language === 'id' ? currentChallenge.title.id : currentChallenge.title.en}
                        </h2>
                        <p className="text-white/70">
                            {language === 'id' ? currentChallenge.instruction.id : currentChallenge.instruction.en}
                        </p>
                    </div>

                    {/* Draggable Items */}
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-6">
                        <p className="text-white/70 text-sm mb-3">{language === 'id' ? 'Seret item:' : 'Drag items:'}</p>
                        <div className="flex flex-wrap gap-3 justify-center min-h-[60px]">
                            {availableItems.map(item => (
                                <div
                                    key={item.id}
                                    draggable
                                    onDragStart={() => handleDragStart(item)}
                                    className={`px-4 py-2 bg-white rounded-xl font-bold text-duo-gray-900 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform shadow-lg ${draggedItem?.id === item.id ? 'opacity-50' : ''
                                        }`}
                                >
                                    {item.content}
                                </div>
                            ))}
                            {availableItems.length === 0 && (
                                <p className="text-white/50">{language === 'id' ? 'Semua item sudah dikelompokkan!' : 'All items grouped!'}</p>
                            )}
                        </div>
                    </div>

                    {/* Drop Zones */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {zones.map(zone => (
                            <div
                                key={zone.id}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(zone)}
                                className="bg-white/20 backdrop-blur rounded-2xl p-4 min-h-[150px] border-2 border-dashed border-white/30 hover:border-white/60 transition-colors"
                            >
                                <h3 className="text-white font-bold mb-3 text-center">{zone.label}</h3>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {zone.items.map(item => (
                                        <span key={item.id} className="px-3 py-1 bg-duo-green text-white rounded-lg text-sm font-semibold">
                                            {item.content}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Complete Phase
    if (phase === 'complete' && currentChallenge) {
        const accuracy = Math.round((score / (score + errors * 10)) * 100) || 0;

        return (
            <div className="min-h-screen bg-gradient-to-br from-duo-green to-emerald-500 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h1 className="text-2xl font-extrabold text-duo-gray-900 mb-2">
                        {language === 'id' ? 'Selesai!' : 'Complete!'}
                    </h1>
                    <p className="text-duo-gray-500 mb-6">
                        {language === 'id' ? currentChallenge.title.id : currentChallenge.title.en}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-duo-green/10 rounded-xl p-4">
                            <div className="text-2xl font-bold text-duo-green">{accuracy}%</div>
                            <div className="text-sm text-duo-gray-500">{language === 'id' ? 'Akurasi' : 'Accuracy'}</div>
                        </div>
                        <div className="bg-duo-yellow/10 rounded-xl p-4">
                            <div className="text-2xl font-bold text-duo-yellow">+{currentChallenge.xpReward}</div>
                            <div className="text-sm text-duo-gray-500">XP</div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => startChallenge(currentChallenge)}
                            className="flex-1 py-3 bg-duo-blue text-white rounded-xl font-bold"
                        >
                            🔄 {language === 'id' ? 'Ulangi' : 'Retry'}
                        </button>
                        <button
                            onClick={() => setPhase('select')}
                            className="flex-1 py-3 bg-duo-gray-200 rounded-xl font-bold"
                        >
                            📚 {language === 'id' ? 'Lainnya' : 'Other'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
