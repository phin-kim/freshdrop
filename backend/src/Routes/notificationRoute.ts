import { Router } from 'express';

import {
    getNotifications,
    markAllAsRead,
    markAsRead,
} from '../Controllers/notificationController';
import asyncHandler from '../Middleware/asyncHandler';
import authenticate from '../Middleware/authenticate';

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
