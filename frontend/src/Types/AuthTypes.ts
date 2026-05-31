export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt: string;
}

export interface AuthState {
    user: User | null;
    accessToken?: string | null;
    isAuthenticated: boolean;
    createAt: Date | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    loading: boolean;
}
