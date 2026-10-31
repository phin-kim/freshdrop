// frontend/src/lib/auth-client.ts
import { adminClient, twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const apiUrl = import.meta.env.VITE_API_URL as string | undefined; // e.g. https://xxx.ngrok-free.dev/api

// Strip trailing "/api" (and any trailing slash) to get the bare origin
const prodUrl = apiUrl?.replace(/\/api\/?$/, '');

export const authClient = createAuthClient({
    baseURL:
        import.meta.env.MODE === 'development'
            ? 'http://localhost:5100'
            : prodUrl, // Your backend
    plugins: [twoFactorClient(), adminClient()],
});
