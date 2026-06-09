import { dash } from '@better-auth/infra';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

// 1. Import the adapter

import { prisma } from '../Config/DB';

export const auth = betterAuth({
    baseURL: `http://localhost:${process.env.PORT || 5100}`,
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    emailAndPassword: { enabled: true },
    socialProviders: {
        apple: {
            clientId: process.env.APPLE_CLIENT_ID!,
            clientSecret: process.env.APPLE_CLIENT_SECRET!,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    trustedOrigins: [
        'http://localhost:5173',
        'https://unparasitical-unsigned-lasonya.ngrok-free.dev',
    ],
    plugins: [
        // ... other plugins
        dash(),
    ],
});
