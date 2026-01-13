/**
 * Supabase Realtime Hook
 * 
 * Provides real-time subscription capabilities for live features:
 * - Class battles
 * - Co-op raids
 * - Tournament updates
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types for real-time events
export interface RoomParticipant {
    id: string;
    name: string;
    avatar: string;
    score: number;
    correctAnswers: number;
    currentQuestion: number;
    isReady: boolean;
    lastUpdate: string;
}

export interface BattleRoom {
    id: string;
    name: string;
    type: 'class_battle' | 'raid' | 'tournament';
    status: 'waiting' | 'starting' | 'active' | 'finished';
    participants: RoomParticipant[];
    hostId: string;
    currentQuestion: number;
    totalQuestions: number;
    startTime?: string;
    endTime?: string;
}

interface UseRealtimeOptions {
    roomId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    onParticipantJoin?: (participant: RoomParticipant) => void;
    onParticipantLeave?: (participantId: string) => void;
    onParticipantUpdate?: (participant: RoomParticipant) => void;
    onRoomUpdate?: (room: Partial<BattleRoom>) => void;
    onQuestionChange?: (questionIndex: number) => void;
}

export function useRealtime(options: UseRealtimeOptions) {
    const { roomId, userId, userName, userAvatar, onParticipantJoin, onParticipantLeave, onParticipantUpdate, onRoomUpdate, onQuestionChange } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [participants, setParticipants] = useState<RoomParticipant[]>([]);
    const [roomStatus, setRoomStatus] = useState<BattleRoom['status']>('waiting');
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    // Initialize the real-time channel
    useEffect(() => {
        if (!isSupabaseConfigured() || !roomId) {
            console.warn('Realtime: Supabase not configured or no roomId');
            return;
        }

        const roomChannel = supabase.channel(`battle:${roomId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        // Track presence (who's in the room)
        roomChannel.on('presence', { event: 'sync' }, () => {
            const state = roomChannel.presenceState();
            const currentParticipants: RoomParticipant[] = Object.values(state)
                .flat()
                .map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    avatar: p.avatar,
                    score: p.score || 0,
                    correctAnswers: p.correctAnswers || 0,
                    currentQuestion: p.currentQuestion || 0,
                    isReady: p.isReady || false,
                    lastUpdate: p.lastUpdate || new Date().toISOString(),
                }));
            setParticipants(currentParticipants);
        });

        roomChannel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
            const participant = newPresences[0] as any;
            onParticipantJoin?.({
                id: participant.id,
                name: participant.name,
                avatar: participant.avatar,
                score: 0,
                correctAnswers: 0,
                currentQuestion: 0,
                isReady: false,
                lastUpdate: new Date().toISOString(),
            });
        });

        roomChannel.on('presence', { event: 'leave' }, ({ key }) => {
            onParticipantLeave?.(key);
        });

        // Listen for broadcast events
        roomChannel.on('broadcast', { event: 'score_update' }, ({ payload }) => {
            const { participantId, score, correctAnswers, currentQuestion } = payload;
            setParticipants(prev =>
                prev.map(p =>
                    p.id === participantId
                        ? { ...p, score, correctAnswers, currentQuestion, lastUpdate: new Date().toISOString() }
                        : p
                )
            );
            onParticipantUpdate?.(payload);
        });

        roomChannel.on('broadcast', { event: 'room_update' }, ({ payload }) => {
            if (payload.status) setRoomStatus(payload.status);
            onRoomUpdate?.(payload);
        });

        roomChannel.on('broadcast', { event: 'question_change' }, ({ payload }) => {
            onQuestionChange?.(payload.questionIndex);
        });

        // Subscribe and track our presence
        roomChannel
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    await roomChannel.track({
                        id: userId,
                        name: userName,
                        avatar: userAvatar,
                        score: 0,
                        correctAnswers: 0,
                        currentQuestion: 0,
                        isReady: false,
                        lastUpdate: new Date().toISOString(),
                    });
                }
            });

        setChannel(roomChannel);

        // Cleanup on unmount
        return () => {
            roomChannel.unsubscribe();
            setChannel(null);
            setIsConnected(false);
        };
    }, [roomId, userId, userName, userAvatar]);

    // Update our score/progress
    const updateScore = useCallback((score: number, correctAnswers: number, currentQuestion: number) => {
        if (!channel) return;

        // Update our presence
        channel.track({
            id: userId,
            name: userName,
            avatar: userAvatar,
            score,
            correctAnswers,
            currentQuestion,
            isReady: true,
            lastUpdate: new Date().toISOString(),
        });

        // Broadcast to others
        channel.send({
            type: 'broadcast',
            event: 'score_update',
            payload: {
                participantId: userId,
                score,
                correctAnswers,
                currentQuestion,
            },
        });
    }, [channel, userId, userName, userAvatar]);

    // Update room status (host only)
    const updateRoom = useCallback((updates: Partial<BattleRoom>) => {
        if (!channel) return;

        channel.send({
            type: 'broadcast',
            event: 'room_update',
            payload: updates,
        });

        if (updates.status) setRoomStatus(updates.status);
    }, [channel]);

    // Change question (host only)
    const changeQuestion = useCallback((questionIndex: number) => {
        if (!channel) return;

        channel.send({
            type: 'broadcast',
            event: 'question_change',
            payload: { questionIndex },
        });
    }, [channel]);

    // Set ready status
    const setReady = useCallback((isReady: boolean) => {
        if (!channel) return;

        channel.track({
            id: userId,
            name: userName,
            avatar: userAvatar,
            isReady,
            lastUpdate: new Date().toISOString(),
        });
    }, [channel, userId, userName, userAvatar]);

    return {
        isConnected,
        participants,
        roomStatus,
        updateScore,
        updateRoom,
        changeQuestion,
        setReady,
    };
}

/**
 * Simple mock fallback for when Supabase is not configured
 * Uses localStorage + polling for local development
 */
export function useLocalRealtime(roomId: string, userId: string) {
    const [participants, setParticipants] = useState<RoomParticipant[]>([]);
    const STORAGE_KEY = `lms_ypp_room_${roomId}`;

    useEffect(() => {
        // Poll localStorage every 500ms
        const interval = setInterval(() => {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                try {
                    const room = JSON.parse(data);
                    setParticipants(room.participants || []);
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }, 500);

        return () => clearInterval(interval);
    }, [roomId]);

    const updateLocalScore = useCallback((score: number, correctAnswers: number) => {
        const data = localStorage.getItem(STORAGE_KEY);
        let room = data ? JSON.parse(data) : { participants: [] };

        const idx = room.participants.findIndex((p: any) => p.id === userId);
        if (idx >= 0) {
            room.participants[idx] = { ...room.participants[idx], score, correctAnswers };
        } else {
            room.participants.push({ id: userId, score, correctAnswers });
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
    }, [roomId, userId]);

    return { participants, updateLocalScore };
}
