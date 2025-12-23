import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSystemRoot } from '../services/auth'; // Your existing helper

export const usePermission = () => {
    const { user } = useAuth();

    const can = useCallback((ability: string): boolean => {
        if (!user) return false;

        // 1. Root User Bypass: Always allow everything
        if (isSystemRoot(user)) return true;

        // 2. Check for wildcard permission (if Bouncer returned '*')
        if (user.abilities?.includes('*')) return true;

        // 3. Check specific ability
        return user.abilities?.includes(ability) || false;
    }, [user]);

    return { can };
};