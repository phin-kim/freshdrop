import type { Request, Response } from 'express';

import { prisma } from '../Config/DB.js';
import type { AuthenticatedRequest } from '../Types/auth';
import AppError from '../Utils/appError';
import createLogger from '../Utils/logger';

const log = createLogger('riderController.ts');

const riderOrderInclude = {
    user: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    items: {
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    quantityText: true,
                    basePrice: true,
                },
            },
        },
    },
    payments: {
        select: {
            id: true,
            amount: true,
            phoneNumber: true,
            status: true,
            reference: true,
            completedAt: true,
        },
    },
} as const;

export async function fetchRiderData(
    req: Request,
    res: Response
): Promise<Response> {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    if (!userId) {
        throw AppError.unauthorized('Unauthorized request.Kindly login ');
    }
    try {
        const rider = await prisma.rider.findUnique({
            where: { userId },
            include: {
                orders: {
                    orderBy: {
                        updatedAt: 'desc',
                    },
                    include: riderOrderInclude,
                },
            },
        });
        if (!rider || rider.isDeleted) {
            throw AppError.badRequest(
                'Rider profile not found or is deactivated'
            );
        }
        //define time boundaries

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        //categorize orders based in status and assignment
        //Active:Assigned to this rider currently in progress
        const activeOrders = rider.orders.filter(
            (order) =>
                order.riderId === rider.id &&
                ['ASSIGNED', 'PICKED_UP'].includes(order.status)
        );
        const completedOrders = rider.orders.filter(
            (order) =>
                order.riderId === rider.id &&
                ['DELIVERY_COMPLETED'].includes(order.status)
        );
        //available pool unassigned orders matching riders hub(the hub part will be for future )
        const availablePool = await prisma.order.findMany({
            where: {
                riderId: null,
                status: { in: ['PAID'] },
                // ...(rider.dispatchHub ? { destinationLabel: rider.dispatchHub } : {}),
            },
            include: riderOrderInclude,
            orderBy: { createdAt: 'desc' },
        });

        //calculate financial metrics
        //todays completed orders
        const todaysCompleted = completedOrders.filter(
            (order) =>
                order.completedAt !== null &&
                new Date(order.completedAt) >= startOfToday
        );

        const todaysEarnings = todaysCompleted.reduce(
            (sum, order) => sum + Number(order.deliveryFee),
            0
        );

        const todaysDropCount = todaysCompleted.length;

        const avgPerDropToday =
            todaysDropCount > 0
                ? Math.round(todaysEarnings / todaysDropCount)
                : 0;
        const cumulativeEarnings = completedOrders.reduce(
            (sum, order) => sum + Number(order.deliveryFee),
            0
        );
        const lifetimeDropCount = completedOrders.length;

        //performance scores
        //completion rate based on accepted vs completed orders
        const totalAssigned = rider.orders.filter(
            (order) => order.riderId === rider.id
        ).length;
        const completionRate =
            totalAssigned > 0
                ? Number(
                      ((completedOrders.length / totalAssigned) * 100).toFixed(
                          1
                      )
                  )
                : 100.0;
        log.debug('Data sent to the frontend', {
            data: {
                data: {
                    profile: {
                        id: rider.id,
                        name: rider.name,
                        profilePic: (rider as { profilePic?: string })
                            .profilePic,
                        phoneNumber: rider.phoneNumber,
                        email: rider.email,
                        telegramId: rider.telegramId,
                        vehiclePlate: rider.vehiclePlate,
                        vehicleType: rider.vehicleType,
                        dispatchHub: rider.dispatchHub,
                        status: rider.status,
                        rating: rider.rating,
                    },
                    metrics: {
                        todaysEarnings,
                        todaysDropCount,
                        avgPerDropToday,
                        cumulativeEarnings,
                        lifetimeDropCount,
                        accountCreatedDate: rider.createdAt,
                    },
                    performance: {
                        onTimeRate: 98.8, // Can be wired to custom logic if timestamps tracked
                        completionRate,
                        acceptanceRate: 96.5,
                        customerSatisfactionRank: 'Top 5% in Hub',
                    },
                    tabs: {
                        activeOrders,
                        availablePool,
                        completedOrders,
                    },
                },
            },
        });
        return res.status(200).json({
            success: true,
            data: {
                profile: {
                    id: rider.id,
                    name: rider.name,
                    profilePic: (rider as { profilePic?: string }).profilePic,
                    phoneNumber: rider.phoneNumber,
                    email: rider.email,
                    telegramId: rider.telegramId,
                    vehiclePlate: rider.vehiclePlate,
                    vehicleType: rider.vehicleType,
                    dispatchHub: rider.dispatchHub,
                    status: rider.status,
                    rating: rider.rating,
                },
                metrics: {
                    todaysEarnings,
                    todaysDropCount,
                    avgPerDropToday,
                    cumulativeEarnings,
                    lifetimeDropCount,
                    accountCreatedDate: rider.createdAt,
                },
                performance: {
                    onTimeRate: 98.8, // Can be wired to custom logic if timestamps tracked
                    completionRate,
                    acceptanceRate: 96.5,
                    customerSatisfactionRank: 'Top 5% in Hub',
                },
                tabs: {
                    activeOrders,
                    availablePool,
                    completedOrders,
                },
            },
        });
    } catch (error) {
        const msg =
            error instanceof Error
                ? error.message
                : 'Unknown error fetching rider data ';
        log.error(`Failed to load courier data: ${msg}`);
        log.error('Error form ', { data: { error } });
        throw AppError.database(msg);
    }
}
