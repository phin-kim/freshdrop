export type RiderStatus = 'AVAILABLE' | 'ON_DELIVERY' | 'ON_BREAK' | 'OFFLINE';
export interface Rider {
    id: string;
    name: string;
    phoneNumber: string;
    email?: string | null;
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
    phoneNumber: string;
    vehicleType: string;
    vehiclePlate: string;
    dispatchHub: string;
    status: RiderStatus;
    rating: number;
}
