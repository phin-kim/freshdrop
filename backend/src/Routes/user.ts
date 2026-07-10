import { Router } from 'express';
import multer from 'multer';

import { BASE_DELIVERY_FEE, PER_KM_RATE } from '../../../shared/constants';
import { prisma } from '../Config/DB.js';
import { fetchUserProducts } from '../Controllers/userProducts';
import { uploadImage } from '../Controllers/userProfileChange';
import asyncHandler from '../Middleware/asyncHandler';
import authenticate from '../Middleware/authenticate';
import { getDrivingDistance } from '../Services/mapboxService.js';
import type { AuthenticatedRequest } from '../Types/auth';
import AppError from '../Utils/appError';
import createLogger from '../Utils/logger.js';

const upload = multer({ storage: multer.memoryStorage() });
const log = createLogger('User.ts');
export const userRoute: Router = Router();
userRoute.post(
    '/delivery/estimate',
    authenticate,
    asyncHandler(async (req, res) => {
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
        const operationalHub = await prisma.supplier.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
        });
        if (!operationalHub) {
            throw AppError.serviceUnavailable(
                'Freshdrop distribution hubs are currently unavailable'
            );
        }
        const supplierCoordinates: [number, number] = [
            operationalHub?.longitude,
            operationalHub?.latitude,
        ];
        const customerCoordinates: [number, number] = [
            coordinates.lng,
            coordinates.lat,
        ];
        const distanceKm = await getDrivingDistance(
            supplierCoordinates,
            customerCoordinates
        );
        let calculatedDeliveryFee = BASE_DELIVERY_FEE;
        if (distanceKm > 2) {
            calculatedDeliveryFee += (distanceKm - 2) * PER_KM_RATE;
        }
        const [lat, lng] = customerCoordinates;
        const customerLatitude = lat;
        const customerLongitude = lng;
        await prisma.savedAddress.create({
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

        res.status(201).json({
            success: true,
            message: 'User delivery location saved successfully',
            deliverySummary: {
                distanceKm,
                deliveryFee: calculatedDeliveryFee,
            },
        });
    })
);
userRoute.get('/products', authenticate, asyncHandler(fetchUserProducts));
userRoute.post(
    '/upload-image',
    authenticate,
    upload.single('file'),
    asyncHandler(uploadImage)
);
