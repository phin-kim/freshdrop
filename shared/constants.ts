import type { OrderStatus } from './sharedTypes';

//THE LOGIC
/**
 * for the first 1km we charge 100 
 * from 1-3 km, we charge an additional 20 per km so if its 1-2km, delivery fee = 120 if its 2-3km its 140
 * for the > 3 km mark to 5 km, we charge an additional 40 so if its 3-4km, its 180 from 4-5km its 220

 */
//base delivery fee = 100
export const BASE_DELIVERY_FEE = 100; //flat charge up to 2km change back to 50(goes directly to riders pocket)
//export const PER_KM_RATE = 15; //per additional k to handle for fuel/electricity  cost(split between and platform)
export const ONE_TO_THREE_KM_CHARGE = 20; //20
export const THREE_TO_FIVE_KM_CHARGE = 40; //40
export const TWO_STOP_SURCHARGE = 40; //goes to rider and platform 30
export const STRATEGY_SERVICE_FEE = 35; //change back to 35
export const THREE_STOP_SURCHARGE = 60; //goes to rider and platform 60
export const MULTI_STORE_PLATFORM_RATE = 0.3;
export const MULTI_STORE_RIDER_RATE = 0.7;
export const PLATFORM_COMMISSION_RATE = 0.17; //this is charge on any additional fee from the delivery generated from additional km

// This approximate box covers the broader Nairobi - Machakos economic zone
//const OPERATIONAL_BBOX = '36.5400,-1.5600,37.3500,-1.0500';
// Tightly limited to the Nairobi - Juja area
export const OPERATIONAL_BBOX = '36.6800,-1.3800,37.1200,-1.0500';
/*export const hubSlug = 'juja-hub';
export const HUB_SLUG_BY_SOURCING_TYPE = {
    OPEN_MARKET: 'juja-market-hub',
    SUPERMARKET: 'juja-supermarket-hub',
} as const;*/

export const ACTIVE_STATUSES: OrderStatus[] = [
    'PENDING',
    'PAID',
    'ASSIGNED',
    'PICKED_UP',
];

/**
 * 0–2 km: KSh 70–90

2–5 km: KSh 100–150

5+ km: KSh 150–250
 */
