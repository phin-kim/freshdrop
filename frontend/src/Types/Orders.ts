import type { OrderStatus } from '../../../shared/sharedTypes';
import type { Rider } from './Riders';

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    quantity: number;
    priceAtPurchase: number | string;
    isAvailable: boolean;
    product?: {
        id: string;
        images: string[];
    };
}

export interface Order {
    id: string;
    userId: string;
    reference: string;

    // Delivery & Address Details
    deliveryPin: string;
    destinationLabel?: string | null;
    deliveryDestination: string;
    apartmentName: string;
    houseNumber: string;
    landmark?: string | null;
    customerLatitude: number;
    customerLongitude: number;

    // Financial Breakdown
    subtotal: number | string;
    serviceFee: number | string;
    deliveryFee: number | string;
    totalAmount: number | string;
    status: OrderStatus;

    // Timestamps
    completedAt?: string | Date | null;
    createdAt: string | Date;
    updatedAt: string | Date;

    // Relations
    items: OrderItem[];
    //payments?: PaymentTransaction[];

    // Rider Relation
    riderId?: string | null;
    rider?: Rider | null;

    // Legacy fallback fields (optional for backwards compatibility)
    courierTelegramId?: string | null;
    courierName?: string | null;
}
