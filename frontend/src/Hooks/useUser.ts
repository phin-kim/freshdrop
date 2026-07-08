import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { userApi } from '../Library/api';
import { authClient } from '../lib/auth-client';

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
export function useUpdateAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            const { data } = await userApi.post<{ url: string }>(
                '/api/upload-image',
                formData
            );

            await authClient.updateUser({ image: data.url });
            return data.url;
        },
        onSuccess: () => {
            // Clean invalidation targets only the session key
            queryClient.invalidateQueries({ queryKey: ['user-session'] });
        },
    });
}

interface UpdateProfilePayload {
    nameInput?: string;
    emailInput?: string;
    currentEmail?: string; // Add this field to track what's currently in the DB
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
