
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    root: '.',
    base: '/static/dist/',
    build: {
        outDir: '../app/static/dist',
        emptyOutDir: true,
        manifest: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'src/main.tsx'),
            },
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8008',
                changeOrigin: true,
                secure: false,
            },
            // Proxy other Flask routes if needed for dev environment to work seamlessly
            '/login': 'http://127.0.0.1:8008',
            '/static': {
                target: 'http://127.0.0.1:8008',
                bypass: (req) => {
                    if (req.url && req.url.startsWith('/static/dist')) {
                        return req.url;
                    }
                }
            },
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
