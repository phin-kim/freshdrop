import type { Request, Response } from 'express';

import {
    STRATEGY_SERVICE_FEE,
    THREE_STOP_SURCHARGE,
    TWO_STOP_SURCHARGE,
} from '../../../shared/constants';
import type { CartItem } from '../../../shared/sharedTypes';
import { prisma } from '../Config/DB.js';
import { fulfillOrderAndDispatch } from '../Helpers/idempotentOrder';
import { NotificationService } from '../Services/notificationService';
import PayheroService from '../Services/paymentService.js';
import type { AuthenticatedRequest } from '../Types/auth';
import type { CheckoutRequestBody } from '../Types/products';
import AppError from '../Utils/appError';
import { calculateFinancials } from '../Utils/costCalculation';
import createLogger from '../Utils/logger';
import { validateKenyanPhoneNumber } from '../Utils/phoneNumberValidator';
import { Prisma } from '../generated/prisma/client';

const log = createLogger('PaymentController.ts');
// Maps product sourcing types to their corresponding database hub slugs

export async function initiatePayment(req: Request, res: Response) {
    const {
        customerCoordinates,
        apartmentName,
        deliveryFee,
        distanceKm,
        houseNumber,
        landmark,
        unavailableAction,
        phoneNumber,
        deliveryDestination,
        items,
        idempotentKey,
    } = req.body as CheckoutRequestBody;
    log.debug(`apartment name ${apartmentName}`);
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const idempotencyKey = (req.header('Idempotency-Key') || idempotentKey) as
        | string
        | undefined;
    if (!userId) {
        throw AppError.unauthorized('Unauthorized user');
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
    if (!unavailableAction) {
        throw AppError.badRequest(
            'Kindly select the action to be taken if item not found'
        );
    }
    if (!customerCoordinates) {
        log.debug(`this are the customer coordinates`, {
            data: { customerCoordinates },
        });
        throw AppError.badRequest(
            'Valid coordinates are required to calculate delivery routing'
        );
    }
    log.debug(
        `The house number ${houseNumber} and apartment name ${apartmentName}`
    );
    if (!apartmentName || !houseNumber) {
        throw AppError.badRequest(
            'Specific apartment building name and room number are mandatory'
        );
    }
    log.debug('INITIATE REQUEST BODY', {
        data: {
            rawPhone: req.body.phoneNumber,
            body: req.body,
            idempotencyKey,
            headerIdempotencyKey: req.header('Idempotency-Key'),
        },
    });

    const phoneValidation = phoneNumber
        ? validateKenyanPhoneNumber(phoneNumber)
        : null;
    log.debug('PHONE VALIDATION', {
        data: {
            rawPhone: phoneNumber,
            normalized: phoneValidation?.normalizedNumber,
            valid: phoneValidation?.isValid,
            error: phoneValidation?.error,
        },
    });
    //dynamic supplier lookup(with fallback routing capability)
    const { lat, lng } = customerCoordinates;
    const customerLatitude = lat;
    const customerLongitude = lng;

    // 1. Map Sourcing Types to retrieve our DB Hub IDs
    // 1. Extract unique store slugs or hub identifiers directly from items
    const targetStoreSlugs: string[] = [
        ...new Set(
            items.flatMap((item) => {
                const slugs: string[] = [];

                if (item.product.storeSlug) slugs.push(item.product.storeSlug);
                if (item.product?.storeSlug) slugs.push(item.product.storeSlug);

                // Pull from storeConfigs array structure if present
                const configs = item.product?.storeConfigs;
                if (Array.isArray(configs)) {
                    configs.forEach((config) => {
                        if (config?.store?.slug) slugs.push(config.store.slug);
                    });
                }

                // Fallback for legacy sourcing types if any exist in older payloads
                const legacyType =
                    item.product.sourcingType || item.product?.sourcingType;
                if (legacyType && typeof legacyType === 'string') {
                    slugs.push(legacyType.toUpperCase());
                }

                return slugs;
            })
        ),
    ]
        .map((slug) => String(slug).toUpperCase())
        .filter(Boolean);

    if (targetStoreSlugs.length === 0) {
        throw AppError.badRequest(
            'Items must contain valid store or sourcing references.'
        );
    }

    // 2. Fetch matching stores and their parent distribution hubs from the database
    const stores = await prisma.store.findMany({
        where: { slug: { in: targetStoreSlugs } },
        include: { hub: true },
    });

    if (stores.length === 0) {
        throw AppError.notFound('No active stores match your items.');
    }

    // 3. Extract unique parent hub IDs and verify they are active
    const activeHubIds = [
        ...new Set(stores.map((s) => s.hubId).filter(Boolean)),
    ];
    const activeHubs = await prisma.hub.findMany({
        where: { id: { in: activeHubIds }, isActive: true },
    });

    if (activeHubs.length === 0) {
        throw AppError.serviceUnavailable(
            'The distribution hubs required for your items are currently unavailable'
        );
    }
    const itemsSubtotal = items.reduce(
        (sum, item) => sum + item.product.localPrice * item.quantity,
        0
    );
    // 2. Locate the Saved Address row for this user to fetch secure cached fees
    /*const savedAddress = await prisma.savedAddress.findFirst({
        where: {
            userId,
            customerLatitude,
            customerLongitude,
        },
    });
    if (savedAddress) {
        const cachedFees = await prisma.hubDeliveryFee.findMany({
            where: {
                addressId: savedAddress.id,
                hubId: { in: activeHubs.map((h) => h.id) },
            },
        });

        if (cachedFees.length > 0) {
            const highestBaseFee = Math.max(
                ...cachedFees.map((f) => Number(f.deliveryFee))
            );
            let multiStoreSurcharge = 0;

            if (stores.length === 2) {
                // 2 unique stores in cart (e.g., Quickmart + Naivas)
                multiStoreSurcharge = 120.0;
            } else if (stores.length >= 3) {
                // 3 unique stores in cart (e.g., Quickmart + Naivas + Open Market)
                multiStoreSurcharge = 250.0;
            }
            secureDeliveryFee = highestBaseFee + multiStoreSurcharge;
        }
    }*/
    //TO DO: Re-calculate everything for security purposes

    const financialSnapshot = calculateFinancials(
        distanceKm,
        stores.length,
        itemsSubtotal
    );
    const overallTotalDue = financialSnapshot.totalAmount;
    const secureDeliveryFee = financialSnapshot.deliveryFee;
    log.debug('Initiate payload', {
        data: {
            amount: Math.floor(overallTotalDue),
            phone: phoneValidation?.normalizedNumber,
            external_reference: `${userId}-${Date.now()}`,
            callback_url: `${process.env.BACKEND_URL || 'http://localhost:4400'}/api/payments/webhook`,
            idempotencyKey,
        },
    });
    const orderReference = `ORD-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    log.info(`Processing Checkout:`, {
        data: {
            userId: userId,
            involvedHubs: activeHubs.map((h) => h.name).join(', '),
            Distance: distanceKm,
            totalCost: overallTotalDue,
        },
    });
    const deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();

    /*if (idempotencyKey) {
        const existingWalletTransaction =
            await prisma.walletTransaction.findUnique({
                where: { idempotencyKey },
            });
        if (existingWalletTransaction?.type === 'PURCHASE') {
            return res.status(200).json({
                success: true,
                message: 'Existing wallet payment returned (idempotent).',
                data: {
                    paymentMethod: 'WALLET',
                    orderReference: existingWalletTransaction.reference,
                    status: existingWalletTransaction.status,
                },
            });
        }
    }*/

    // Re-check the wallet at payment time, then debit it atomically with the order.
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (wallet && wallet.balance >= overallTotalDue) {
        try {
            const walletOrder = await prisma.$transaction(async (tx) => {
                const currentWallet = await tx.wallet.findUnique({
                    where: { userId },
                });
                if (!currentWallet || currentWallet.balance < overallTotalDue) {
                    return null;
                }
                const order = await tx.order.create({
                    data: {
                        userId,
                        deliveryPin,
                        reference: orderReference,
                        deliveryDestination,
                        apartmentName,
                        houseNumber,
                        landmark,
                        customerLongitude,
                        customerLatitude,
                        unavailableAction: unavailableAction.toUpperCase() as
                            | 'REFUND'
                            | 'REPLACE',

                        status: 'PAID',
                        hubs: {
                            connect: activeHubs.map((hub) => ({ id: hub.id })),
                        },
                        items: {
                            create: items.map((item: CartItem) => ({
                                productName: item.product.name,
                                quantity: item.quantity,
                                priceAtPurchase: item.product.localPrice,
                                product: { connect: { id: item.product.id } },
                            })),
                        },
                        financials: {
                            create: financialSnapshot,
                        },
                    },
                });
                await tx.wallet.update({
                    where: { id: currentWallet.id },
                    data: { balance: { decrement: overallTotalDue } },
                });
                await tx.walletTransaction.create({
                    data: {
                        walletId: currentWallet.id,
                        amount: overallTotalDue,
                        type: 'PURCHASE',
                        status: 'SUCCESS',
                        transactionStatus: 'SUCCESS',
                        idempotencyKey,
                        reference: orderReference,
                        description: `Payment for order ${orderReference}`,
                        completedAt: new Date(),
                    },
                });
                return order;
            });
            if (walletOrder) {
                await fulfillOrderAndDispatch(walletOrder.id);
                return res.status(200).json({
                    success: true,
                    message: 'Order paid successfully using wallet balance.',
                    data: {
                        paymentMethod: 'WALLET',
                        orderReference: walletOrder.reference,
                        status: 'SUCCESS',
                        logisticsSummary: {
                            distanceKm,
                            deliveryFee: secureDeliveryFee,
                            serviceFee: STRATEGY_SERVICE_FEE,
                            totalAmount: overallTotalDue,
                        },
                    },
                });
            }
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                const existingOrder = await prisma.order.findFirst({
                    where: { reference: orderReference },
                });
                if (existingOrder) {
                    return res.status(200).json({
                        success: true,
                        data: {
                            paymentMethod: 'WALLET',
                            orderReference,
                            status: 'SUCCESS',
                        },
                    });
                }
            }
            throw error;
        }
    }
    if (!phoneValidation?.isValid) {
        throw AppError.badRequest(
            phoneValidation?.error || 'Phone number is required for STK payment'
        );
    }
    // 5. Trigger Payhero M-Pesa STK Push Integration
    if (idempotencyKey) {
        const existingTx = await prisma.paymentTransaction.findUnique({
            where: { idempotencyKey },
        });
        if (existingTx) {
            const order = await prisma.order.findUnique({
                where: { id: existingTx.orderId },
                include: { items: true, payments: true },
            });
            return res.status(200).json({
                success: true,
                message: 'Existing payment request returned (idempotent)',
                data: {
                    orderReference: order?.reference,
                    paymentReference: existingTx.reference,
                    checkoutRequestId: existingTx.checkoutRequestId,
                    logisticsSummary: {
                        distanceKm,
                        deliveryFee: secureDeliveryFee,
                        serviceFee: STRATEGY_SERVICE_FEE,
                        totalAmount: overallTotalDue,
                    },
                },
            });
        }
    }
    log.info('Initiating Payhero payment gateway gateway handshake...');
    try {
        const response = await PayheroService.initiatePayment({
            amount: Math.floor(overallTotalDue),
            phone_number: phoneValidation.normalizedNumber,
            external_reference: `${userId}-${Date.now()}`,
            customer_name: 'freshdrop user',
            callback_url: `${process.env.BACKEND_URL || 'http://localhost:4400'}/api/payments/webhook`,
        });
        //log.debug('Payhero Response', { data: { response } });
        log.debug('PAYHERO RESPONSE', {
            data: {
                reference: response.reference,
                checkoutRequestId: response.CheckoutRequestID,
                response,
            },
        });
        //using nested writes to atomically persist everything down to postgres
        const newOrder = await prisma.order.create({
            data: {
                userId,
                deliveryPin,
                reference: orderReference,
                deliveryDestination,
                apartmentName,
                houseNumber,
                landmark,
                customerLongitude,
                customerLatitude,
                unavailableAction: unavailableAction
                    ? (unavailableAction.toUpperCase() as 'REFUND' | 'REPLACE')
                    : 'REFUND',

                status: 'PENDING',
                // Link the order to all involved hubs via many-to-many relationship
                hubs: {
                    connect: activeHubs.map((hub) => ({ id: hub.id })),
                },
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
                financials: {
                    create: financialSnapshot,
                },
                payments: {
                    create: [
                        // Fixed: Wrapped in an array to align w`ith the many relation schema
                        {
                            userId,
                            reference: response.reference,
                            checkoutRequestId: response.CheckoutRequestID,
                            status: 'QUEUED',
                            phoneNumber,
                            amount: overallTotalDue,
                            idempotencyKey: idempotencyKey ?? null,
                        },
                    ],
                },
            },
            include: { items: true, payments: true },
        });
        log.highlight(
            `Order context initialized cleanly: ${newOrder.reference} | Gateway Ref: ${response.reference},idempotency key created : ${idempotencyKey}`
        );
        log.debug('Saved payment row', {
            data: {
                reference: response.reference,
                checkoutRequestId: response.CheckoutRequestID,
                idempotencyKey,
                status: response.status,
            },
        });

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
        const isPrismaRequestError = (
            err: unknown
        ): err is Prisma.PrismaClientKnownRequestError =>
            typeof err === 'object' &&
            err !== null &&
            'code' in err &&
            typeof (err as { code?: unknown }).code === 'string';
        if (
            isPrismaRequestError(error) &&
            error.code === 'P2002' &&
            idempotencyKey
        ) {
            const existingTx = await prisma.paymentTransaction.findUnique({
                where: { idempotencyKey },
            });
            if (existingTx) {
                const order = await prisma.order.findUnique({
                    where: { id: existingTx.orderId },
                    include: { items: true, payments: true },
                });
                return res.status(200).json({
                    success: true,
                    message:
                        'Existing payment request returned (idempotent - conflict recovery)',
                    data: {
                        orderReference: order?.reference,
                        paymentReference: existingTx.reference,
                        checkoutRequestId: existingTx.checkoutRequestId,
                        logisticsSummary: {
                            distanceKm,
                            deliveryFee: secureDeliveryFee,
                            serviceFee: STRATEGY_SERVICE_FEE,
                            totalAmount: overallTotalDue,
                        },
                    },
                });
            }
        }
        const msg =
            error instanceof Error
                ? error.message
                : 'Unknown payment routing fault ';
        log.error(`Checkout transaction instantiation collapsed: ${msg}`);
        log.error('Error form ', { data: { error } });
        throw error;
    }
}
export async function paymentWebhook(req: Request, res: Response) {
    const { reference, status, success } = req.body;
    log.debug('Webhook is being received');
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
        throw AppError.badRequest('Webhook Unable to complete payment process');
    }
    if (success && status === 'SUCCESS') {
        //atomic operations block updating transaction logs and setting order state to PAID
        await prisma.$transaction([
            prisma.paymentTransaction.update({
                where: { id: transaction.id },
                data: { status: 'SUCCESS', webhookReceived: true },
            }),
        ]);
        await fulfillOrderAndDispatch(transaction.orderId);

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
                where: { id: transaction.orderId },
                data: { status: 'CANCELLED' },
            }),
        ]);
        await NotificationService.send({
            userId: transaction.userId,
            orderId: transaction.orderId,
            title: '❌ Payment Failed',
            message:
                'Your payment could not be processed. Please try placing the order again.',
            type: 'ORDER_CANCELLED',
        });
        log.warn(`Order context ${transaction.id} routes int failure`);
    }
    return res.status(200).json({
        success: true,
        message: 'Status mapped successfully ',
    });
}
export async function statusCheck(req: Request, res: Response) {
    const { reference } = req.params;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;
    if (!userId) {
        throw AppError.unauthorized('Unauthorized user');
    }
    log.debug('STATUS CHECK REQUEST', {
        data: {
            referenceFromUrl: req.params.reference,
            authUserId: userId,
        },
    });
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
        log.highlight('The webhook was received ');
        return res.status(200).json({
            success: true,
            data: {
                status: transaction.status,
                reference: transaction.reference,
                amount: transaction.amount,
            },
        });
    } else {
        log.warn('No webhook received proceeding with status checking ...');
    }
    // Fallback: Query gateway directly if webhook is experiencing network delays
    try {
        const status = await PayheroService.getTransactionStatus(reference);
        if (
            //status.success &&
            status.status === 'SUCCESS'
            //!transaction.completedAt
        ) {
            const updatedTransaction = await prisma.paymentTransaction.update({
                where: { reference },
                data: {
                    status: status.status,
                    completedAt: new Date(),
                },
            });
            await fulfillOrderAndDispatch(transaction.orderId);
            return res.status(200).json({
                success: true,
                data: {
                    status: updatedTransaction.status,
                    reference: updatedTransaction.reference,
                    amount: updatedTransaction.amount,
                },
            });
        } else if (status.status === 'FAILED') {
            const failedTransaction = await prisma.paymentTransaction.update({
                where: { reference },
                data: {
                    status: status.status,
                },
            });
            await NotificationService.send({
                userId: transaction.userId,
                orderId: transaction.orderId,
                title: '❌ Payment Failed',
                message:
                    'Your payment attempt failed. Please check your balance or try again.',
                type: 'ORDER_CANCELLED',
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
}
export async function getCheckoutPreview(req: Request, res: Response) {
    const { addressId, cartItems } = req.body;
    if (!addressId) {
        throw AppError.badRequest(
            'Delivery address is required for checkout calculation'
        );
    }
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        throw AppError.badRequest('Shopping cart is empty');
    }
    const targetStoreSlugs: string[] = [
        ...new Set(
            cartItems.flatMap((item) => {
                const slugs: string[] = [];
                if (item.storeSlug) slugs.push(item.storeSlug);
                if (item.product?.storeSlug) slugs.push(item.product.storeSlug);

                // Pull from storeConfigs structure
                const configs = item.storeConfigs || item.product?.storeConfigs;
                if (Array.isArray(configs)) {
                    configs.forEach((config) => {
                        if (config?.store?.slug) slugs.push(config.store.slug);
                    });
                }
                return slugs;
            })
        ),
    ]
        .map((slug) => String(slug).toUpperCase())
        .filter(Boolean);
    log.debug(`Target store slugs ${targetStoreSlugs}`);
    if (targetStoreSlugs.length === 0) {
        log.error('Cart items must contain valid store configurations');
        throw AppError.badRequest(
            'Unable to calculate delivery fee: no valid store found in cart.'
        );
    }

    const stores = await prisma.store.findMany({
        where: { slug: { in: targetStoreSlugs } },
        select: { id: true, name: true, hubId: true, slug: true },
    });
    log.debug('the stores', { data: { stores } });

    if (stores.length === 0) {
        throw AppError.notFound('No active stores match your cart items.');
    }
    const targetHubIds = [
        ...new Set(stores.map((store) => store.hubId).filter(Boolean)),
    ];
    log.highlight(
        `This is the address id ${addressId} with the hub id ${targetHubIds}`
    );
    const cachedFees = await prisma.hubDeliveryFee.findMany({
        where: { addressId, hubId: { in: targetHubIds } },
        include: {
            hub: {
                select: { name: true },
            },
        },
    });
    log.highlight('Data from the hubdeliveryfee');
    log.info('Cached fees', {
        data: { cachedFees },
    });

    if (cachedFees.length === 0) {
        log.error(
            `No active delivery routes match address ${addressId} for these stores.`
        );
        throw AppError.notFound(
            'No active delivery routes match your cart items for this location.'
        );
    }
    const baseFees = cachedFees.map((f) => Number(f.deliveryFee));
    const highestBaseFee = Math.max(...baseFees);
    //Tiered store count && surcharge calculation
    const storeCount = stores.length;
    let multiStoreSurcharge = 0;
    let estimatedCheckoutWaitTime = 10;
    if (storeCount === 2) {
        multiStoreSurcharge = TWO_STOP_SURCHARGE;
        estimatedCheckoutWaitTime = 25;
    } else if (storeCount >= 3) {
        multiStoreSurcharge = THREE_STOP_SURCHARGE;
        estimatedCheckoutWaitTime = 40;
    }

    const finalDeliveryFee = highestBaseFee + multiStoreSurcharge;
    const subtotal = cartItems.reduce((acc: number, item) => {
        const storeSlug = item.storeSlug || item.product?.storeSlug;
        const configs = item.storeConfigs || item.product?.storeConfigs;

        let itemPrice = 0;

        // Try to find the exact price matching the item's active store config
        if (storeSlug && Array.isArray(configs)) {
            const matchedConfig = configs.find(
                (c) => c?.store?.slug?.toUpperCase() === storeSlug.toUpperCase()
            );
            if (matchedConfig?.price) {
                itemPrice = Number(matchedConfig.price);
            }
        }

        // Fallback to the first available store config price
        if (!itemPrice && Array.isArray(configs) && configs.length > 0) {
            itemPrice = Number(configs[0].price || 0);
        }

        // Final fallbacks for flat price properties
        if (!itemPrice) {
            itemPrice = Number(
                item.localPrice ?? item.price ?? item.basePrice ?? 0
            );
        }

        const qty = Number(item.quantity || 1);
        return acc + itemPrice * qty;
    }, 0);

    const grandTotal = subtotal + STRATEGY_SERVICE_FEE + finalDeliveryFee;
    const authReq = req as AuthenticatedRequest;
    const wallet = authReq.user?.id
        ? await prisma.wallet.findUnique({ where: { userId: authReq.user.id } })
        : null;
    const walletBalance = wallet?.balance ?? 0;
    res.status(200).json({
        success: true,
        storeCount,
        estimatedCheckoutWaitTime,
        multiStoreSurcharge,
        isMixedCart: storeCount > 1, // Let frontend know if it's a multi-stop order
        wallet: {
            balance: walletBalance,
            canCover: walletBalance >= grandTotal,
        },
        breakdown: {
            subtotal: parseFloat(subtotal.toFixed(2)),
            serviceFee: parseFloat(STRATEGY_SERVICE_FEE.toFixed(2)),
            baseDeliveryFee: parseFloat(highestBaseFee.toFixed(2)),
            multiStopSurcharge: parseFloat(multiStoreSurcharge.toFixed(2)),
            totalDeliveryFee: parseFloat(finalDeliveryFee.toFixed(2)),
            grandTotal: parseFloat(grandTotal.toFixed(2)),
        },
        routingDetails: cachedFees.map((f) => ({
            storeName: f.hub.name,
            distanceKm: f.distanceKm,
            directFee: Number(f.deliveryFee),
        })),
    });
}
