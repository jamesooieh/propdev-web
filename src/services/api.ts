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
    const { value } = await Preferences.get({ key: 'auth_token' });
    if (value) {
        config.headers.Authorization = `Bearer ${value}`;
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
        // You could trigger a global logout here if you wanted
        return Promise.reject(error);
    }
);

export default api;