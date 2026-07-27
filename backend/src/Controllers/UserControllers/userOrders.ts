import type { Request, Response } from 'express';

import { prisma } from '../../Config/DB.js';
import type { AuthenticatedRequest } from '../../Types/auth.js';
import AppError from '../../Utils/appError.js';
import createLogger from '../../Utils/logger.js';

const log = createLogger('userOrders.ts');
export interface PaginatedOrdersResponse {
    orders: unknown[]; // Explicitly typed in frontend
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
export const getUserOrders = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const userId = authReq?.user?.id || (req.query.userId as string);
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.max(1, parseInt(req.query.limit as string) || 5);
        const skip = (page - 1) * limit;
        if (!userId) {
            throw AppError.unauthorized('User not authenticated');
        }
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { userId },
                include: { items: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.order.count({ where: { userId } }),
        ]);
        const responsePayload: PaginatedOrdersResponse = {
            orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };

        res.status(200).json(responsePayload);
    } catch (error) {
        log.error('Error in fetching the user orders', { data: { error } });
        throw AppError.badRequest('Error in fetching the user orders');
    }
};
