import { useState, useEffect, useRef } from 'react';
import { syncApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { ErrorAlert } from './ui/ErrorMessage';
import { InlineLoader } from './ui/LoadingSpinner';

export default function VersionHistoryModal({ documentId, isOpen, onClose, onPreview }) {
    const toast = useToast();
    const [versions, setVersions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const modalRef = useRef(null);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setVersions([]);
            setCurrentPage(1);
            setPagination(null);
            setError('');
            setIsLoading(true);
            setIsLoadingMore(false);
        }
    }, [isOpen]);

    // Fetch versions when modal opens
    useEffect(() => {
        if (isOpen && documentId) {
            fetchVersions(1);
        }
    }, [isOpen, documentId]);

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

    const fetchVersions = async (page = 1, append = false) => {
        if (append) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
        }
        setError('');

        try {
            const response = await syncApi.getVersions(documentId, page);
            const newVersions = response.data.versions || [];
            const paginationData = response.data.pagination;

            if (append) {
                setVersions(prev => [...prev, ...newVersions]);
            } else {
                setVersions(newVersions);
            }

            setPagination(paginationData);
            setCurrentPage(page);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load version history');
            if (!append) {
                setVersions([]);
            }
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (pagination && currentPage < pagination.last_page) {
            fetchVersions(currentPage + 1, true);
        }
    };

    const handlePreview = (version) => {
        if (onPreview) {
            onPreview(version);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="version-history-title">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
                aria-label="Close modal"
            ></div>
            <div 
                ref={modalRef}
                className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 id="version-history-title" className="text-lg font-semibold text-white">Version History</h3>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
                        aria-label="Close version history"
                        title="Close (ESC)"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4">
                        <ErrorAlert message={error} onDismiss={() => setError('')} />
                    </div>
                )}

                {/* Versions List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <InlineLoader message="Loading versions..." />
                    ) : versions.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
                                <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-sm text-zinc-500">No versions yet</p>
                            <p className="text-xs text-zinc-600 mt-1">Versions are created automatically as you edit</p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {versions.map((version) => (
                                <li 
                                    key={version.id}
                                    className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg group hover:bg-zinc-750 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                            <span className="text-amber-500 font-semibold text-sm">v{version.version_number}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-white text-sm font-medium">
                                                    Version {version.version_number}
                                                </p>
                                                {version.user && (
                                                    <span className="text-zinc-500 text-xs">
                                                        by {version.user.name}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-zinc-500 text-xs mt-0.5">
                                                {formatDate(version.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePreview(version)}
                                            className="px-3 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                            aria-label={`Preview version ${version.version_number}`}
                                        >
                                            Preview
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Pagination / Load More */}
                {pagination && currentPage < pagination.last_page && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                        <button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            aria-label="Load more versions"
                        >
                            {isLoadingMore ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Loading...
                                </>
                            ) : (
                                <>
                                    Load More ({pagination.total - versions.length} remaining)
                                </>
                            )}
                        </button>
                        <p className="text-xs text-zinc-500 text-center mt-2">
                            Showing {versions.length} of {pagination.total} versions
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

