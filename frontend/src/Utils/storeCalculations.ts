import axios from 'axios';

import type { AddressDetails } from '../Store/addressStore';
import createClientLogger from './clientLogger';

const log = createClientLogger('StoreEstimates.ts');
export const MACHAKOS_STORES = {
    QUICKMART: { id: 'QUICKMART', lng: 37.2634, lat: -1.5177 },
    NAIVAS: { id: 'NAIVAS', lng: 37.2621, lat: -1.5205 },
    OPEN_MARKET: { id: 'OPEN_MARKET', lng: 37.2658, lat: -1.5192 },
} as const;

export type StoreId = keyof typeof MACHAKOS_STORES;
/**
 * Mapbox returns null (not undefined) for unreachable pairs. ?? handles null, fine. But if data.durations[index] itself is missing, you'll throw before reaching ??. Guard it:
 */
export interface StoreDeliveryEstimate {
    storeId: StoreId;
    distanceKm: number;
    durationMins: number;
    deliveryTimeWindow: string;
}
const MAPBOX_ACCESS_TOKEN =
    'pk.eyJ1IjoicGhpbmtpbSIsImEiOiJjbXB5em5lM2IwMDNiMnFwa2tsdGczejRoIn0.dx7X6_8GHSycsoYSJwmlfw';
export async function fetchMachakosDeliveryTimes(
    userLng: number,
    userLat: number
): Promise<Record<StoreId, StoreDeliveryEstimate>> {
    const origins = [
        `${MACHAKOS_STORES.QUICKMART.lng},${MACHAKOS_STORES.QUICKMART.lat}`,
        `${MACHAKOS_STORES.NAIVAS.lng},${MACHAKOS_STORES.NAIVAS.lat}`,
        `${MACHAKOS_STORES.OPEN_MARKET.lng},${MACHAKOS_STORES.OPEN_MARKET.lat}`,
    ].join(';');

    const destination = `${userLng},${userLat}`;
    const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${origins};${destination}?sources=0;1;2&destinations=3&annotations=distance,duration&access_token=${MAPBOX_ACCESS_TOKEN}`;
    try {
        const response = await axios.get(url);
        const data = response.data;
        const storeKeys: StoreId[] = ['QUICKMART', 'NAIVAS', 'OPEN_MARKET'];

        const prepBuffers: Record<StoreId, number> = {
            QUICKMART: 15,
            NAIVAS: 20,
            OPEN_MARKET: 5,
        };
        const estimates = {} as Record<StoreId, StoreDeliveryEstimate>;
        storeKeys.forEach((storeId, index) => {
            const driveSeconds = data?.durations[index]?.[0] ?? 600;
            const distanceMeters = data?.distances[index]?.[0] ?? 3000;
            const driveMins = Math.ceil(driveSeconds / 60);
            const prepBuffer = prepBuffers[storeId];
            const minTime = driveMins + prepBuffer;
            const maxTime = minTime + 10;
            estimates[storeId] = {
                storeId,
                distanceKm: parseFloat((distanceMeters / 1000).toFixed(1)),
                durationMins: driveMins,
                deliveryTimeWindow: `${minTime}-${maxTime} mins`,
            };
        });
        return estimates;
    } catch (error) {
        log.error('Error fetching mapbox delivery information', {
            data: error,
        });
        return {
            QUICKMART: {
                storeId: 'QUICKMART',
                distanceKm: 2.1,
                durationMins: 10,
                deliveryTimeWindow: '15-25 mins',
            },
            NAIVAS: {
                storeId: 'NAIVAS',
                distanceKm: 2.5,
                durationMins: 12,
                deliveryTimeWindow: '25-35 mins',
            },
            OPEN_MARKET: {
                storeId: 'OPEN_MARKET',
                distanceKm: 2.0,
                durationMins: 10,
                deliveryTimeWindow: '20-30 mins',
            },
        };
    }
}
// Update with your actual import path

export function normalizeAddressCoordinates(
    address?: Partial<AddressDetails | null>
): { latitude: number; longitude: number } | undefined {
    if (!address) return undefined;

    const latitude = address.customerLatitude;
    const longitude = address.customerLongitude;

    if (typeof latitude === 'number' && typeof longitude === 'number') {
        return { latitude, longitude };
    }
    return undefined;
}
/*export function coordsToLatLng(
    coords?: Coordinates | null
): { latitude: number; longitude: number } | undefined {
    if (!coords) return undefined;
    return { latitude: coords.latitude, longitude: coords.longitude };
}*/
