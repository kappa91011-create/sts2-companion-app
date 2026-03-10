"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { db, hasFirebaseConfig } from '@/lib/firebase';
import { ref, onValue, set, push, serverTimestamp, remove, onDisconnect } from 'firebase/database';
import { RoomState, UserState, ChatMessage } from '@/lib/types';
import { playNotificationSound } from '@/lib/audio';

export function useRoomSync(roomId: string, userId: string) {
    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const bcRef = useRef<BroadcastChannel | null>(null);
    const messageCountRef = useRef(0);

    // Initial setup
    useEffect(() => {
        if (!roomId) return;

        if (hasFirebaseConfig) {
            const roomRef = ref(db, `rooms/${roomId}`);
            const unsubscribe = onValue(roomRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    // Check for new messages to play sound
                    const newMsgCount = data.messages ? Object.keys(data.messages).length : 0;
                    if (newMsgCount > messageCountRef.current && !isMuted) {
                        playNotificationSound();
                    }
                    messageCountRef.current = newMsgCount;
                    setRoomState(data);
                } else {
                    setRoomState(null);
                }
            });

            return () => {
                unsubscribe();
            };
        } else {
            // Local Fallback using BroadcastChannel
            const bc = new BroadcastChannel(`sts2_room_${roomId}`);
            bcRef.current = bc;

            bc.onmessage = (event) => {
                if (event.data.type === 'STATE_UPDATE') {
                    const newState = event.data.state;
                    const newMsgCount = newState?.messages ? Object.keys(newState.messages).length : 0;
                    if (newMsgCount > messageCountRef.current && !isMuted) {
                        playNotificationSound();
                    }
                    messageCountRef.current = newMsgCount;
                    setRoomState(newState);
                }
            };

            // Request initial state from other tabs
            bc.postMessage({ type: 'REQUEST_STATE' });

            return () => {
                bc.close();
            };
        }
    }, [roomId, isMuted]);

    // Handle user presence
    useEffect(() => {
        if (!roomId || !userId) return;

        if (hasFirebaseConfig) {
            const userRef = ref(db, `rooms/${roomId}/users/${userId}`);
            onDisconnect(userRef).remove();
        } else {
            // For BroadcastChannel, handle window unload
            const handleUnload = () => {
                leaveRoom();
            };
            window.addEventListener('unload', handleUnload);
            return () => {
                window.removeEventListener('unload', handleUnload);
                leaveRoom();
            };
        }
    }, [roomId, userId]);

    // Broadcast state for local testing
    const broadcastLocalState = (newState: RoomState) => {
        if (!hasFirebaseConfig && bcRef.current) {
            setRoomState(newState);
            bcRef.current.postMessage({ type: 'STATE_UPDATE', state: newState });
        }
    };


    const joinRoom = useCallback(async (user: UserState) => {
        if (hasFirebaseConfig) {
            await set(ref(db, `rooms/${roomId}/users/${userId}`), user);
        } else {
            setRoomState((prev) => {
                const newState = {
                    ...prev,
                    roomInfo: prev?.roomInfo || {
                        name: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sts2_username') || 'Unknown' : 'Unknown',
                        ascension: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sts2_room_asc') || 'A1' : 'A1',
                        playstyle: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sts2_room_style') || '初心者卓' : '初心者卓'
                    },
                    users: { ...(prev?.users || {}), [userId]: user },
                    messages: prev?.messages || {}
                } as RoomState;
                broadcastLocalState(newState);
                return newState;
            });
        }
    }, [roomId, userId, roomState]);

    const leaveRoom = useCallback(async () => {
        if (hasFirebaseConfig) {
            await remove(ref(db, `rooms/${roomId}/users/${userId}`));
        } else {
            setRoomState((prev) => {
                if (!prev) return prev;
                const newUsers = { ...prev.users };
                delete newUsers[userId];
                const newState = { ...prev, users: newUsers };
                broadcastLocalState(newState);
                return newState;
            });
        }
    }, [roomId, userId]);

    const updateDeckStatus = useCallback(async (status: string) => {
        if (hasFirebaseConfig) {
            await set(ref(db, `rooms/${roomId}/users/${userId}/deckStatus`), status);
        } else {
            setRoomState((prev) => {
                if (!prev || !prev.users[userId]) return prev;
                const newState = {
                    ...prev,
                    users: {
                        ...prev.users,
                        [userId]: { ...prev.users[userId], deckStatus: status }
                    }
                };
                broadcastLocalState(newState);
                return newState;
            });
        }
    }, [roomId, userId]);

    const sendMessage = useCallback(async (text: string, senderName: string, avatar: string) => {
        const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const msg: ChatMessage = {
            id: msgId,
            senderId: userId,
            senderName,
            avatar,
            text,
            timestamp: Date.now()
        };

        if (hasFirebaseConfig) {
            const msgRef = push(ref(db, `rooms/${roomId}/messages`));
            await set(msgRef, msg);
        } else {
            setRoomState((prev) => {
                const newState = {
                    ...prev,
                    roomInfo: prev?.roomInfo || { name: '', ascension: '', playstyle: '' },
                    users: prev?.users || {},
                    messages: { ...(prev?.messages || {}), [msgId]: msg }
                };
                broadcastLocalState(newState);
                return newState;
            });
        }
    }, [roomId, userId]);

    const createRoomInitial = useCallback(async (roomInfo: RoomState['roomInfo']) => {
        if (hasFirebaseConfig) {
            const roomRef = ref(db, `rooms/${roomId}/roomInfo`);
            await set(roomRef, roomInfo);
        } else {
            const newState = {
                roomInfo,
                users: {},
                messages: {}
            };
            setRoomState(newState);
            broadcastLocalState(newState);
        }
    }, [roomId]);


    return {
        roomState,
        joinRoom,
        leaveRoom,
        updateDeckStatus,
        sendMessage,
        createRoomInitial,
        isMuted,
        setIsMuted
    };
}
