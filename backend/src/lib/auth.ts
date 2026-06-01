import { dash } from '@better-auth/infra';
import { betterAuth } from 'better-auth';

import { pool } from '../Config/DB';

export const auth = betterAuth({
    baseURL: 'http://localhost:3000/',
    database: pool,
    emailAndPassword: { enabled: true },
    trustedOrigins: ['http://localhost:5173'],
    plugins: [
        // ... other plugins
        dash(),
    ],
});
