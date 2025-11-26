import { useState } from 'react';

const SHORTCUTS = [
    { keys: ['Ctrl', 'B'], action: 'Bold' },
    { keys: ['Ctrl', 'I'], action: 'Italic' },
    { keys: ['Ctrl', 'U'], action: 'Underline' },
    { keys: ['Ctrl', 'Z'], action: 'Undo' },
    { keys: ['Ctrl', 'Y'], action: 'Redo' },
    { keys: ['Ctrl', 'S'], action: 'Save' },
];

/**
 * Keyboard Shortcuts Help Modal
 */
export default function KeyboardShortcuts({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white transition-colors p-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-3">
                    {SHORTCUTS.map(({ keys, action }) => (
                        <div key={action} className="flex items-center justify-between">
                            <span className="text-zinc-400 text-sm">{action}</span>
                            <div className="flex items-center gap-1">
                                {keys.map((key, i) => (
                                    <span key={i}>
                                        <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 font-mono">
                                            {key}
                                        </kbd>
                                        {i < keys.length - 1 && (
                                            <span className="text-zinc-600 mx-0.5">+</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-6 text-xs text-zinc-500 text-center">
                    Use <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 font-mono">?</kbd> to toggle this help
                </p>
            </div>
        </div>
    );
}

/**
 * Keyboard Shortcuts Toggle Button
 */
export function KeyboardShortcutsButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded hover:bg-zinc-800"
            title="Keyboard shortcuts"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
        </button>
    );
}

