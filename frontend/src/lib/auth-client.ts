// frontend/src/lib/auth-client.ts
import { adminClient, twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
    baseURL: 'http://localhost:5100', // Your backend
    plugins: [twoFactorClient(), adminClient()],
});
