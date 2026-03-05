import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
    base: './',
    plugins: [preact()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
    },
    server: {
        port: 8080
    }
});
