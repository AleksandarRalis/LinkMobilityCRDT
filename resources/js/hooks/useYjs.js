import { useRef, useCallback, useEffect } from 'react';
import * as Y from 'yjs';
import { syncApi } from '../services/api';

/**
 * Hook for managing Yjs document state
 */
export function useYjs(documentId) {
    const ydocRef = useRef(null);
    const updateCountRef = useRef(0);
    const saveTimeoutRef = useRef(null);
    const isSavingRef = useRef(false);

    const SAVE_DEBOUNCE_MS = 2000; // Save 2 seconds after last edit
    const MAX_UPDATES_BEFORE_SAVE = 50; // Or after 50 updates

    /**
     * Initialize Y.Doc
     */
    const initializeDoc = useCallback((initialContent = null) => {
        // Create new Y.Doc
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;
        updateCountRef.current = 0;

        // If we have initial content, apply it
        if (initialContent) {
            try {
                const update = base64ToUint8Array(initialContent);
                Y.applyUpdate(ydoc, update);
            } catch (error) {
                console.error('Failed to apply initial content:', error);
            }
        }

        return ydoc;
    }, []);

    /**
     * Get the Y.Doc instance
     */
    const getDoc = useCallback(() => {
        return ydocRef.current;
    }, []);

    /**
     * Encode current document state to base64
     */
    const encodeState = useCallback(() => {
        if (!ydocRef.current) return null;
        const state = Y.encodeStateAsUpdate(ydocRef.current);
        return uint8ArrayToBase64(state);
    }, []);

    /**
     * Apply an update from another client
     */
    const applyUpdate = useCallback((base64Update) => {
        if (!ydocRef.current) return;
        try {
            const update = base64ToUint8Array(base64Update);
            Y.applyUpdate(ydocRef.current, update);
        } catch (error) {
            console.error('Failed to apply update:', error);
        }
    }, []);

    /**
     * Save document to backend
     */
    const saveToBackend = useCallback(async () => {
        if (!ydocRef.current || !documentId || isSavingRef.current) return;

        const content = encodeState();
        if (!content) return;

        isSavingRef.current = true;
        try {
            await syncApi.save(documentId, content, updateCountRef.current);
            updateCountRef.current = 0;
        } catch (error) {
            console.error('Failed to save document:', error);
        } finally {
            isSavingRef.current = false;
        }
    }, [documentId, encodeState]);

    /**
     * Schedule a save (debounced)
     */
    const scheduleSave = useCallback(() => {
        updateCountRef.current++;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Force save if we hit the update threshold
        if (updateCountRef.current >= MAX_UPDATES_BEFORE_SAVE) {
            saveToBackend();
            return;
        }

        // Otherwise debounce the save
        saveTimeoutRef.current = setTimeout(() => {
            saveToBackend();
        }, SAVE_DEBOUNCE_MS);
    }, [saveToBackend]);

    /**
     * Clean up on unmount
     */
    const destroy = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        // Save any pending changes
        if (updateCountRef.current > 0 && ydocRef.current) {
            saveToBackend();
        }

        if (ydocRef.current) {
            ydocRef.current.destroy();
            ydocRef.current = null;
        }
    }, [saveToBackend]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            destroy();
        };
    }, [destroy]);

    return {
        initializeDoc,
        getDoc,
        encodeState,
        applyUpdate,
        scheduleSave,
        saveToBackend,
        destroy,
    };
}

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(uint8Array) {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

