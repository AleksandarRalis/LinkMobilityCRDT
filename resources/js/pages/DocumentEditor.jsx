import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useYjs } from '@/hooks/useYjs';
import { useCollaboration, ConnectionState } from '@/hooks/useCollaboration';
import { documentApi } from '@/services/api';
import Editor from '@/components/Editor';
import ActiveUsers from '@/components/ActiveUsers';
import Notifications, { useNotifications } from '@/components/Notifications';
import ShareModal from '@/components/ShareModal';

export default function DocumentEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState('saved');
    const [showShareModal, setShowShareModal] = useState(false);

    // Notification system
    const {
        notifications,
        dismissNotification,
        notifyEdit,
        notifyJoin,
        notifyLeave,
    } = useNotifications();

    // Collaboration callbacks for join/leave/connection events
    const collaborationCallbacks = useMemo(() => ({
        onUserJoin: (joiningUser) => notifyJoin(joiningUser.name),
        onUserLeave: (leavingUser) => notifyLeave(leavingUser.name),
    }), [notifyJoin, notifyLeave]);

    // Initialize collaboration (presence & broadcasting) FIRST
    const {
        activeUsers,
        connectionState,
        isConnected,
        isReconnecting,
        reconnectAttempts,
        broadcastUpdate,
        onRemoteUpdate,
        reconnect,
    } = useCollaboration(id, user, collaborationCallbacks);

    // Callback for when local changes happen - broadcast to other clients
    const handleLocalChange = useCallback((base64State) => {
        if (broadcastUpdate) {
            broadcastUpdate(base64State);
        }
    }, [broadcastUpdate, isConnected]);

    // Initialize Yjs with document ID and broadcast callback
    const { 
        ydoc, 
        isReady: yjsReady,
        applyRemoteUpdate,
        getStateAsBase64,
    } = useYjs(id, handleLocalChange);

    // Fetch document on mount
    useEffect(() => {
        const fetchDocument = async () => {
            try {
                setLoading(true);
                const response = await documentApi.get(id);
                
                // API returns { document: {...}, content: "..." }
                setDocument(response.data.document);
                
                // If document has content, load it into Yjs
                if (response.data.content && ydoc) {
                    try {
                        applyRemoteUpdate(response.data.content);
                    } catch (e) {
                        console.warn('[Editor] Failed to load document content:', e);
                    }
                }
            } catch (err) {
                console.error('[Editor] Failed to fetch document:', err);
                setError('Failed to load document');
            } finally {
                setLoading(false);
            }
        };

        if (id && yjsReady) {
            fetchDocument();
        }
    }, [id, yjsReady, ydoc, applyRemoteUpdate]);

    // Listen for remote updates (from other clients)
    useEffect(() => {
        const handleRemote = (data) => {
            if (data.update) {
                try {
                    applyRemoteUpdate(data.update);
                    
                    // Show notification for the edit
                    if (data.userId && data.userId !== user?.id) {
                        notifyEdit(data.userName || 'Someone');
                    }
                } catch (e) {
                    console.warn('[Editor] Failed to apply remote update:', e);
                }
            }
        };

        const unsubscribe = onRemoteUpdate(handleRemote);
        return unsubscribe;
    }, [applyRemoteUpdate, onRemoteUpdate, user, notifyEdit]);

    const handleBack = () => {
        navigate('/documents');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
                    <p className="text-zinc-400">Loading document...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-zinc-400 mb-4">{error}</p>
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                        Back to Documents
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            {/* Header */}
            <header className="bg-zinc-900 border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                title="Back to documents"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-xl font-semibold text-white">
                                    {document?.title || 'Untitled Document'}
                                </h1>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <span>
                                        {saveStatus === 'saved' && '✓ Saved'}
                                        {saveStatus === 'saving' && 'Saving...'}
                                        {saveStatus === 'error' && '⚠ Error saving'}
                                    </span>
                                    <ConnectionStatus 
                                        state={connectionState} 
                                        reconnectAttempts={reconnectAttempts}
                                        onReconnect={reconnect}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Share Button - only for owner */}
                            {document?.user_id === user?.id && (
                                <button
                                    onClick={() => setShowShareModal(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share
                                </button>
                            )}
                            <ActiveUsers users={activeUsers} currentUserId={user?.id} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Notifications */}
            <Notifications 
                notifications={notifications} 
                onDismiss={dismissNotification} 
            />

            {/* Share Modal */}
            <ShareModal
                documentId={id}
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
            />

            {/* Disconnection Banner */}
            {connectionState === ConnectionState.DISCONNECTED && reconnectAttempts >= 5 && (
                <div className="bg-red-900/50 border-b border-red-800 px-4 py-3">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-sm">Connection lost. Changes may not sync with other users.</span>
                        </div>
                        <button
                            onClick={reconnect}
                            className="px-3 py-1 text-sm bg-red-800 hover:bg-red-700 text-white rounded transition-colors"
                        >
                            Reconnect
                        </button>
                    </div>
                </div>
            )}

            {/* Editor */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {yjsReady && ydoc ? (
                    <Editor
                        ydoc={ydoc}
                        user={user}
                        activeUsers={activeUsers}
                    />
                ) : (
                    <div className="flex items-center justify-center h-64 bg-zinc-900 rounded-lg">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-amber-500 mx-auto mb-2"></div>
                            <p className="text-zinc-500 text-sm">Initializing editor...</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

/**
 * Connection Status Indicator Component
 */
function ConnectionStatus({ state, reconnectAttempts, onReconnect }) {
    if (state === ConnectionState.CONNECTED) {
        return (
            <span className="flex items-center gap-1 text-green-500">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Connected
            </span>
        );
    }

    if (state === ConnectionState.CONNECTING) {
        return (
            <span className="flex items-center gap-1 text-amber-500">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                Connecting...
            </span>
        );
    }

    if (state === ConnectionState.RECONNECTING) {
        return (
            <span className="flex items-center gap-1 text-amber-500">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                Reconnecting ({reconnectAttempts}/5)...
            </span>
        );
    }

    // Disconnected
    return (
        <button 
            onClick={onReconnect}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
        >
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            Disconnected - Click to retry
        </button>
    );
}
