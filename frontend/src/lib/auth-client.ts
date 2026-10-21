// frontend/src/lib/auth-client.ts
import { adminClient, twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
    baseURL:
        import.meta.env.MODE === 'development'
            ? 'http://localhost:5100'
            : 'https://republicans-heights-munich-jun.trycloudflare.com', // Your backend
    plugins: [twoFactorClient(), adminClient()],
});
