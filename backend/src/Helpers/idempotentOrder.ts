import { prisma } from '../Config/DB.js';
import { NotificationService } from '../Services/notificationService.js';
import { dispatchOrderToGroup } from '../Services/telegramService.js';
import createLogger from '../Utils/logger.js';

const log = createLogger('IdempotentOrder.ts');
export async function fulfillOrderAndDispatch(
    orderId: string
): Promise<boolean> {
    //atomically update order on;y if it hasn't been marked paid yet
    const result = await prisma.order.updateMany({
        where: {
            id: orderId,
            status: { not: 'PAID' },
        },
        data: {
            status: 'PAID',
        },
    });
    if (result.count > 0) {
        // Fetch the full order details required for Notification & Dispatching
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (order) {
            // 🛍️ Send in-app notification using actual order properties
            await NotificationService.send({
                userId: order.userId,
                orderId: order.id,
                title: '🛍️ Order Placed Successfully!',
                message: `Payment received for Order #${order.reference}. We are locating a courier!`,
                type: 'ORDER_PLACED',
            });

            log.highlight(
                `Order ${orderId} marked PAID. Dispatching to telegram group...`
            );
            await dispatchOrderToGroup(orderId);
            return true;
        }
    }
    return false;
}
