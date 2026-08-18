import type { Request, Response } from 'express';

//import type { OrderStatus } from '../../../../shared/sharedTypes.js';
import { prisma } from '../../Config/DB.js';
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
