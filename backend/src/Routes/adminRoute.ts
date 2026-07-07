import { Router } from 'express';

import {
    fetchAdminProducts,
    handleAdminProductSync,
    handleAdminToggleStatus,
} from '../Controllers/adminController.js';
import asyncHandler from '../Middleware/asyncHandler.js';

export const adminRoute: Router = Router();
adminRoute.post('/products/sync', asyncHandler(handleAdminProductSync));
adminRoute.post(
    '/products/toggle-status',
    asyncHandler(handleAdminToggleStatus)
);
adminRoute.get('/products', asyncHandler(fetchAdminProducts));
