import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Configure Axios
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.baseURL = '/api';
window.axios.defaults.withCredentials = true; // Send cookies with requests

// Axios Response Interceptor - Handle auth errors
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        // Handle 401 Unauthorized - redirect to login
        if (status === 401) {
            // Only redirect if not already on login/register page
            const isAuthPage = window.location.pathname === '/login' 
                || window.location.pathname === '/register';
            
            if (!isAuthPage) {
                window.location.href = '/login';
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
