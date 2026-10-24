import { Router } from 'express';

import {
    activateRiderAccount,
    checkRiderActivation,
    fetchRiderData,
    markItemMissing,
    updateStatus,
} from '../Controllers/ridersController';
import asyncHandler from '../Middleware/asyncHandler';
import authenticate from '../Middleware/authenticate';

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
