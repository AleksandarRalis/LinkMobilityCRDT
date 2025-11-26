import { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import Placeholder from '@tiptap/extension-placeholder';
import KeyboardShortcuts, { KeyboardShortcutsButton } from './KeyboardShortcuts';

/**
 * Collaborative Tiptap Editor Component
 * 
 * Uses Yjs for CRDT-based collaboration.
 * Active users are displayed via Laravel Echo presence channels (not cursor extension).
 * Broadcasting is handled by useYjs hook's onLocalUpdate callback.
 */
export default function Editor({ 
    ydoc, 
    user, 
    activeUsers = [],
    className = '' 
}) {
    const editorRef = useRef(null);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [wordCount, setWordCount] = useState({ words: 0, characters: 0 });

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                history: false, // Disable default history, Yjs handles undo/redo
            }),
            Collaboration.configure({
                document: ydoc,
            }),
            Placeholder.configure({
                placeholder: 'Start writing your document...',
            }),
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] px-6 py-4',
            },
        },
        onUpdate: ({ editor }) => {
            // Update word count
            const text = editor.getText();
            setWordCount({
                words: text.split(/\s+/).filter(Boolean).length,
                characters: text.length,
            });
        },
    }, [ydoc, user]);

    // Store editor ref
    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    // Keyboard shortcut listener for ?
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                // Don't trigger if typing in the editor
                if (e.target.closest('.ProseMirror')) return;
                setShowShortcuts(prev => !prev);
            }
            if (e.key === 'Escape') {
                setShowShortcuts(false);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!editor) {
        return (
            <div className="flex items-center justify-center h-64 bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent mx-auto mb-3"></div>
                    <p className="text-zinc-400 text-sm">Loading editor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`editor-wrapper ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800 rounded-t-xl">
                <div className="flex items-center gap-0.5 overflow-x-auto">
                    {/* Text Formatting */}
                    <ToolbarGroup>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            isActive={editor.isActive('bold')}
                            title="Bold (Ctrl+B)"
                        >
                            <BoldIcon />
                        </ToolbarButton>

                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            isActive={editor.isActive('italic')}
                            title="Italic (Ctrl+I)"
                        >
                            <ItalicIcon />
                        </ToolbarButton>

                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            isActive={editor.isActive('strike')}
                            title="Strikethrough"
                        >
                            <StrikeIcon />
                        </ToolbarButton>

                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleCode().run()}
                            isActive={editor.isActive('code')}
                            title="Inline Code"
                        >
                            <InlineCodeIcon />
                        </ToolbarButton>
                    </ToolbarGroup>

                    <ToolbarDivider />

                    {/* Headings */}
                    <ToolbarGroup>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            isActive={editor.isActive('heading', { level: 1 })}
                            title="Heading 1"
                        >
                            <span className="text-xs font-bold">H1</span>
                        </ToolbarButton>

                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            isActive={editor.isActive('heading', { level: 2 })}
                            title="Heading 2"
                        >
                            <span className="text-xs font-bold">H2</span>
                        </ToolbarButton>

                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            isActive={editor.isActive('heading', { level: 3 })}
                            title="Heading 3"
                        >
                            <span className="text-xs font-semibold">H3</span>
                        </ToolbarButton>
                    </ToolbarGroup>

                    <ToolbarDivider />

                    {/* Lists & Blocks */}
                    <ToolbarGroup>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            isActive={editor.isActive('bulletList')}
                            title="Bullet List"
                        >
                            <BulletListIcon />
                        </ToolbarButton>

                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            isActive={editor.isActive('orderedList')}
                            title="Numbered List"
                        >
                            <OrderedListIcon />
                        </ToolbarButton>

                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            isActive={editor.isActive('blockquote')}
                            title="Quote"
                        >
                            <QuoteIcon />
                        </ToolbarButton>

                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                            isActive={editor.isActive('codeBlock')}
                            title="Code Block"
                        >
                            <CodeBlockIcon />
                        </ToolbarButton>
                    </ToolbarGroup>

                    <ToolbarDivider />

                    {/* Undo/Redo */}
                    <ToolbarGroup>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                            title="Undo (Ctrl+Z)"
                        >
                            <UndoIcon />
                        </ToolbarButton>

                        <ToolbarButton
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                            title="Redo (Ctrl+Y)"
                        >
                            <RedoIcon />
                        </ToolbarButton>
                    </ToolbarGroup>
                </div>

                {/* Right side - shortcuts help */}
                <div className="flex items-center gap-2 ml-2">
                    <KeyboardShortcutsButton onClick={() => setShowShortcuts(true)} />
                </div>
            </div>

            {/* Editor Content */}
            <div className="bg-zinc-900/50 border border-t-0 border-zinc-800 rounded-b-xl min-h-[400px]">
                <EditorContent editor={editor} />
            </div>

            {/* Word Count Footer */}
            <div className="flex items-center justify-end gap-4 mt-2 text-xs text-zinc-500">
                <span>{wordCount.words} words</span>
                <span>{wordCount.characters} characters</span>
            </div>

            {/* Keyboard Shortcuts Modal */}
            <KeyboardShortcuts 
                isOpen={showShortcuts} 
                onClose={() => setShowShortcuts(false)} 
            />
        </div>
    );
}

/**
 * Toolbar Group - groups related buttons
 */
function ToolbarGroup({ children }) {
    return (
        <div className="flex items-center bg-zinc-800/50 rounded-lg p-0.5">
            {children}
        </div>
    );
}

/**
 * Toolbar Button Component
 */
function ToolbarButton({ onClick, isActive, disabled, title, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`
                p-2 rounded-md transition-all duration-150
                ${isActive
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                }
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'}
            `}
        >
            {children}
        </button>
    );
}

/**
 * Toolbar Divider Component
 */
function ToolbarDivider() {
    return <div className="w-px h-6 bg-zinc-700/50 mx-1.5"></div>;
}

// Icons
function BoldIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z" fillRule="evenodd" />
        </svg>
    );
}

function ItalicIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4h6l-1 2h-2l-4 12h2l-1 2H4l1-2h2l4-12H9l1-2z" />
        </svg>
    );
}

function StrikeIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5c-2.5 0-4 1.5-4 3s1.5 2 4 2m0 4c2.5 0 4 1 4 3s-1.5 3-4 3" />
        </svg>
    );
}

function InlineCodeIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-3 3 3 3m8-6l3 3-3 3" />
        </svg>
    );
}

function BulletListIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
    );
}

function OrderedListIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 4h2v4H4V5H3V4zm0 7h3v1H4v1h2v1H3v-1H2v-1h1V11zm0 6h2v1H3v1h2v1H3v-1H2v-2h1v1zm5-12h13v2H8V5zm0 6h13v2H8v-2zm0 6h13v2H8v-2z" />
        </svg>
    );
}

function QuoteIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
        </svg>
    );
}

function CodeBlockIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
    );
}

function UndoIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
    );
}

function RedoIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
        </svg>
    );
}
