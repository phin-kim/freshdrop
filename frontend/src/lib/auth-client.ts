// frontend/src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
    baseURL: 'http://localhost:5100', // Your backend
});
