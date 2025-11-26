import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { documentApi } from '../services/api';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { ErrorAlert, EmptyState, PageError } from '../components/ui/ErrorMessage';

export default function Documents() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    
    const [ownedDocs, setOwnedDocs] = useState([]);
    const [sharedDocs, setSharedDocs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await documentApi.list();
            // API now returns { owned: [...], shared: [...] }
            setOwnedDocs(response.data.documents?.owned || response.data.documents || []);
            setSharedDocs(response.data.documents?.shared || []);
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to load documents. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateDocument = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        setIsCreating(true);
        setCreateError('');
        try {
            const response = await documentApi.create({ title: newTitle });
            setShowCreateModal(false);
            setNewTitle('');
            toast.success(`"${newTitle}" created successfully!`);
            navigate(`/documents/${response.data.document.id}`);
        } catch (err) {
            const message = err.response?.data?.message 
                || err.response?.data?.errors?.title?.[0]
                || 'Failed to create document. Please try again.';
            setCreateError(message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
            navigate('/login');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setNewTitle('');
        setCreateError('');
    };

    // Loading state
    if (isLoading) {
        return <PageLoader message="Loading your documents..." />;
    }

    // Error state with retry
    if (error && ownedDocs.length === 0 && sharedDocs.length === 0) {
        return (
            <PageError
                title="Unable to load documents"
                message={error}
                onRetry={fetchDocuments}
            />
        );
    }

    const totalDocs = ownedDocs.length + sharedDocs.length;

    return (
        <div className="min-h-screen bg-zinc-950">
            {/* Header */}
            <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white">
                        Collab<span className="text-amber-500">Docs</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-zinc-400">{user?.name}</span>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* Title + Create Button */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-semibold text-white">My Documents</h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Document
                    </button>
                </div>

                {/* Inline error (when we have some docs but refresh failed) */}
                {error && (
                    <div className="mb-6">
                        <ErrorAlert message={error} onDismiss={() => setError('')} />
                    </div>
                )}

                {/* No Documents */}
                {totalDocs === 0 ? (
                    <EmptyState
                        icon={
                            <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        }
                        title="No documents yet"
                        message="Create your first document to get started"
                        action={() => setShowCreateModal(true)}
                        actionLabel="Create Document"
                    />
                ) : (
                    <>
                        {/* Owned Documents */}
                        {ownedDocs.length > 0 && (
                            <div className="mb-10">
                                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
                                    My Documents ({ownedDocs.length})
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {ownedDocs.map((doc) => (
                                        <DocumentCard key={doc.id} doc={doc} formatDate={formatDate} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Shared Documents */}
                        {sharedDocs.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
                                    Shared with me ({sharedDocs.length})
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {sharedDocs.map((doc) => (
                                        <DocumentCard 
                                            key={doc.id} 
                                            doc={doc} 
                                            formatDate={formatDate}
                                            isShared={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Create Document Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={closeModal}
                    ></div>
                    <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-semibold text-white mb-4">Create New Document</h3>
                        
                        {createError && (
                            <div className="mb-4">
                                <ErrorAlert message={createError} onDismiss={() => setCreateError('')} />
                            </div>
                        )}

                        <form onSubmit={handleCreateDocument}>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Document title"
                                autoFocus
                                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors mb-4"
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isCreating}
                                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || !newTitle.trim()}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {isCreating && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                                    )}
                                    {isCreating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Document Card Component
 */
function DocumentCard({ doc, formatDate, isShared = false }) {
    return (
        <Link
            to={`/documents/${doc.id}`}
            className="group p-5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 hover:bg-zinc-800/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${
                    isShared ? 'bg-blue-500/10' : 'bg-amber-500/10'
                }`}>
                    {isShared ? (
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )}
                </div>
                <svg className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
            <h3 className="font-medium text-white mb-1 truncate group-hover:text-amber-50 transition-colors">{doc.title}</h3>
            <p className="text-sm text-zinc-500">
                {isShared && doc.user?.name && (
                    <span className="text-blue-400">by {doc.user.name} · </span>
                )}
                Updated {formatDate(doc.updated_at)}
            </p>
        </Link>
    );
}
