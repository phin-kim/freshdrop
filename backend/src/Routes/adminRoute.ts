import { Router } from 'express';

import {
    handleAdminProductSync,
    handleAdminToggleStatus,
} from '../Controllers/adminController.js';
import asyncHandler from '../Middleware/asyncHandler.js';

export const adminRouter: Router = Router();
adminRouter.post('/products/sync', asyncHandler(handleAdminProductSync));
adminRouter.put(
    '/products/toggle-status',
    asyncHandler(handleAdminToggleStatus)
);
