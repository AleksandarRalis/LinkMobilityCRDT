import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook for managing real-time collaboration via Laravel Echo
 */
export function useCollaboration(documentId) {
    const { user } = useAuth();
    const [activeUsers, setActiveUsers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const channelRef = useRef(null);
    const onUpdateCallbackRef = useRef(null);

    /**
     * Join the document channel
     */
    const joinChannel = useCallback((onUpdate) => {
        if (!documentId || !window.Echo) return;

        onUpdateCallbackRef.current = onUpdate;

        const channel = window.Echo.join(`document.${documentId}`)
            .here((users) => {
                // Initial list of users in the channel
                setActiveUsers(users);
                setIsConnected(true);
            })
            .joining((user) => {
                // User joined
                setActiveUsers((prev) => [...prev, user]);
            })
            .leaving((user) => {
                // User left
                setActiveUsers((prev) => prev.filter((u) => u.id !== user.id));
            })
            .listen('.document.updated', (data) => {
                // Received update from another client
                if (data.user_id !== user?.id && onUpdateCallbackRef.current) {
                    onUpdateCallbackRef.current(data);
                }
            })
            .error((error) => {
                console.error('Channel error:', error);
                setIsConnected(false);
            });

        channelRef.current = channel;
    }, [documentId, user?.id]);

    /**
     * Leave the document channel
     */
    const leaveChannel = useCallback(() => {
        if (channelRef.current && window.Echo) {
            window.Echo.leave(`document.${documentId}`);
            channelRef.current = null;
            setActiveUsers([]);
            setIsConnected(false);
        }
    }, [documentId]);

    /**
     * Broadcast update to other clients
     */
    const broadcastUpdate = useCallback((content) => {
        if (!channelRef.current || !user) return;

        // Use whisper for client-to-client communication (faster, no server roundtrip)
        channelRef.current.whisper('typing', {
            user_id: user.id,
            user_name: user.name,
            content: content,
            timestamp: new Date().toISOString(),
        });
    }, [user]);

    /**
     * Listen for whisper events (client-to-client)
     */
    const listenForWhispers = useCallback((onWhisper) => {
        if (!channelRef.current) return;

        channelRef.current.listenForWhisper('typing', (data) => {
            if (data.user_id !== user?.id) {
                onWhisper(data);
            }
        });
    }, [user?.id]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            leaveChannel();
        };
    }, [leaveChannel]);

    return {
        activeUsers,
        isConnected,
        joinChannel,
        leaveChannel,
        broadcastUpdate,
        listenForWhispers,
    };
}

