import type { Request, Response } from 'express';
import { Router } from 'express';

import { STRATEGY_SERVICE_FEE } from '../../../shared/constants.js';
//remember to add an authenticator base don how better auth handles it
import type { CartItem } from '../../../shared/sharedTypes.js';
//import { calculateServiceCharge } from '../../../frontend/src/Utils/calculations.js';
import { prisma } from '../Config/DB.js';
import asyncHandler from '../Middleware/asyncHandler.js';
import authenticate from '../Middleware/authenticate.js';
import PayheroService from '../Services/paymentService.js';
import type { AuthenticatedRequest } from '../Types/auth.js';
import type { CheckoutRequestBody } from '../Types/products.js';
import AppError from '../Utils/appError.js';
import createLogger from '../Utils/logger.js';
import { validateKenyanPhoneNumber } from '../Utils/phoneNumberValidator.js';

const log = createLogger('PaymentRoute.ts');
export const paymentRoute: Router = Router();
paymentRoute.post(
    '/initiate',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const {
            customerCoordinates,
            apartmentName,
            deliveryFee,
            distanceKm,
            houseNumber,
            landmark,
            phoneNumber,
            deliveryDestination,
            items,
        } = req.body as CheckoutRequestBody;

        const authReq = req as AuthenticatedRequest;
        const userId = authReq.user?.id;
        if (!userId) {
            throw AppError.unauthorized('Unauthorized user');
        }

        if (!phoneNumber) {
            throw AppError.badRequest('Phone number is required');
        }
        if (!deliveryFee) {
            throw AppError.badRequest('Kindly enter your delivery destination');
        }
        if (!deliveryDestination) {
            throw AppError.badRequest('Kindly enter your delivery destination');
        }
        if (!items || items.length === 0) {
            throw AppError.badRequest('Shopping basket items cannot be empty');
        }
        if (!customerCoordinates) {
            log.debug(`this are the customer coordinates`, {
                data: { customerCoordinates },
            });
            throw AppError.badRequest(
                'Valid coordinates are required to calculate delivery routing'
            );
        }
        if (!apartmentName || !houseNumber) {
            throw AppError.badRequest(
                'Specific apartment building name and room number are mandatory'
            );
        }

        const phoneValidation = validateKenyanPhoneNumber(phoneNumber);
        if (!phoneValidation.isValid) {
            throw AppError.badRequest(
                phoneValidation.error || 'Invalid phone number format '
            );
        }
        //dynamic supplier lookup(with fallback routing capability)
        const operationalHub = await prisma.hub.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
        });
        if (!operationalHub) {
            throw AppError.serviceUnavailable(
                'Freshdrop distribution hubs are currently unavailable'
            );
        }
        const { lat, lng } = customerCoordinates;
        const customerLatitude = lat;
        const customerLongitude = lng;
        //TO DO: Re-calculate everything for security purposes

        const itemsSubtotal = items.reduce(
            (sum, item) => sum + item.product.localPrice * item.quantity,
            0
        );
        log.debug(
            `The item subtotal: ${itemsSubtotal}, Strategy service fee: ${STRATEGY_SERVICE_FEE}, delivery fee: ${deliveryFee}. Items payload: ${JSON.stringify(items)}`
        );
        const overallTotalDue =
            itemsSubtotal + STRATEGY_SERVICE_FEE + deliveryFee;
        log.debug(
            `This is the total amount calculated from the backend ${overallTotalDue}`
        );
        const orderReference = `ORD-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

        log.info(
            `Processing Checkout: User ${userId} via Hub ${operationalHub.name}. Distance: ${distanceKm}km. Total: KSh ${overallTotalDue}`
        );

        // 5. Trigger Payhero M-Pesa STK Push Integration
        log.info('Initiating Payhero payment gateway gateway handshake...');
        try {
            const response = await PayheroService.initiatePayment({
                amount: Math.floor(overallTotalDue),
                phone_number: phoneValidation.normalizedNumber,
                external_reference: `${userId}-${Date.now()}`,
                customer_name: 'Test user',
                callback_url: `${process.env.BACKEND_URL || 'http://localhost:4400'}/api/payments/webhook`,
            });
            log.debug('Payhero Response', { data: { response } });
            //using nested writes to atomically persist everything down to postgres
            const newOrder = await prisma.order.create({
                data: {
                    userId,
                    hubId: operationalHub.id,
                    reference: orderReference,
                    deliveryDestination,
                    apartmentName,
                    houseNumber,
                    landmark,
                    customerLongitude,
                    customerLatitude,
                    subtotal: itemsSubtotal,
                    serviceFee: STRATEGY_SERVICE_FEE,
                    deliveryFee: deliveryFee,

                    totalAmount: overallTotalDue,
                    status: 'PENDING',
                    items: {
                        create: items.map((item: CartItem) => ({
                            productName: item.product.name,
                            quantity: item.quantity,
                            priceAtPurchase: item.product.localPrice,
                            product: {
                                connect: { id: item.product.id },
                            },
                        })),
                    },
                    payments: {
                        create: [
                            // Fixed: Wrapped in an array to align w`ith the many relation schema
                            {
                                userId,
                                reference: response.reference,
                                checkoutRequestId: response.CheckoutRequestID,
                                status: 'QUEUED',
                                amount: overallTotalDue,
                            },
                        ],
                    },
                },
                include: { items: true },
            });
            log.highlight(
                `Order context initialized cleanly: ${newOrder.reference} | Gateway Ref: ${response.reference}`
            );

            // 7. Structure Clear UI Feedback
            res.status(201).json({
                success: true,
                message:
                    'Payment push transmitted. Check your handset device to enter your M-Pesa PIN.',
                data: {
                    orderReference: newOrder.reference,
                    paymentReference: response.reference,
                    checkoutRequestId: response.CheckoutRequestID,
                    logisticsSummary: {
                        distanceKm,
                        deliveryFee: deliveryFee,
                        serviceFee: STRATEGY_SERVICE_FEE,
                        totalAmount: overallTotalDue,
                    },
                },
            });
        } catch (error: unknown) {
            const msg =
                error instanceof Error
                    ? error.message
                    : 'Unknown payment routing fault ';
            log.error(`Checkout transaction instantiation collapsed: ${msg}`);
            log.error('Error form ', { data: { error } });
            throw error;
        }
    })
);
paymentRoute.post(
    '/webhook',
    authenticate,
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
                log.warn(
                    `Webhook  dropped: Transaction reference ${reference} not flagged in the system`
                );
                throw AppError.badRequest(
                    'Webhook Unable to complete payment process'
                );
            }
            if (success && status === 'SUCCESS') {
                //atomic operations block updating transaction logs and setting order state to PAID
                await prisma.$transaction([
                    prisma.paymentTransaction.update({
                        where: { id: transaction.orderId },
                        data: { status: 'SUCCESS', webhookReceived: true },
                    }),
                    prisma.order.update({
                        where: { id: transaction.orderId },
                        data: { status: 'PAID' },
                    }),
                ]);
                log.highlight(
                    `Order context ${transaction.orderId} marked PAID successfully`
                );
            } else {
                await prisma.$transaction([
                    prisma.paymentTransaction.update({
                        where: { id: transaction.id },
                        data: {
                            status: status || 'FAILED',
                            webhookReceived: true,
                        },
                    }),
                    prisma.order.update({
                        where: { id: transaction.id },
                        data: { status: 'CANCELLED' },
                    }),
                ]);
                log.warn(`Order context ${transaction.id} routes int failure`);
            }
            return res.status(200).json({
                success: true,
                message: 'Status mapped successfully ',
            });
        }
    )
);
paymentRoute.get(
    '/status/:reference',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const { reference } = req.params;
        const authReq = req as AuthenticatedRequest;
        const userId = authReq?.user?.id;
        if (!userId) {
            throw AppError.unauthorized('Unauthorized user');
        }
        if (!reference || typeof reference !== 'string') {
            throw AppError.badRequest('Invalid reference');
        }
        const transaction = await prisma.paymentTransaction.findUnique({
            where: {
                reference: reference,
            },
        });
        if (!transaction) {
            throw AppError.notFound('Transaction not found');
        }
        if (transaction.userId !== userId) {
            throw AppError.unauthorized(
                "You don't have permission to check this transaction"
            );
        }
        // If webhook already finalized it, immediately return the cached database value
        if (transaction.webhookReceived) {
            return res.status(200).json({
                success: true,
                data: {
                    status: transaction.status,
                    reference: transaction.reference,
                    amount: transaction.amount,
                },
            });
        }
        // Fallback: Query gateway directly if webhook is experiencing network delays
        try {
            const status = await PayheroService.getTransactionStatus(reference);
            if (
                //status.success &&
                status.status === 'SUCCESS'
                //!transaction.completedAt
            ) {
                const updatedTransaction =
                    await prisma.paymentTransaction.update({
                        where: { reference },
                        data: {
                            status: status.status,
                            completedAt: new Date(),
                        },
                    });
                return res.status(200).json({
                    success: true,
                    data: {
                        status: updatedTransaction.status,
                        reference: updatedTransaction.reference,
                        amount: updatedTransaction.amount,
                    },
                });
            } else if (status.status === 'FAILED') {
                const failedTransaction =
                    await prisma.paymentTransaction.update({
                        where: { reference },
                        data: {
                            status: status.status,
                        },
                    });
                //i am return ing a 200 coz i need the transaction status to be read from the frontend as a failed and this is impossible to do if the status is 503 as it goes to the catch block which then wont reach the if statement in the frontend
                return res.status(200).json({
                    success: false,
                    data: {
                        status: status.status,
                        reference: failedTransaction.reference,
                    },
                });
            } else {
                log.warn(
                    `Status unchanged (${transaction.status}). Skipping DB write`,
                    { context: 'TransactionStatus' }
                );
                return res.status(200).json({
                    success: true,
                    data: {
                        status: transaction.status,
                        reference: transaction.reference,
                        amount: transaction.amount,
                    },
                });
            }
        } catch (error: unknown) {
            const msg =
                error instanceof Error
                    ? error.message
                    : 'Unknown payment routing fault ';

            log.error('Error form ', { data: { error } });
            log.error(`Checkout transaction instantiation collapsed: ${msg}`);
            throw error;
        }
    })
);
