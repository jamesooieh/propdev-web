import { Device } from '@capacitor/device';
import api from './api';
import { Preferences } from '@capacitor/preferences';

// 1. Define Types based on your Backend Models
export interface User {
    id: number;
    name: string;
    email: string;
    roles?: Role[];
    abilities: string[];
    // Add other fields (role, avatar, etc.) as needed
}

export interface Role {
    id: number;
    name: string; // This is the key we check (e.g., 'system-root')
    title: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface ResetPasswordPayload {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
}

export interface ChangePasswordPayload {
    current_password: string;
    password: string;
    password_confirmation: string;
}

/**
 * Helper: Check if user has a specific role
 */
export const hasRole = (user: User | null, roleName: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(r => r.name === roleName);
};

/**
 * Specific Helper for System Root
 */
export const isSystemRoot = (user: User | null): boolean => {
    return hasRole(user, 'root'); 
};

export const AuthService = {  
    /**
     * Helper: Get a useful Device Name
     */
    getDeviceName: async (): Promise<string> => {
        try {
            // 1. Get Device Info from Capacitor
            const info = await Device.getInfo();

            // 2. Check Platform
            if (info.platform === 'web') {
                // On Web, we can't get the Hostname, so we use the User Agent
                // Result example: "Web Client (Mozilla/5.0...)" or just "Web Browser"
                return `Web Client (${window.navigator.platform})`;
            }

            // 3. On Mobile (Android/iOS), 'name' or 'model' gives the hardware name
            // Result example: "iPhone 13" or "Samsung SM-G991B"
            return info.name || info.model || 'Unknown Mobile Device';
        } catch (e) {
            return 'Ionic App'; // Fallback if plugin fails
        }
    },
    
    /**
     * LOGIN
     * 1. Posts credentials + device_name to backend.
     * 2. Receives Token.
     * 3. Uses Token to fetch User details.
     * 4. Saves both to device storage.
     */
    login: async (credentials: LoginCredentials): Promise<User> => {
        // Step 1: Get Dynamic Device Name
        const deviceName = await AuthService.getDeviceName();

        const loginPayload = {
            ...credentials,
            device_name: deviceName // <--- Now Dynamic
        };

        // Step 2: Post to API
        const response = await api.post('/auth/login', loginPayload);
        const { access_token } = response.data;

        // Step 3: Save Token
        await Preferences.set({ key: 'auth_token', value: access_token });

        // Step 4: Fetch User
        const userResponse = await api.get('/auth/user');
        
        // Handle potentially wrapped resource response
        const user: User = userResponse.data.data || userResponse.data;

        // Step 5: Save User
        await Preferences.set({ key: 'user', value: JSON.stringify(user) });

        return user;
    },

    /**
     * LOGOUT
     * Calls backend to invalidate token, then clears local storage.
     */
    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error("Logout failed on server", e);
        }
        await Preferences.remove({ key: 'auth_token' });
        await Preferences.remove({ key: 'user' });
    },

    /**
     * GET CURRENT USER
     * Retrieves user from local storage (used on App Start).
     */
    getCurrentUser: async (): Promise<User | null> => {
        const { value } = await Preferences.get({ key: 'user' });
        return value ? JSON.parse(value) : null;
    },

    /**
     * FORGOT PASSWORD
     * Sends the reset link to the email.
     */
    forgotPassword: async (email: string) => {
        // Your backend: Route::post('/forgot-password')
        return api.post('/auth/forgot-password', { email });
    },

    /**
     * RESET PASSWORD
     * Finalizes the reset with the token from email.
     */
    resetPassword: async (payload: ResetPasswordPayload) => {
        // Your backend: Route::post('/reset-password')
        return api.post('/auth/reset-password', payload);
    },

    /**
     * CHANGE PASSWORD
     * For logged-in users to update their password.
     */
    changePassword: async (payload: ChangePasswordPayload) => {
        // Your backend: Route::post('/password') inside auth:sanctum middleware
        return api.post('/auth/password', payload);
    }
};