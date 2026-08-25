import { Router } from 'express';

import { fetchRiderData } from '../Controllers/ridersController';
import asyncHandler from '../Middleware/asyncHandler';
import authenticate from '../Middleware/authenticate';

export const riderRoute: Router = Router();
riderRoute.get('/dashboard', authenticate, asyncHandler(fetchRiderData));
