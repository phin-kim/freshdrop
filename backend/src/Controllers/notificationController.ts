import type { Request, Response } from 'express';

import { prisma } from '../Config/DB.js';
import type { AuthenticatedRequest } from '../Types/auth.js';
import AppError from '../Utils/appError.js';

export const getNotifications = async (
    req: Request,
    res: Response
): Promise<Response> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;
    if (!userId) {
        throw AppError.unauthorized('User not authorized');
    }
    const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
    });
    const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
    });
    return res.json({ notifications, unreadCount });
};
export const markAsRead = async (
    req: Request,
    res: Response
): Promise<Response> => {
    const { id } = req.params as { id: string };
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;
    if (!userId) {
        throw AppError.unauthorized('User not authorized');
    }
    const result = await prisma.notification.updateMany({
        where: { id: id, userId: userId },
        data: {
            isRead: true,
        },
    });
    if (result.count === 0) {
        throw AppError.notFound('Notification not found');
    }
    return res.json({ success: true });
};
export const markAllAsRead = async (
    req: Request,
    res: Response
): Promise<Response> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;
    if (!userId) {
        throw AppError.unauthorized('User not authorized');
    }
    await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });

    return res.json({ success: true });
};
