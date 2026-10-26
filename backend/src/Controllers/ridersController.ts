import type { Request, Response } from 'express';
import { createHash } from 'node:crypto';

import { prisma } from '../Config/DB.js';
import { NotificationService } from '../Services/notificationService.js';
import type { AuthenticatedRequest } from '../Types/auth.js';
import AppError from '../Utils/appError.js';
import { calculateFinancials } from '../Utils/costCalculation.js';
import createLogger from '../Utils/logger.js';
import { auth } from '../lib/auth.js';

const log = createLogger('riderController.ts');
const selfServiceStatuses = ['AVAILABLE', 'ON_BREAK', 'OFFLINE'] as const;
type SelfServiceStatus = (typeof selfServiceStatuses)[number];

const riderOrderInclude = {
    user: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    financials: true,
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
            (sum, order) => sum + Number(order.financials?.riderPayout ?? 0),
            0
        );

        const todaysDropCount = todaysCompleted.length;

        const avgPerDropToday =
            todaysDropCount > 0
                ? Math.round(todaysEarnings / todaysDropCount)
                : 0;
        const cumulativeEarnings = completedOrders.reduce(
            (sum, order) => sum + Number(order.financials?.riderPayout ?? 0),
            0
        );
        const lifetimeDropCount = completedOrders.length;

        //performance scores
        //completion rate based on accepted vs completed orders
        const totalAssigned = rider.orders.filter(
            (order) => order.riderId === rider.id
        ).length;
        const unavailableAction = rider.orders.filter(
            (order) => order.riderId && order?.unavailableAction
        );
        const completionRate =
            totalAssigned > 0
                ? Number(
                      ((completedOrders.length / totalAssigned) * 100).toFixed(
                          1
                      )
                  )
                : 100.0;

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
                    unavailableAction: unavailableAction,
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

