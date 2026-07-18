import { authClient } from '../lib/auth-client';

export type LoginResponse = Awaited<ReturnType<typeof authClient.signIn.email>>;
export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt: Date;
}

export interface AuthState {
    user: User | null;
    accessToken?: string | null;
    isAuthenticated: boolean;
    createdAt: Date | null;
    login: (email: string, password: string) => Promise<LoginResponse>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    loading: boolean;
}
