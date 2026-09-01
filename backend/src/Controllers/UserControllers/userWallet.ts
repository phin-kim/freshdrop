import type { Request, Response } from 'express';

import type {
    TransactionStatus,
    TransactionType,
} from '../../../../shared/sharedTypes.js';
import { prisma } from '../../Config/DB.js';
import type { AuthenticatedRequest } from '../../Types/auth.js';
import AppError from '../../Utils/appError.js';
import createLogger from '../../Utils/logger.js';

const log = createLogger('userWallet.ts');
export async function getWalletDashboard(
    req: Request,
    res: Response
): Promise<Response> {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;
    if (!userId) {
        throw AppError.unauthorized('Unauthorized access');
    }
    try {
        let wallet = await prisma.wallet.findUnique({
            where: { userId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: {
                    userId,
                    ballance: 0.0,
                    currency: 'KES',
                },
                include: {
                    transactions: true,
                },
            });
        }
        //calculate aggregate metrics for the dashboards
        const aggregateStats = await prisma.walletTransaction.aggregate({
            where: {
                walletId: wallet.id,
                status: 'SUCCESS',
            },
            _sum: {
                amount: true,
            },
        });
        const topUpSum = await prisma.walletTransaction.aggregate({
            where: {
                walletId: wallet.id,
                type: 'TOPUP',
                status: 'SUCCESS',
            },
            _sum: {
                amount: true,
            },
        });
        const refundSum = await prisma.walletTransaction.aggregate({
            where: {
                walletId: wallet.id,
                type: 'REFUND',
                status: 'SUCCESS',
            },
            _sum: { amount: true },
        });
        const purchaseSum = await prisma.walletTransaction.aggregate({
            where: {
                walletId: wallet.id,
                type: 'PURCHASE',
                status: 'SUCCESS',
            },
            _sum: {
                amount: true,
            },
        });
        return res.status(200).json({
            success: true,
            data: {
                balance: wallet.balance,
                currency: wallet.currency,
                stats: {
                    aggregateStats: aggregateStats._sum.amount ?? 0,
                    totalTopUps: topUpSum._sum.amount ?? 0,
                    totalRefunds: refundSum._sum.amount ?? 0,
                    totalPurchases: Math.abs(purchaseSum._sum.amount ?? 0),
                },
                recentTransactions: wallet.transactions.slice(0, 10),
            },
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
        log.error(`Failed to fetch wallet dashboard: ${errorMessage}`);
        throw AppError.badRequest(errorMessage);
    }
}
export async function getWalletTransactions(
    req: Request,
    res: Response
): Promise<Response> {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;
    const { type, status, page = '1', limit = '10' } = req.query;
    if (!userId) {
        throw AppError.unauthorized('Unauthorized access');
    }
    try {
        const wallet = await prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            throw AppError.notFound('Wallet not found');
        }
        const pageNumber = parseInt(page as string, 10) || 1;
        const pageSize = parseInt(limit as string, 10) || 10;
        const skip = (pageNumber - 1) * pageSize;

        const whereClause: Record<string, unknown> = { walletId: wallet.id };
        if (type && type !== 'ALL') {
            whereClause.type = type as TransactionType;
        }

        if (status && status !== 'ALL') {
            whereClause.status = status as TransactionStatus;
        }
        const [transactions, totalCount] = await Promise.all([
            prisma.walletTransaction.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            prisma.walletTransaction.count({ where: whereClause }),
        ]);
        return res.status(200).json({
            success: true,
            data: {
                transactions,
                pagination: {
                    total: totalCount,
                    page: pageNumber,
                    limit: pageSize,
                    totalPages: Math.ceil(totalCount / pageSize),
                },
            },
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
        log.error(`Failed to fetch wallet transactions: ${errorMessage}`);
        throw AppError.badRequest(errorMessage);
    }
}
export async function getTransactionReceipt(
    req: Request,
    res: Response
): Promise<Response> {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;
    const transactionId = req.params.transactionId as string;
    if (!userId) {
        throw AppError.unauthorized('Unauthorized access');
    }
    try {
        const wallet = await prisma.wallet.findUnique({
            where: { userId },
        });

        if (!wallet) {
            throw AppError.notFound('Wallet not found');
        }
        const transaction = await prisma.walletTransaction.findFirst({
            where: {
                id: transactionId,
                walletId: wallet.id,
            },
        });
        if (!transaction) {
            throw AppError.notFound('Transaction receipt not found');
        }

        return res.status(200).json({
            success: true,
            data: transaction,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
        log.error(`Failed to fetch transaction receipt: ${errorMessage}`);
        throw AppError.badRequest(errorMessage);
    }
}
