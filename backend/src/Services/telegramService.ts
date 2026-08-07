/**
 * in hte event that we want to have modular functions this si how to do it async function handleAcceptOrder(ctx: ActionContext): Promise<void> {
    const orderId = ctx.match[1];
    const courierTelegramId = ctx.from?.id;
    const courierName = ctx.from?.first_name || 'Courier';
    const courierUsername = ctx.from?.username
        ? `@${ctx.from.username}`
        : courierName;

    if (!courierTelegramId) return;

   export const initTelegramBot = (): void => {
    bot.start((ctx) => {
        ctx.reply(
            '👋 <b>Welcome Courier!</b>\n\nYou will receive order details and delivery controls here once you claim a job in the courier group.',
            { parse_mode: 'HTML' }
        );
    });

    // Clean, readable handler bindings
    bot.action(/accept_(.+)/, (ctx) => handleAcceptOrder(ctx as ActionContext));
    bot.action(/pickup_(.+)/, (ctx) => handlePickupOrder(ctx as ActionContext));
    bot.hears(/^\d{4}$/, (ctx) => handlePinVerification(ctx as TextContext));
 */
import cron from 'node-cron';
import { Context, Markup, Telegraf } from 'telegraf';

import { prisma } from '../Config/DB.js';
import { NotificationService } from '../Services/notificationService.js';
import AppError from '../Utils/appError';
import createLogger from '../Utils/logger';

const log = createLogger('TelegramService.ts');
const BOT_TOKEN = process.env.TELEGRAM_API_TOKEN;
const COURIER_GROUP_ID = process.env.COURIER_GROUP_ID;
const BOT_USERNAME = 'FreshdroppersBot';
type DISPATCH_REASON = 'NEW' | 'STALE' | 'EMERGENCY_CANCEL';
if (!COURIER_GROUP_ID) {
    log.error('Courier id not initialized');
    throw AppError.badRequest('Courier id not initialized');
}
if (!BOT_TOKEN) {
    log.error('BotToken not initialized');
    throw AppError.badRequest('BotToken not initialized');
}
export const bot: Telegraf<Context> = new Telegraf(BOT_TOKEN);
// Track couriers who clicked "Delivered" and need to send a photo

