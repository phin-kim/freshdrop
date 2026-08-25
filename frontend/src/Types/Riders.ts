//admin rider data
export type RiderStatus = 'AVAILABLE' | 'ON_DELIVERY' | 'ON_BREAK' | 'OFFLINE';
export interface Rider {
    id: string;
    name: string;
    password?: string;
    phoneNumber: string;
    email: string;
    vehicleType?: string | null;
    vehiclePlate?: string | null;
    status: RiderStatus;
    rating?: number | null;
    isDeleted?: boolean;
    deletedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    userId?: string | null;
    totalDeliveries?: number;
    completedToday?: number;
    currentOrderId?: string | null;
    avatar?: string | null;
    dispatchHub?: string | null;
    stats: {
        todayDrops: number;
        allTimeDrops: number;
    };
}

export interface RiderFormState {
    name: string;
    email: string;
    password?: string;
    phoneNumber: string;
    vehicleType: string;
    vehiclePlate: string;
    dispatchHub: string;
    status: RiderStatus;
    rating: number;
}
import type { OrderStatus } from '../../../shared/sharedTypes';

// rider dashboard side
export interface RiderProfile {
    id: string;
    name: string;
    profilePic: string;
    phoneNumber: string;
    email: string;
    telegramId: string | number;
    vehiclePlate: string;
    vehicleType: string;
    dispatchHub: string;
    status: string;
    rating: number;
}

export interface RiderMetrics {
    todaysEarnings: number;
    todaysDropCount: number;
    avgPerDropToday: number;
    cumulativeEarnings: number;
    lifetimeDropCount: number;
    accountCreatedDate: string | Date;
}

export interface RiderPerformance {
    onTimeRate: number;
    completionRate: number;
    acceptanceRate: number;
    customerSatisfactionRank: string;
}

export interface RiderOrder {
    id: string;
    reference: string;
    deliveryDestination: string;
    apartmentName: string;
    houseNumber: string;
    landmark?: string | null;
    deliveryFee: number | string;
    status: OrderStatus;
    completedAt?: string | Date | null;
    createdAt: string | Date;
    user: {
        id: string;
        name: string | null;
        email: string | null;
    };
    items: {
        id: string;
        productName: string;
        quantity: number;
        priceAtPurchase: number | string;
        product: {
            id: string;
            name: string;
            image: string | null;
            quantityText: string | null;
            basePrice: number | string;
        };
    }[];
    payments: {
        id: string;
        amount: number | string;
        phoneNumber: string | null;
        status: string;
        reference: string;
        completedAt: string | Date | null;
    }[];
}

export interface RiderTabs {
    activeOrders: RiderOrder[];
    availablePool: RiderOrder[];
    completedOrders: RiderOrder[];
}

export interface RiderDashboardData {
    profile: RiderProfile;
    metrics: RiderMetrics;
    performance: RiderPerformance;
    tabs: RiderTabs;
}
export interface RiderDashboardApiResponse {
    success: boolean;
    data: RiderDashboardData;
}
