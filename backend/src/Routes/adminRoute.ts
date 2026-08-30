import { Router } from 'express';

import { getAdminAnalytics } from '../Controllers/AdminControllers/analytics.js';
import {
    fetchAdminProducts,
    handleAdminProductSync,
    handleAdminToggleStatus,
    //hardDeleteProducts,
    softDeleteProducts,
} from '../Controllers/AdminControllers/inventory.js';
import {
    assignRiderToOrder,
    fetchCustomerOrders,
} from '../Controllers/AdminControllers/orders.js';
//import { updateOrderStatus } from '../Controllers/AdminControllers/orders.js';
import {
    createRider,
    getAllRiders,
    resendActivationLink,
    softDeleteRiders,
    updateRider,
} from '../Controllers/AdminControllers/riders.js';
import {
    deleteTicket,
    getTickets,
    updateTicketResolution,
} from '../Controllers/AdminControllers/tickets.js';
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
adminRoute.patch('/riders/update/:id', asyncHandler(updateRider));
adminRoute.delete('/riders/delete/:id', asyncHandler(softDeleteRiders));
adminRoute.post(
    '/riders/:id/resend-invite',
    asyncHandler(resendActivationLink)
);
adminRoute.get('/orders', asyncHandler(fetchCustomerOrders));
adminRoute.patch(
    '/orders/:orderId/assign-rider',
    asyncHandler(assignRiderToOrder)
);
adminRoute.get('/analytics', asyncHandler(getAdminAnalytics));
//adminRoute.patch('/orders/:orderId/status', asyncHandler(updateOrderStatus));

adminRoute.get('/tickets/all', asyncHandler(getTickets));
adminRoute.patch('/tickets/update/:id', asyncHandler(updateTicketResolution));
adminRoute.delete('/tickets/delete/:id', asyncHandler(deleteTicket));
