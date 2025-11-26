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
 * Document Sync API calls (Yjs)
 */
export const syncApi = {
    // Save document state (called periodically, not on every edit)
    save: (id, content, updateCount) => axios.post(`/documents/${id}/save`, { content, update_count: updateCount }),
    createSnapshot: (id) => axios.post(`/documents/${id}/snapshot`),
    getVersions: (id) => axios.get(`/documents/${id}/versions`),
    restore: (id, versionNumber) => axios.post(`/documents/${id}/restore`, { version_number: versionNumber }),
};

