'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';

// Skill tree types
interface Skill {
    id: string;
    name: { id: string; en: string };
    description: { id: string; en: string };
    icon: string;
    subject: string;
    tier: number; // 1 = basic, 2 = intermediate, 3 = advanced
    xpRequired: number;
    prerequisites: string[]; // skill IDs that must be unlocked first
    isUnlocked: boolean;
    progress: number; // 0-100
    rewards: {
        xpBonus?: number;
        badge?: string;
        title?: string;
    };
}

interface Subject {
    id: string;
    name: { id: string; en: string };
    icon: string;
    color: string;
}

const SUBJECTS: Subject[] = [
    { id: 'matematika', name: { id: 'Matematika', en: 'Mathematics' }, icon: '🔢', color: 'blue' },
    { id: 'ipa', name: { id: 'IPA', en: 'Science' }, icon: '🔬', color: 'green' },
    { id: 'bahasa', name: { id: 'Bahasa', en: 'Language' }, icon: '📚', color: 'purple' },
];

const SKILLS: Skill[] = [
    // Mathematics - Tier 1
    { id: 'math-basic', name: { id: 'Aritmatika Dasar', en: 'Basic Arithmetic' }, description: { id: 'Penjumlahan, pengurangan, perkalian, pembagian', en: 'Addition, subtraction, multiplication, division' }, icon: '➕', subject: 'matematika', tier: 1, xpRequired: 100, prerequisites: [], isUnlocked: true, progress: 100, rewards: { xpBonus: 50, badge: '🧮 Calculator' } },
    { id: 'math-fractions', name: { id: 'Pecahan', en: 'Fractions' }, description: { id: 'Operasi pecahan dan desimal', en: 'Fraction and decimal operations' }, icon: '½', subject: 'matematika', tier: 1, xpRequired: 150, prerequisites: [], isUnlocked: true, progress: 75, rewards: { xpBonus: 75 } },

    // Mathematics - Tier 2
    { id: 'math-algebra', name: { id: 'Aljabar', en: 'Algebra' }, description: { id: 'Variabel, persamaan, ketidaksamaan', en: 'Variables, equations, inequalities' }, icon: '𝑥', subject: 'matematika', tier: 2, xpRequired: 300, prerequisites: ['math-basic', 'math-fractions'], isUnlocked: false, progress: 40, rewards: { xpBonus: 100, badge: '🎓 Algebraist' } },
    { id: 'math-geometry', name: { id: 'Geometri', en: 'Geometry' }, description: { id: 'Bangun datar dan ruang', en: 'Shapes and solids' }, icon: '📐', subject: 'matematika', tier: 2, xpRequired: 300, prerequisites: ['math-basic'], isUnlocked: false, progress: 20, rewards: { xpBonus: 100 } },

    // Mathematics - Tier 3
    { id: 'math-calculus', name: { id: 'Kalkulus', en: 'Calculus' }, description: { id: 'Limit, turunan, integral', en: 'Limits, derivatives, integrals' }, icon: '∫', subject: 'matematika', tier: 3, xpRequired: 500, prerequisites: ['math-algebra'], isUnlocked: false, progress: 0, rewards: { xpBonus: 200, badge: '🏆 Math Master', title: 'Calculus Champion' } },
    { id: 'math-stats', name: { id: 'Statistika', en: 'Statistics' }, description: { id: 'Probabilitas dan analisis data', en: 'Probability and data analysis' }, icon: '📊', subject: 'matematika', tier: 3, xpRequired: 400, prerequisites: ['math-algebra'], isUnlocked: false, progress: 0, rewards: { xpBonus: 150, badge: '📈 Data Wizard' } },

    // Science - Tier 1
    { id: 'sci-basic', name: { id: 'Metode Ilmiah', en: 'Scientific Method' }, description: { id: 'Observasi, hipotesis, eksperimen', en: 'Observation, hypothesis, experiment' }, icon: '🔍', subject: 'ipa', tier: 1, xpRequired: 100, prerequisites: [], isUnlocked: true, progress: 100, rewards: { xpBonus: 50 } },

    // Science - Tier 2
    { id: 'sci-physics', name: { id: 'Fisika Dasar', en: 'Basic Physics' }, description: { id: 'Gerak, gaya, energi', en: 'Motion, force, energy' }, icon: '⚡', subject: 'ipa', tier: 2, xpRequired: 300, prerequisites: ['sci-basic', 'math-basic'], isUnlocked: false, progress: 60, rewards: { xpBonus: 100, badge: '⚛️ Physicist' } },
    { id: 'sci-biology', name: { id: 'Biologi', en: 'Biology' }, description: { id: 'Sel, organisme, ekosistem', en: 'Cells, organisms, ecosystems' }, icon: '🧬', subject: 'ipa', tier: 2, xpRequired: 300, prerequisites: ['sci-basic'], isUnlocked: false, progress: 30, rewards: { xpBonus: 100 } },

    // Language - Tier 1
    { id: 'lang-grammar', name: { id: 'Tata Bahasa', en: 'Grammar' }, description: { id: 'Struktur kalimat dan kata', en: 'Sentence and word structure' }, icon: '✏️', subject: 'bahasa', tier: 1, xpRequired: 100, prerequisites: [], isUnlocked: true, progress: 85, rewards: { xpBonus: 50 } },

    // Language - Tier 2
    { id: 'lang-writing', name: { id: 'Menulis', en: 'Writing' }, description: { id: 'Essay, cerita, argumentasi', en: 'Essays, stories, argumentation' }, icon: '📝', subject: 'bahasa', tier: 2, xpRequired: 300, prerequisites: ['lang-grammar'], isUnlocked: false, progress: 50, rewards: { xpBonus: 100, badge: '✍️ Wordsmith' } },
];

