import { UserType } from '@eventflow/shared';
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    ReactNode,
} from 'react';

import { api } from '../../../services/axios';

interface AuthContextType {
    user: UserType | null;
    isLoading: boolean;
    loginUser: (email: string, password: string) => Promise<void>;
    logoutUser: () => Promise<void>;
    updateUserTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserType | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        const checkSession = async () => {
            try {
                const response = await api.get<{ user: UserType }>('/auth/me');
                if (isMounted) {
                    setUser(response.data.user);
                }
            } catch {
                if (isMounted) {
                    setUser(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void checkSession();

        return () => {
            isMounted = false;
        };
    }, []);

    // Sync theme to DOM dynamically
    useEffect(() => {
        const themePreference = user?.theme || 'light';
        const applyTheme = (theme: 'light' | 'dark' | 'system') => {
            if (theme === 'system') {
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.setAttribute('data-theme', systemDark ? 'dark' : 'light');
            } else {
                document.documentElement.setAttribute('data-theme', theme);
            }
        };

        applyTheme(themePreference);

        // If theme is system, listen to changes in OS preferences
        if (themePreference === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const listener = (e: MediaQueryListEvent) => {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            };
            mediaQuery.addEventListener('change', listener);
            return () => mediaQuery.removeEventListener('change', listener);
        }
    }, [user?.theme]);

    const loginUser = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            await api.post('/auth/login', { email, password });
            // Retrieve current user info after successful login
            const response = await api.get<{ user: UserType }>('/auth/me');
            setUser(response.data.user);
        } catch (error) {
            setUser(null);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logoutUser = useCallback(async () => {
        setIsLoading(true);
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error('Logout error on server:', err);
        } finally {
            setUser(null);
            setIsLoading(false);
        }
    }, []);

    const updateUserTheme = useCallback(async (theme: 'light' | 'dark' | 'system') => {
        try {
            const response = await api.put<{ user: UserType }>('/auth/theme', { theme });
            setUser(response.data.user);
        } catch (error) {
            console.error('Error updating theme:', error);
            throw error;
        }
    }, []);

    const value = useMemo(
        () => ({ user, isLoading, loginUser, logoutUser, updateUserTheme }),
        [user, isLoading, loginUser, logoutUser, updateUserTheme],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
