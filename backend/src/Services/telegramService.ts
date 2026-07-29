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
// Track couriers who clicked "Delivered" and need to send a photo
const pendingPhotoUploads = new Map<number, string>();
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
                    courierName: courierName,
                    courierTelegramId: String(courierTelegramId),
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
                `✅ <b>ORDER CLAIMED</b>\n\n` +
                    `👤 <b>Assigned Courier:</b> ${courierName} (${courierUsername})\n` +
                    `⚡ <b>Status:</b> In Progress`,
                { parse_mode: 'HTML' }
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
            const deliveryFee = order.deliveryFee
                ? Number(order.deliveryFee).toFixed(2)
                : '0.00';
            const apartment = order.apartmentName || 'N/A';
            const house = order.houseNumber || 'N/A';
            const landmark = order.landmark || 'N/A';
            const lat = order.customerLatitude ?? 0;
            const lng = order.customerLongitude ?? 0;
            // 6. Send private DM to courier with sensitive location details & payout
            try {
                await bot.telegram.sendMessage(
                    courierTelegramId,
                    `🎉 <b>JOB DETAILS: Order #${order.reference || order.id}</b>\n\n` +
                        `💰 <b>Courier Payout (Delivery Fee):</b> $${deliveryFee}\n\n` +
                        `🏬 <b>Pickup Hub:</b> ${hubName}\n\n` +
                        `📍 <b>Drop-off Address:</b> ${order.deliveryDestination || 'Standard Area'}\n` +
                        `🏢 <b>Apartment:</b> ${apartment}, House ${house}\n` +
                        `🚩 <b>Landmark:</b> ${landmark}\n\n` +
                        `🛒 <b>Items to Pick Up:</b>\n${itemsList}\n\n` +
                        `📍 <b>Customer GPS:</b> https://maps.google.com/?q=${lat},${lng}`,
                    {
                        parse_mode: 'HTML',
                        link_preview_options: { is_disabled: true }, // Hides the big Google Maps box
                        ...Markup.inlineKeyboard([
                            [
                                Markup.button.callback(
                                    '🛍️ Mark Picked Up from Hub',
                                    `pickup_${order.id}`
                                ),
                            ],
                        ]),
                    }
                );
            } catch (dmError) {
                log.warn(
                    `Could not DM courier ${courierTelegramId}. They might not have clicked /start with the bot yet.`,
                    { data: { dmError } }
                );

                // Alert the courier in Telegram so they know to check their DM settings
                await ctx.reply(
                    `⚠️ @${ctx.from.username || courierName}, order assigned! However, I couldn't DM you the location details. Please start a private chat with me first!`,
                    { parse_mode: 'HTML' }
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

    // handle order picked up
    bot.action(/pickup_(.+)/, async (ctx) => {
        const orderId = ctx.match[1];
        try {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'PICKED_UP',
                },
            });
            await ctx.editMessageText(
                ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message
                    ? `${ctx.callbackQuery.message.text}\n\n🚀 *STATUS:* In Transit to Customer`
                    : '🚀 *STATUS:* In Transit to Customer',
                {
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard([
                        [
                            Markup.button.callback(
                                '✅ Mark Order Delivered',
                                `deliver_${orderId}`
                            ),
                        ],
                    ]),
                }
            );
        } catch (error) {
            log.error('Error in updating pick up status', { data: { error } });
            await ctx.answerCbQuery('❌ Failed to update status.', {
                show_alert: true,
            });
        }
    });

    // handle Mark order delivered
    bot.action(/deliver_(.+)/, async (ctx) => {
        const orderId = ctx.match[1];
        try {
            // Register courier in pending upload state
            pendingPhotoUploads.set(courierTelegramId, orderId);

            await ctx.answerCbQuery('📸 Photo proof required');

            await ctx.reply(
                `📸 <b>DELIVERY PROOF REQUIRED</b>\n\n` +
                    `Please upload/take a photo of the delivered package at the customer's doorstep to complete this order.`,
                { parse_mode: 'HTML' }
            );
        } catch (error: unknown) {
            log.error('Error initiating delivery photo prompt:', {
                data: { error },
            });
            await ctx.answerCbQuery('❌ Error processing delivery request.', {
                show_alert: true,
            });
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
        `📦 <b>NEW ORDER OFFER #${order.reference}</b>\n\n` +
            `🏬 <b>Hub:</b> ${hubName}\n` +
            `📍 <b>Area:</b> ${order.deliveryDestination}\n` +
            `💰 <b>Payout:</b> $${Number(order.deliveryFee).toFixed(2)}\n` +
            `💡 <i>First time courier? Make sure you have started a chat with <a href="https://t.me/${BOT_USERNAME}">@${BOT_USERNAME}</a> first!</i>`,
        {
            parse_mode: 'HTML',
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
