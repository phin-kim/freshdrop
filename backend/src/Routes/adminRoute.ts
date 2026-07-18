import { Router } from 'express';

import {
    fetchAdminProducts,
    handleAdminProductSync,
    handleAdminToggleStatus,
    //hardDeleteProducts,
    softDeleteProducts,
} from '../Controllers/adminController.js';
import asyncHandler from '../Middleware/asyncHandler.js';

export const adminRoute: Router = Router();
adminRoute.post('/products/sync', asyncHandler(handleAdminProductSync));
adminRoute.post(
    '/products/toggle-status',
    asyncHandler(handleAdminToggleStatus)
);
adminRoute.get('/products', asyncHandler(fetchAdminProducts));
//adminRoute.delete('/products/:id', asyncHandler(hardDeleteProducts));
adminRoute.delete('/products/:id', asyncHandler(softDeleteProducts));
