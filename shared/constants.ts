import type { OrderStatus } from './sharedTypes';

export const BASE_DELIVERY_FEE = 1; //flat charge up to 2km change back to 50
export const PER_KM_RATE = 25; //per additional k to handle for fuel/electricity  cost
export const STRATEGY_SERVICE_FEE = 1; //change back to 50
// This approximate box covers the broader Nairobi - Machakos economic zone
//const OPERATIONAL_BBOX = '36.5400,-1.5600,37.3500,-1.0500';
// Tightly limited to the Nairobi - Juja area
export const OPERATIONAL_BBOX = '36.6800,-1.3800,37.1200,-1.0500';
export const hubSlug = 'juja-market-hub';
export const MULTI_STOP_SURCHARGE = 50.0;
export const ACTIVE_STATUSES: OrderStatus[] = [
    'PENDING',
    'PAID',
    'ASSIGNED',
    'PICKED_UP',
];
