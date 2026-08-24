//import { dash } from '@better-auth/infra';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, twoFactor } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins';

// 1. Import the adapter

import { prisma } from '../Config/DB';

prisma
    .$connect()
    .then(() => console.log('✅ Prisma connected'))
    .catch((e) => console.error('❌ Prisma failed:', e));
//Define permissions scope permissions
const statement = {
    user: ['create', 'list', 'ban', 'delete'],
    order: ['create', 'update', 'read'],
} as const;

const ac = createAccessControl(statement);

// 2. Define custom roles using ac.newRole
const roles = {
    admin: ac.newRole({
        user: ['create', 'list', 'ban', 'delete'],
        order: ['create', 'update', 'read'],
    }),
    rider: ac.newRole({
        order: ['update', 'read'], // Specific permissions for riders
    }),
    user: ac.newRole({
        order: ['create', 'read'],
    }),
};
export const auth = betterAuth({
    baseURL: `http://localhost:${process.env.PORT || 5100}`,
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    emailAndPassword: { enabled: true, autoSignIn: true },
    debug: true,
    user: {
        changeEmail: {
            enabled: true,
            // If true, lets users update it immediately without verifying the new inbox
            updateEmailWithoutVerification: true,
        },
    },
    /*socialProviders: {
        apple: {
            clientId: process.env.APPLE_CLIENT_ID!,
            clientSecret: process.env.APPLE_CLIENT_SECRET!,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },*/
    trustedOrigins: ['http://localhost:5173'],
    plugins: [
        twoFactor({ issuer: 'Freshdrop admin' }),
        admin({
            ac,
            roles,
        }), //automatically adds "role to user schema"
        // ... other plugins
        //dash(),
    ],
});
