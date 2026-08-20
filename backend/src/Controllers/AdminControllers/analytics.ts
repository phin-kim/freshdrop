import type { Request, Response } from 'express';

import { prisma } from '../../Config/DB.js';
import AppError from '../../Utils/appError.js';
import createLogger from '../../Utils/logger.js';

const log = createLogger('analytics.ts');

export const getAdminAnalytics = async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as string) || 'today';
        const now = new Date();
        const startDate = new Date();

        if (period === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (period === '7days') {
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
        } else if (period === '30days') {
            startDate.setDate(now.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
        }

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
            },
            include: {
                user: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        const totalOrders: number = orders.length;
        const funnel = {
            pending: orders.filter((order) => order.status === 'PENDING')
                .length,
            assigned: orders.filter((order) => order.status === 'ASSIGNED')
                .length,
            pickedUp: orders.filter((order) => order.status === 'PICKED_UP')
                .length,
            delivered: orders.filter(
                (order) => order.status === 'DELIVERY_COMPLETED'
            ).length,
            totalOrders,
        };
        const totalRevenue = orders.reduce(
            (total, order) => total + Number(order.totalAmount),
            0
        );
        const totalServiceFees = orders.reduce(
            (total, order) => total + Number(order.serviceFee),
            0
        );
        const categoryMap = new Map<
            string,
            { itemCount: number; revenue: number }
        >();

        orders.forEach((order) => {
            order.items.forEach((item) => {
                const category = item.product.category || 'Uncategorized';
                const current = categoryMap.get(category) || {
                    itemCount: 0,
                    revenue: 0,
                };
                current.itemCount += item.quantity;
                current.revenue += Number(item.priceAtPurchase) * item.quantity;
                categoryMap.set(category, current);
            });
        });

        const categoryRevenue = Array.from(categoryMap.values()).reduce(
            (total, category) => total + category.revenue,
            0
        );
        const categoryBreakdown = Array.from(categoryMap.entries()).map(
            ([category, values]) => ({
                category,
                itemCount: values.itemCount,
                revenue: Number(values.revenue.toFixed(2)),
                percentage:
                    categoryRevenue > 0
                        ? Number(
                              (
                                  (values.revenue / categoryRevenue) *
                                  100
                              ).toFixed(2)
                          )
                        : 0,
            })
        );
        const responseOrders = orders.map((order) => ({
            id: order.id,
            reference: order.reference,
            status: order.status,
            totalAmount: Number(order.totalAmount),
            serviceFee: Number(order.serviceFee),
            deliveryFee: Number(order.deliveryFee),
            user: {
                id: order.user.id,
                name: order.user.name,
                email: order.user.email,
            },
            items: order.items.map((item) => ({
                id: item.id,
                productName: item.productName,
                quantity: item.quantity,
                priceAtPurchase: Number(item.priceAtPurchase),
                isAvailable: item.isAvailable,
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    category: item.product.category,
                    sourcingType: item.product.sourcingType,
                },
            })),
            createdAt: order.createdAt.toISOString(),
        }));

        res.status(200).json({
            success: true,
            message: 'Order analytics retrieved successfully',
            data: {
                funnel,
                financials: {
                    totalRevenue: Number(totalRevenue.toFixed(2)),
                    totalServiceFees: Number(totalServiceFees.toFixed(2)),
                },
                categoryBreakdown,
                orders: responseOrders,
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
};
