'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

// Simulation types
interface Simulation {
    id: string;
    title: { id: string; en: string };
    description: { id: string; en: string };
    type: 'geometry' | 'algebra' | 'physics' | 'statistics';
    icon: string;
}

const SIMULATIONS: Simulation[] = [
    {
        id: 'triangle-area',
        title: { id: 'Luas Segitiga', en: 'Triangle Area' },
        description: { id: 'Ubah alas dan tinggi untuk melihat perubahan luas', en: 'Change base and height to see area change' },
        type: 'geometry',
        icon: '📐',
    },
    {
        id: 'linear-graph',
        title: { id: 'Grafik Linear', en: 'Linear Graph' },
        description: { id: 'Eksplor persamaan y = mx + c', en: 'Explore equation y = mx + c' },
        type: 'algebra',
        icon: '📈',
    },
    {
        id: 'probability',
        title: { id: 'Simulasi Dadu', en: 'Dice Simulation' },
        description: { id: 'Roll dadu dan lihat distribusi probabilitas', en: 'Roll dice and see probability distribution' },
        type: 'statistics',
        icon: '🎲',
    },
];

type ActiveSim = 'none' | 'triangle-area' | 'linear-graph' | 'probability';

export default function SimulationLabPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();
    const { addXp } = useGame();

    const [activeSim, setActiveSim] = useState<ActiveSim>('none');

    // Triangle simulation state
    const [triBase, setTriBase] = useState(10);
    const [triHeight, setTriHeight] = useState(8);

    // Linear graph state
    const [slope, setSlope] = useState(2);
    const [intercept, setIntercept] = useState(1);

    // Dice simulation state
    const [diceResults, setDiceResults] = useState<number[]>([]);
    const [isRolling, setIsRolling] = useState(false);

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const rollDice = () => {
        setIsRolling(true);
        const result = Math.floor(Math.random() * 6) + 1;
        setTimeout(() => {
            setDiceResults(prev => [...prev, result]);
            setIsRolling(false);
        }, 500);
    };

    const rollMultiple = (count: number) => {
        const results: number[] = [];
        for (let i = 0; i < count; i++) {
            results.push(Math.floor(Math.random() * 6) + 1);
        }
        setDiceResults(prev => [...prev, ...results]);
    };

    const getDistribution = () => {
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        diceResults.forEach(r => dist[r]++);
        return dist;
    };

    // Simulation List View
    if (activeSim === 'none') {
        return (
            <div className="min-h-screen bg-duo-gray-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => router.back()} className="text-duo-gray-500 hover:text-duo-gray-700 mb-4">
                        ← {language === 'id' ? 'Kembali' : 'Back'}
                    </button>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-duo-gray-900 mb-2">
                            🧪 {language === 'id' ? 'Lab Simulasi' : 'Simulation Lab'}
                        </h1>
                        <p className="text-duo-gray-500">
                            {language === 'id' ? 'Eksplorasi konsep matematika secara interaktif!' : 'Explore math concepts interactively!'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {SIMULATIONS.map(sim => (
                            <button
                                key={sim.id}
                                onClick={() => setActiveSim(sim.id as ActiveSim)}
                                className="card card-interactive text-left hover:scale-105 transition-transform"
                            >
                                <div className="text-4xl mb-3">{sim.icon}</div>
                                <h3 className="font-bold text-lg text-duo-gray-900 mb-1">
                                    {language === 'id' ? sim.title.id : sim.title.en}
                                </h3>
                                <p className="text-sm text-duo-gray-500">
                                    {language === 'id' ? sim.description.id : sim.description.en}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Triangle Area Simulation
    if (activeSim === 'triangle-area') {
        const area = (triBase * triHeight) / 2;

        return (
            <div className="min-h-screen bg-gradient-to-br from-duo-blue to-duo-purple p-6">
                <div className="max-w-2xl mx-auto">
                    <button onClick={() => setActiveSim('none')} className="text-white/70 hover:text-white mb-4">
                        ← {language === 'id' ? 'Kembali ke Lab' : 'Back to Lab'}
                    </button>

                    <div className="bg-white rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-duo-gray-900 mb-6 text-center">
                            📐 {language === 'id' ? 'Luas Segitiga' : 'Triangle Area'}
                        </h2>

                        {/* Visual Triangle */}
                        <div className="relative h-64 mb-6 flex items-end justify-center">
                            <svg viewBox="0 0 200 160" className="w-full h-full">
                                <polygon
                                    points={`10,150 ${10 + triBase * 9},150 ${10 + triBase * 4.5},${150 - triHeight * 8}`}
                                    fill="#3B82F6"
                                    fillOpacity="0.3"
                                    stroke="#3B82F6"
                                    strokeWidth="2"
                                />
                                {/* Base label */}
                                <text x={10 + triBase * 4.5} y="165" textAnchor="middle" fontSize="12" fill="#374151">
                                    {language === 'id' ? 'alas' : 'base'} = {triBase}
                                </text>
                                {/* Height line */}
                                <line
                                    x1={10 + triBase * 4.5}
                                    y1="150"
                                    x2={10 + triBase * 4.5}
                                    y2={150 - triHeight * 8}
                                    stroke="#EF4444"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                />
                                <text x={20 + triBase * 4.5} y={150 - triHeight * 4} fontSize="12" fill="#EF4444">
                                    {language === 'id' ? 'tinggi' : 'height'} = {triHeight}
                                </text>
                            </svg>
                        </div>

                        {/* Controls */}
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                    {language === 'id' ? 'Alas' : 'Base'}: {triBase}
                                </label>
                                <input
                                    type="range"
                                    min="2"
                                    max="20"
                                    value={triBase}
                                    onChange={(e) => setTriBase(Number(e.target.value))}
                                    className="w-full h-3 bg-duo-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                    {language === 'id' ? 'Tinggi' : 'Height'}: {triHeight}
                                </label>
                                <input
                                    type="range"
                                    min="2"
                                    max="15"
                                    value={triHeight}
                                    onChange={(e) => setTriHeight(Number(e.target.value))}
                                    className="w-full h-3 bg-duo-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Formula & Result */}
                        <div className="bg-duo-blue/10 rounded-xl p-4 text-center">
                            <p className="text-sm text-duo-gray-500 mb-2">{language === 'id' ? 'Rumus' : 'Formula'}:</p>
                            <p className="text-lg font-mono font-bold text-duo-blue mb-2">
                                L = ½ × alas × tinggi
                            </p>
                            <p className="text-lg font-mono text-duo-gray-700">
                                L = ½ × {triBase} × {triHeight} = <span className="text-2xl font-bold text-duo-green">{area}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Linear Graph Simulation
    if (activeSim === 'linear-graph') {
        const points: { x: number; y: number }[] = [];
        for (let x = -5; x <= 5; x++) {
            points.push({ x, y: slope * x + intercept });
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-duo-green to-emerald-600 p-6">
                <div className="max-w-2xl mx-auto">
                    <button onClick={() => setActiveSim('none')} className="text-white/70 hover:text-white mb-4">
                        ← {language === 'id' ? 'Kembali ke Lab' : 'Back to Lab'}
                    </button>

                    <div className="bg-white rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-duo-gray-900 mb-6 text-center">
                            📈 {language === 'id' ? 'Grafik Linear' : 'Linear Graph'}
                        </h2>

                        {/* Graph */}
                        <div className="relative h-64 mb-6 bg-duo-gray-50 rounded-xl p-4">
                            <svg viewBox="-60 -60 120 120" className="w-full h-full">
                                {/* Grid */}
                                <line x1="-50" y1="0" x2="50" y2="0" stroke="#ccc" strokeWidth="0.5" />
                                <line x1="0" y1="-50" x2="0" y2="50" stroke="#ccc" strokeWidth="0.5" />

                                {/* Axis labels */}
                                <text x="48" y="10" fontSize="8" fill="#666">x</text>
                                <text x="5" y="-45" fontSize="8" fill="#666">y</text>

                                {/* Line */}
                                <line
                                    x1={-50}
                                    y1={-(slope * -5 + intercept) * 8}
                                    x2={50}
                                    y2={-(slope * 5 + intercept) * 8}
                                    stroke="#10B981"
                                    strokeWidth="2"
                                />

                                {/* Points */}
                                {points.map((p, i) => (
                                    <circle
                                        key={i}
                                        cx={p.x * 10}
                                        cy={-p.y * 8}
                                        r="3"
                                        fill="#10B981"
                                    />
                                ))}
                            </svg>
                        </div>

                        {/* Controls */}
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                    m (slope): {slope}
                                </label>
                                <input
                                    type="range"
                                    min="-5"
                                    max="5"
                                    step="0.5"
                                    value={slope}
                                    onChange={(e) => setSlope(Number(e.target.value))}
                                    className="w-full h-3 bg-duo-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-duo-gray-700 mb-2">
                                    c (intercept): {intercept}
                                </label>
                                <input
                                    type="range"
                                    min="-5"
                                    max="5"
                                    value={intercept}
                                    onChange={(e) => setIntercept(Number(e.target.value))}
                                    className="w-full h-3 bg-duo-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Equation */}
                        <div className="bg-duo-green/10 rounded-xl p-4 text-center">
                            <p className="text-2xl font-mono font-bold text-duo-green">
                                y = {slope}x {intercept >= 0 ? '+' : ''} {intercept}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Dice Probability Simulation
    if (activeSim === 'probability') {
        const dist = getDistribution();
        const maxCount = Math.max(...Object.values(dist), 1);

        return (
            <div className="min-h-screen bg-gradient-to-br from-duo-orange to-red-500 p-6">
                <div className="max-w-2xl mx-auto">
                    <button onClick={() => setActiveSim('none')} className="text-white/70 hover:text-white mb-4">
                        ← {language === 'id' ? 'Kembali ke Lab' : 'Back to Lab'}
                    </button>

                    <div className="bg-white rounded-2xl p-6">
                        <h2 className="text-2xl font-bold text-duo-gray-900 mb-6 text-center">
                            🎲 {language === 'id' ? 'Simulasi Dadu' : 'Dice Simulation'}
                        </h2>

                        {/* Dice Display */}
                        <div className="flex justify-center mb-6">
                            <div className={`w-24 h-24 bg-white border-4 border-duo-gray-300 rounded-xl flex items-center justify-center text-5xl font-bold ${isRolling ? 'animate-spin' : ''}`}>
                                {diceResults.length > 0 ? ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][diceResults[diceResults.length - 1] - 1] : '🎲'}
                            </div>
                        </div>

                        {/* Roll Buttons */}
                        <div className="flex gap-3 justify-center mb-6">
                            <button
                                onClick={rollDice}
                                disabled={isRolling}
                                className="px-6 py-3 bg-duo-orange text-white font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
                            >
                                🎲 Roll 1x
                            </button>
                            <button
                                onClick={() => rollMultiple(10)}
                                className="px-6 py-3 bg-duo-blue text-white font-bold rounded-xl hover:scale-105 transition-transform"
                            >
                                🎲 Roll 10x
                            </button>
                            <button
                                onClick={() => rollMultiple(100)}
                                className="px-6 py-3 bg-duo-purple text-white font-bold rounded-xl hover:scale-105 transition-transform"
                            >
                                🎲 Roll 100x
                            </button>
                        </div>

                        {/* Distribution Chart */}
                        <div className="bg-duo-gray-100 rounded-xl p-4 mb-4">
                            <p className="text-sm text-duo-gray-500 mb-3 text-center">
                                {language === 'id' ? 'Distribusi' : 'Distribution'} ({diceResults.length} rolls)
                            </p>
                            <div className="flex items-end justify-around h-40">
                                {[1, 2, 3, 4, 5, 6].map(num => (
                                    <div key={num} className="flex flex-col items-center">
                                        <div
                                            className="w-8 bg-duo-blue rounded-t transition-all duration-300"
                                            style={{ height: `${(dist[num] / maxCount) * 100}%`, minHeight: dist[num] > 0 ? '8px' : '0' }}
                                        />
                                        <span className="text-xs mt-1 font-bold">{num}</span>
                                        <span className="text-xs text-duo-gray-400">{dist[num]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        {diceResults.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-duo-green/10 rounded-xl p-3">
                                    <p className="text-sm text-duo-gray-500">{language === 'id' ? 'Rata-rata' : 'Average'}</p>
                                    <p className="text-xl font-bold text-duo-green">
                                        {(diceResults.reduce((a, b) => a + b, 0) / diceResults.length).toFixed(2)}
                                    </p>
                                </div>
                                <div className="bg-duo-blue/10 rounded-xl p-3">
                                    <p className="text-sm text-duo-gray-500">{language === 'id' ? 'Teoritis' : 'Theoretical'}</p>
                                    <p className="text-xl font-bold text-duo-blue">3.50</p>
                                </div>
                            </div>
                        )}

                        {/* Reset */}
                        <button
                            onClick={() => setDiceResults([])}
                            className="w-full mt-4 py-2 text-duo-gray-500 hover:text-duo-gray-700"
                        >
                            🔄 {language === 'id' ? 'Reset' : 'Reset'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