export const updateStatus = async (
    req: Request,
    res: Response
): Promise<Response> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const requestedStatus = req.body.status as SelfServiceStatus;
    if (!userId) {
        throw AppError.unauthorized('Unauthorized user  ');
    }
    if (!selfServiceStatuses.includes(requestedStatus)) {
        throw AppError.badRequest(
            'Rider status must be AVAILABLE, ON_BREAK, or OFFLINE'
        );
    }

    try {
        const rider = await prisma.rider.findFirst({
            where: {
                userId,
                isDeleted: false,
            },
        });

        if (!rider) {
            throw AppError.notFound('Rider profile not found');
        }

        const updatedRider = await prisma.rider.update({
            where: { id: rider.id },
            data: { status: requestedStatus },
            select: {
                id: true,
                status: true,
            },
        });
        return res.status(200).json({
            success: true,
            message: 'Rider status updated successfully',
            rider: updatedRider,
        });
    } catch (error) {
        const msg =
            error instanceof Error
                ? error.message
                : 'Unknown error updating status ';
        log.error(`Failed to update status: ${msg}`);
        log.error('Error form ', { data: { error } });
        throw AppError.database(msg);
    }
};
export async function activateRiderAccount(
    req: Request,
    res: Response
): Promise<Response> {
    const { token, password } = req.body;
    if (!token) {
        throw AppError.badRequest('Activation token is required');
    }
    if (!password) {
        throw AppError.badRequest('Password is required ');
    }

    if (password.length < 8) {
        throw AppError.badRequest(
            'Password must contain at least 8 characters'
        );
    }
    const tokenHash = createHash('sha256').update(token).digest('hex');
    try {
        const rider = await prisma.rider.findFirst({
            where: {
                activationTokenHash: tokenHash,
                accountStatus: 'PENDING_ACTIVATION',
                isDeleted: false,
            },
        });
        if (!rider) {
            throw AppError.badRequest(
                'This activation link is invalid or has already been used'
            );
        }
        if (
            !rider.activationTokenExpiresAt ||
            rider.activationTokenExpiresAt < new Date()
        ) {
            throw AppError.badRequest('THis activation link has expired');
        }
        const existingUser = await prisma.user.findUnique({
            where: {
                email: rider.email,
            },
        });
        let userId: string;
        let message: string;
        if (existingUser) {
            const updatedUser = await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    role: 'rider',
                },
            });
            userId = updatedUser.id;
            message =
                'Your existing account has been activated as a rider>Please login with your current password';
        } else {
            const authResponse = await auth.api.createUser({
                body: {
                    name: rider.name,
                    email: rider.email,
                    password,
                    role: 'rider',
                    //callbackURL:""
                },
            });
            if (!authResponse?.user?.id) {
                throw AppError.database('Could not create rider');
            }
            userId = authResponse.user.id;
            message = 'Rider account created successfully. You can now log in.';
        }

        const activatedRider = await prisma.rider.update({
            where: { id: rider.id },
            data: {
                userId,
                accountStatus: 'ACTIVE',
                status: 'AVAILABLE',
                activatedAt: new Date(),
                activationTokenExpiresAt: null,
                activationTokenHash: null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                accountStatus: true,
                status: true,
            },
        });
        return res.status(200).json({
            success: true,
            message,
            rider: activatedRider,
            existingAccount: Boolean(existingUser),
        });
    } catch (error) {
        const msg =
            error instanceof Error
                ? error.message
                : 'Unknown error activating account ';
        log.error(`Failed to activating account: ${msg}`);
        log.error('Error form ', { data: { error } });
        throw AppError.badRequest(msg);
    }
}
export async function checkRiderActivation(
    req: Request,
    res: Response
): Promise<Response> {
    const token = req.query.token as string | undefined;

    if (!token) {
        throw AppError.badRequest('Activation token is required');
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const rider = await prisma.rider.findFirst({
        where: {
            activationTokenHash: tokenHash,
            accountStatus: 'PENDING_ACTIVATION',
            isDeleted: false,
        },
        select: {
            name: true,
            email: true,
            activationTokenExpiresAt: true,
        },
    });

    if (!rider) {
        throw AppError.badRequest('Invalid or already-used activation link');
    }

    if (
        !rider.activationTokenExpiresAt ||
        rider.activationTokenExpiresAt < new Date()
    ) {
        throw AppError.badRequest('This activation link has expired');
    }

    const existingUser = await prisma.user.findUnique({
        where: { email: rider.email },
        select: { id: true },
    });

    return res.status(200).json({
        success: true,
        riderName: rider.name,
        existingAccount: Boolean(existingUser),
    });
}

export async function markItemMissing(
    req: Request,
    res: Response
): Promise<Response> {
    const { orderId, itemId } = req.params as {
        orderId: string;
        itemId: string;
    };
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;

    const rider = await prisma.rider.findFirst({
        where: { userId, isDeleted: false },
        select: { id: true },
    });

    if (!rider) {
        throw AppError.notFound('Rider profile not found');
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                user: true,
                hubs: { select: { id: true } },
                financials: true,
            },
        });

        if (!order) throw AppError.notFound('Order not found');
        if (order.riderId !== rider.id)
            throw AppError.forbidden('You are not assigned to this order');

        const targetItem = order.items.find((item) => item.id === itemId);
        if (!targetItem) throw AppError.notFound('Order item not found');

        // Calculate item refund value
        const itemRefundAmount =
            Number(targetItem.priceAtPurchase) * targetItem.quantity;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Verify stock configuration
            const productConfigs = await tx.storeProductConfig.findMany({
                where: {
                    productId: targetItem.productId,
                    store: { hubId: { in: order.hubs.map((hub) => hub.id) } },
                },
                select: { id: true, status: true },
            });

            if (productConfigs.length === 0) {
                throw AppError.notFound(
                    'Product stock configuration not found for this order'
                );
            }
            if (
                productConfigs.every(
                    (config) => config.status === 'OUT_OF_STOCK'
                )
            ) {
                throw AppError.badRequest(
                    'Item is already marked as unavailable'
                );
            }

            // 2. Mark the item and store config as unavailable
            const updatedItem = await tx.orderItem.update({
                where: { id: itemId },
                data: { isAvailable: false },
            });

            await tx.storeProductConfig.updateMany({
                where: { id: { in: productConfigs.map((c) => c.id) } },
                data: { status: 'OUT_OF_STOCK' },
            });

            // 3. Determine if the WHOLE order is now dead
            // We check if there are any other items that are still marked available
            const remainingAvailableItems = order.items.filter(
                (item) => item.id !== itemId && item.isAvailable
            );
            const isWholeOrderCancelled = remainingAvailableItems.length === 0;

            // 4. Process Wallet Refund & Update Totals
            if (order.unavailableAction === 'REFUND' && order.financials) {
                let wallet = await tx.wallet.findUnique({
                    where: { userId: order.userId },
                });
                if (!wallet) {
                    wallet = await tx.wallet.create({
                        data: { userId: order.userId, balance: 0.0 },
                    });
                }

                let finalRefundAmount = itemRefundAmount;
                let updatedWallet;

                if (isWholeOrderCancelled) {
                    // 🚨 EDGE CASE: Refund EVERYTHING they paid
                    finalRefundAmount = Number(order.financials.totalAmount);

                    updatedWallet = await tx.wallet.update({
                        where: { id: wallet.id },
                        data: { balance: { increment: finalRefundAmount } },
                    });

                    // Zero out the financial record
                    await tx.orderFinancial.update({
                        where: { orderId: order.id },
                        data: {
                            subtotal: 0,
                            totalAmount: 0,
                            deliveryFee: 0,
                            riderPayout: 0,
                            platformCommission: 0,
                            platformTotal: 0,
                        },
                    });

                    // Update order status to CANCELLED
                    await tx.order.update({
                        where: { id: order.id },
                        data: { status: 'CANCELLED' },
                    });
                } else {
                    // ✅ PARTIAL MISSING: Just refund the item, keep fees
                    updatedWallet = await tx.wallet.update({
                        where: { id: wallet.id },
                        data: { balance: { increment: finalRefundAmount } },
                    });

                    const newSubtotal =
                        Number(order.financials.subtotal) - finalRefundAmount;
                    const newTotalAmount =
                        Number(order.financials.totalAmount) -
                        finalRefundAmount;

                    // Recalculate rider payout based on new subtotal
                    const recalculated = calculateFinancials(
                        order.financials.distanceKm,
                        1, // Store count stays same
                        newSubtotal
                    );

                    await tx.orderFinancial.update({
                        where: { orderId: order.id },
                        data: {
                            subtotal: newSubtotal,
                            totalAmount: newTotalAmount,
                            riderPayout: recalculated.riderPayout,
                            platformCommission: recalculated.platformCommission,
                            platformTotal: recalculated.platformTotal,
                            // Fees remain untouched
                        },
                    });
                }

                // 5. Record Ledger Transaction
                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        amount: finalRefundAmount,
                        type: 'REFUND',
                        status: 'SUCCESS',
                        reference: order.reference,
                        description: isWholeOrderCancelled
                            ? `Full refund: Order #${order.reference} cancelled (items unavailable)`
                            : `Refund for missing item: ${targetItem.productName}`,
                    },
                });

                // 6. Send Notification
                await NotificationService.send({
                    userId: order.userId,
                    orderId: order.id,
                    title: isWholeOrderCancelled
                        ? 'Order Cancelled & Fully Refunded'
                        : 'Wallet Refund',
                    message: isWholeOrderCancelled
                        ? `Unfortunately, all items in order #${order.reference} were unavailable. A full refund of KES ${finalRefundAmount.toFixed(2)} has been credited to your wallet.`
                        : `The item "${targetItem.productName}" was unavailable. A refund of KES ${finalRefundAmount.toFixed(2)} has been credited to your wallet.`,
                    type: 'REFUND_SUCCESSFUL',
                });

                return {
                    updatedItem,
                    walletBalance: updatedWallet.balance,
                    orderCancelled: isWholeOrderCancelled,
                };
            }

            return {
                updatedItem,
                walletBalance: null,
                orderCancelled: isWholeOrderCancelled,
            };
        });

        return res.status(200).json({
            success: true,
            message: result.orderCancelled
                ? 'All items unavailable. Order cancelled and fully refunded.'
                : 'Item marked unavailable and partially refunded successfully.',
            data: result,
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown server error';
        log.error(`Failed to mark item unavailable: ${errorMessage}`);
        throw AppError.badRequest(errorMessage);
    }
}
