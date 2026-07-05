import { Router } from 'express';

import {
    handleAdminProductSync,
    handleAdminToggleStatus,
} from '../Controllers/adminController.js';
import asyncHandler from '../Middleware/asyncHandler.js';

export const adminRoute: Router = Router();
adminRoute.post('/products/sync', asyncHandler(handleAdminProductSync));
adminRoute.put(
    '/products/toggle-status',
    asyncHandler(handleAdminToggleStatus)
);
