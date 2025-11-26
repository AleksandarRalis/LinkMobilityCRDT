import { useContext } from 'react';
import { DocumentContext } from '../contexts/DocumentContext';

export function useDocument() {
    const context = useContext(DocumentContext);
    
    if (context === undefined) {
        throw new Error('useDocument must be used within a DocumentProvider');
    }
    
    return context;
}

