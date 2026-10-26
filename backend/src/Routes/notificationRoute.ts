import { Router } from 'express';

import {
    getNotifications,
    markAllAsRead,
    markAsRead,
} from '../Controllers/notificationController.js';
import asyncHandler from '../Middleware/asyncHandler.js';
import authenticate from '../Middleware/authenticate.js';

export const notificationRouter: Router = Router();
notificationRouter.get('', authenticate, asyncHandler(getNotifications));
notificationRouter.patch(
    '/read-all',
    authenticate,
    asyncHandler(markAllAsRead)
);
notificationRouter.patch(
    '/:notifId/read',
    authenticate,
    asyncHandler(markAsRead)
);
