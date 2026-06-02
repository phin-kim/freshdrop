export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt: string;
}

export interface AuthState {
    displayName: string;
    user: User | null;
    email: string | null;
    accessToken?: string | null;
    isAuthenticated: boolean;
    createdAt: Date | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    loading: boolean;
}
