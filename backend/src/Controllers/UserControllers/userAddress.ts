import type { Request, Response } from 'express';

import { prisma } from '../../Config/DB.js';
import type { AuthenticatedRequest } from '../../Types/auth.js';
import AppError from '../../Utils/appError.js';
import createLogger from '../../Utils/logger.js';

const log = createLogger('UserAddress.ts');
export async function fetchAddressDetails(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const user = authReq?.user;
    const userId = user?.id;

    try {
        const savedAddresses = await prisma.savedAddress.findMany({
            where: {
                userId: userId,
            },
            orderBy: [
                { isDefault: 'desc' }, // Default address floats to the top
                { createdAt: 'desc' }, // Newest addresses next
            ],
        });
        log.debug('Saved addresses', { data: { savedAddresses } });
        return res.status(200).json({
            success: true,
            message: 'Fetched the saved address successfully',
            savedAddresses: savedAddresses,
        });
    } catch (error) {
        log.error('Error in fetching the address', { data: { error } });
        throw AppError.badRequest('Error in fetching the the address');
    }
}
export async function updateAddressDetails(req: Request, res: Response) {
    const { id } = req.params;
    const { isDefault, destinationLabel } = req.body;
    if (!id || typeof id !== 'string') {
        throw AppError.badRequest('Invalid address ID parameter');
    }
    const authReq = req as AuthenticatedRequest;
    try {
        const userId = authReq?.user?.id;
        /*if (!isDefault) {
            throw AppError.badRequest('Kindly select the default destination');
        }*/
        if (!destinationLabel) {
            throw AppError.badRequest('Kindly enter select a label ');
        }
        const addressExists = await prisma.savedAddress.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!addressExists) {
            throw AppError.badRequest('Address not found');
        }
        if (isDefault === true) {
            await prisma.savedAddress.updateMany({
                where: {
                    userId,
                },
                data: {
                    isDefault: false,
                },
            });
        }
        const updatedAddress = await prisma.savedAddress.update({
            where: { id },
            data: {
                destinationLabel:
                    destinationLabel !== undefined
                        ? destinationLabel
                        : undefined,
                isDefault: isDefault !== undefined ? isDefault : undefined,
            },
        });
        return res.status(200).json({
            success: true,
            message: 'Address metadata udated successfully',
            address: updatedAddress,
        });
    } catch (error) {
        log.error('Unable to update th address details', { data: { error } });
        throw AppError.badRequest('Unable to update th address details');
    }
}
