import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        babel({ presets: [reactCompilerPreset()] }),
    ],
    server: {
        allowedHosts: ['unparasitical-unsigned-lasonya.ngrok-free.dev'],
        fs: {
            allow: [
                // 🎯 Allow Vite to look one level up into the root and grab the shared folder
                path.resolve(__dirname, '..'),
            ],
        },
    },
});
