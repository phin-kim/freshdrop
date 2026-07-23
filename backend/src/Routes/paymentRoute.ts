import { Router } from 'express';

import {
    getCheckoutPreview,
    initiatePayment,
    paymentWebhook,
    statusCheck,
} from '../Controllers/paymentController.js';
import asyncHandler from '../Middleware/asyncHandler.js';
import authenticate from '../Middleware/authenticate.js';

export const paymentRoute: Router = Router();
paymentRoute.post('/initiate', authenticate, asyncHandler(initiatePayment));
paymentRoute.post('/webhook', authenticate, asyncHandler(paymentWebhook));
paymentRoute.get('/status/:reference', authenticate, asyncHandler(statusCheck));
paymentRoute.post(
    '/checkout-preview',
    authenticate,
    asyncHandler(getCheckoutPreview)
);
