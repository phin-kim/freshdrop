import { useMutation, useQueryClient } from '@tanstack/react-query';

import { riderApi } from '../Library/api';
import useErrorStore from '../Store/errorStore';
import useSuccessStore from '../Store/successStore';
import type { RiderStatus } from '../Types/Riders';
import handleApiError from '../Utils/apiError';

export type SelfServiceRiderStatus = Exclude<RiderStatus, 'ON_DELIVERY'>;
export function useUpdateOwnRiderStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (status: SelfServiceRiderStatus) => {
            const response = await riderApi.patch('/rider/status', {
                status,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['rider-dashboard'],
            });
        },
        onError: (error) => {
            const setError = useErrorStore.getState().setError;
            handleApiError(error, setError);
        },
    });
}
export function useActivateAccount() {
    return useMutation({
        mutationFn: async ({
            token,
            password,
            confirmPassword,
        }: {
            token: string;
            password: string;
            confirmPassword: string;
        }) => {
            if (!token) {
                throw new Error('Activation token is missing');
            }

            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            const response = await riderApi.post('/rider/activate', {
                token,
                password,
            });

            return response.data;
        },
    });
}
export function useMissingItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            orderId,
            itemId,
        }: {
            orderId: string;
            itemId: string;
        }) => {
            const response = await riderApi.patch(
                `/rider/orders/${orderId}/items/${itemId}/unavailable`
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin-products'],
            });
            const setSuccess = useSuccessStore.getState().setSuccess;
            setSuccess('Successfully marked item to missing');
        },
        onError: (error) => {
            const setError = useErrorStore.getState().setError;
            handleApiError(error, setError);
        },
    });
}
