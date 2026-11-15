import cron from 'node-cron';
import { Telegraf } from 'telegraf';

import { prisma } from '../Config/DB';
import { dispatchOrderToGroup } from '../Services/telegramService';
import createLogger from '../Utils/logger';

const log = createLogger('staleOrders.ts');

export const startStaleOrderCron = (_bot: Telegraf): void => {
    cron.schedule('*/2 * * * *', async () => {
        try {
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            const staleOrders = await prisma.order.findMany({
                where: {
                    status: 'PAID',
                    courierTelegramId: null,
                    updatedAt: {
                        lte: tenMinutesAgo,
                    },
                },
            });
            for (const order of staleOrders) {
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        updatedAt: new Date(),
                    },
                });
                await dispatchOrderToGroup(order.id, 'STALE');
            }
        } catch (error) {
            log.error('Error running stale orders', { data: { error } });
        }
    });
};