//Initialize the bot attaching callback listeners and the polls
export const initTelegramBot = () => {
    // 1. Allow couriers to register / start the bot so DM messaging works
    bot.start((ctx: Context) => {
        ctx.reply(
            '👋 Welcome Courier! You will receive full order pickup & drop-off details here once you accept an order in the main courier group.'
        );
    });
    //catch accept order buttonclick from the group chat

    bot.action(
        /accept_(.+)/,
        async (ctx: Context & { match: RegExpExecArray }) => {
            if (!ctx.from) {
                return ctx.answerCbQuery(
                    '❌ Could not identify Telegram user.'
                );
            }
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
                                [
                                    Markup.button.callback(
                                        '🚨 Emergency Cancel',
                                        `emergency_cancel_${order.id}`
                                    ),
                                ],
                            ]),
                        }
                    );
                    await NotificationService.send({
                        userId: order.userId,
                        orderId: order.id,
                        title: '🚚 Courier Assigned',
                        message: ` ${courierName} has accepted your order and is heading to the hub!`,
                        type: 'ORDER_ASSIGNED',
                    });
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
                log.error('Error handling order acceptance:', {
                    data: { error },
                });
                await ctx.answerCbQuery(
                    '❌ An error occurred while processing your request.',
                    { show_alert: true }
                );
            }
        }
    );

    // handle order picked up
    bot.action(
        /pickup_(.+)/,
        async (ctx: Context & { match: RegExpExecArray }) => {
            const orderId = ctx.match[1];

            try {
                const order = await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        status: 'PICKED_UP',
                    },
                });
                await ctx.editMessageText(
                    ctx.callbackQuery?.message &&
                        'text' in ctx.callbackQuery.message
                        ? `${ctx.callbackQuery.message.text}\n\n🚀 *STATUS:* In Transit to Customer`
                        : '🚀 *STATUS:* In Transit to Customer' +
                              `🔑 <b>VERIFICATION INSTRUCTIONS:</b>\n` +
                              `When you arrive at the customer's doorstep, ask them for their <b>4-digit Delivery PIN</b> and send it directly as a text message in this chat to complete the order.`,
                    {
                        parse_mode: 'HTML',
                        ...Markup.inlineKeyboard([
                            [
                                Markup.button.callback(
                                    '✅ Mark Order Delivered',
                                    `deliver_${orderId}`
                                ),
                            ],
                            [
                                Markup.button.callback(
                                    '🚨 Emergency Cancel',
                                    `emergency_cancel_${orderId}`
                                ),
                            ],
                        ]),
                    }
                );
                await NotificationService.send({
                    userId: order.userId,
                    orderId: order.id,
                    title: '📦 Order Out for Delivery',
                    message: `Your courier is on the way to your location!`,
                    type: 'ORDER_PICKED_UP',
                });
            } catch (error) {
                log.error('Error in updating pick up status', {
                    data: { error },
                });
                await ctx.answerCbQuery('❌ Failed to update status.', {
                    show_alert: true,
                });
            }
        }
    );
    bot.action(
        /emergency_cancel_(.+)/,
        async (ctx: Context & { match: RegExpExecArray }) => {
            const orderId = ctx.match[1];
            if (!ctx.from) {
                return ctx.answerCbQuery(
                    '❌ Could not identify Telegram user.'
                );
            }
            const courierTelegramId = String(ctx.from.id);
            const courierName = ctx.from.first_name || 'Courier';

            try {
                //fetch current order state b4 updating
                const orderBeforeUpdate = await prisma.order.findUnique({
                    where: { id: orderId },
                });
                if (!orderBeforeUpdate) {
                    return ctx.answerCbQuery('⚠️ Order not found.');
                }
                const wasPickedUp = orderBeforeUpdate.status === 'PICKED_UP';
                //generate a brand new 4 digit pin
                const newDeliveryPin = Math.floor(
                    1000 + Math.random() * 9000
                ).toString();
                // 1. Atomic update in Postgres: Ensure the order belongs to this courier
                // and is in an active state (ASSIGNED or PICKED_UP)
                const updateResult = await prisma.order.updateMany({
                    where: {
                        id: orderId,
                        courierTelegramId: courierTelegramId,
                        status: {
                            in: ['ASSIGNED', 'PICKED_UP'],
                        },
                    },
                    data: {
                        status: 'PAID', // Reset back to PAID so another courier can claim it
                        courierName: null,
                        courierTelegramId: null,
                        deliveryPin: newDeliveryPin,
                        updatedAt: new Date(),
                    },
                });

                // 2. Race condition / Authorization check
                if (updateResult.count === 0) {
                    return ctx.answerCbQuery(
                        '⚠️ Unable to cancel. The order is either not assigned to you or already completed.',
                        { show_alert: true }
                    );
                }

                // 3. Acknowledge button press
                await ctx.answerCbQuery('🚨 Emergency cancellation processed');

                // 4. Update the courier's private DM message
                await ctx.editMessageText(
                    `🚨 <b>ORDER CANCELLED (Emergency)</b>\n\n` +
                        `This order has been released and reposted back to the courier group. Thank you for notifying us!`,
                    { parse_mode: 'HTML' }
                );
                // 4. If cancelled AFTER pickup, alert Admin / Hub Manager!
                if (wasPickedUp && process.env.TELEGRAM_ADMIN_CHAT_ID) {
                    await bot.telegram.sendMessage(
                        process.env.TELEGRAM_ADMIN_CHAT_ID,
                        `⚠️ <b>POST-PICKUP CANCELLATION ALERT</b>\n\n` +
                            `Courier: <b>${courierName}</b> (@${ctx.from.username || 'N/A'})\n` +
                            `Order Ref: <code>#${orderBeforeUpdate.reference}</code>\n\n` +
                            `🚨 <i>The courier had already picked up the items before cancelling. Please re-pack/re-prepare inventory at the Hub for the next courier.</i>`,
                        { parse_mode: 'HTML' }
                    );
                }

                // 5. Repost the order immediately back to the group for other couriers

                // Inside bot.action(/emergency_cancel_(.+)/)
                if (updateResult.count > 0) {
                    const order = await prisma.order.findUnique({
                        where: { id: orderId },
                    });
                    if (order) {
                        await NotificationService.send({
                            userId: order.userId,
                            orderId: order.id,
                            title: '⚠️ Delivery Re-Assigned',
                            message: `Your original courier encountered an issue. We are re-assigning a new courier immediately.`,
                            type: 'ORDER_CANCELLED',
                        });
                        await dispatchOrderToGroup(orderId, 'EMERGENCY_CANCEL');
                    }
                }
            } catch (error) {
                log.error('Error handling emergency cancellation:', {
                    data: { error },
                });
                await ctx.answerCbQuery(
                    '❌ An error occurred while cancelling the order.',
                    { show_alert: true }
                );
            }
        }
    );
    // handle Mark order delivered

    bot.hears(/^\d{4}$/, async (ctx: Context) => {
        if (!ctx.from) {
            return ctx.answerCbQuery('❌ Could not identify Telegram user.');
        }
        if (!ctx.message || !('text' in ctx.message)) {
            return;
        }

        const courierTelegramId = String(ctx.from.id);
        const enteredPin = ctx.message.text.trim();
        try {
            const activeOrder = await prisma.order.findFirst({
                where: {
                    courierTelegramId: courierTelegramId,
                    status: 'PICKED_UP',
                },
            });
            if (!activeOrder) {
                return;
            }
            if (activeOrder.deliveryPin !== enteredPin) {
                await ctx.reply(
                    `❌ <b>INCORRECT PIN</b>\n\n` +
                        `The code <b>${enteredPin}</b> does not match <b>${activeOrder.deliveryPin}</b>. Please ask the customer for the correct 4-digit Delivery PIN shown in their app.`,
                    { parse_mode: 'HTML' }
                );
                return;
            } //correct pin : update order status to deliveryCompleted
            const order = await prisma.order.update({
                where: { id: activeOrder.id },
                data: {
                    status: 'DELIVERY_COMPLETED',
                    completedAt: new Date(),
                },
            });
            await ctx.reply(
                `🎉 <b>PIN VERIFIED & DELIVERY COMPLETED!</b>\n\n` +
                    `Great job! Order #${activeOrder.reference || activeOrder.id} status is now <b>DELIVERY_COMPLETED</b>.\n\n` +
                    `Payout has been logged to your account.`,
                { parse_mode: 'HTML' }
            );
            await NotificationService.send({
                userId: order.userId,
                orderId: order.id,
                title: '🎉 Order Delivered!',
                message: `Your order #${order.reference} has been delivered successfully. Enjoy!`,
                type: 'ORDER_DELIVERED',
            });
        } catch (error) {
            log.error('Error verifying delivery PIN:', { data: { error } });
            await ctx.reply(
                '❌ An error occurred while verifying the PIN. Please try again.'
            );
        }
    });

    // courier earning endpoint
    bot.command('earnings', async (ctx: Context) => {
        try {
            const telegramId = ctx.from?.id.toString();
            if (!telegramId) {
                await ctx.reply(
                    '⚠️ Could not identify your Telegram user account.'
                );
                return;
            }
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            //fetch all orders assigned to this courier
            const todaysOrders = await prisma.order.findMany({
                where: {
                    courierTelegramId: telegramId,
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
                select: {
                    id: true,
                    reference: true,
                    status: true,
                    deliveryFee: true,
                    deliveryDestination: true,
                    apartmentName: true,
                    createdAt: true,
                    completedAt: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            if (todaysOrders.length === 0) {
                await ctx.reply(
                    '📊 <b>Daily Earnings Summary</b>\n\nYou have no orders assigned for today yet.',
                    {
                        parse_mode: 'HTML',
                    }
                );
            }
            const completedOrders = todaysOrders.filter(
                (order) => order.status === 'DELIVERY_COMPLETED'
            );
            const inProgressOrders = todaysOrders.filter(
                (order) =>
                    order.status !== 'DELIVERY_COMPLETED' &&
                    order.status !== 'CANCELLED'
            );

            const completedPayout = completedOrders.reduce(
                (sum, order) => sum + Number(order.deliveryFee || 0),
                0
            );

            const pendingPayout = inProgressOrders.reduce(
                (sum, order) => sum + Number(order.deliveryFee || 0),
                0
            );

            const totalExpectedPayout = completedPayout + pendingPayout;
            let message = `💰 <b>Daily Earnings Summary for Today</b>\n`;
            message += `🗓 Date: <b>${startOfDay.toLocaleDateString()}</b>\n\n`;

            message += `✅ <b>Completed Deliveries (${completedOrders.length})</b>\n`;
            message += `• Earned Payout: <b>KES ${completedPayout.toLocaleString()}</b>\n\n`;

            if (inProgressOrders.length > 0) {
                message += `🚚 <b>In-Progress Deliveries (${inProgressOrders.length})</b>\n`;
                message += `• Expected Payout: <b>KES ${pendingPayout.toLocaleString()}</b>\n\n`;
            }

            message += `----------------------------------------\n`;
            message += `💵 <b>Total Expected Daily Payout: KES ${totalExpectedPayout.toLocaleString()}</b>\n\n`;

            message += `📦 <b>Today's Order Breakdown:</b>\n`;
            todaysOrders.forEach((order, index) => {
                const statusIcon =
                    order.status === 'DELIVERY_COMPLETED' ? '✅' : '⏳';
                const location =
                    order.apartmentName || order.deliveryDestination || 'N/A';
                message += `${index + 1}. ${statusIcon} <b>${order.reference}</b> - KES ${order.deliveryFee} (${location})\n`;
            });

            await ctx.reply(message, { parse_mode: 'HTML' });
        } catch (error) {
            log.error('Error fetching courier earnings:', { data: { error } });
            await ctx.reply(
                '❌ Failed to retrieve your earnings report. Please try again later.'
            );
        }
    });
    // Command to fetch your personal Telegram User/Chat ID for .env setup
    /*bot.command('myid', async (ctx: Context) => {
        if (!ctx.from) return;

        await ctx.reply(
            `🆔 <b>Your Telegram Chat ID:</b> <code>${ctx.from.id}</code>\n` +
                `Chat Type: <b>${ctx.chat?.type}</b>`,
            { parse_mode: 'HTML' }
        );
    });*/

    //start listening
    bot.launch();
    log.highlight('🤖 Telegram bot service initialized...');
    //enable graceful shutdowns
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
};
//called by server when new order comes in
export const dispatchOrderToGroup = async (
    orderId: string,
    reason: DISPATCH_REASON = 'NEW'
) => {
    try {
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
        let header = `📦 <b>NEW ORDER OFFER #${order.reference}</b>`;

        if (reason === 'STALE') {
            header = `⏰ <b>STILL UNASSIGNED (10+ MINS) OFFER #${order.reference}</b>`;
        } else if (reason === 'EMERGENCY_CANCEL') {
            header = `🚨 <b>ORDER WAS CANCELLED & REPOSTED #${order.reference}</b>`;
        }
        //send message to telegram group
        await bot.telegram.sendMessage(
            COURIER_GROUP_ID,
            `${header}\n\n` +
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
    } catch (error) {
        log.error('Unable to dispatch order to telegram group', {
            data: { error },
        });
    }
};
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
