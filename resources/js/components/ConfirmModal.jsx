import { useEffect, useRef } from 'react';

export default function ConfirmModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel',
    confirmVariant = 'danger' // 'danger' or 'primary'
}) {
    const modalRef = useRef(null);
    const confirmButtonRef = useRef(null);

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

    // Focus confirm button when modal opens
    useEffect(() => {
        if (isOpen && confirmButtonRef.current) {
            confirmButtonRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const confirmButtonClass = confirmVariant === 'danger' 
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : 'bg-amber-500 hover:bg-amber-400 text-black';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
                aria-label="Close confirmation"
            ></div>
            <div 
                ref={modalRef}
                className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4">
                    <h3 id="confirm-title" className="text-lg font-semibold text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-zinc-400 text-sm">
                        {message}
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={confirmButtonRef}
                        onClick={handleConfirm}
                        className={`px-4 py-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

