import type { Request, Response } from 'express';

import { BASE_DELIVERY_FEE, PER_KM_RATE } from '../../../../shared/constants';
import { prisma } from '../../Config/DB.js';
import { getDrivingDistance } from '../../Services/mapboxService.js';
import type { AuthenticatedRequest } from '../../Types/auth';
import AppError from '../../Utils/appError';
import createLogger from '../../Utils/logger.js';

const log = createLogger('User.ts');

export async function estimateDistance(req: Request, res: Response) {
    const { coordinates, address, deliveryDestination } = req.body;
    log.debug(`this is the body ${JSON.stringify(req.body, null, 2)}`);

    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;

    if (!userId) {
        throw AppError.unauthorized('Unauthorized user');
    }
    if (!coordinates) {
        throw AppError.badRequest('Coordinates are required');
    }
    if (!address) {
        throw AppError.badRequest('Address is required');
    }
    if (!deliveryDestination) {
        throw AppError.badRequest('Delivery destination is required');
    }
    const { houseNumber, apartmentName, landmark } = address;
    const activeHubs = await prisma.hub.findMany({
        where: { isActive: true },
    });
    if (activeHubs.length === 0) {
        throw AppError.serviceUnavailable(
            'Freshdrop distribution hubs are currently unavailable'
        );
    }

    /*const customerCoordinates: [number, number] = [
        coordinates.lng,
        coordinates.lat,
    ];*/
    const customerLatitude = coordinates.lat;
    const customerLongitude = coordinates.lng;
    //atomic transaction where we write both addresses and cache fees safely
    const transactionResult = await prisma.$transaction(async (tx) => {
        const savedAddress = await tx.savedAddress.create({
            data: {
                userId,
                deliveryDestination,
                apartmentName,
                houseNumber,
                landmark,
                customerLatitude,
                customerLongitude,
            },
        });
        const feeRecords = await Promise.all(
            activeHubs.map(async (hub) => {
                const hubCoordinates: [number, number] = [
                    hub.longitude,
                    hub.latitude,
                ];
                const customerCoordinates: [number, number] = [
                    customerLongitude,
                    customerLatitude,
                ];
                const distanceKm = await getDrivingDistance(
                    hubCoordinates,
                    customerCoordinates
                );
                let calculatedDeliveryFee = BASE_DELIVERY_FEE;
                if (distanceKm > 2) {
                    calculatedDeliveryFee += (distanceKm - 2) * PER_KM_RATE;
                }
                return {
                    addressId: savedAddress.id,
                    hubId: hub.id,
                    distanceKm: parseFloat(distanceKm.toFixed(2)),
                    deliveryFee: parseFloat(calculatedDeliveryFee.toFixed(2)),
                    hubName: hub.name, // Passed along for the response payload
                };
            })
        );
        // C. Bulk insert the calculated distances and fees into our cache table
        // We strip out the helper 'hubName' field so it matches the DB schema exactly
        const dbInsertRecords = feeRecords.map((record) => ({
            addressId: record.addressId,
            hubId: record.hubId,
            distanceKm: record.distanceKm,
            deliveryFee: record.deliveryFee,
        }));
        await tx.hubDeliveryFee.createMany({
            data: dbInsertRecords,
        });

        return { savedAddress, feeRecords };
    });
    const { savedAddress, feeRecords } = transactionResult;
    // 3. For backwards compatibility, find the closest hub to populate "deliverySummary"
    const sortedEstimates = [...feeRecords].sort(
        (a, b) => a.distanceKm - b.distanceKm
    );
    const closestEstimate = sortedEstimates[0];

    res.status(201).json({
        success: true,
        message:
            'User delivery location saved and hub fees cached successfully',
        address: savedAddress,
        // Backwards compatible payload for existing frontend screens
        deliverySummary: {
            distanceKm: closestEstimate.distanceKm,
            deliveryFee: closestEstimate.deliveryFee,
        },
        // Comprehensive payloads for your future multi-stop checkout system
        hubEstimates: feeRecords.map((record) => ({
            hubId: record.hubId,
            hubName: record.hubName,
            distanceKm: record.distanceKm,
            deliveryFee: record.deliveryFee,
        })),
    });
    // const distanceKm = await getDrivingDistance(
    //     supplierCoordinates,
    //     customerCoordinates
    // );

    // const [lat, lng] = customerCoordinates;
    // const customerLatitude = lat;
    // const customerLongitude = lng;
}
