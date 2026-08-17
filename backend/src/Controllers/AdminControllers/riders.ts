import { RiderStatus } from '@generated/prisma/enums.js';
import type { Request, Response } from 'express';

import { prisma } from '../../Config/DB.js';
import AppError from '../../Utils/appError.js';
import createLogger from '../../Utils/logger.js';

const log = createLogger('Riders.ts');
//type RiderStatus = 'AVAILABLE' | 'ON_DELIVERY' | 'ON_BREAK' | 'OFFLINE';
interface RiderInput {
    name: string;
    phone: string;
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
        phone,
        vehicleType,
        vehiclePlate,
        dispatchHub,
        status,
        rating,
    }: RiderInput = req.body;
    try {
        if (!name || !phone) {
            throw AppError.badRequest('Name and phone number are required');
        }
        const existingRider = await prisma.rider.findUnique({
            where: { phone },
        });
        if (existingRider) {
            throw AppError.conflict(
                'A courier with this phone number already exists'
            );
        }
        const rider = await prisma.rider.create({
            data: {
                name,
                phone,
                vehicleType,
                vehiclePlate: vehiclePlate ?? '',
                dispatchHub,
                status: status ?? RiderStatus.AVAILABLE,
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
        phone,
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
        if (phone && phone !== existingRider.phone) {
            const phoneTaken = await prisma.rider.findUnique({
                where: { phone },
            });
            if (phoneTaken) {
                throw AppError.conflict(
                    'Phone number is already in use by another courier'
                );
            }
        }
        const updatedRider = await prisma.rider.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(phone && { phone }),
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
                status: RiderStatus.OFFLINE,
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
        const riders = await prisma.rider.findMany({
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' },
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
