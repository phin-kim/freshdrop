import type { Request, Response } from 'express';
import { Router } from 'express';

import asyncHandler from '../Middleware/asyncHandler.js';
import PayheroService from '../Services/paymentService.js';
//remember to add an authenticator base don how better auth handles it
import AppError from '../Utils/appError.js';
import createLogger from '../Utils/logger.js';
import { validateKenyanPhoneNumber } from '../Utils/phoneNumberValidator.js';

const log = createLogger('PaymentRoute.ts');

export const paymentRoute: Router = Router();
paymentRoute.post(
    '/initiate',
    asyncHandler(async (req: Request, res: Response) => {
        const { phoneNumber, amount } = req.body;
        //temporary userid
        const userId = crypto.randomUUID();
        //check the user id via the better auth
        if (!phoneNumber) {
            throw AppError.badRequest('Phone number is required');
        }
        if (!amount) {
            throw AppError.badRequest('Amount is required');
        }
        if (typeof amount !== 'number' || amount <= 0) {
            throw AppError.badRequest('Amount must be a positive number');
        }
        const phoneValidation = validateKenyanPhoneNumber(phoneNumber);
        if (!phoneValidation.isValid) {
            throw AppError.badRequest(
                phoneValidation.error || 'Invalid phone number format '
            );
        }
        log.info('Initiating payment ...');
        try {
            const response = await PayheroService.initiatePayment({
                amount: Math.floor(amount),
                phone_number: phoneValidation.normalizedNumber,
                external_reference: `${userId}-${Date.now()}`,
                customer_name: 'Test user',
                callback_url: `${process.env.BACKEND_URL || 'http://localhost:4400'}/api/payments/webhook`,
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
                    reference: response.reference,
                    status: response.status,
                    checkoutRequestId: response.CheckoutRequestID,
                },
            });
        } catch (error) {}
    })
);
