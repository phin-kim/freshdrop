import type { Request, Response } from 'express';
import { Router } from 'express';
import { includes } from 'zod';

import { calculateServiceCharge } from '../../../frontend/src/Utils/calculations.js';
import { prisma } from '../Config/DB.js';
import asyncHandler from '../Middleware/asyncHandler.js';
import PayheroService from '../Services/paymentService.js';
//remember to add an authenticator base don how better auth handles it
import AppError from '../Utils/appError.js';
import {
    CartItemInput,
    calculateOrderTotals,
} from '../Utils/costCalculation.js';
import createLogger from '../Utils/logger.js';
import { validateKenyanPhoneNumber } from '../Utils/phoneNumberValidator.js';

const log = createLogger('PaymentRoute.ts');
interface CheckoutRequestBody {
    phoneNumber: string;
    deliveryDestination: string;
    items: CartItemInput[];
}
export const paymentRoute: Router = Router();
paymentRoute.post(
    '/initiate',
    asyncHandler(async (req: Request, res: Response) => {
        const { phoneNumber, deliveryDestination, items } =
            req.body as CheckoutRequestBody;
        //temporary userid
        const userId = crypto.randomUUID();
        //check the user id via the better auth
        if (!phoneNumber) {
            throw AppError.badRequest('Phone number is required');
        }
        if (!items) {
            throw AppError.badRequest('Amount is required');
        }

        const phoneValidation = validateKenyanPhoneNumber(phoneNumber);
        if (!phoneValidation.isValid) {
            throw AppError.badRequest(
                phoneValidation.error || 'Invalid phone number format '
            );
        }
        const { subtotal, serviceFee, totalDue } = calculateOrderTotals(items);
        const orderReference = `ord-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

        log.info(
            `Processing Checkout for User ${userId}. Total: KSh ${totalDue}`
        );

        log.info('Initiating payment ...');
        try {
            const response = await PayheroService.initiatePayment({
                amount: Math.floor(totalDue),
                phone_number: phoneValidation.normalizedNumber,
                external_reference: `${userId}-${Date.now()}`,
                customer_name: 'Test user',
                callback_url: `${process.env.BACKEND_URL || 'http://localhost:4400'}/api/payments/webhook`,
            });
            //using nested writes to atomically persist everything down to postgres
            const newOrder = await prisma.order.create({
                data: {
                    userId,
                    reference: orderReference,
                    deliveryDestination,
                    subtotal,
                    serviceFee,
                    totalAmount: totalDue,
                    status: 'PENDING',
                    items: {
                        create: items.map((item: CartItemInput) => ({
                            productName: item.productName,
                            quantity: item.quantity,
                            priceAtPurchase: item.quantity,
                        })),
                    },
                    payments: {
                        create: {
                            reference: response.reference,
                            checkoutRequestId: response.CheckoutRequestId,
                            status: 'QUEUED',
                            amount: totalDue,
                        },
                    },
                },
                include: { items: true },
            });
            log.highlight(
                `Payment initiated successfully: ${response.reference}`,
                {
                    context: 'PaymentInitiation',
                    data: {
                        reference: response.reference,
                        status: response.status,
                    },
                }
            );
            res.status(201).json({
                success: true,
                message:
                    'Payment initiated. Please complete the transaction on your phone.',
                data: {
                    reference: newOrder.reference,
                    status: response.status,
                    checkoutRequestId: response.CheckoutRequestId,
                },
            });
        } catch (error: unknown) {
            const msg =
                error instanceof Error
                    ? error.message
                    : 'Unknown payment routing fault ';
            log.error(`Checkout transaction instantiation collapsed: ${msg}`);
            throw error;
        }
    })
);
paymentRoute.post(
    '/webhook',
    asyncHandler(
        async (req: Request, res: Response): Promise<Response | null> => {
            const { reference, status, success } = req.body;
            if (!reference) {
                log.error('Missing transaction reference');
                throw AppError.badRequest('Unable to process payment');
            }
            const transaction = await prisma.paymentTransaction.findUnique({
                where: { reference },
            });
            if (!transaction) {
                log.warn(`Webhook  dropped:`);
            }
        }
    )
);
