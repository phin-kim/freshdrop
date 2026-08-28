import { useMutation, useQueryClient } from '@tanstack/react-query';

import { hubSlug } from '../../../shared/constants';
import type { Product } from '../../../shared/sharedTypes';
import { adminAPI } from '../Library/api';
import useErrorStore from '../Store/errorStore';
import useSuccessStore from '../Store/successStore';
import type { RiderFormState, RiderStatus } from '../Types/Riders';
import type { TicketStatus } from '../Types/Tickets';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';

const log = createClientLogger('AdminSynch.tsx');

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
//INVENTORY
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
export function useToggleInventoryStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            product,
            backendEnumStatus,
        }: {
            product: Product;
            backendEnumStatus: 'IN_STOCK' | 'OUT_OF_STOCK';
        }) => {
            await adminAPI.post('/admin/products/toggle-status', {
                sku: product.sku,
                hubSlug: hubSlug,
                status: backendEnumStatus,
            });
        },
        onSuccess: (_data, { product }) => {
            queryClient.invalidateQueries({
                queryKey: ['admin-products'],
            });
            const setSuccess = useSuccessStore.getState().setSuccess;
            setSuccess(
                `Stock status for "${product.name}" updated to ${product.inStock ? 'OUT OF STOCK' : 'IN STOCK'}.`
            );
        },
        onError: (error) => {
            const setError = useErrorStore.getState().setError;
            log.error('Error creating new rider', { data: { error } });
            handleApiError(error, setError);
        },
    });
}
export function useDeleteInventory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            productId,
        }: {
            productId: string;
            productName: string;
        }) => {
            await adminAPI.delete(`/admin/products/${productId}`);
        },
        onSuccess: (_data, { productName }) => {
            queryClient.invalidateQueries({
                queryKey: ['admin-products'],
            });
            const setSuccess = useSuccessStore.getState().setSuccess;
            setSuccess(`${productName} successfully deleted `);
        },
        onError: (error) => {
            const setError = useErrorStore.getState().setError;
            log.error('Error deleting inventory item', { data: { error } });
            handleApiError(error, setError);
        },
    });
}
//TICKETS
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
//RIDERS
export function useCreateRider() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            name,
            phoneNumber,
            email,
            vehicleType,
            vehiclePlate,
            dispatchHub,
            status,
            rating,
        }: RiderFormState) => {
            await adminAPI.post('/admin/riders/create', {
                name: name.trim(),
                phoneNumber: phoneNumber.trim(),
                email: email.trim(),
                vehicleType: vehicleType,
                vehiclePlate: vehiclePlate.trim(),
                dispatchHub: dispatchHub.trim(),
                status: status,
                rating: Number(rating) || 5,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin-riders'],
            });
            const setSuccess = useSuccessStore.getState().setSuccess;
            setSuccess('Rider added successfully');
        },
        onError: (error) => {
            const setError = useErrorStore.getState().setError;
            log.error('Error creating new rider', { data: { error } });
            handleApiError(error, setError);
        },
    });
}
export function useUpdateRider() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            name,
            phoneNumber,
            vehicleType,
            vehiclePlate,
            dispatchHub,
            status,
            rating,
            riderId,
        }: RiderFormState & { riderId: string }) => {
            await adminAPI.patch(`/admin/riders/update/${riderId}`, {
                name: name.trim(),
                phoneNumber: phoneNumber.trim(),
                vehicleType: vehicleType,
                vehiclePlate: vehiclePlate.trim(),
                dispatchHub: dispatchHub.trim(),
                status: status,
                rating: Number(rating) || 5,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin-riders'],
            });
            queryClient.invalidateQueries({
                queryKey: ['rider-dashboard'],
            });
            const setSuccess = useSuccessStore.getState().setSuccess;
            setSuccess('Rider updated successfully');
        },
        onError: (error) => {
            const setError = useErrorStore.getState().setError;
            log.error('Error updating  rider', { data: { error } });
            handleApiError(error, setError);
        },
    });
}
export function useToggleRiderStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            riderId,
            nextStatus,
        }: {
            riderId: string;
            nextStatus: RiderStatus;
        }) => {
            await adminAPI.patch(`/admin/riders/update/${riderId}`, {
                status: nextStatus,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin-riders'],
            });
            const setSuccess = useSuccessStore.getState().setSuccess;
            setSuccess('Rider status changed successfully');
        },
        onError: (error) => {
            const setError = useErrorStore.getState().setError;
            log.error('Error updating rider status', { data: { error } });
            handleApiError(error, setError);
        },
    });
}
export function useDeleteRider() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ riderId }: { riderId: string }) => {
            await adminAPI.delete(`/admin/riders/delete/${riderId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin-riders'],
            });
            const setSuccess = useSuccessStore.getState().setSuccess;
            setSuccess('Rider deleted successfully');
        },
        onError: (error) => {
            const setError = useErrorStore.getState().setError;
            log.error('Error deleting  rider', { data: { error } });
            handleApiError(error, setError);
        },
    });
}
