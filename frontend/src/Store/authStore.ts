import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthState } from '../Types/AuthTypes';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';
import { authClient } from '../lib/auth-client';
import useErrorStore from './errorStore';
import useSuccessStore from './successStore';

const log = createClientLogger('Authstore.ts');

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            loading: false,
            createdAt: null,
            signup: async (name, email, password) => {
                set({ loading: true });
                log.debug(`The password ${password} the email ${email}`);

                try {
                    log.debug(
                        `Sending email ${email} sending password ${password}`
                    );

                    const { error } = await authClient.signUp.email({
                        name,
                        email,
                        password,
                        callbackURL: 'http://localhost:5173/',
                    });
                    if (error) {
                        const { setError } = useErrorStore.getState();
                        const errorMessage =
                            error.message ||
                            'Error in signup. Please try again';
                        switch (error.code) {
                            case 'USER_ALREADY_EXISTS':
                                setError(
                                    'An account with this email already exists'
                                );
                                break;
                            case 'PASSWORD_TOO_SHORT':
                                setError(
                                    'Password must be at least 8 characters'
                                );
                                break;
                            default:
                                log.error('error in sign up', {
                                    data: { error },
                                });

                                setError(errorMessage);
                        }
                        log.error('Error in registering new user', {
                            data: { error },
                        });
                        handleApiError(error, setError);
                        set({ isAuthenticated: false });
                        return; // Stop execution - don't set success state
                    }
                    /*set({
                       user
                        accessToken: data?.token,
                        createdAt: data?.user?.createdAt,
                        isAuthenticated: true,
                    });*/
                    useSuccessStore.setState({
                        success: 'Sign up successful',
                    });
                } catch (error) {
                    log.error('Error in registering new user', {
                        data: { error },
                    });
                    const { setError } = useErrorStore.getState();
                    handleApiError(error, setError);
                    set({ isAuthenticated: false });
                } finally {
                    set({ loading: false });
                }
            },
            login: async (email, password) => {
                set({ loading: true });
                log.debug(`The password ${password} the email ${email}`);
                try {
                    const { data, error } = await authClient.signIn.email({
                        email,
                        password,
                        rememberMe: true,
                        callbackURL: 'http://localhost:5173/',
                    });
                    if (error) {
                        const { setError } = useErrorStore.getState();
                        const errorMessage =
                            error.message || 'Error in login. Please try again';
                        switch (error.code) {
                            case 'USER_ALREADY_EXISTS':
                                setError(
                                    'An account with this email already exists'
                                );
                                break;
                            case 'PASSWORD_TOO_SHORT':
                                setError(
                                    'Password must be at least 8 characters'
                                );
                                break;
                            default:
                                log.error('Error in login in user', {
                                    data: { error },
                                });

                                setError(errorMessage);
                        }
                        log.error('Error in Login in  user', {
                            data: { error },
                        });
                        handleApiError(error, setError);
                        set({ isAuthenticated: false });
                        return; // Stop execution - don't set success state
                    }
                    set({
                        user: data?.user,
                        accessToken: data?.token,
                        createdAt: data?.user?.createdAt,

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
                await authClient.signOut();
                log.warn('User is logged out ');
                set({ isAuthenticated: false });
            },
            deleteAccount: async () => {
                log.warn('The user has deleted the account ');
            },
        }),
        {
            name: 'freshdrop_auth',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                user: state.user,
            }),
        }
    )
);
