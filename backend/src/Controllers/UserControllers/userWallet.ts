import type { Request, Response } from 'express';

import type {
    TransactionStatus,
    TransactionType,
} from '../../../../shared/sharedTypes.js';
import { prisma } from '../../Config/DB.js';
import PayheroService from '../../Services/paymentService.js';
import type { AuthenticatedRequest } from '../../Types/auth.js';
import AppError from '../../Utils/appError.js';
import createLogger from '../../Utils/logger.js';
import { validateKenyanPhoneNumber } from '../../Utils/phoneNumberValidator.js';

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
                    balance: 0.0,
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
async function finalizeWalletTopUp(
    transactionId: string,
    status: 'SUCCESS' | 'FAILED'
): Promise<void> {
    await prisma.$transaction(async (tx) => {
        const transaction = await tx.walletTransaction.findUnique({
            where: { id: transactionId },
        });
        if (!transaction || transaction.status === 'SUCCESS') return;

        await tx.walletTransaction.update({
            where: { id: transaction.id },
            data: {
                status,
                transactionStatus: status,
                webhookReceived: true,
                completedAt: status === 'SUCCESS' ? new Date() : null,
            },
        });
        if (status === 'SUCCESS') {
            await tx.wallet.update({
                where: { id: transaction.walletId },
                data: { balance: { increment: transaction.amount } },
            });
        }
    });
}

export async function topUpWallet(
    req: Request,
    res: Response
): Promise<Response> {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const { phoneNumber: rawPhoneNumber, idempotentKey, amount: rawAmount } = req.body as {
        phoneNumber?: string;
        idempotentKey?: string;
        amount?: number;
    };
    const idempotencyKey = (req.header('Idempotency-Key') || idempotentKey) as
        | string
        | undefined;
    if (!userId) {
        throw AppError.unauthorized('Unauthorized access');
    }
    if (typeof rawAmount !== 'number' || !Number.isFinite(rawAmount) || rawAmount <= 0) {
        throw AppError.badRequest('Top up amount is required');
    }
    const amount = rawAmount;
    if (!idempotencyKey) {
        throw AppError.badRequest('Configuration error');
    }
    if (!rawPhoneNumber) {
        throw AppError.badRequest('Phone number is required');
    }
    const phoneNumber = rawPhoneNumber;
    const phoneValidation = validateKenyanPhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
        throw AppError.badRequest(
            phoneValidation.error || 'Invalid phone number format'
        );
    }
    if (idempotencyKey) {
        const existingTx = await prisma.walletTransaction.findUnique({
            where: {
                idempotencyKey,
            },
        });
        if (existingTx) {
            const wallet = await prisma.wallet.findUnique({
                where: {
                    id: existingTx.walletId,
                },
                include: {
                    transactions: true,
                },
            });
            return res.status(200).json({
                success: true,
                message: 'Existing top-up request returned (idempotent)',
                data: {
                    reference: existingTx?.reference,
                    checkoutRequestId: existingTx.checkoutRequestId,
                    data: {
                        balance: wallet?.balance,
                        recentTransactions: wallet?.transactions.slice(0, 10),
                    },
                },
            });
        }
    }
    try {
        const response = await PayheroService.initiatePayment({
            amount: Math.floor(amount),
            phone_number: phoneValidation.normalizedNumber,
            external_reference: `${userId}-${Date.now()}`,
            customer_name: 'Freshdrop user',
            callback_url: `${process.env.BACKEND_URL || 'http://localhost:4400'}/api/user/wallet/top-up/webhook`,
        });
        const wallet = await prisma.wallet.upsert({
            where: { userId },
            update: {},
            create: { userId, balance: 0, currency: 'KES' },
        });
        const transaction = await prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                amount: Math.floor(amount),
                type: 'TOPUP',
                status: 'PENDING',
                transactionStatus: response.status,
                idempotencyKey,
                checkoutRequestId: response.CheckoutRequestID,
                reference: response.reference,
                description: 'Wallet top up',
            },
        });
        return res.status(200).json({
            success: true,
            message: 'Wallet top-up initiated. Confirm the prompt on your phone.',
            data: {
                transactionId: transaction.id,
                reference: transaction.reference,
                checkoutRequestId: transaction.checkoutRequestId,
                status: transaction.status,
            },
        });
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown server error';
        log.error(`failed to top up wallet: ${errorMessage}`);
        throw AppError.badRequest(errorMessage);
    }
}

export async function walletWebhook(
    req: Request,
    res: Response
): Promise<Response> {
    const {
        reference: rawReference,
        payment_reference,
        third_party_reference,
        status,
        success,
    } = req.body as {
        reference?: string;
        payment_reference?: string;
        third_party_reference?: string;
        status?: string;
        success?: boolean;
    };
    const reference =
        rawReference || payment_reference || third_party_reference;
    if (!reference) {
        throw AppError.badRequest('Unable to process wallet top up');
    }
    const transaction = await prisma.walletTransaction.findFirst({
        where: { reference },
    });
    if (!transaction) {
        throw AppError.notFound('Wallet top-up transaction not found');
    }
    if (success && status === 'SUCCESS') {
        await finalizeWalletTopUp(transaction.id, 'SUCCESS');
    } else if (status === 'FAILED') {
        await finalizeWalletTopUp(transaction.id, 'FAILED');
    }
    return res.status(200).json({
        success: true,
        message: 'Wallet top-up status processed',
    });
}

export async function walletTopUpStatus(
    req: Request,
    res: Response
): Promise<Response> {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const referenceParam = req.params.reference;
    if (!userId) throw AppError.unauthorized('Unauthorized access');
    if (typeof referenceParam !== 'string' || !referenceParam) {
        throw AppError.badRequest('Transaction reference is required');
    }
    const reference = referenceParam;

    const transaction = await prisma.walletTransaction.findFirst({
        where: { reference, wallet: { userId } },
    });
    if (!transaction) throw AppError.notFound('Wallet top-up not found');
    if (transaction.status === 'PENDING') {
        const gatewayStatus = await PayheroService.getTransactionStatus(reference);
        if (gatewayStatus.status === 'SUCCESS' || gatewayStatus.status === 'FAILED') {
            await finalizeWalletTopUp(transaction.id, gatewayStatus.status);
        }
    }
    const current = await prisma.walletTransaction.findUnique({
        where: { id: transaction.id },
    });
    return res.status(200).json({
        success: current?.status === 'SUCCESS',
        data: {
            status: current?.status,
            reference: current?.reference,
            amount: current?.amount,
        },
    });
}
