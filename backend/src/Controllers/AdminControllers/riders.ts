//import { RiderStatus } from '@generated/prisma/enums.js';
/**
 * 
 * in the event that user wants to become courier import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function approveRiderApplication(req: Request, res: Response): Promise<Response> {
    const { userId, vehicleType, vehiclePlate, dispatchHub } = req.body;

    try {
        // 1. Run a transaction to update the user role and activate/create their rider profile
        const result = await prisma.$transaction(async (tx) => {
            // Update the existing user's role to "rider"
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { role: 'rider' },
            });

            // Create or update their Rider worker profile linked to this userId
            const riderProfile = await tx.rider.upsert({
                where: { userId: userId },
                update: {
                    vehicleType,
                    vehiclePlate: vehiclePlate ?? '',
                    dispatchHub,
                    status: 'AVAILABLE',
                },
                create: {
                    userId: userId,
                    name: updatedUser.name ?? 'New Rider',
                    phoneNumber: '', // Collected from their application form
                    vehicleType,
                    vehiclePlate: vehiclePlate ?? '',
                    dispatchHub,
                    status: 'AVAILABLE',
                },
            });

            return { updatedUser, riderProfile };
        });

        return res.status(200).json({
            success: true,
            message: 'User successfully promoted to rider!',
            data: result,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to approve rider application.',
        });
    }
}
 */
import type { Request, Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';

import { prisma } from '../../Config/DB.js';
import BrevoEmailSend from '../../Services/emailService.js';
import AppError from '../../Utils/appError.js';
import createLogger from '../../Utils/logger.js';

const log = createLogger('Riders.ts');

type RiderStatus = 'AVAILABLE' | 'ON_DELIVERY' | 'ON_BREAK' | 'OFFLINE';
interface RiderInput {
    name: string;
    email: string;
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
        email,
        dispatchHub,
        rating,
    }: RiderInput = req.body;
    try {
        if (!name) {
            throw AppError.badRequest('Name  is required');
        }
        if (!phoneNumber) {
            throw AppError.badRequest(' phoneNumber number is required');
        }
        if (!email) {
            throw AppError.badRequest('Email is required');
        }

        const existingRider = await prisma.rider.findUnique({
            where: { phoneNumber },
        });
        if (existingRider) {
            throw AppError.conflict(
                'A courier with this phone number number already exists'
            );
        }
        const activationToken = randomBytes(32).toString('hex');
        const activationTokenHash = createHash('sha256')
            .update(activationToken)
            .digest('hex');
        const activationTokenExpiresAt = new Date(Date.now() + 1 * 60 * 1000);
        //create the user via better auth server side api
        // const response = await auth.api.createUser({
        //     body: {
        //         email,
        //         password,
        //         name,
        //         role: 'rider',
        //     },
        // });

        const rider = await prisma.rider.create({
            data: {
                name: name.trim(),
                email: email.trim(),
                phoneNumber: phoneNumber.trim(),
                vehicleType,
                vehiclePlate: vehiclePlate?.toUpperCase() ?? '',
                dispatchHub,
                status: 'OFFLINE',
                accountStatus: 'PENDING_ACTIVATION',
                activationTokenExpiresAt,
                activationTokenHash,
                rating: rating !== undefined ? Number(rating) : 5.0,
            },
        });
        const activationLink =
            `${process.env.FRONTEND_URL || 'http://localhost:5173'}` +
            `/rider/activate?token=${activationToken}`;
        await BrevoEmailSend.sendEmail({
            to: rider.email,
            templateId: 8,
            params: {
                activationLink,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Courier created successfully',
            rider,
            activationLink,
        });
    } catch (error) {
        const msg =
            error instanceof Error
                ? error.message
                : 'Unknown payment routing fault ';
        log.error(`Failed to register courier: ${msg}`);
        log.error('Error form ', { data: { error } });
        throw AppError.database(msg);
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
        email,
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
        const upperCasePlate = vehiclePlate?.toUpperCase();
        const updatedRider = await prisma.rider.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(phoneNumber && { phoneNumber }),
                ...(vehicleType !== undefined && { vehicleType }),
                ...(vehiclePlate !== undefined && {
                    vehiclePlate: upperCasePlate,
                }),
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
        throw AppError.database(msg);
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
//GET ALL RIDERS
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
                        completedAt: true,
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
                    o.completedAt !== null &&
                    new Date(o.completedAt) >= todayStart
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
        throw AppError.database(msg);
    }
}
//RESEND LINK
export async function resendActivationLink(
    req: Request,
    res: Response
): Promise<Response> {
    const id = req.params.id as string;
    try {
        const existingRider = await prisma.rider.findFirst({
            where: { id: id, accountStatus: 'PENDING_ACTIVATION' },
        });
        if (!existingRider) {
            throw AppError.badRequest(
                'Rider not found or account is already active'
            );
        }
        const activationToken = randomBytes(32).toString('hex');
        const activationTokenHash = createHash('sha256')
            .update(activationToken)
            .digest('hex');
        const activationTokenExpiresAt = new Date(
            Date.now() + 24 * 60 * 60 * 1000
        );
        await prisma.rider.update({
            where: {
                id: existingRider.id,
            },
            data: {
                activationTokenHash,
                activationTokenExpiresAt,
            },
        });
        const activationLink =
            `${process.env.FRONTEND_URL || 'http://localhost:5173'}` +
            `/rider/activate?token=${activationToken}`;
        await BrevoEmailSend.sendEmail({
            to: existingRider.email,
            templateId: 8,
            params: {
                activationLink,
            },
        });
        return res.status(200).json({
            success: true,
            message: 'Link resent to riders email',
        });
    } catch (error) {
        const msg =
            error instanceof Error ? error.message : 'Unknown activation error'; //
        log.error(`Failed to resend activation link: ${msg}`);
        log.error('Error form ', { data: { error } });

        throw AppError.database(msg);
    }
}
