import { prisma } from '../Config/DB.js';
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
        log.highlight(
            `Order ${orderId} marked PAID.Dispatching to telegram group...`
        );
        await dispatchOrderToGroup(orderId);
        return true;
    }
    return false;
}
