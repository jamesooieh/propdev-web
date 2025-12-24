import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

export const API_URL = 'http://localhost:8199/api';

const api = axios.create({
    // Replace with your Laravel URL.
    // If testing on Android Emulator later, use your PC's IP (e.g., http://192.168.1.5:8000/api)
    baseURL: API_URL, 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

/**
 * REQUEST INTERCEPTOR
 * Before any request is sent, check for a token and attach it.
 */
api.interceptors.request.use(async (config) => {
    // 1. Handle Auth Token (Your existing code)
    const { value } = await Preferences.get({ key: 'auth_token' });
    if (value) {
        config.headers.Authorization = `Bearer ${value}`;
    }

    // 2. Handle Developer Context (New Logic)
    // We can use standard localStorage for this lightweight string, 
    // or you can use Preferences if you prefer consistency.
    const contextHash = localStorage.getItem('active_context_hash');

    if (contextHash) {
        // Append 't' to params. 
        // We create a new object to preserve any existing params (like page=1)
        config.params = {
            ...config.params,
            t: contextHash 
        };
    }

    return config;
});

/**
 * RESPONSE INTERCEPTOR (Optional but Recommended)
 * If the server says "401 Unauthorized", it means our token is bad.
 * We can catch that here globally.
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Optional: specific check for 403 Context errors
        if (error.response?.status === 403 && error.response?.data?.message?.includes('Context')) {
            console.error("Context Error: ", error.response.data.message);
        }
        return Promise.reject(error);
    }
);

export default api;