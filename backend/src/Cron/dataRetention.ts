import cron from 'node-cron';

import { prisma } from '../Config/DB.js';
import createLogger from '../Utils/logger.js';

const log = createLogger('DataRetentionCron.ts');

export const startDataRetentionCron = () => {
    // Runs at midnight on the 1st of every month
    //PROD:0 0 1 * *
    //TESTING '*/2 * * * *
    cron.schedule('0 0 1 * *', async () => {
        log.info('Starting monthly order anonymization...');
        const cutOffDate = new Date();
        //PROD
        cutOffDate.setFullYear(cutOffDate.getFullYear() - 1);
        //TEST
        //cutOffDate.setMinutes(cutOffDate.getMinutes() - 5);
        try {
            // 1. Find old deleted users
            const deletedUsers = await prisma.user.findMany({
                where: {
                    banned: true,
                    banReason: 'Request for account deletion',
                    updatedAt: { lt: cutOffDate },
                },
                select: { id: true },
            });

            if (deletedUsers.length === 0) {
                log.info('No old deleted users found to anonymize.');
                return;
            }

            const userIds = deletedUsers.map((u) => u.id);

            // 2. Anonymize the Orders (keeping the financial record intact)
            await prisma.order.updateMany({
                where: {
                    userId: { in: userIds },
                    deliveryDestination: { not: '[REDACTED]' },
                },
                data: {
                    deliveryDestination: '[REDACTED]',
                    apartmentName: '[REDACTED]',
                    houseNumber: '[REDACTED]',
                    landmark: '[REDACTED]',
                    customerLatitude: 0,
                    customerLongitude: 0,
                },
            });

            // Note: SavedAddresses were already deleted immediately in the deleteAccount function.

            log.info(
                `Successfully anonymized orders for ${userIds.length} users.`
            );
        } catch (error) {
            log.error('Failed to run data anonymization cron job', {
                data: { error },
            });
        }
    });
};
