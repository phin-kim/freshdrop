import { prisma } from '../Config/DB.js';
import { io } from '../Server.js';

type NotificationType =
    | 'ORDER_PLACED'
    | 'ORDER_ASSIGNED'
    | 'ORDER_PICKED_UP'
    | 'ORDER_DELIVERED'
    | 'ORDER_CANCELLED';
export interface Notification {
    id: string;
    userId: string;
    orderId: string | null; // Optional relation fields in Prisma evaluate to string | null
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    createdAt: Date;
}

export interface CreateNotificationDTO {
    userId: string;
    orderId?: string;
    title: string;
    message: string;
    type: NotificationType;
}
export class NotificationService {
    static async send(data: CreateNotificationDTO): Promise<Notification> {
        //persist notification
        const notification = await prisma.notification.create({
            data: {
                userId: data.userId,
                orderId: data.orderId,
                title: data.title,
                message: data.message,
                type: data.type,
            },
        });
        if (io) {
            io.to(`user_${data.userId}`).emit(
                'notification_received',
                notification
            );
        }

        return notification;
    }
}
