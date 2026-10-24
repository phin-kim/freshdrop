import type { Request, Response } from 'express';

import { prisma } from '../../Config/DB.js';
import AppError from '../../Utils/appError.js';
import createLogger from '../../Utils/logger.js';

const log = createLogger('AdminTickets.ts');
export const getTickets = async (
    req: Request,
    res: Response
): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string, 5) || 5);
    const skip = (page - 1) * limit;
    try {
        const baseWhere = { isDeleted: false };
        const totalInquiries = await prisma.supportTicket.count({
            where: baseWhere,
        });
        const requestCount = await prisma.supportTicket.count({
            where: {
                ...baseWhere,
                ticketClass: 'REQUEST',
            },
        });
        const commentCount = await prisma.supportTicket.count({
            where: {
                ...baseWhere,

                ticketClass: 'COMMENT',
            },
        });
        const complaintCount = await prisma.supportTicket.count({
            where: {
                ...baseWhere,
                ticketClass: 'COMPLAINT',
            },
        });
        const pendingReviewCount = await prisma.supportTicket.count({
            where: {
                ...baseWhere,
                OR: [{ status: 'OPEN' }, { status: 'PENDING' }],
            },
        });
        //fetch all the tickets with the associated user details
        const ticketData = await prisma.supportTicket.findMany({
            take: limit,
            skip: skip,
            where: baseWhere,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const totalPages = Math.ceil(totalInquiries / limit);
        log.debug('The data being sent to the frontend', {
            data: {
                totalInquiries,
                totalPages,
                currentPage: page,
                limit,
                requests: requestCount,
                comments: commentCount,
                complaints: complaintCount,
                pendingReviews: pendingReviewCount,
                ticketData,
            },
        });
        res.status(200).json({
            success: true,
            message: 'Tickets fetched successfully',
            tickets: {
                totalPages,
                currentPage: page,
                limit,
                totalInquiries,
                requests: requestCount,
                comments: commentCount,
                complaints: complaintCount,
                pendingReviews: pendingReviewCount,
                ticketData,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            log.error(`Prisma Validation Error: ${error.message}`);
        } else {
            log.error('Unable to fetch admin orders', { data: { error } });
        }
        throw AppError.database('Unable to fetch tickets for admin dashboard');
    }
};
export const updateTicketResolution = async (
    req: Request,
    res: Response
): Promise<void> => {
    const id = req.params.id as string;
    if (id === '') {
        throw AppError.badRequest('Kindly provide and id');
    }
    const { status, adminResponse } = req.body;
    if (!status) {
        throw AppError.badRequest('Kindly provide the updated status');
    }
    if (adminResponse === undefined) {
        throw AppError.badRequest(
            'Kindly provide a response to the the ticket'
        );
    }
    try {
        const updatedData = await prisma.supportTicket.update({
            where: { id },
            data: {
                status: status,
                ticketResponse: adminResponse,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });
        res.status(200).json({
            success: true,
            message: 'Successfully updated the ticket',
            updatedData,
        });
    } catch (error) {
        if (error instanceof Error) {
            log.error(`Prisma Validation Error: ${error.message}`);
        } else {
            log.error('Unable to fetch admin orders', { data: { error } });
        }
        throw AppError.database('Unable to update data ');
    }
};
export const deleteTicket = async (
    req: Request,
    res: Response
): Promise<void> => {
    const id = req.params.id as string;
    if (id === '') {
        throw AppError.badRequest('Kindly provide and id');
    }
    try {
        await prisma.supportTicket.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() },
        });
        res.status(200).json({
            success: true,
            message: 'Successfully deleted the ticket',
        });
    } catch (error) {
        if (error instanceof Error) {
            log.error(`Prisma Validation Error: ${error.message}`);
        } else {
            log.error('Unable to fetch admin orders', { data: { error } });
        }
        throw AppError.database('Unable to delete ticket ');
    }
};
