import type { Request, Response } from 'express';
import { Router } from 'express';

import {
    BASE_DELIVERY_FEE,
    PER_KM_RATE,
    STRATEGY_SERVICE_FEE,
} from '../../../shared/constants.js';
//import { calculateServiceCharge } from '../../../frontend/src/Utils/calculations.js';
import { prisma } from '../Config/DB.js';
import asyncHandler from '../Middleware/asyncHandler.js';
import authenticate from '../Middleware/authenticate.js';
import { getDrivingDistance } from '../Services/mapboxService.js';
import PayheroService from '../Services/paymentService.js';
import type { AuthenticatedRequest } from '../Types/auth.js';
import { CartItemInput, CheckoutRequestBody } from '../Types/products.js';
//remember to add an authenticator base don how better auth handles it
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
            buildingDetails,
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
        if (!items || items.length === 0) {
            throw AppError.badRequest('Shopping basket items cannot be empty');
        }
        if (!customerCoordinates || customerCoordinates.length !== 2) {
            throw AppError.badRequest(
                'Valid coordinates are required to calculate delivery routing'
            );
        }
        if (!buildingDetails || !houseNumber) {
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
        const operationalHub = await prisma.supplier.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
        });
        if (!operationalHub) {
            throw AppError.serviceUnavailable(
                'Freshdrop distribution hubs are currently unavailable'
            );
        }

        const supplierCoordinates: [number, number] = [
            operationalHub.longitude,
            operationalHub.latitude,
        ];
        const distanceKm = await getDrivingDistance(
            supplierCoordinates,
            customerCoordinates
        );
        let calculatedDeliveryFee = BASE_DELIVERY_FEE;
        if (distanceKm > 2) {
            calculatedDeliveryFee += (distanceKm - 2) * PER_KM_RATE;
        }
        const itemsSubtotal = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
        const overallTotalDue =
            itemsSubtotal + STRATEGY_SERVICE_FEE + calculatedDeliveryFee;

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
            //using nested writes to atomically persist everything down to postgres
            const newOrder = await prisma.order.create({
                data: {
                    userId,
                    supplierId: operationalHub.id,
                    reference: orderReference,
                    deliveryDestination,
                    buildingDetails,
                    houseNumber,
                    landmark,
                    customerLongitude: customerCoordinates[0],
                    customerLatitude: customerCoordinates[1],
                    subtotal: itemsSubtotal,
                    serviceFee: STRATEGY_SERVICE_FEE,
                    deliveryFee: calculatedDeliveryFee,

                    totalAmount: overallTotalDue,
                    status: 'PENDING',
                    items: {
                        create: items.map((item: CartItemInput) => ({
                            productName: item.productName,
                            quantity: item.quantity,
                            priceAtPurchase: item.quantity,
                        })),
                    },
                    payments: {
                        create: [
                            // Fixed: Wrapped in an array to align w`ith the many relation schema
                            {
                                userId,
                                reference: response.reference,
                                checkoutRequestId: response.CheckoutRequestId,
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
                    checkoutRequestId: response.CheckoutRequestId,
                    logisticsSummary: {
                        distanceKm,
                        deliveryFee: calculatedDeliveryFee,
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
