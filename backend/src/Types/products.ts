import type { CartItem } from '../../../shared/sharedTypes.js';

export interface CheckoutRequestBody {
    phoneNumber: string;
    items: CartItem[];
    idempotentKey?: string;
    //macro location
    apartmentName: string;
    customerCoordinates: {
        lat: number;
        lng: number;
    };
    deliveryDestination: string;
    deliveryFee: number;
    distanceKm: number;
    //micro location details
    buildingDetails: string;
    houseNumber: string;
    landmark?: string;
    unavailableAction: 'refund' | 'replace';
}
