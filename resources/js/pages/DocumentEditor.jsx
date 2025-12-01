import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useYjs } from '@/hooks/useYjs';
import { useDocumentChannel, ConnectionState } from '@/hooks/useDocumentChannel';
import { documentApi, syncApi } from '@/services/api';
import Editor from '@/components/Editor';
import ActiveUsers from '@/components/ActiveUsers';
import Notifications, { useNotifications } from '@/components/Notifications';
import ShareModal from '@/components/ShareModal';
import VersionHistoryModal from '@/components/VersionHistoryModal';
import VersionPreviewModal from '@/components/VersionPreviewModal';
import { useToast } from '@/contexts/ToastContext';

const NOTIFICATION_DEBOUNCE_MS = 5000; // 5 seconds

export default function DocumentEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();

    const [document, setDocument] = useState(null);
    const [versionNumber, setVersionNumber] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);
    const [showVersionPreviewModal, setShowVersionPreviewModal] = useState(false);
    const [previewVersionNumber, setPreviewVersionNumber] = useState(null);

    // Notifications
    const { notifications, dismissNotification, notifyEdit, notifyJoin, notifyLeave } = useNotifications();

    // Per-user debounce timers for edit notifications
    const notificationTimersRef = useRef(new Map());

    // Yjs document (pure)
    const { ydoc, isReady, getState, applyUpdate, restoreToState } = useYjs(id);

    // Handle remote update from another client with per-user debouncing
    const handleRemoteUpdate = useCallback((data) => {
        if (data.update) {
            applyUpdate(data.update);
            
            // Debounce notifications per user
            if (data.userName && data.userId) {
                // Clear existing timer for this user
                const existingTimer = notificationTimersRef.current.get(data.userId);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                }
                
                // Set new timer for this user
                const timer = setTimeout(() => {
                    notifyEdit(data.userName);
                    notificationTimersRef.current.delete(data.userId);
                }, NOTIFICATION_DEBOUNCE_MS);
                
                notificationTimersRef.current.set(data.userId, timer);
            }
        }
    }, [applyUpdate, notifyEdit]);

    // Handle remote restore from another client
    const handleRemoteRestore = useCallback((data) => {
        if (data.content) {
            applyUpdate(data.content);
            if (data.versionNumber) setVersionNumber(data.versionNumber);
            // Clear any pending "made a change" notification for this user
            // since restore notification is more specific
            if (data.userId) {
                const existingTimer = notificationTimersRef.current.get(data.userId);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                    notificationTimersRef.current.delete(data.userId);
                }
            }
            
            if (data.userName) notifyEdit(`${data.userName} restored a previous version`);
        }
    }, [applyUpdate, notifyEdit]);

    // Document channel (networking)
    const {
        activeUsers,
        connectionState,
        reconnectAttempts,
        reconnect,
        broadcast,
        broadcastRestore,
        scheduleSave,
        saveNow,
    } = useDocumentChannel(id, user, {
        onUserJoin: (u) => notifyJoin(u.name),
        onUserLeave: (u) => notifyLeave(u.name),
        onRemoteUpdate: handleRemoteUpdate,
        onRemoteRestore: handleRemoteRestore,
        getState,
    });

    // Cleanup notification timers on unmount
    useEffect(() => {
        return () => {
            // Clear all pending notification timers
            notificationTimersRef.current.forEach((timer) => {
                clearTimeout(timer);
            });
            notificationTimersRef.current.clear();
        };
    }, []);

    // Wire Yjs local changes → broadcast + schedule save
    useEffect(() => {
        if (!ydoc) return;

        const handleUpdate = (_update, origin) => {
            if (origin !== 'remote') {
                broadcast(getState());
                scheduleSave();
            }
        };

        ydoc.on('update', handleUpdate);
        return () => ydoc.off('update', handleUpdate);
    }, [ydoc, broadcast, getState, scheduleSave]);

    // Fetch document on mount
    useEffect(() => {
        if (!id || !isReady) return;

        const fetchDocument = async () => {
            try {
                setLoading(true);
                const response = await documentApi.get(id);
                setDocument(response.data.document);
                setVersionNumber(response.data.version_number);

                if (response.data.content) {
                    applyUpdate(response.data.content);
                }
            } catch (err) {
                console.error('[DocumentEditor] Failed to fetch:', err);
                setError('Failed to load document');
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [id, isReady, applyUpdate]);

    const handleBack = () => {
        saveNow();
        navigate('/documents');
    };

    // ─────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────

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
                    <button onClick={handleBack} className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors">
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
                                <ConnectionStatus state={connectionState} reconnectAttempts={reconnectAttempts} onReconnect={reconnect} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
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
                            <button
                                onClick={() => setShowVersionHistoryModal(true)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Version History
                            </button>
                            <ActiveUsers users={activeUsers} currentUserId={user?.id} />
                        </div>
                    </div>
                </div>
            </header>

            <Notifications notifications={notifications} onDismiss={dismissNotification} />

            <ShareModal documentId={id} isOpen={showShareModal} onClose={() => setShowShareModal(false)} />

            <VersionHistoryModal 
                documentId={id} 
                isOpen={showVersionHistoryModal} 
                onClose={() => setShowVersionHistoryModal(false)}
                onPreview={(version) => {
                    setPreviewVersionNumber(version.version_number);
                    setShowVersionPreviewModal(true);
                }}
            />

            <VersionPreviewModal
                documentId={id}
                versionNumber={previewVersionNumber}
                isOpen={showVersionPreviewModal}
                onClose={() => {
                    setShowVersionPreviewModal(false);
                    setPreviewVersionNumber(null);
                }}
                onRestore={async (versionNumber) => {
                    try {
                        const response = await syncApi.restore(id, versionNumber);
                        const postRestoreState = restoreToState(response.data.content);
                        setVersionNumber(response.data.version_number);

                        if (postRestoreState) {
                            broadcastRestore(postRestoreState, response.data.version_number);
                        }
                        toast.success(`Document restored to version ${versionNumber}`);
                        setShowVersionPreviewModal(false);
                        setShowVersionHistoryModal(false);
                    } catch (err) {
                        console.error('[DocumentEditor] Restore failed:', err);
                        const errorMessage = err.response?.data?.message || 'Failed to restore version';
                        toast.error(errorMessage);
                        throw err;
                    }
                }}
            />

            {/* Disconnection Banner */}
            {connectionState === ConnectionState.DISCONNECTED && reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && (
                <div className="bg-red-900/50 border-b border-red-800 px-4 py-3">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-sm">Connection lost. Changes may not sync with other users.</span>
                        </div>
                        <button onClick={reconnect} className="px-3 py-1 text-sm bg-red-800 hover:bg-red-700 text-white rounded transition-colors">
                            Reconnect
                        </button>
                    </div>
                </div>
            )}

            {/* Editor */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isReady && ydoc ? (
                    <Editor ydoc={ydoc} user={user} activeUsers={activeUsers} />
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

const MAX_RECONNECT_ATTEMPTS = 5;

function ConnectionStatus({ state, reconnectAttempts, onReconnect }) {
    if (state === ConnectionState.CONNECTED) {
        return (
            <span className="flex items-center gap-1 text-xs text-green-500">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Connected
            </span>
        );
    }

    if (state === ConnectionState.CONNECTING) {
        return (
            <span className="flex items-center gap-1 text-xs text-amber-500">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                Connecting...
            </span>
        );
    }

    if (state === ConnectionState.RECONNECTING) {
        return (
            <span className="flex items-center gap-1 text-xs text-amber-500">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                Reconnecting ({reconnectAttempts}/5)...
            </span>
        );
    }

    return (
        <button onClick={onReconnect} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            Disconnected - Click to retry
        </button>
    );
}
