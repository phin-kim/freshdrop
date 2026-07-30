import type { Request, Response } from 'express';

import {
    MULTI_STOP_SURCHARGE,
    STRATEGY_SERVICE_FEE,
} from '../../../shared/constants';
import type { CartItem } from '../../../shared/sharedTypes';
import { prisma } from '../Config/DB.js';
import { fulfillOrderAndDispatch } from '../Helpers/idempotentOrder';
import PayheroService from '../Services/paymentService.js';
import type { AuthenticatedRequest } from '../Types/auth';
import type { CheckoutRequestBody } from '../Types/products';
import AppError from '../Utils/appError';
import createLogger from '../Utils/logger';
import { validateKenyanPhoneNumber } from '../Utils/phoneNumberValidator';

const log = createLogger('PaymentController.ts');
// Maps product sourcing types to their corresponding database hub slugs
const SOURCING_TYPE_TO_HUB_SLUG: Record<string, string> = {
    open_market: 'juja-market-hub',
    supermarket: 'juja-supermarket-hub',
    'open market': 'juja-market-hub', // Safe fallback for spacing differences
};
export async function initiatePayment(req: Request, res: Response) {
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
    log.debug(`apartment name ${apartmentName}`);
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
    const { lat, lng } = customerCoordinates;
    const customerLatitude = lat;
    const customerLongitude = lng;

    // 1. Map Sourcing Types to retrieve our DB Hub IDs
    const uniqueSourcingTypes: string[] = [
        ...new Set(
            items.map((item) => item.product?.sourcingType?.toLowerCase())
        ),
    ].filter(Boolean) as string[];

    const targetHubSlugs = uniqueSourcingTypes
        .map((type) => SOURCING_TYPE_TO_HUB_SLUG[type])
        .filter(Boolean);

    const activeHubs = await prisma.hub.findMany({
        where: { slug: { in: targetHubSlugs }, isActive: true },
    });

    if (activeHubs.length === 0) {
        throw AppError.serviceUnavailable(
            'The distribution hubs required for your items are currently unavailable'
        );
    }

    // 2. Locate the Saved Address row for this user to fetch secure cached fees
    const savedAddress = await prisma.savedAddress.findFirst({
        where: {
            userId,
            customerLatitude,
            customerLongitude,
        },
    });
    let secureDeliveryFee = Number(deliveryFee);
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
            const multiStopSurcharge = activeHubs.length > 1 ? 100.0 : 0.0;
            secureDeliveryFee = highestBaseFee + multiStopSurcharge;
        }
    }
    //TO DO: Re-calculate everything for security purposes

    const itemsSubtotal = items.reduce(
        (sum, item) => sum + item.product.localPrice * item.quantity,
        0
    );

    const overallTotalDue =
        itemsSubtotal + STRATEGY_SERVICE_FEE + secureDeliveryFee;

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
                deliveryPin,
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
export async function statusCheck(req: Request, res: Response) {
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
    const uniqueSourcingType: string[] = [
        ...new Set(
            cartItems.map((item) => item.product?.sourcingType?.toLowerCase())
        ),
    ].filter(Boolean) as string[];
    if (uniqueSourcingType.length === 0) {
        log.error('Cart items must contain valid sourcing types');
        throw AppError.badRequest('Unable to calculate the delivery fee ');
    }
    const targetHubs = uniqueSourcingType
        .map((type) => SOURCING_TYPE_TO_HUB_SLUG[type])
        .filter(Boolean);
    const hubs = await prisma.hub.findMany({
        where: { slug: { in: targetHubs }, isActive: true },
    });
    if (hubs.length === 0) {
        throw AppError.notFound(
            'No active distribution hubs match your cart items.'
        );
    }
    const targetHubIds = hubs.map((hub) => hub.id);
    const cachedFees = await prisma.hubDeliveryFee.findMany({
        where: { addressId, hubId: { in: targetHubIds } },
        include: {
            hub: {
                select: {
                    name: true,
                },
            },
        },
    });
    if (cachedFees.length === 0) {
        log.error(`No active distribution hubs match your cart items.`);
        throw AppError.notFound(
            'No active distribution hubs match your cart items.'
        );
    }
    const baseFees = cachedFees.map((f) => Number(f.deliveryFee));
    const highestBaseFee = Math.max(...baseFees);

    const totalSurcharge = hubs.length > 1 ? MULTI_STOP_SURCHARGE : 0.0;

    const finalDeliveryFee = highestBaseFee + totalSurcharge;
    const subtotal = cartItems.reduce((acc: number, item) => {
        const price = Number(item.product?.localPrice || item.price || 0);
        const qty = Number(item.quantity || 0);
        return acc + price * qty;
    }, 0);

    const grandTotal = subtotal + STRATEGY_SERVICE_FEE + finalDeliveryFee;
    res.status(200).json({
        success: true,
        isMixedCart: hubs.length > 1, // Let frontend know if it's a multi-stop order
        breakdown: {
            subtotal: parseFloat(subtotal.toFixed(2)),
            serviceFee: parseFloat(STRATEGY_SERVICE_FEE.toFixed(2)),
            baseDeliveryFee: parseFloat(highestBaseFee.toFixed(2)),
            multiStopSurcharge: parseFloat(totalSurcharge.toFixed(2)),
            totalDeliveryFee: parseFloat(finalDeliveryFee.toFixed(2)),
            grandTotal: parseFloat(grandTotal.toFixed(2)),
        },
        routingDetails: cachedFees.map((f) => ({
            hubName: f.hub.name,
            distanceKm: f.distanceKm,
            directFee: Number(f.deliveryFee),
        })),
    });
}
