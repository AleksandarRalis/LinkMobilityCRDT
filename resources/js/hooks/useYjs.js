import { useState, useRef, useCallback, useEffect } from 'react';
import * as Y from 'yjs';
import { syncApi } from '../services/api';

/**
 * Hook for managing Yjs document state
 */
export function useYjs(documentId, onLocalChange = null) {
    const [ydoc, setYdoc] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const ydocRef = useRef(null);
    const updateCountRef = useRef(0);
    const saveTimeoutRef = useRef(null);
    const isSavingRef = useRef(false);
    const onLocalChangeRef = useRef(onLocalChange);

    const SAVE_DEBOUNCE_MS = 10000;
    const MAX_UPDATES_BEFORE_SAVE = 50;

    // Keep callback ref updated
    useEffect(() => {
        onLocalChangeRef.current = onLocalChange;
    }, [onLocalChange]);

    /**
     * Get current document state as base64
     */
    const getStateAsBase64 = useCallback(() => {
        if (!ydocRef.current) return null;
        const state = Y.encodeStateAsUpdate(ydocRef.current);
        return uint8ArrayToBase64(state);
    }, []);

    /**
     * Save document to backend
     */
    const saveToBackend = useCallback(async () => {
        if (!ydocRef.current || !documentId || isSavingRef.current) return;

        const content = getStateAsBase64();
        if (!content) return;

        isSavingRef.current = true;
        try {
            await syncApi.save(documentId, content, updateCountRef.current);
            updateCountRef.current = 0;
        } catch (error) {
            console.error('[Yjs] Failed to save:', error);
        } finally {
            isSavingRef.current = false;
        }
    }, [documentId, getStateAsBase64]);

    /**
     * Schedule a save (debounced)
     */
    const scheduleSave = useCallback(() => {
        updateCountRef.current++;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        if (updateCountRef.current >= MAX_UPDATES_BEFORE_SAVE) {
            saveToBackend();
            return;
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveToBackend();
        }, SAVE_DEBOUNCE_MS);
    }, [saveToBackend]);

    // Initialize Y.Doc on mount
    useEffect(() => {
        if (!documentId) return;

        const doc = new Y.Doc();
        ydocRef.current = doc;
        updateCountRef.current = 0;

        // Listen for updates
        const handleUpdate = (update, origin) => {
            
            // Only process local updates (origin is null/undefined for local, 'remote' for applied remote updates)
            if (origin !== 'remote') {
                
                // Schedule save
                scheduleSave();
                
                // Call the broadcast callback
                if (onLocalChangeRef.current) {
                    const state = Y.encodeStateAsUpdate(doc);
                    const base64 = uint8ArrayToBase64(state);
                    onLocalChangeRef.current(base64);
                }
            }
        };

        doc.on('update', handleUpdate);

        // Set state to trigger re-render
        setYdoc(doc);
        setIsReady(true);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            doc.off('update', handleUpdate);
            doc.destroy();
            ydocRef.current = null;
            setYdoc(null);
            setIsReady(false);
        };
    }, [documentId, scheduleSave]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            saveToBackend();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [saveToBackend]);

    /**
     * Apply an update from another client
     */
    const applyRemoteUpdate = useCallback((update) => {
        if (!ydocRef.current) {
            console.warn('[Yjs] Cannot apply remote update - no doc');
            return;
        }
        try {
            if (update instanceof Uint8Array) {
                Y.applyUpdate(ydocRef.current, update, 'remote');
            } else if (typeof update === 'string') {
                const decoded = base64ToUint8Array(update);
                Y.applyUpdate(ydocRef.current, decoded, 'remote');
            }
        } catch (error) {
            console.error('[Yjs] Failed to apply remote update:', error);
        }
    }, []);

    return {
        ydoc,
        isReady,
        applyRemoteUpdate,
        getStateAsBase64,
        saveToBackend,
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
