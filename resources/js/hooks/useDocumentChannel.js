import { useState, useEffect, useCallback, useRef } from 'react';
import { syncApi } from '../services/api';

export const ConnectionState = {
    DISCONNECTED: 'disconnected',
    CONNECTED: 'connected',
};

const SAVE_DEBOUNCE_MS = 10000;
const MAX_UPDATES_BEFORE_SAVE = 50;

/**
 * Hook for document channel - presence, whispers, and auto-save
 */
export function useDocumentChannel(documentId, user, {
    onUserJoin,
    onUserLeave,
    onRemoteUpdate,
    onRemoteRestore,
    getState,
} = {}) {
    const [activeUsers, setActiveUsers] = useState([]);
    const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED);

    const channelRef = useRef(null);
    const saveTimeoutRef = useRef(null);
    const updateCountRef = useRef(0);
    const isSavingRef = useRef(false);

    const channelName = `document.${documentId}`;

    // ─────────────────────────────────────────────────────────────
    // Connection Management
    // ─────────────────────────────────────────────────────────────

    const connect = useCallback(() => {
        if (!documentId || !window.Echo || !user) {
            setConnectionState(ConnectionState.DISCONNECTED);
            return;
        }

        // Leave existing channel if any
        if (channelRef.current) {
            window.Echo.leave(channelName);
            channelRef.current = null;
        }

        try {
            const channel = window.Echo.join(channelName)
                .here((users) => {
                    setActiveUsers(users);
                    setConnectionState(ConnectionState.CONNECTED);
                })
                .joining((joiningUser) => {
                    setActiveUsers((prev) => {
                        if (prev.find(u => u.id === joiningUser.id)) return prev;
                        return [...prev, joiningUser];
                    });
                    onUserJoin?.(joiningUser);
                })
                .leaving((leavingUser) => {
                    setActiveUsers((prev) => prev.filter((u) => u.id !== leavingUser.id));
                    onUserLeave?.(leavingUser);
                })
                .error(() => {
                    setConnectionState(ConnectionState.DISCONNECTED);
                    channelRef.current = null;
                    setActiveUsers([]);
                });

            // Listen for update whispers
            channel.listenForWhisper('update', (data) => {
                if (data.userId !== user?.id) {
                    onRemoteUpdate?.(data);
                }
            });

            // Listen for restore whispers
            channel.listenForWhisper('restore', (data) => {
                if (data.userId !== user?.id) {
                    onRemoteRestore?.(data);
                }
            });

            channelRef.current = channel;
        } catch {
            setConnectionState(ConnectionState.DISCONNECTED);
            channelRef.current = null;
            setActiveUsers([]);
        }
    }, [documentId, user, channelName, onUserJoin, onUserLeave, onRemoteUpdate, onRemoteRestore]);

    // Connect on mount
    useEffect(() => {
        if (!documentId || !user) return;

        connect();

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (channelRef.current) {
                window.Echo?.leave(channelName);
                channelRef.current = null;
            }
        };
    }, [documentId, user?.id]);

    // Listen for global Pusher state changes
    useEffect(() => {
        const pusher = window.Echo?.connector?.pusher;
        if (!pusher) return;

        const handleStateChange = (states) => {
            if (states.current === 'connected' && states.previous !== 'connected') {
                if (documentId && user && !channelRef.current) connect();
            } else if (states.current !== 'connected') {
                setConnectionState(ConnectionState.DISCONNECTED);
                channelRef.current = null;
                setActiveUsers([]);
            }
        };

        pusher.connection.bind('state_change', handleStateChange);
        return () => pusher.connection.unbind('state_change', handleStateChange);
    }, [documentId, user, connect]);

    // ─────────────────────────────────────────────────────────────
    // Broadcasting
    // ─────────────────────────────────────────────────────────────

    const broadcast = useCallback((content) => {
        if (!channelRef.current || connectionState !== ConnectionState.CONNECTED) return false;

        channelRef.current.whisper('update', {
            update: content,
            userId: user.id,
            userName: user.name,
        });
        return true;
    }, [user, connectionState]);

    const broadcastRestore = useCallback((content, versionNumber) => {
        if (!channelRef.current || connectionState !== ConnectionState.CONNECTED) return false;

        channelRef.current.whisper('restore', {
            content,
            versionNumber,
            userId: user.id,
            userName: user.name,
        });
        return true;
    }, [user, connectionState]);

    // ─────────────────────────────────────────────────────────────
    // Auto-Save
    // ─────────────────────────────────────────────────────────────

    const saveNow = useCallback(async () => {
        if (!documentId || !getState || isSavingRef.current) return;

        const content = getState();
        if (!content) return;

        isSavingRef.current = true;
        try {
            await syncApi.save(documentId, content, updateCountRef.current);
            updateCountRef.current = 0;
        } catch (error) {
            console.error('[useDocumentChannel] Save failed:', error);
        } finally {
            isSavingRef.current = false;
        }
    }, [documentId, getState]);

    const scheduleSave = useCallback(() => {
        updateCountRef.current++;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        if (updateCountRef.current >= MAX_UPDATES_BEFORE_SAVE) {
            saveNow();
            return;
        }

        saveTimeoutRef.current = setTimeout(saveNow, SAVE_DEBOUNCE_MS);
    }, [saveNow]);

    // Save on page unload
    useEffect(() => {
        const handleUnload = () => saveNow();
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, [saveNow]);

    return {
        activeUsers,
        connectionState,
        isConnected: connectionState === ConnectionState.CONNECTED,
        connect,
        broadcast,
        broadcastRestore,
        scheduleSave,
        saveNow,
    };
}

