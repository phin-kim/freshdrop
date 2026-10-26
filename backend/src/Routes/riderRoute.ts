import { Router } from 'express';

import {
    activateRiderAccount,
    checkRiderActivation,
    fetchRiderData,
    markItemMissing,
    updateStatus,
} from '../Controllers/ridersController.js';
import asyncHandler from '../Middleware/asyncHandler.js';
import authenticate from '../Middleware/authenticate.js';

export const riderRoute: Router = Router();
riderRoute.get('/dashboard', authenticate, asyncHandler(fetchRiderData));
riderRoute.patch('/status', authenticate, asyncHandler(updateStatus));
riderRoute.post('/activate', asyncHandler(activateRiderAccount));
riderRoute.get('/activation/check', asyncHandler(checkRiderActivation));
riderRoute.patch(
    '/orders/:orderId/items/:itemId/unavailable',
    authenticate,
    asyncHandler(markItemMissing)
);
