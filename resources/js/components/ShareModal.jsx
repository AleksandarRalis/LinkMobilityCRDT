import { useState, useEffect } from 'react';
import { shareApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { ErrorAlert } from './ui/ErrorMessage';
import { InlineLoader } from './ui/LoadingSpinner';

export default function ShareModal({ documentId, isOpen, onClose }) {
    const toast = useToast();
    const [email, setEmail] = useState('');
    const [shares, setShares] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingShares, setIsLoadingShares] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && documentId) {
            fetchShares();
        }
    }, [isOpen, documentId]);

    const fetchShares = async () => {
        setIsLoadingShares(true);
        try {
            const response = await shareApi.getShares(documentId);
            setShares(response.data.shares || []);
        } catch (err) {
            // User might not be owner, that's ok
            setShares([]);
        } finally {
            setIsLoadingShares(false);
        }
    };

    const handleShare = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            await shareApi.share(documentId, email.trim());
            toast.success(`Document shared with ${email}`);
            setEmail('');
            fetchShares();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to share document');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveShare = async (userId, userName) => {
        try {
            await shareApi.removeShare(documentId, userId);
            setShares(shares.filter(s => s.user_id !== userId));
            toast.success(`Removed ${userName || 'user'} from document`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove share');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Share Document</h3>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Share Form */}
                <form onSubmit={handleShare} className="mb-6">
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !email.trim()}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                                    Sharing...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Share
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Error Message */}
                {error && (
                    <div className="mb-4">
                        <ErrorAlert message={error} onDismiss={() => setError('')} />
                    </div>
                )}

                {/* Shared Users List */}
                <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-3">Shared with</h4>
                    {isLoadingShares ? (
                        <InlineLoader message="Loading shares..." />
                    ) : shares.length === 0 ? (
                        <div className="text-center py-6">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
                                <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <p className="text-sm text-zinc-500">Not shared with anyone yet</p>
                            <p className="text-xs text-zinc-600 mt-1">Add collaborators by email</p>
                        </div>
                    ) : (
                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                            {shares.map((share) => (
                                <li 
                                    key={share.id}
                                    className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg group hover:bg-zinc-750 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-semibold text-white">
                                            {share.user?.name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{share.user?.name}</p>
                                            <p className="text-zinc-500 text-xs">{share.user?.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveShare(share.user_id, share.user?.name)}
                                        className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-red-500/10"
                                        title="Remove access"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

