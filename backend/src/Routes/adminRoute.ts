import { Router } from 'express';

import {
    fetchAdminProducts,
    handleAdminProductSync,
    handleAdminToggleStatus,
    //hardDeleteProducts,
    softDeleteProducts,
} from '../Controllers/AdminControllers/inventory.js';
import {
    createRider,
    getAllRiders,
    softDeleteRiders,
    updateRider,
} from '../Controllers/AdminControllers/riders.js';
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

adminRoute.get('/riders/all', asyncHandler(getAllRiders));
adminRoute.post('/riders/create', asyncHandler(createRider));
adminRoute.put('/riders/update/:id', asyncHandler(updateRider));
adminRoute.delete('/riders/delete/:id', asyncHandler(softDeleteRiders));
