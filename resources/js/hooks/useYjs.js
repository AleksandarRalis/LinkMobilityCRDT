import { useState, useRef, useCallback, useEffect } from 'react';
import * as Y from 'yjs';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/encoding';

/**
 * Pure Yjs document hook
 * Only manages Y.Doc state - no networking, no saving
 */
export function useYjs(documentId) {
    const [ydoc, setYdoc] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const ydocRef = useRef(null);

    // Initialize Y.Doc on mount
    useEffect(() => {
        if (!documentId) return;

        const doc = new Y.Doc();
        ydocRef.current = doc;

        setYdoc(doc);
        setIsReady(true);

        return () => {
            doc.destroy();
            ydocRef.current = null;
            setYdoc(null);
            setIsReady(false);
        };
    }, [documentId]);

    /**
     * Get current document state as base64
     */
    const getState = useCallback(() => {
        if (!ydocRef.current) return null;
        const state = Y.encodeStateAsUpdate(ydocRef.current);
        return uint8ArrayToBase64(state);
    }, []);

    /**
     * Apply an update from another client (base64 or Uint8Array)
     */
    const applyUpdate = useCallback((update, origin = 'remote') => {
        if (!ydocRef.current) return;

        try {
            const decoded = typeof update === 'string' 
                ? base64ToUint8Array(update) 
                : update;
            Y.applyUpdate(ydocRef.current, decoded, origin);
        } catch (error) {
            console.error('[useYjs] Failed to apply update:', error);
        }
    }, []);

    /**
     * Restore document to a specific version state
     * Replaces content instead of merging
     * Returns post-restore state as base64
     */
    const restoreToState = useCallback((stateBase64) => {
        if (!ydocRef.current) return null;

        try {
            const decoded = base64ToUint8Array(stateBase64);
            const fragment = ydocRef.current.getXmlFragment('default');

            // Load restored state into temp doc
            const tempDoc = new Y.Doc();
            Y.applyUpdate(tempDoc, decoded);
            const tempFragment = tempDoc.getXmlFragment('default');

            // Replace content atomically
            ydocRef.current.transact(() => {
                fragment.delete(0, fragment.length);
                tempFragment.toArray().forEach((item) => {
                    fragment.push([item.clone()]);
                });
            });

            tempDoc.destroy();
            return getState();
        } catch (error) {
            console.error('[useYjs] Failed to restore:', error);
            return null;
        }
    }, [getState]);

    return {
        ydoc,
        isReady,
        getState,
        applyUpdate,
        restoreToState,
    };
}
