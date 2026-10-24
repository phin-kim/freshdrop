import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Product } from '../../../shared/sharedTypes';
import { ticketApi, userApi } from '../Library/api';
import useErrorStore from '../Store/errorStore';
import useSuccessStore from '../Store/successStore';
import handleApiError from '../Utils/apiError';
import { authClient } from '../lib/auth-client';

interface UpdateProfilePayload {
    nameInput?: string;
    emailInput?: string;
    currentEmail?: string; // Add this field to track what's currently in the DB
}

export function useUserSession() {
    return useQuery({
        queryKey: ['user-session'],
        queryFn: async () => {
            const session = await authClient.getSession();
            // 1. Check if Better Auth returned a request error
            if (session.error) {
                throw new Error(
                    session.error.message || 'Failed to fetch session'
                );
            }
            return session.data?.user || null;
        },
        staleTime: 1000 * 60 * 5, //5 mins
    });
}
export function useProducts() {
    return useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data } = await userApi.get<Product[]>('/products');
            return data;
        },
        // Keep your distinct layout configs right here
        staleTime: 1000 * 60 * 60 * 24, // 24-Hour deep cache strategy
        refetchInterval: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
}
export function useUpdateAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            const { data } = await userApi.post<{ url: string }>(
                '/user/upload-image',
                formData
            );

            await authClient.updateUser({ image: data.url });
            return data.url;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-session'] });
            queryClient.invalidateQueries({ queryKey: ['rider-dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['admin-riders'] });
        },
    });
}

export function useUpdateProfileInfo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: UpdateProfilePayload) => {
            // 1. Only run name update if the string has content
            if (payload.nameInput && payload.nameInput.trim() !== '') {
                const nameResponse = await authClient.updateUser({
                    name: payload.nameInput,
                });
                if (nameResponse.error) {
                    throw new Error(
                        nameResponse.error.message || 'Failed to update name'
                    );
                }
            }

            // 2. Only run change-email if it's a completely NEW email address
            const hasEmailChanged =
                payload.emailInput &&
                payload.emailInput.trim() !== '' &&
                payload.emailInput !== payload.currentEmail;

            if (hasEmailChanged) {
                const emailResponse = await authClient.changeEmail({
                    newEmail: payload.emailInput!,
                });
                if (emailResponse.error) {
                    throw new Error(
                        emailResponse.error.message || 'Failed to update email'
                    );
                }
            }

            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-session'] });
        },
    });
}

export function useUpdateTickets() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            ticketId,
            activeTab,
            fullName,
            message,
            email,
        }: {
            ticketId: string;
            activeTab: string;
            fullName: string;
            message: string;
            email: string;
        }) => {
            await ticketApi.post('/ticket/send', {
                ticketId,
                ticketClass: activeTab,
                fullName: fullName,
                message,
                email: email,
                status: 'PENDING',
                priority:
                    activeTab === 'COMPLAINT'
                        ? 'HIGH'
                        : activeTab === 'REQUEST'
                          ? 'MEDIUM'
                          : 'LOW',
                createdAt: new Date().toISOString(),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
            useSuccessStore.setState({
                success: 'Ticket submitted successfully',
            });
        },
        onError: (error) => {
            const setError = useErrorStore.getState().setError;
            handleApiError(error, setError);
        },
    });
}
