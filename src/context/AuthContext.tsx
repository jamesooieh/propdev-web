import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AuthService, User, LoginCredentials } from '../services/auth';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    // Start true so we don't kick the user out before checking storage
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Helper to handle Context Hash
    const handleContextHash = (userData: User | null) => {
        if (userData?.meta?.active_hash) {
            // Save hash for the API interceptor
            localStorage.setItem('active_context_hash', userData.meta.active_hash);
        } else {
            // Clear if not present (e.g., user is global root without context)
            localStorage.removeItem('active_context_hash');
        }
    };

    // On App Start: Check if user is already logged in (persisted in device storage)
    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedUser = await AuthService.getCurrentUser();
                if (storedUser) {
                    setUser(storedUser);

                    // Sync hash on app reload
                    handleContextHash(storedUser);
                }
            } catch (error) {
                console.error("Auth Init Failed", error);
            } finally {
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);

    // Login Action
    const login = async (credentials: LoginCredentials) => {
        // AuthService.login throws an error if it fails, which the UI component catches
        const userData = await AuthService.login(credentials);
        setUser(userData);

        // Sync hash on fresh login
        handleContextHash(userData);
    };

    // Logout Action
    const logout = async () => {
        await AuthService.logout();
        setUser(null);

        // Clear hash on logout
        localStorage.removeItem('active_context_hash');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom Hook to easily access Auth functions in any component
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};