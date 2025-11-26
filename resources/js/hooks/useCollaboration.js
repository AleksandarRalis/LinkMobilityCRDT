import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Connection states
 */
export const ConnectionState = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
};

/**
 * Hook for managing real-time collaboration via Laravel Echo
 * Includes automatic reconnection handling
 */
export function useCollaboration(documentId, user, callbacks = {}) {
    const [activeUsers, setActiveUsers] = useState([]);
    const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    
    const channelRef = useRef(null);
    const updateCallbacksRef = useRef([]);
    const callbacksRef = useRef(callbacks);
    const reconnectTimeoutRef = useRef(null);

    const MAX_RECONNECT_ATTEMPTS = 5;
    const BASE_RECONNECT_DELAY = 1000; // 1 second

    // Keep callbacks ref updated
    useEffect(() => {
        callbacksRef.current = callbacks;
    }, [callbacks]);

    /**
     * Register a callback for remote updates
     */
    const onRemoteUpdate = useCallback((callback) => {
        updateCallbacksRef.current.push(callback);
        return () => {
            updateCallbacksRef.current = updateCallbacksRef.current.filter(cb => cb !== callback);
        };
    }, []);

    /**
     * Calculate reconnect delay with exponential backoff
     */
    const getReconnectDelay = useCallback((attempt) => {
        return Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempt), 30000); // Max 30 seconds
    }, []);

    /**
     * Connect to the document channel
     */
    const connect = useCallback(() => {
        if (!documentId || !window.Echo || !user) {
            return;
        }

        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        setConnectionState(reconnectAttempts > 0 ? ConnectionState.RECONNECTING : ConnectionState.CONNECTING);

        try {
            const channel = window.Echo.join(`document.${documentId}`)
                .here((users) => {
                    setActiveUsers(users);
                    setConnectionState(ConnectionState.CONNECTED);
                    setReconnectAttempts(0); // Reset on successful connection
                    
                    // Notify about reconnection
                    if (callbacksRef.current.onReconnected && reconnectAttempts > 0) {
                        callbacksRef.current.onReconnected();
                    }
                })
                .joining((joiningUser) => {
                    setActiveUsers((prev) => {
                        if (prev.find(u => u.id === joiningUser.id)) return prev;
                        return [...prev, joiningUser];
                    });
                    if (callbacksRef.current.onUserJoin) {
                        callbacksRef.current.onUserJoin(joiningUser);
                    }
                })
                .leaving((leavingUser) => {
                    setActiveUsers((prev) => prev.filter((u) => u.id !== leavingUser.id));
                    if (callbacksRef.current.onUserLeave) {
                        callbacksRef.current.onUserLeave(leavingUser);
                    }
                })
                .error((error) => {
                    console.error('[Collab] Channel error:', error);
                    handleDisconnect();
                });

            // Listen for whispers
            channel.listenForWhisper('update', (data) => {
                if (data.userId !== user?.id) {
                    updateCallbacksRef.current.forEach(cb => cb(data));
                }
            });

            // Listen for server broadcasts
            channel.listen('.document.updated', (data) => {
                if (data.user_id !== user?.id) {
                    updateCallbacksRef.current.forEach(cb => cb({
                        update: data.content,
                        userId: data.user_id,
                        userName: data.user_name,
                    }));
                }
            });

            channelRef.current = channel;
        } catch (error) {
            console.error('[Collab] Failed to join channel:', error);
            handleDisconnect();
        }
    }, [documentId, user, reconnectAttempts]);

    /**
     * Handle disconnection and attempt reconnect
     */
    const handleDisconnect = useCallback(() => {
        setConnectionState(ConnectionState.DISCONNECTED);
        channelRef.current = null;
        setActiveUsers([]);

        // Notify about disconnection
        if (callbacksRef.current.onDisconnected) {
            callbacksRef.current.onDisconnected();
        }

        // Attempt reconnect if under max attempts
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = getReconnectDelay(reconnectAttempts);
            
            reconnectTimeoutRef.current = setTimeout(() => {
                setReconnectAttempts(prev => prev + 1);
            }, delay);
        } else {
            console.error('[Collab] Max reconnection attempts reached');
            if (callbacksRef.current.onMaxReconnectAttempts) {
                callbacksRef.current.onMaxReconnectAttempts();
            }
        }
    }, [reconnectAttempts, getReconnectDelay]);

    /**
     * Manual reconnect function
     */
    const reconnect = useCallback(() => {
        setReconnectAttempts(0);
        if (channelRef.current) {
            window.Echo?.leave(`document.${documentId}`);
            channelRef.current = null;
        }
        connect();
    }, [documentId, connect]);

    /**
     * Listen for global Pusher connection state changes
     */
    useEffect(() => {
        if (!window.Echo?.connector?.pusher) return;

        const pusher = window.Echo.connector.pusher;

        const handleStateChange = (states) => {
            
            if (states.current === 'connected' && states.previous !== 'connected') {
                // Pusher reconnected, rejoin channel
                if (documentId && user && !channelRef.current) {
                    connect();
                }
            } else if (states.current === 'disconnected' || states.current === 'failed') {
                handleDisconnect();
            }
        };

        pusher.connection.bind('state_change', handleStateChange);

        return () => {
            pusher.connection.unbind('state_change', handleStateChange);
        };
    }, [documentId, user, connect, handleDisconnect]);

    /**
     * Connect when dependencies are ready or reconnect attempts change
     */
    useEffect(() => {
        if (!documentId || !window.Echo || !user) {
            return;
        }

        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (window.Echo) {
                window.Echo.leave(`document.${documentId}`);
            }
            channelRef.current = null;
            setActiveUsers([]);
            setConnectionState(ConnectionState.DISCONNECTED);
        };
    }, [documentId, user?.id, reconnectAttempts]);

    /**
     * Broadcast update to other clients
     */
    const broadcastUpdate = useCallback((content) => {
        if (!channelRef.current || !user || connectionState !== ConnectionState.CONNECTED) {
            console.warn('[Collab] Cannot broadcast - not connected');
            return false;
        }

        channelRef.current.whisper('update', {
            update: content,
            userId: user.id,
            userName: user.name,
            timestamp: new Date().toISOString(),
        });
        return true;
    }, [user, connectionState]);

    return {
        activeUsers,
        connectionState,
        isConnected: connectionState === ConnectionState.CONNECTED,
        isReconnecting: connectionState === ConnectionState.RECONNECTING,
        reconnectAttempts,
        broadcastUpdate,
        onRemoteUpdate,
        reconnect,
    };
}
