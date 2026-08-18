//import { RiderStatus } from '@generated/prisma/enums.js';
import type { Request, Response } from 'express';

import { prisma } from '../../Config/DB.js';
import AppError from '../../Utils/appError.js';
import createLogger from '../../Utils/logger.js';

const log = createLogger('Riders.ts');
type RiderStatus = 'AVAILABLE' | 'ON_DELIVERY' | 'ON_BREAK' | 'OFFLINE';
interface RiderInput {
    name: string;
    phoneNumber: string;
    vehicleType?: string;
    vehiclePlate?: string;
    dispatchHub?: string;
    status?: RiderStatus;
    rating?: number;
}
//REGISTER NEW COURIER
export async function createRider(
    req: Request,
    res: Response
): Promise<Response> {
    const {
        name,
        phoneNumber,
        vehicleType,
        vehiclePlate,
        dispatchHub,
        status,
        rating,
    }: RiderInput = req.body;
    try {
        if (!name || !phoneNumber) {
            throw AppError.badRequest(
                'Name and phoneNumber number are required'
            );
        }
        const existingRider = await prisma.rider.findUnique({
            where: { phoneNumber },
        });
        if (existingRider) {
            throw AppError.conflict(
                'A courier with this phoneNumber number already exists'
            );
        }
        const rider = await prisma.rider.create({
            data: {
                name,
                phoneNumber,
                vehicleType,
                vehiclePlate: vehiclePlate ?? '',
                dispatchHub,
                status: status ?? 'AVAILABLE',
                rating: rating !== undefined ? Number(rating) : 5.0,
            },
        });
        log.highlight(`New courier added : ${rider.name} (${rider.id})}`);
        return res.status(201).json({
            success: true,
            message: 'Courier created successfully',
            rider,
        });
    } catch (error) {
        const msg =
            error instanceof Error
                ? error.message
                : 'Unknown payment routing fault ';
        log.error(`Failed to register courier: ${msg}`);
        log.error('Error form ', { data: { error } });
        throw AppError.database('Internal server ');
    }
}
//EDIT COURIER
export async function updateRider(
    req: Request,
    res: Response
): Promise<Response> {
    const id = req.params.id as string;
    const {
        name,
        phoneNumber,
        vehicleType,
        vehiclePlate,
        dispatchHub,
        status,
        rating,
    }: Partial<RiderInput> = req.body;
    try {
        const existingRider = await prisma.rider.findFirst({
            where: {
                id,
                isDeleted: false,
            },
        });
        if (!existingRider) {
            throw AppError.notFound('Courier not found');
        }
        if (phoneNumber && phoneNumber !== existingRider.phoneNumber) {
            const phoneNumberTaken = await prisma.rider.findUnique({
                where: { phoneNumber },
            });
            if (phoneNumberTaken) {
                throw AppError.conflict(
                    'PhoneNumber number is already in use by another courier'
                );
            }
        }
        const updatedRider = await prisma.rider.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(phoneNumber && { phoneNumber }),
                ...(vehicleType !== undefined && { vehicleType }),
                ...(vehiclePlate !== undefined && { vehiclePlate }),
                ...(dispatchHub !== undefined && { dispatchHub }),
                ...(status && { status }),
                ...(rating !== undefined && { rating: Number(rating) }),
            },
        });
        log.highlight(
            `Updated courier: ${updatedRider.name} (${updatedRider.id})`
        );

        return res.status(200).json({
            success: true,
            message: 'Courier updated successfully',
            updatedRider,
        });
    } catch (error) {
        const msg =
            error instanceof Error
                ? error.message
                : 'Unknown payment routing fault ';
        log.error(`Failed to update courier: ${msg}`);
        log.error('Error form ', { data: { error } });
        throw AppError.database('Internal server ');
    }
}

//SOFT DELETE
export async function softDeleteRiders(
    req: Request,
    res: Response
): Promise<Response> {
    const id = req.params.id as string;
    try {
        const existingRider = await prisma.rider.findFirst({
            where: { id, isDeleted: false },
        });
        if (!existingRider) {
            throw AppError.notFound('Rider not found or already deleted');
        }
        await prisma.rider.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                status: 'OFFLINE',
            },
        });
        log.warn(`Soft-deleted courier: ${existingRider.name} (${id})`);

        return res.status(200).json({
            success: true,
            message: 'Courier deleted successfully',
        });
    } catch (error) {
        const msg =
            error instanceof Error
                ? error.message
                : 'Unknown payment routing fault ';
        log.error(`Failed to delete courier: ${msg}`);
        log.error('Error form ', { data: { error } });
        throw AppError.database('Internal server ');
    }
}
export async function getAllRiders(
    _req: Request,
    res: Response
): Promise<Response> {
    try {
        const rawRiders = await prisma.rider.findMany({
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            include: {
                orders: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });

        // 2. Compute dynamic stats (Today's drops vs All-time delivered drops) for each rider
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const riders = rawRiders.map((rider) => {
            const allTimeDrops = rider.orders.filter(
                (o) => o.status === 'DELIVERY_COMPLETED'
            ).length;

            const todayDrops = rider.orders.filter(
                (o) =>
                    o.status === 'DELIVERY_COMPLETED' &&
                    new Date(o.createdAt) >= todayStart
            ).length;

            // Strip the raw orders array if you don't want to send heavy data,
            // or keep it if your frontend needs the order objects.
            return {
                ...rider,
                stats: {
                    todayDrops,
                    allTimeDrops,
                },
            };
        });
        const riderNo = await prisma.rider.count({
            where: { isDeleted: false },
        });
        const ridersDeleted = await prisma.rider.count({
            where: { isDeleted: true },
        });
        return res.status(200).json({
            success: true,
            riders,
            riderNo,
            ridersDeleted,
        });
    } catch (error) {
        const msg =
            error instanceof Error
                ? error.message
                : 'Unknown payment routing fault ';
        log.error(`Failed to fetch couriers: ${msg}`);
        log.error('Error form ', { data: { error } });
        throw AppError.database('Internal server ');
    }
}
