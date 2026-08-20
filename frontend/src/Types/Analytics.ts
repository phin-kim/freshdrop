export interface FunnelData {
    pending: number;
    assigned: number;
    pickedUp: number;
    delivered: number;
    totalOrders: number;
}

export interface AnalyticsFinancials {
    totalRevenue: number;
    totalServiceFees: number;
}

export interface CategoryBreakdownItem {
    category: string;
    itemCount: number;
    revenue: number;
    percentage: number;
}

export interface AnalyticsProduct {
    id: string;
    name: string;
    category: string;
    sourcingType: 'OPEN_MARKET' | 'SUPERMARKET';
}

export interface AnalyticsOrderItem {
    id: string;
    productName: string;
    quantity: number;
    priceAtPurchase: number;
    isAvailable: boolean;
    product: AnalyticsProduct;
}

export interface AnalyticsOrderUser {
    id: string;
    name: string;
    email: string;
}

export interface OrderAnalytics {
    id: string;
    reference: string;
    status:
        | 'PENDING'
        | 'PAID'
        | 'ASSIGNED'
        | 'PICKED_UP'
        | 'DELIVERY_COMPLETED'
        | 'CANCELLED';
    totalAmount: number;
    serviceFee: number;
    deliveryFee: number;
    user: AnalyticsOrderUser;
    items: AnalyticsOrderItem[];
    createdAt: string;
}

export interface AnalyticsPayload {
    funnel: FunnelData;
    financials: AnalyticsFinancials;
    categoryBreakdown: CategoryBreakdownItem[];
    orders: OrderAnalytics[];
}

export interface AnalyticsResponse {
    success: boolean;
    message: string;
    data: AnalyticsPayload;
}
