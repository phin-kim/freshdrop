import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminAPI } from '../Library/api';
import useErrorStore from '../Store/errorStore';
import useSuccessStore from '../Store/successStore';
import type { TicketStatus } from '../Types/Tickets';

interface UpdateTicketResponse {
    id: string;
    status: TicketStatus;
    adminResponse?: string;
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
