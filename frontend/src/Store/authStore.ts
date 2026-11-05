import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthState, LoginResponse } from '../Types/AuthTypes';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';
import { authClient } from '../lib/auth-client';
import useErrorStore from './errorStore';
import { useStore } from './productStore';
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

                try {
                    const { error } = await authClient.signUp.email({
                        name,
                        email,
                        password,
                        callbackURL: '/',
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
                    const { error: otpError } =
                        await authClient.emailOtp.sendVerificationOtp({
                            email: email,
                            type: 'email-verification',
                        });

                    if (otpError) {
                        log.error('Failed to send OTP:', {
                            data: { otpError },
                        });
                        // Even if OTP fails, they are signed up. Let them go to the OTP page
                        // so they can click "Resend".
                    } else {
                        useSuccessStore.setState({
                            success:
                                'Account created! Check your email for the OTP.',
                        });
                    }
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

                try {
                    const response = await authClient.signIn.email({
                        email,
                        password,
                        rememberMe: true,
                        callbackURL: '/',
                    });
                    const { data, error } = response;
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
                        return response; // Stop execution - don't set success state
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
                    return response;
                } catch (error) {
                    log.error('Error in login in  user', { data: { error } });
                    const { setError } = useErrorStore.getState();
                    handleApiError(error, setError);
                    set({ isAuthenticated: false });
                    return {
                        data: null,
                        error:
                            error instanceof Error
                                ? error
                                : new Error('Unknown authentication error'),
                    } as unknown as LoginResponse;
                } finally {
                    set({ loading: false });
                }
            },
            logout: async () => {
                await authClient.signOut();
                log.warn('User is logged out ');
                useStore.getState().clearCart();
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
