import { UserType } from '@eventflow/shared';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { api } from '../../../services/axios';

interface AuthContextType {
    user: UserType | null;
    isLoading: boolean;
    loginUser: (email: string, password: string) => Promise<void>;
    logoutUser: () => Promise<void>;
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

    const loginUser = async (email: string, password: string) => {
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
    };

    const logoutUser = async () => {
        setIsLoading(true);
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error('Logout error on server:', err);
        } finally {
            setUser(null);
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
