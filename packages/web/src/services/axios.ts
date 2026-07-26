import axios from 'axios';

export const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});
