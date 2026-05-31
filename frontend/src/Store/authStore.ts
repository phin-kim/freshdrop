import { create } from 'zustand';

import { authApi } from '../Library/api';
import { AuthState } from '../Types/AuthTypes';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';
import useErrorStore from './errorStore';
import useSuccessStore from './successStore';

const log = createClientLogger('Authstore.ts');

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    loading: false,
    createAt: null,
    signup: async (email, password) => {
        set({ loading: true });
        try {
            const res = await authApi.post('/auth/signup', { email, password });
            set({
                user: res.data.user,
                accessToken: res.data.accessToken,
                createAt: res.data.createAt,
                isAuthenticated: true,
            });
            useSuccessStore.setState({
                success: 'Sign up successful',
            });
        } catch (error) {
            log.error('Error in registering new user', { data: { error } });
            const { setError } = useErrorStore.getState();
            handleApiError(error, setError);
            set({ isAuthenticated: false });
        } finally {
            set({ loading: false });
        }
    },
    login: async (email, password) => {
        set({ loading: true });
        try {
            const res = await authApi.post('/auth/login', { email, password });
            set({
                user: res.data.user,
                accessToken: res.data.accessToken,
                createAt: res.data.createAt,
                isAuthenticated: true,
            });
            useSuccessStore.setState({
                success: 'Login successful',
            });
        } catch (error) {
            log.error('Error in login in  user', { data: { error } });
            const { setError } = useErrorStore.getState();
            handleApiError(error, setError);
            set({ isAuthenticated: false });
        } finally {
            set({ loading: false });
        }
    },
    logout: async () => {
        log.warn('User has logged out');
    },
    deleteAccount: async () => {
        log.warn('The user has deleted the account ');
    },
}));
