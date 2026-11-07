//import { dash } from '@better-auth/infra';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, emailOTP, twoFactor } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins';

// 1. Import the adapter

import { prisma } from '../Config/DB.js';
import BrevoEmailSend from '../Services/emailService.js';
import createLogger from '../Utils/logger.js';

const log = createLogger('Auth.ts');

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
    baseURL:
        process.env.NODE_ENV === 'production'
            ? process.env.BETTER_AUTH_URL
            : `http://localhost:${process.env.PORT || 5100}`,
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    advanced: {
        // defaultCookieAttributes: {
        //     sameSite: 'none',
        //     secure: true, // Required when sameSite is "none" (Cloudflare provides HTTPS)
        // },
        defaultCookieAttributes: {
            // In development, we must allow HTTP (non-secure) cookies
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none',
        },
        // Only enable cross-subdomain cookies in production, otherwise it breaks localhost
        crossSubDomainCookies: {
            enabled: process.env.NODE_ENV === 'production',
            domain: '.freshdop.co.ke',
        },
    },
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        sendResetPassword: async ({ user, token }) => {
            const resetLink =
                `${process.env.FRONTEND_URL || 'http://localhost:5173'}` +
                `/auth/reset-password?token=${token}`;
            await BrevoEmailSend.sendEmail({
                to: user.email,
                templateId: 9,
                params: { resetLink },
            });
        },
        resetPasswordTokenExpiresIn: 3600,
    },
    /*emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, otp }) => {
            await BrevoEmailSend.sendEmail({
                to: user.email,
                templateId: 10,
                params: { otp },
            });
        },
    },*/ //this link based authentication
    debug: true,
    user: {},

    socialProviders: {
        /*apple: {
            clientId: process.env.APPLE_CLIENT_ID!,
            clientSecret: process.env.APPLE_CLIENT_SECRET!,
        },*/
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
    onAPIError: {
        // 🚨 Redirect errors back to your frontend login page
        errorURL:
            process.env.NODE_ENV === 'production'
                ? 'https://www.freshdop.co.ke/auth/login'
                : 'http://localhost:5173/auth/login',
    },
    trustedOrigins: [
        'http://localhost:5173',
        'https://freshdop.co.ke',
        'https://www.freshdop.co.ke',
        // 'https://freshdrop-git-dev-phin-kims-projects.vercel.app',
        // 'https://freshdrop-frontend-nu.vercel.app',
    ],
    plugins: [
        twoFactor({ issuer: 'Freshdrop admin' }),
        admin({
            ac,
            roles,
        }), //automatically adds "role to user schema"
        emailOTP({
            async sendVerificationOTP({ email, otp }) {
                log.highlight('Sending the OTP');
                await BrevoEmailSend.sendEmail({
                    to: email,
                    templateId: 10,
                    params: { otp },
                });
            },
            changeEmail: {
                enabled: true,
                verifyCurrentEmail: false,
            },
            overrideDefaultEmailVerification: true,
            sendVerificationOnSignUp: true,
        }),
        // ... other plugins
        //dash(),
    ],
});
