import { useState, useEffect, useCallback, useRef } from 'react';
import { syncApi } from '../services/api';

export const ConnectionState = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
};

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_BASE = 1000;
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
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    const channelRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const saveTimeoutRef = useRef(null);
    const updateCountRef = useRef(0);
    const isSavingRef = useRef(false);

    const channelName = `document.${documentId}`;

    // ─────────────────────────────────────────────────────────────
    // Connection Management
    // ─────────────────────────────────────────────────────────────

    const connect = useCallback(() => {
        if (!documentId || !window.Echo || !user) return;

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        setConnectionState(reconnectAttempts > 0 
            ? ConnectionState.RECONNECTING 
            : ConnectionState.CONNECTING
        );

        try {
            const channel = window.Echo.join(channelName)
                .here((users) => {
                    setActiveUsers(users);
                    setConnectionState(ConnectionState.CONNECTED);
                    setReconnectAttempts(0);
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
                    handleDisconnect();
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
            handleDisconnect();
        }
    }, [documentId, user, channelName, reconnectAttempts, onUserJoin, onUserLeave, onRemoteUpdate, onRemoteRestore]);

    const handleDisconnect = useCallback(() => {
        setConnectionState(ConnectionState.DISCONNECTED);
        channelRef.current = null;
        setActiveUsers([]);

        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttempts), 30000);
            reconnectTimeoutRef.current = setTimeout(() => {
                setReconnectAttempts(prev => prev + 1);
            }, delay);
        }
    }, [reconnectAttempts]);

    const reconnect = useCallback(() => {
        setReconnectAttempts(0);
        if (channelRef.current) {
            window.Echo?.leave(channelName);
            channelRef.current = null;
        }
        connect();
    }, [channelName, connect]);

    // Connect on mount / reconnect on attempt change
    useEffect(() => {
        if (!documentId || !window.Echo || !user) return;

        connect();

        return () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            window.Echo?.leave(channelName);
            channelRef.current = null;
        };
    }, [documentId, user?.id, reconnectAttempts]);

    // Listen for global Pusher state changes
    useEffect(() => {
        const pusher = window.Echo?.connector?.pusher;
        if (!pusher) return;

        const handleStateChange = (states) => {
            if (states.current === 'connected' && states.previous !== 'connected') {
                if (documentId && user && !channelRef.current) connect();
            } else if (states.current === 'disconnected' || states.current === 'failed') {
                handleDisconnect();
            }
        };

        pusher.connection.bind('state_change', handleStateChange);
        return () => pusher.connection.unbind('state_change', handleStateChange);
    }, [documentId, user, connect, handleDisconnect]);

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
        reconnectAttempts,
        reconnect,
        broadcast,
        broadcastRestore,
        scheduleSave,
        saveNow,
    };
}

