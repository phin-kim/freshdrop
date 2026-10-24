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
        image: string;
    };
}
export interface OrderFinancialData {
    additionalDistanceFee: number | string;
    baseDeliveryFee: number | string;
    commissionRate: number;
    createdAt: Date | string;
    deliveryFee: number | string;
    distanceKm: number;
    id: string;
    orderId: string;
    platformCommission: string | number;
    platformTotal: string | number;
    riderPayout: string | number;
    serviceFee: string | number;
    subtotal: string | number;
    totalAmount: string | number;
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
    financials: OrderFinancialData;
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
