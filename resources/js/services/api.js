import axios from 'axios';

/**
 * Auth API calls
 * Token is handled via HTTP-only cookies automatically
 */
export const authApi = {
    register: (data) => axios.post('/register', data),
    login: (data) => axios.post('/login', data),
    logout: () => axios.post('/logout'),
    me: () => axios.get('/me'),
    refresh: () => axios.post('/refresh'),
};

/**
 * Document API calls
 */
export const documentApi = {
    list: () => axios.get('/documents'),
    get: (id) => axios.get(`/documents/${id}`),
    create: (data) => axios.post('/documents', data),
};

/**
 * Document Sharing API calls
 */
export const shareApi = {
    share: (documentId, email, permission = 'edit') => 
        axios.post(`/documents/${documentId}/share`, { email, permission }),
    removeShare: (documentId, userId) => 
        axios.delete(`/documents/${documentId}/share/${userId}`),
    getShares: (documentId) => 
        axios.get(`/documents/${documentId}/shares`),
};

/**
 * Document Sync API calls (Yjs)
 */
export const syncApi = {
    // Save document state (called periodically, not on every edit)
    save: (id, content, updateCount) => axios.post(`/documents/${id}/save`, { content, update_count: updateCount }),
    createSnapshot: (id) => axios.post(`/documents/${id}/snapshot`),
    getVersions: (id, page = 1) => axios.get(`/documents/${id}/versions`, { params: { page } }),
    getVersionPreview: (id, versionNumber) => axios.get(`/documents/${id}/versions/${versionNumber}`),
    restore: (id, versionNumber) => axios.post(`/documents/${id}/restore`, { version_number: versionNumber }),
};

