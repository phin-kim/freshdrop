import { CheckCircle2, Clock, Radio, Truck, XCircle } from 'lucide-react';

import type { OrderStatus } from '../../../shared/sharedTypes';
import { adminAPI } from '../Library/api';
import type { RiderFormState, RiderStatus } from '../Types/Riders';

export const getStageBadge = (status?: OrderStatus) => {
    switch (status) {
        case 'PENDING':
            return {
                label: 'Pending Payment',
                bg: 'bg-stone-100 text-stone-700 border-stone-200',
                icon: Clock,
            };
        case 'PAID':
            return {
                label: 'Placed / Awaiting Dispatch',
                bg: 'bg-amber-100 text-amber-800 border-amber-200',
                icon: Clock,
            };
        case 'ASSIGNED':
            return {
                label: 'Assigned to Courier',
                bg: 'bg-blue-100 text-blue-800 border-blue-200',
                icon: Truck,
            };
        case 'PICKED_UP':
            return {
                label: 'Out for Delivery',
                bg: 'bg-purple-100 text-purple-800 border-purple-200',
                icon: Radio,
            };
        case 'DELIVERY_COMPLETED':
            return {
                label: 'Delivered to Customer',
                bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                icon: CheckCircle2,
            };
        case 'CANCELLED':
            return {
                label: 'Cancelled',
                bg: 'bg-rose-100 text-rose-800 border-rose-200',
                icon: XCircle,
            };
        default:
            return {
                label: 'Processing',
                bg: 'bg-stone-100 text-stone-700 border-stone-200',
                icon: Clock,
            };
    }
};

// Progression logic mapped to database ORDER_STATUS
export const getNextStage = (current?: OrderStatus): OrderStatus | null => {
    if (current === 'PAID') return 'ASSIGNED';
    if (current === 'ASSIGNED') return 'PICKED_UP';
    if (current === 'PICKED_UP') return 'DELIVERY_COMPLETED';
    return null;
};
export const fetchAdminPageProducts = async (
    page: number,
    limit: number,
    category: string
) => {
    const categoryParam =
        category !== 'All Items' ? `&category=${category}` : '';
    const url = `/admin/products?page=${page}&limit=${limit}${categoryParam}`;
    const res = await adminAPI.get(url);
    return res.data; // Returns: { data: [...], meta: { totalPages: X, totalCount: Y } }
};
export const statusLabelMap: Record<RiderStatus, string> = {
    AVAILABLE: 'Available',
    ON_DELIVERY: 'On Delivery',
    ON_BREAK: 'On Break',
    OFFLINE: 'Offline',
};

export const statusOptions: Array<{ value: RiderStatus; label: string }> = [
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'ON_DELIVERY', label: 'On Delivery' },
    { value: 'ON_BREAK', label: 'On Break' },
    { value: 'OFFLINE', label: 'Offline' },
];

export const createDefaultRiderForm = (): RiderFormState => ({
    name: '',
    phoneNumber: '+254',
    vehicleType: 'Electric Van',
    vehiclePlate: '',
    dispatchHub: 'Juja Central Hub',
    status: 'AVAILABLE',
    rating: 5,
});
