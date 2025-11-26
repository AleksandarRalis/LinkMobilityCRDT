import { createContext, useState, useCallback } from 'react';
import { documentApi } from '../services/api';

export const DocumentContext = createContext(undefined);

export function DocumentProvider({ children }) {
    const [document, setDocument] = useState(null);
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    /**
     * Load a document by ID
     */
    const loadDocument = useCallback(async (id) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await documentApi.get(id);
            setDocument(response.data.document);
            setContent(response.data.content);
            return response.data;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to load document';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Update content locally (for real-time editing)
     */
    const updateContent = useCallback((newContent) => {
        setContent(newContent);
    }, []);

    /**
     * Clear document state (when leaving editor)
     */
    const clearDocument = useCallback(() => {
        setDocument(null);
        setContent(null);
        setError(null);
        setIsSaving(false);
        setLastSaved(null);
    }, []);

    /**
     * Mark as saving
     */
    const setSavingState = useCallback((saving) => {
        setIsSaving(saving);
        if (!saving) {
            setLastSaved(new Date());
        }
    }, []);

    const value = {
        // State
        document,
        content,
        isLoading,
        error,
        isSaving,
        lastSaved,

        // Actions
        loadDocument,
        updateContent,
        clearDocument,
        setSavingState,
        setError,
    };

    return (
        <DocumentContext.Provider value={value}>
            {children}
        </DocumentContext.Provider>
    );
}

