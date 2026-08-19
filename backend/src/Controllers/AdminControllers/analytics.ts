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
        let grossSalesNum = 0;
        let totalServiceFeeNum = 0;

        let pendingCount = 0;
        let assignedCount = 0;
        let pickUpCount = 0;
        // let dispatchedCount = 0;
        let deliveredCount = 0;

        const categoryMap: Record<string, number> = {};
        const timelineMap: Record<string, { revenue: number; orders: number }> =
            {};
        let openmarketSales = 0;
        let openmarketUnits = 0;
        let supermarketSales = 0;
        let supermarketUnits = 0;
        orders.forEach((order) => {
            const orderTotal = Number(order.totalAmount) || 0;
            const serviceFee = Number(order.serviceFee) || 0;

            grossSalesNum += orderTotal;
            totalServiceFeeNum += serviceFee;

            const orderDate = new Date(order.createdAt);
            let timeKey = '';
            if (period === 'today') {
                timeKey = `${orderDate.getHours().toString().padStart(2, '0')}:00`;
            } else {
                timeKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
            }

            if (!timelineMap[timeKey]) {
                timelineMap[timeKey] = { revenue: 0, orders: 0 };
            }
            timelineMap[timeKey].revenue += orderTotal;
            timelineMap[timeKey].orders += 1;
            //funnel tracking based on order status
            switch (order.status) {
                case 'PENDING':
                    pendingCount++;
                    break;
                case 'ASSIGNED':
                    assignedCount++;
                    break;
                case 'PICKED_UP':
                    pickUpCount++;
                    break;
                case 'DELIVERY_COMPLETED':
                    deliveredCount++;
                    break;
                default:
                    break;
            }
            //loop through items to calculate category share and sourcing type
            order.items.forEach((item) => {
                const itemPrice = Number(item.priceAtPurchase || 0);
                const itemsTotal = itemPrice * item.quantity;

                const category = item.product.category || 'Uncategorized';

                categoryMap[category] =
                    (categoryMap[category] || 0) + itemsTotal;

                if (item.product.sourcingType === 'OPEN_MARKET') {
                    openmarketSales += itemsTotal;
                    openmarketUnits += item.quantity;
                } else if (item.product.sourcingType === 'SUPERMARKET') {
                    supermarketSales += itemsTotal;
                    supermarketUnits += item.quantity;
                }
            });
        });
        const averageOrderAmount =
            totalOrders > 0 ? grossSalesNum / totalOrders : 0;
        const fulfillmentRate =
            totalOrders > 0
                ? Number(((deliveredCount / totalOrders) * 100).toFixed(1))
                : 0;

        //new vs returning customers
        const userIds: string[] = Array.from(
            new Set(
                orders
                    .map((ord) => ord.userId)
                    .filter((id): id is string => Boolean(id))
            )
        );
        const userOrderCounts = await prisma.order.groupBy({
            by: ['userId'],
            where: { userId: { in: userIds } },
            _count: { id: true },
        });
        const orderCountMap = new Map<string, number>(
            userOrderCounts.map((item) => [item.userId, item._count.id])
        );
        let newCustomers = 0;
        let returningCustomers = 0;
        orders.forEach((order) => {
            if (!order.userId) return;
            const lifetimeCount = orderCountMap.get(order.userId) || 1;
            if (lifetimeCount === 1) {
                newCustomers++;
            } else {
                returningCustomers++;
            }
        });
        //format category share into array fro the charts
        const categoryShare = Object.keys(categoryMap).map((cat) => ({
            category: categoryMap,
            amount: categoryMap[cat],
        }));
        const salesTimeline = Object.keys(timelineMap)
            .sort()
            .map((key) => ({
                time: key,
                day: key,
                week: key,
                revenue: timelineMap[key].revenue,
                orders: timelineMap[key].orders,
            }));
        // 5. Final Structured JSON Response
        res.status(200).json({
            success: true,
            data: {
                summary: {
                    grossSales: grossSalesNum,
                    totalOrders,
                    averageOrderAmount: Math.round(averageOrderAmount),
                    platformCommission: totalServiceFeeNum,
                    fulfillmentRate,
                },
                customerShare: {
                    newCustomers,
                    returningCustomers,
                    newPercentage:
                        totalOrders > 0
                            ? Math.round((newCustomers / totalOrders) * 100)
                            : 0,
                    returningPercentage:
                        totalOrders > 0
                            ? Math.round(
                                  (returningCustomers / totalOrders) * 100
                              )
                            : 0,
                },
                categoryShare,
                supplierSplit: {
                    openmarket: {
                        amount: openmarketSales,
                        units: openmarketUnits,
                    },
                    supermarket: {
                        amount: supermarketSales,
                        units: supermarketUnits,
                    },
                },
                funnel: {
                    pending: pendingCount,
                    assigned: assignedCount,
                    pickedUp: pickUpCount,
                    //dispatched: dispatchedCount,
                    delivered: deliveredCount,
                },
                salesTimeline,
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
