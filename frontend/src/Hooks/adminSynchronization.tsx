import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Product } from '../../../shared/sharedTypes';
import { adminAPI } from '../Library/api';
import useErrorStore from '../Store/errorStore';
import useSuccessStore from '../Store/successStore';
import type { TicketStatus } from '../Types/Tickets';
import handleApiError from '../Utils/apiError';

interface UpdateTicketResponse {
    id: string;
    status: TicketStatus;
    adminResponse?: string;
}
interface UpdateInventoryResponse {
    productData: Omit<Product, 'id'>;
    sku: string;
    hubSlug: string;
}
export function useUpdateInventory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            productData,
            sku,
            hubSlug,
        }: UpdateInventoryResponse) => {
            const res = await adminAPI.post('/admin/products/sync', {
                productData: {
                    ...productData,
                    sku: sku,
                },
                hubSlug,
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin-products'],
            });
            const setSuccess = useSuccessStore.getState().setSuccess;
            setSuccess('Synchronized catalog inventory updates');
        },
        onError: (error) => {
            const setError = useErrorStore.getState().setError;
            handleApiError(error, setError);
        },
    });
}
export function useUpdateTicket() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            status,
            adminResponse,
        }: UpdateTicketResponse) => {
            const res = await adminAPI.patch(`/admin/tickets/update/${id}`, {
                status,
                adminResponse,
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
            useSuccessStore.setState({
                success: 'Successfully updated the ticket status',
            });
        },
        onError: () => {
            useErrorStore.setState({
                error: 'Unable to update the status of the ticket',
            });
        },
    });
}
export function useDeleteSupportTicket() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            const res = await adminAPI.delete(`/admin/delete/:${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
            useSuccessStore.setState({
                success: 'Successfully deleted the ticket ',
            });
        },
        onError: () => {
            useErrorStore.setState({
                error: 'Unable to delete the ticket',
            });
        },
    });
}
