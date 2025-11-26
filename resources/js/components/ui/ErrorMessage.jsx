/**
 * Error Alert Component
 * For displaying error messages in forms or inline
 */
export function ErrorAlert({ message, onDismiss }) {
    if (!message) return null;

    return (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="flex-1">{message}</span>
            {onDismiss && (
                <button 
                    onClick={onDismiss}
                    className="text-red-400 hover:text-red-300 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}

/**
 * Success Alert Component
 */
export function SuccessAlert({ message, onDismiss }) {
    if (!message) return null;

    return (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="flex-1">{message}</span>
            {onDismiss && (
                <button 
                    onClick={onDismiss}
                    className="text-green-400 hover:text-green-300 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}

/**
 * Full Page Error State
 */
export function PageError({ 
    title = 'Something went wrong', 
    message = 'An unexpected error occurred.',
    onRetry,
    onBack,
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
                <p className="text-zinc-400 mb-6">{message}</p>
                <div className="flex gap-3 justify-center">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            Go Back
                        </button>
                    )}
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Empty State Component
 */
export function EmptyState({ 
    icon,
    title, 
    message, 
    action,
    actionLabel,
}) {
    return (
        <div className="text-center py-12">
            {icon && (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
            {message && <p className="text-zinc-400 mb-4">{message}</p>}
            {action && actionLabel && (
                <button
                    onClick={action}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

