import { api } from '../../../services/axios';

export async function login(email: string, password: string): Promise<void> {
    await api.post('/auth/login', { email, password });
}
