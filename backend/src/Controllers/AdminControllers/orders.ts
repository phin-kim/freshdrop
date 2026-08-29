import type { Request, Response } from 'express';
import { Markup } from 'telegraf';

//import type { OrderStatus } from '../../../../shared/sharedTypes.js';
import { prisma } from '../../Config/DB.js';
import { bot } from '../../Services/telegramService.js';
import AppError from '../../Utils/appError.js';
import createLogger from '../../Utils/logger.js';

//import { Prisma } from '../../generated/prisma/client.js';

const log = createLogger('Order.ts');

export const VALID_ORDER_STATUSES = [
    'PENDING',
    'PAID',
    'ASSIGNED',
    'PICKED_UP',
    'DELIVERY_COMPLETED',
    'CANCELLED',
] as const;
export type OrderStatus = (typeof VALID_ORDER_STATUSES)[number];

export async function fetchCustomerOrders(
    req: Request,
    res: Response
): Promise<Response> {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
    const skip = (page - 1) * limit;
    //concurrent queries to minimize latency
    try {
        const [
            orders,
            totalCount,
            activeInTransitCount,
            deliveredCount,
            grossAggregate,
        ] = await Promise.all([
            prisma.order.findMany({
                take: limit,
                skip: skip,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    items: {
                        select: {
                            id: true,
                            productName: true,
                            quantity: true,
                            priceAtPurchase: true,
                            isAvailable: true,
                            product: {
                                select: {
                                    id: true,
                                    image: true,
                                },
                            },
                        },
                    },
                    rider: {
                        select: {
                            id: true,
                            name: true,
                            phoneNumber: true,
                            vehiclePlate: true,
                            vehicleType: true,
                            status: true,
                        },
                    },
                    payments: {
                        select: {
                            id: true,
                            status: true,
                            //channel: true,
                            amount: true,
                            createdAt: true,
                        },
                        take: 1,
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            //phoneNumber: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.order.count(),

            prisma.order.count({
                where: {
                    status: {
                        in: ['PENDING', 'PAID', 'ASSIGNED', 'PICKED_UP'],
                    },
                },
            }),
            prisma.order.count({
                where: {
                    status: 'DELIVERY_COMPLETED',
                },
            }),
            prisma.order.aggregate({
                _sum: {
                    totalAmount: true,
                },
            }),
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        const grossOrderValue = grossAggregate._sum.totalAmount
            ? Number(grossAggregate._sum.totalAmount)
            : 0;
        return res.status(200).json({
            success: true,
            message: 'Admin orders fetched successfully ',
            data: orders,
            metrics: {
                totalOrders: totalCount,
                activeInTransit: activeInTransitCount,
                deliveredOrders: deliveredCount,
                grossOrderValue,
            },
            meta: {
                totalCount,
                totalPages,
                currentPage: page,
                limit,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            log.error(`Prisma Validation Error: ${error.message}`);
        } else {
            log.error('Unable to fetch admin orders', { data: { error } });
        }
        throw AppError.database('Unable to fetch orders for admin dashboard');
    }
}

export async function assignRiderToOrder(
    req: Request,
    res: Response
): Promise<Response> {
    const orderIdParam = req.params.orderId;
    const orderId = Array.isArray(orderIdParam)
        ? orderIdParam[0]
        : orderIdParam;
    const { riderId } = req.body as { riderId?: string };

    if (!orderId || orderId.trim() === '') {
        throw AppError.badRequest('A valid order ID is required');
    }

    if (!riderId || typeof riderId !== 'string' || riderId.trim() === '') {
        throw AppError.badRequest('A valid rider ID is required');
    }

    try {
        const [order, rider] = await Promise.all([
            prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.rider.findUnique({
                where: { id: riderId },
                select: {
                    id: true,
                    name: true,
                    phoneNumber: true,
                    vehicleType: true,
                    vehiclePlate: true,
                    telegramId: true,
                    isDeleted: true,
                },
            }),
        ]);

        if (!order) {
            throw AppError.notFound('Order not found');
        }

        if (!rider) {
            throw AppError.notFound('Rider not found');
        }

        if (rider.isDeleted) {
            throw AppError.badRequest('This rider is deactivated');
        }

        if (['DELIVERY_COMPLETED', 'CANCELLED'].includes(order.status)) {
            throw AppError.badRequest(
                'This order cannot be reassigned because it is already completed or cancelled'
            );
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                riderId: rider.id,
                status: 'ASSIGNED',
                courierName: rider.name,
                courierTelegramId: rider.telegramId,
            },
            include: {
                rider: {
                    select: {
                        id: true,
                        name: true,
                        phoneNumber: true,
                        vehicleType: true,
                        vehiclePlate: true,
                    },
                },
            },
        });

        // Send Telegram notification to rider with order details
        if (rider.telegramId) {
            try {
                const customerName = order.user?.name || 'Customer';

                await bot.telegram.sendMessage(
                    Number(rider.telegramId),
                    `📋 <b>ADMIN ASSIGNED ORDER #${order.reference || order.id}</b>\n\n` +
                        `✅ <b>Status:</b> Ready for Pickup\n\n` +
                        `👤 <b>Customer:</b> ${customerName}\n` +
                        `📞 <b>Customer Phone:</b> ${order.user?.email || 'Not provided'}\n\n` +
                        `📍 <b>Delivery Address:</b>\n${order.deliveryDestination || 'Address not specified'}\n\n` +
                        `🔑 <b>Delivery PIN:</b> <code>${order.deliveryPin || '****'}</code>\n\n` +
                        `💰 <b>Order Total:</b> KSh ${order.subtotal.toLocaleString()}\n` +
                        `💵 <b>Your Payout:</b> KSh ${Number(order.deliveryFee || 0).toFixed(2)}\n\n` +
                        `🗺️ <b>GPS Location:</b> https://maps.google.com/?q=${order.customerLatitude},${order.customerLongitude}`,
                    {
                        parse_mode: 'HTML',
                        link_preview_options: { is_disabled: true },
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
                log.info(
                    `Telegram notification sent to rider ${rider.name} (${rider.telegramId}) for order ${order.reference}`
                );
            } catch (telegramError) {
                log.warn(
                    `Could not send Telegram notification to rider ${rider.telegramId}: ${telegramError instanceof Error ? telegramError.message : String(telegramError)}`
                );
                // Don't throw error; the order assignment is still successful even if Telegram notification fails
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Rider assigned to order successfully',
            data: updatedOrder,
        });
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        const msg =
            error instanceof Error ? error.message : 'Unknown assignment error';
        log.error(`Failed to assign rider to order ${orderId}: ${msg}`);
        throw AppError.database('Failed to assign rider to order');
    }
}
/*export async function updateOrderStatus(
    req: Request,
    res: Response
): Promise<Response> {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        // 1. Validate status input against Prisma OrderStatus enum
        // 1. Define runtime array with strictly-typed read-only tuple

        // 2. Derive TypeScript type from array elements (No 'any' inferred)

        // 3. Validation inside Controller
        if (!status || !VALID_ORDER_STATUSES.includes(status as OrderStatus)) {
            throw AppError.badRequest(
                `Invalid status provided. Allowed values: ${VALID_ORDER_STATUSES.join(', ')}`
            );
        }

        // 2. Execute update and conditionally update completion timestamp
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                ...(status === 'DELIVERY_COMPLETED'
                    ? { completedAt: new Date() }
                    : {}),
            },
            include: {
                items: {
                    select: {
                        id: true,
                        productName: true,
                        quantity: true,
                        priceAtPurchase: true,
                        isAvailable: true,
                        product: {
                            select: {
                                id: true,
                                images: true,
                            },
                        },
                    },
                },
                rider: {
                    select: {
                        id: true,
                        name: true,
                        phoneNumber: true,
                        vehiclePlate: true,
                        status: true,
                    },
                },
                payments: {
                    select: {
                        id: true,
                        status: true,
                        channel: true,
                        amount: true,
                    },
                    take: 1,
                },
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        phoneNumber: true,
                        email: true,
                    },
                },
            },
        });

        log.info(`Order ${orderId} updated to status: ${status}`);

        return res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: updatedOrder,
        });
    } catch (error: unknown) {
        if (error instanceof AppError) {
            throw error;
        }

        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
        ) {
            throw AppError.notFound(
                `Order with ID ${req.params.orderId} not found`
            );
        }

        log.error('Failed to update order status', { data: { error } });
        throw AppError.database('Failed to update order status');
    }
}*/
