// frontend/src/lib/auth-client.ts
import { adminClient, twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const prodUrl = import.meta.env.VITE_API_URL;

export const authClient = createAuthClient({
    baseURL:
        import.meta.env.MODE === 'development'
            ? 'http://localhost:5100'
            : prodUrl, // Your backend
    plugins: [twoFactorClient(), adminClient()],
});
