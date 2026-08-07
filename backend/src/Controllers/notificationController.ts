import { Request, Response } from 'express';

import { prisma } from '../Config/DB.js';
import type { AuthenticatedRequest } from '../Types/auth.js';

export const getNotifications = async (
    req: Request,
    res: Response
): Promise<Response> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;
    const notifications = await prisma.notification.findMany({
        where: { id: userId },
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
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;
    await prisma.notification.updateMany({
        where: { id: userId },
        data: {
            isRead: true,
        },
    });
    return res.json({ success: true });
};
export const markAllAsRead = async (
    req: Request,
    res: Response
): Promise<Response> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;

    await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });

    return res.json({ success: true });
};
