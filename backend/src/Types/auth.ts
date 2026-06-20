import type { Request } from 'express';

export interface BetterAuthUser {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
    [key: string]: unknown;
}
export interface BetterAuthSession {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
}
export type AuthenticatedRequest = Request & {
    user?: BetterAuthUser;
    session?: BetterAuthSession;
};
