import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { login } from '../services/auth';

interface UseLoginReturn {
    handleLogin: (email: string, password: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export function useLogin(): UseLoginReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    async function handleLogin(email: string, password: string): Promise<void> {
        setIsLoading(true);
        setError(null);

        try {
            await login(email, password);
            await navigate('/404');
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
