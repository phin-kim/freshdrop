import type { OrderStatus } from '../../../shared/sharedTypes';

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    quantity: number;
    priceAtPurchase: number | string;
    isAvailable: boolean;
}

export interface Order {
    id: string;
    userId: string;
    reference: string;
    courierTelegramId?: string | null;
    courierName?: string | null;
    destinationLabel?: string | null;
    deliveryDestination: string;
    deliveryPin: string;
    apartmentName: string;
    houseNumber: string;
    landmark?: string | null;
    customerLatitude: number;
    customerLongitude: number;
    subtotal: number | string;
    serviceFee: number | string;
    deliveryFee: number | string;
    totalAmount: number | string;
    status: OrderStatus;
    createdAt: string | Date;
    updatedAt: string | Date;
    items: OrderItem[];
}
