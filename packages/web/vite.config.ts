import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],
        server: {
            host: true,
            allowedHosts: true,
            hmr: false,
            port: parseInt(env.VITE_PORT || '5173'),
            proxy: {
                '/api': {
                    target: env.VITE_API_URL || 'http://localhost:3000',
                    changeOrigin: true,
                },
            },
        },
        optimizeDeps: {
            include: ['@eventflow/shared'],
        },
        preview: {
            host: true,
            allowedHosts: true,
            port: parseInt(env.VITE_PORT || '5173'),
            proxy: {
                '/api': {
                    target: env.VITE_API_URL || 'http://localhost:3000',
                    changeOrigin: true,
                },
            },
        },
        build: {
            outDir: 'dist',
            sourcemap: true,
        },
    };
});
