import axios from 'axios';

import AppError from '../Utils/appError';
import createLogger from '../Utils/logger.js';

const log = createLogger('Mapboxservices.ts');
interface MapboxDirectionResponse {
    routes: Array<{
        distance: number; //in meters
        duration: number; //in seconds
    }>;
}
export async function getDrivingDistance(
    supplierCoords: [number, number],
    customerCoords: [number, number]
): Promise<number> {
    const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
    if (!MAPBOX_TOKEN) {
        log.error('The mapbox token is missing');
        throw AppError.serviceUnavailable(
            'Service is unavailable at the moment.Kindly try again later'
        );
    }
    if (!supplierCoords || !customerCoords) {
        console.error(
            '❌ CRITICAL: One or more coordinates passed to Mapbox are invalid:',
            {
                supplierCoords,
                customerCoords,
            }
        );
        throw AppError.badRequest('Invalid coordinate parameters.');
    }

    // Mapbox strictly requires: longitude,latitude

    const coordinatesString = `${supplierCoords[0]},${supplierCoords[1]};${customerCoords[0]},${customerCoords[1]}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?overview=false&access_token=${MAPBOX_TOKEN}`;
    try {
        const response = await axios.get(url);
        const data = response.data as MapboxDirectionResponse;
        if (!data.routes || data.routes.length === 0) {
            throw AppError.badRequest(
                'No drivable road options found for this destination'
            );
        }
        log.info('This is the data format returned from the mapbox api', {
            data: { data },
        });
        const distanceInKm = data.routes[0].distance / 1000;
        return Math.round(distanceInKm * 100) / 100;
    } catch (error) {
        let message = 'Failed to determine the accurate distance';
        let statusCode = 500;
        let errorData = undefined;
        if (axios.isAxiosError(error)) {
            message = error?.response?.data?.message || error?.message;
            statusCode = error.response?.status || 500;
            errorData = error?.response?.data;
        }
        log.error('Failed to fetch distance  status', {
            data: { statusCode, message, errorData },
        });
        throw AppError.serviceUnavailable('Error identifying the distance');
    }
}
