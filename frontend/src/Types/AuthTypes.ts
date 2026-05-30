export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  session: { id: string; expiresAt: string } | null;
  loading: boolean;
}