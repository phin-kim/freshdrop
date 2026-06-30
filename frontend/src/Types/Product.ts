import type { CartItem } from '../../../shared/sharedTypes';

export interface Order {
    id: string;
    items: CartItem[];
    subtotal: number;
    serviceCharge: number;
    total: number;
    paymentMethod: 'Payhero M-PESA' | 'Payhero Card';
    paymentPhone?: string;
    shippingAddress: string;
    status: 'Completed' | 'Pending' | 'Failed';
    createdAt: string;
}
