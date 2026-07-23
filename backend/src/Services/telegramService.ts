import { Markup, Telegraf } from 'telegraf';

import { prisma } from '../Config/DB.js';
import AppError from '../Utils/appError';
import createLogger from '../Utils/logger';

const log = createLogger('TelegramService.ts');
const BOT_TOKEN = process.env.TELEGRAM_API_TOKEN;
const COURIER_GROUP_ID = process.env.COURIER_GROUP_ID;
const BOT_USERNAME = 'FreshdroppersBot';

if (!COURIER_GROUP_ID) {
    log.error('Courier id not initialized');
    throw AppError.badRequest('Courier id not initialized');
}
if (!BOT_TOKEN) {
    log.error('BotToken not initialized');
    throw AppError.badRequest('BotToken not initialized');
}
const bot = new Telegraf(BOT_TOKEN);
//for now that is for testing we shall do an in memory setup for the orders that is for the orders then we shift to database calls for the actual orders

//Initialize the bot attaching callback listeners and the polls
export const initTelegramBot = () => {
    // 1. Allow couriers to register / start the bot so DM messaging works
    bot.start((ctx) => {
        ctx.reply(
            '👋 Welcome Courier! You will receive full order pickup & drop-off details here once you accept an order in the main courier group.'
        );
    });
    //catch accept order buttonclick from the group chat
    bot.action(/accept_(.+)/, async (ctx) => {
        const orderId = ctx.match[1]; //extracts the id from accept 101
        const courierTelegramId = ctx.from.id; //couriers telegram user id
        const courierName = ctx.from.first_name || 'Courier';
        const courierUsername = ctx.from.username
            ? `@${ctx.from.username}`
            : courierName;
        try {
            //atomic update lok order in Postgres
            //only update if status is pending
            const updateResult = await prisma.order.updateMany({
                where: {
                    id: orderId,
                    status: 'PAID',
                },
                data: {
                    status: 'ASSIGNED',
                },
            });
            //race condition check
            if (updateResult.count === 0) {
                return ctx.answerCbQuery(
                    '⚠️ Too late! This order was already claimed by another courier.',
                    { show_alert: true }
                );
            }
            //stop button spinner
            await ctx.answerCbQuery('✅ Order successfully claimed');
            await ctx.editMessageText(
                `✅ *ORDER CLAIMED*\n\n` +
                    `👤 *Assigned Courier:* ${courierName} (${courierUsername})\n` +
                    `⚡ *Status:* In Progress`,
                { parse_mode: 'Markdown' }
            );
            //fetch order details from DB for the dm
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    items: true,
                    hubs: true,
                },
            });
            if (!order) {
                throw AppError.notFound('Order not found');
            }
            const itemsList = order.items
                .map((item) => `• ${item.quantity}x ${item.productName}`)
                .join('\n');

            const hubName = order.hubs?.[0]?.name || 'Central Hub';

            // 6. Send private DM to courier with sensitive location details & payout
            try {
                await bot.telegram.sendMessage(
                    courierTelegramId,
                    `🎉 *JOB DETAILS: Order #${order.reference}*\n\n` +
                        `💰 *Courier Payout (Delivery Fee):* $${Number(order.deliveryFee).toFixed(2)}\n\n` +
                        `🏬 *Pickup Hub:* ${hubName}\n\n` +
                        `📍 *Drop-off Address:* ${order.deliveryDestination}\n` +
                        `🏢 *Apartment:* ${order.apartmentName}, House ${order.houseNumber}\n` +
                        `🚩 *Landmark:* ${order.landmark || 'N/A'}\n\n` +
                        `🛒 *Items to Pick Up:*\n${itemsList}\n\n` +
                        `📍 *Customer GPS:* https://maps.google.com/?q=${order.customerLatitude},${order.customerLongitude}`,
                    { parse_mode: 'Markdown' }
                );
            } catch (dmError) {
                log.warn(
                    `Could not DM courier ${courierTelegramId}. They might not have clicked /start with the bot yet.`,
                    { data: { dmError } }
                );

                // Alert the courier in Telegram so they know to check their DM settings
                await ctx.reply(
                    `⚠️ @${ctx.from.username || courierName}, order assigned! However, I couldn't DM you the location details. Please start a private chat with me first!`,
                    { parse_mode: 'Markdown' }
                );
            }
        } catch (error) {
            log.error('Error handling order acceptance:', { data: { error } });
            await ctx.answerCbQuery(
                '❌ An error occurred while processing your request.',
                { show_alert: true }
            );
        }
    });
    //start listening
    bot.launch();
    log.highlight('🤖 Telegram bot service initialized...');
    //enable graceful shutdowns
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
};
//called by server when new order comes in
export const dispatchOrderToGroup = async (orderId: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            hubs: true,
        },
    });
    if (!order) {
        throw AppError.notFound(`Order ${orderId} not found in database.`);
    }
    const hubName = order.hubs?.[0]?.name || 'Local hub';
    //send message to telegram group
    await bot.telegram.sendMessage(
        COURIER_GROUP_ID,
        `📦 *NEW ORDER OFFER #${order.reference}*\n\n` +
            `🏬 *Hub:* ${hubName}\n` +
            `📍 *Area:* ${order.deliveryDestination}\n` +
            `💰 *Payout:* $${Number(order.deliveryFee).toFixed(2)}\n` +
            `💡 _First time courier? Make sure you have started a chat with [@${BOT_USERNAME}](https://t.me/${BOT_USERNAME}) first!_`,

        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [
                    Markup.button.callback(
                        '⚡ Accept Order',
                        `accept_${order.id}`
                    ),
                ],
            ]),
        }
    );
};
