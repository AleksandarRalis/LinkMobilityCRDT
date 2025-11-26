import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Configure Axios
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.baseURL = '/api';
window.axios.defaults.withCredentials = true; // Send cookies with requests

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Axios Response Interceptor - Handle auth errors with token refresh
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // Handle 401 Unauthorized
        if (status === 401 && !originalRequest._retry) {
            // Skip refresh for auth endpoints
            const isAuthEndpoint = originalRequest.url === '/login' 
                || originalRequest.url === '/register'
                || originalRequest.url === '/refresh';

            if (isAuthEndpoint) {
                return Promise.reject(error);
            }

            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return axios(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Attempt to refresh the token
                await axios.post('/refresh');
                
                processQueue(null);
                
                // Retry the original request
                return axios(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                
                // Refresh failed - redirect to login
                const isAuthPage = window.location.pathname === '/login' 
                    || window.location.pathname === '/register';
                
                if (!isAuthPage) {
                    window.location.href = '/login';
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        // Handle 419 CSRF token mismatch - refresh page
        if (status === 419) {
            window.location.reload();
        }

        // Handle 503 Service Unavailable
        if (status === 503) {
            console.error('Service unavailable. Please try again later.');
        }

        return Promise.reject(error);
    }
);

// Configure Pusher for Laravel Echo
window.Pusher = Pusher;

// Configure Laravel Echo with Reverb
window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: '/api/broadcasting/auth',
});
