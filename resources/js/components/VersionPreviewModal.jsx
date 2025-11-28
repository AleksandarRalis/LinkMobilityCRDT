import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';
import { syncApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { ErrorAlert } from './ui/ErrorMessage';
import { InlineLoader } from './ui/LoadingSpinner';
import { base64ToUint8Array } from '../utils/encoding';
import ConfirmModal from './ConfirmModal';

export default function VersionPreviewModal({ 
    documentId, 
    versionNumber, 
    isOpen, 
    onClose, 
    onRestore 
}) {
    const toast = useToast();
    const [versionInfo, setVersionInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const previewYdocRef = useRef(null);
    const modalRef = useRef(null);
    const [ydocReady, setYdocReady] = useState(false);

    // Create Y.Doc synchronously when modal opens (before editor initializes)
    // This ensures the Y.Doc exists when useEditor runs
    if (isOpen && !previewYdocRef.current) {
        previewYdocRef.current = new Y.Doc();
        setYdocReady(true);
    }

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setVersionInfo(null);
            setError('');
            setIsLoading(false);
            if (previewYdocRef.current) {
                previewYdocRef.current.destroy();
                previewYdocRef.current = null;
            }
            setYdocReady(false);
        }

        return () => {
            if (previewYdocRef.current) {
                previewYdocRef.current.destroy();
                previewYdocRef.current = null;
            }
            setYdocReady(false);
        };
    }, [isOpen]);

    // TipTap editor for preview (read-only) - only create when Y.Doc is ready
    const previewEditor = useEditor({
        extensions: ydocReady && previewYdocRef.current ? [
            StarterKit.configure({
                history: false,
            }),
            Collaboration.configure({
                document: previewYdocRef.current,
            }),
            Placeholder.configure({
                placeholder: 'Loading version content...',
            }),
        ] : [
            StarterKit.configure({
                history: false,
            }),
            Placeholder.configure({
                placeholder: 'Initializing preview...',
            }),
        ],
        editable: false, // Read-only preview
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] px-6 py-4',
            },
        },
    }, [ydocReady, previewYdocRef.current]);

    // Fetch version content function
    const fetchVersionContent = async () => {
        if (!documentId || !versionNumber) return;

        setIsLoading(true);
        setError('');
        setVersionInfo(null);

        try {
            const response = await syncApi.getVersionPreview(documentId, versionNumber);
            const content = response.data.content;
            const versionData = {
                version_number: response.data.version_number,
                created_at: response.data.created_at,
                user: response.data.user,
            };

            setVersionInfo(versionData);

            // Apply version content to preview Y.Doc
            if (content && previewYdocRef.current) {
                try {
                    const decoded = base64ToUint8Array(content);
                    Y.applyUpdate(previewYdocRef.current, decoded);
                } catch (err) {
                    console.error('[VersionPreviewModal] Failed to apply content:', err);
                    setError('Failed to load version content');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load version preview');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch version content when modal opens or version number changes
    useEffect(() => {
        if (isOpen && documentId && versionNumber) {
            fetchVersionContent();
        }
    }, [isOpen, documentId, versionNumber]);

    // Handle ESC key to close modal
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Focus trap for accessibility
    useEffect(() => {
        if (isOpen && modalRef.current) {
            const firstFocusable = modalRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }
    }, [isOpen]);

    const handleRestoreClick = () => {
        setShowConfirmModal(true);
    };

    const handleConfirmRestore = async () => {
        try {
            if (onRestore) {
                await onRestore(versionNumber);
                // Toast notification is handled in DocumentEditor
                setShowConfirmModal(false);
                onClose();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to restore version');
            setShowConfirmModal(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="version-preview-title">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                aria-label="Close modal"
            ></div>
            <div 
                ref={modalRef}
                className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div>
                        <h3 id="version-preview-title" className="text-lg font-semibold text-white">
                            Preview Version {versionNumber}
                        </h3>
                        {versionInfo && (
                            <div className="mt-1 flex items-center gap-3 text-sm text-zinc-400">
                                {versionInfo.user && (
                                    <span>by {versionInfo.user.name}</span>
                                )}
                                {versionInfo.created_at && (
                                    <span>• {formatDate(versionInfo.created_at)}</span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {versionInfo && (
                            <button
                                onClick={handleRestoreClick}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                aria-label={`Restore to version ${versionNumber}`}
                            >
                                Restore This Version
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
                            aria-label="Close preview"
                            title="Close (ESC)"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 border-b border-zinc-800">
                        <ErrorAlert message={error} onDismiss={() => setError('')} />
                    </div>
                )}

                {/* Preview Content */}
                <div className="flex-1 overflow-y-auto bg-zinc-950">
                    {isLoading || !ydocReady ? (
                        <div className="flex items-center justify-center h-64">
                            <InlineLoader message="Loading version content..." />
                        </div>
                    ) : previewEditor && ydocReady && previewYdocRef.current ? (
                        <div className="min-h-[400px]">
                            <EditorContent editor={previewEditor} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-zinc-500">Unable to load preview</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
                    <p className="text-xs text-zinc-500">
                        This is a read-only preview. Click "Restore This Version" to apply it to your document.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        aria-label="Close preview"
                    >
                        Close
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmRestore}
                title="Restore Version"
                message={`Are you sure you want to restore to version ${versionNumber}?`}
                confirmText="Restore"
                cancelText="Cancel"
                confirmVariant="danger"
            />
        </div>
    );
}

