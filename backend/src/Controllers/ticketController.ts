import type { Request, Response } from 'express';

import { prisma } from '../Config/DB.js';
import type { AuthenticatedRequest } from '../Types/auth.js';
import AppError from '../Utils/appError.js';
import createLogger from '../Utils/logger.js';

const log = createLogger('ticketController.ts');

export const saveTickets = async (req: Request, res: Response) => {
    const {
        ticketId,
        ticketClass,
        fullName,
        email,
        message,
        priority,
        status,
    } = req.body;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    if (!userId) {
        throw AppError.unauthorized('User is unauthorized');
    }
    if (!fullName) {
        throw AppError.badRequest('Name is required');
    }
    if (!email) {
        throw AppError.badRequest('Email is required');
    }
    if (!message) {
        throw AppError.badRequest('Message is required');
    }
    try {
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });
        const newTicket = await prisma.supportTicket.create({
            data: {
                ticketId,
                ticketClass,
                fullName,
                email,
                message,
                priority: priority || 'MEDIUM',
                status: status || 'PENDING',
                userId: existingUser ? existingUser.id : null,
            },
        });
        res.status(201).json({
            success: true,
            message: 'Support ticket successfully submitted',
            newTicket,
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
};
export async function getTickets(req: Request, res: Response): Promise<void> {
    try {
        const userId =
            typeof req.query.userId === 'string' ? req.query.userId : undefined;
        const email =
            typeof req.query.email === 'string' ? req.query.email : undefined;

        const queryFilter: { userId?: string; email?: string } = {};
        if (userId) queryFilter.userId = userId;
        if (email) queryFilter.email = email;

        const tickets = await prisma.supportTicket.findMany({
            where: queryFilter,
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({
            success: true,
            data: tickets,
        });
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown server error';
        res.status(500).json({ success: false, error: errorMessage });
    }
}
