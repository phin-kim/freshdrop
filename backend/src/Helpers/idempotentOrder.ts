import { prisma } from '../Config/DB.js';
import { NotificationService } from '../Services/notificationService.js';
import { dispatchOrderToGroup } from '../Services/telegramService.js';
import createLogger from '../Utils/logger.js';

const log = createLogger('IdempotentOrder.ts');
export async function fulfillOrderAndDispatch(
    orderId: string
): Promise<boolean> {
    // 1. Try to update the status to PAID (safely handles both PENDING and already-PAID orders)
    await prisma.order.updateMany({
        where: {
            id: orderId,
            status: { not: 'PAID' },
        },
        data: {
            status: 'PAID',
        },
    });

    // 2. Fetch the order (regardless of whether we just updated it or it was already PAID)
    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    // 3. If it exists and hasn't been cancelled, dispatch it!
    if (order && order.status === 'PAID') {
        // 🛍️ Send in-app notification
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

        // Dispatch to telegram
        await dispatchOrderToGroup(orderId);
        return true;
    }

    return false;
}
