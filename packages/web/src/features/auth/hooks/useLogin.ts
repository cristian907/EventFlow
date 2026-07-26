import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

interface UseLoginReturn {
    handleLogin: (email: string, password: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export function useLogin(): UseLoginReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    async function handleLogin(email: string, password: string): Promise<void> {
        setIsLoading(true);
        setError(null);

        try {
            await loginUser(email, password);
            void navigate('/dashboard');
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response
                ?.data?.message;
            setError(message ?? 'Credenciales incorrectas. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    }

    return { handleLogin, isLoading, error };
}
