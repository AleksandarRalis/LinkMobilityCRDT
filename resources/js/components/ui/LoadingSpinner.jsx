/**
 * Loading Spinner Component
 * Sizes: sm, md, lg
 */
export default function LoadingSpinner({ size = 'md', className = '' }) {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-3',
    };

    return (
        <div 
            className={`animate-spin rounded-full border-t-amber-500 border-b-amber-500 border-l-transparent border-r-transparent ${sizeClasses[size]} ${className}`}
        />
    );
}

/**
 * Full Page Loading State
 */
export function PageLoader({ message = 'Loading...' }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <div className="text-center">
                <LoadingSpinner size="lg" className="mx-auto mb-4" />
                <p className="text-zinc-400">{message}</p>
            </div>
        </div>
    );
}

/**
 * Inline Loading State (for sections/cards)
 */
export function InlineLoader({ message = 'Loading...' }) {
    return (
        <div className="flex items-center justify-center py-8">
            <div className="text-center">
                <LoadingSpinner size="md" className="mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">{message}</p>
            </div>
        </div>
    );
}

/**
 * Button Loading State
 */
export function ButtonLoader({ className = '' }) {
    return (
        <LoadingSpinner size="sm" className={className} />
    );
}