const STORAGE_KEY = 'lms_ypp_skill_tree';

export default function SkillTreePage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { language } = useLanguage();
    const { xp, addXp } = useGame();

    const [selectedSubject, setSelectedSubject] = useState('matematika');
    const [skills, setSkills] = useState<Skill[]>(SKILLS);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [showUnlockModal, setShowUnlockModal] = useState(false);

    // Load saved progress
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setSkills(prev => prev.map(s => ({
                    ...s,
                    isUnlocked: data.unlocked?.includes(s.id) || s.tier === 1,
                    progress: data.progress?.[s.id] ?? s.progress,
                })));
            } catch (e) {
                console.error('Failed to load skill tree:', e);
            }
        }
    }, []);

    // Save progress
    const saveProgress = (newSkills: Skill[]) => {
        const data = {
            unlocked: newSkills.filter(s => s.isUnlocked).map(s => s.id),
            progress: Object.fromEntries(newSkills.map(s => [s.id, s.progress])),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSkills(newSkills);
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-duo-gray-100">
                <div className="spinner"></div>
            </div>
        );
    }

    const subjectSkills = skills.filter(s => s.subject === selectedSubject);
    const tierGroups = [1, 2, 3].map(tier => subjectSkills.filter(s => s.tier === tier));

    const canUnlock = (skill: Skill) => {
        if (skill.isUnlocked) return false;
        const prereqsMet = skill.prerequisites.every(prereqId => {
            const prereq = skills.find(s => s.id === prereqId);
            return prereq?.isUnlocked && prereq?.progress >= 100;
        });
        return prereqsMet && xp >= skill.xpRequired;
    };

    const handleUnlockSkill = (skill: Skill) => {
        if (!canUnlock(skill)) return;

        // Deduct XP and unlock
        const newSkills = skills.map(s =>
            s.id === skill.id ? { ...s, isUnlocked: true } : s
        );
        saveProgress(newSkills);

        // Award bonus XP for unlocking
        if (skill.rewards.xpBonus) {
            addXp(skill.rewards.xpBonus);
        }

        setSelectedSkill(null);
        setShowUnlockModal(false);
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 100) return 'bg-duo-green';
        if (progress >= 50) return 'bg-duo-yellow';
        if (progress > 0) return 'bg-duo-orange';
        return 'bg-duo-gray-300';
    };

    const subject = SUBJECTS.find(s => s.id === selectedSubject)!;

    return (
        <div className="min-h-screen bg-duo-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                <button onClick={() => router.back()} className="text-duo-gray-500 hover:text-duo-gray-700 mb-4">
                    ← {language === 'id' ? 'Kembali' : 'Back'}
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-extrabold text-duo-gray-900 mb-2">
                        🌳 {language === 'id' ? 'Pohon Keahlian' : 'Skill Tree'}
                    </h1>
                    <p className="text-duo-gray-500">
                        {language === 'id' ? 'Kuasai materi dan unlock skill baru!' : 'Master topics and unlock new skills!'}
                    </p>
                    <div className="inline-block mt-3 px-4 py-2 bg-duo-yellow text-black font-bold rounded-full">
                        💰 {xp.toLocaleString()} XP
                    </div>
                </div>

                {/* Subject Tabs */}
                <div className="flex justify-center gap-3 mb-8">
                    {SUBJECTS.map(sub => (
                        <button
                            key={sub.id}
                            onClick={() => setSelectedSubject(sub.id)}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${selectedSubject === sub.id
                                    ? `bg-duo-${sub.color} text-white shadow-lg scale-105`
                                    : 'bg-white text-duo-gray-600 hover:bg-duo-gray-100'
                                }`}
                        >
                            {sub.icon} {language === 'id' ? sub.name.id : sub.name.en}
                        </button>
                    ))}
                </div>

                {/* Skill Tree */}
                <div className="space-y-8">
                    {tierGroups.map((tierSkills, tierIndex) => (
                        <div key={tierIndex}>
                            <h3 className="text-center font-bold text-duo-gray-500 mb-4">
                                {tierIndex === 0 ? '🌱 Basic' : tierIndex === 1 ? '🌿 Intermediate' : '🌲 Advanced'}
                            </h3>
                            <div className="flex justify-center gap-6 flex-wrap">
                                {tierSkills.map(skill => {
                                    const locked = !skill.isUnlocked;
                                    const canUnlockThis = canUnlock(skill);
                                    const completed = skill.progress >= 100;

                                    return (
                                        <button
                                            key={skill.id}
                                            onClick={() => { setSelectedSkill(skill); setShowUnlockModal(true); }}
                                            className={`w-40 p-4 rounded-2xl text-center transition-all ${locked
                                                    ? canUnlockThis
                                                        ? 'bg-duo-yellow/20 border-2 border-dashed border-duo-yellow hover:scale-105'
                                                        : 'bg-duo-gray-200 opacity-50'
                                                    : completed
                                                        ? 'bg-white border-2 border-duo-green shadow-lg'
                                                        : 'bg-white border-2 border-duo-gray-200 hover:border-duo-blue hover:scale-105'
                                                }`}
                                        >
                                            <div className={`text-4xl mb-2 ${locked && !canUnlockThis ? 'grayscale' : ''}`}>
                                                {locked ? '🔒' : skill.icon}
                                            </div>
                                            <p className={`font-bold text-sm ${locked ? 'text-duo-gray-500' : 'text-duo-gray-900'}`}>
                                                {language === 'id' ? skill.name.id : skill.name.en}
                                            </p>

                                            {/* Progress bar */}
                                            <div className="h-2 bg-duo-gray-200 rounded-full mt-3 overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${getProgressColor(skill.progress)}`}
                                                    style={{ width: `${skill.progress}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-duo-gray-500 mt-1">
                                                {skill.progress}%
                                            </p>

                                            {/* Status badges */}
                                            {completed && (
                                                <span className="text-xs px-2 py-1 bg-duo-green/20 text-duo-green rounded-full mt-2 inline-block">
                                                    ✅ Mastered
                                                </span>
                                            )}
                                            {canUnlockThis && (
                                                <span className="text-xs px-2 py-1 bg-duo-yellow/20 text-duo-yellow rounded-full mt-2 inline-block animate-pulse">
                                                    🔓 Ready!
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-8 flex justify-center gap-6 text-sm text-duo-gray-500">
                    <span>🔒 Locked</span>
                    <span>🔓 Ready to Unlock</span>
                    <span>📚 In Progress</span>
                    <span>✅ Mastered</span>
                </div>
            </div>

            {/* Skill Detail Modal */}
            {showUnlockModal && selectedSkill && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <div className="text-center mb-4">
                            <span className="text-5xl block mb-2">{selectedSkill.icon}</span>
                            <h2 className="text-xl font-bold text-duo-gray-900">
                                {language === 'id' ? selectedSkill.name.id : selectedSkill.name.en}
                            </h2>
                            <p className="text-duo-gray-500 text-sm">
                                {language === 'id' ? selectedSkill.description.id : selectedSkill.description.en}
                            </p>
                        </div>

                        {/* Progress */}
                        <div className="bg-duo-gray-100 rounded-xl p-4 mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span>{language === 'id' ? 'Progress' : 'Progress'}</span>
                                <span className="font-bold">{selectedSkill.progress}%</span>
                            </div>
                            <div className="h-3 bg-duo-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${getProgressColor(selectedSkill.progress)}`}
                                    style={{ width: `${selectedSkill.progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Prerequisites */}
                        {selectedSkill.prerequisites.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-semibold text-duo-gray-700 mb-2">
                                    {language === 'id' ? 'Persyaratan:' : 'Prerequisites:'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedSkill.prerequisites.map(prereqId => {
                                        const prereq = skills.find(s => s.id === prereqId);
                                        const met = prereq?.isUnlocked && prereq?.progress >= 100;
                                        return (
                                            <span key={prereqId} className={`text-xs px-2 py-1 rounded-full ${met ? 'bg-duo-green/20 text-duo-green' : 'bg-duo-red/20 text-duo-red'
                                                }`}>
                                                {met ? '✅' : '❌'} {prereq ? (language === 'id' ? prereq.name.id : prereq.name.en) : prereqId}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Rewards */}
                        <div className="mb-4">
                            <p className="text-sm font-semibold text-duo-gray-700 mb-2">
                                {language === 'id' ? 'Hadiah:' : 'Rewards:'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {selectedSkill.rewards.xpBonus && (
                                    <span className="text-xs px-2 py-1 bg-duo-yellow/20 text-duo-yellow rounded-full">
                                        +{selectedSkill.rewards.xpBonus} XP
                                    </span>
                                )}
                                {selectedSkill.rewards.badge && (
                                    <span className="text-xs px-2 py-1 bg-duo-purple/20 text-duo-purple rounded-full">
                                        {selectedSkill.rewards.badge}
                                    </span>
                                )}
                                {selectedSkill.rewards.title && (
                                    <span className="text-xs px-2 py-1 bg-duo-blue/20 text-duo-blue rounded-full">
                                        🏷️ {selectedSkill.rewards.title}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUnlockModal(false)}
                                className="flex-1 py-3 bg-duo-gray-200 rounded-xl font-bold"
                            >
                                {language === 'id' ? 'Tutup' : 'Close'}
                            </button>
                            {!selectedSkill.isUnlocked && canUnlock(selectedSkill) && (
                                <button
                                    onClick={() => handleUnlockSkill(selectedSkill)}
                                    className="flex-1 py-3 bg-duo-green text-white rounded-xl font-bold"
                                >
                                    🔓 Unlock ({selectedSkill.xpRequired} XP)
                                </button>
                            )}
                            {selectedSkill.isUnlocked && selectedSkill.progress < 100 && (
                                <button
                                    onClick={() => router.push('/student/practice')}
                                    className="flex-1 py-3 bg-duo-blue text-white rounded-xl font-bold"
                                >
                                    📚 {language === 'id' ? 'Latihan' : 'Practice'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
