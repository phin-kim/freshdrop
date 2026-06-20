import { toNodeHandler } from 'better-auth/node';
import { Router } from 'express';

import { signup } from '../Controllers/authController';
import asyncHandler from '../Middleware/asyncHandler';
import { auth } from '../lib/auth';

export const authRouter = Router();
authRouter.all('/{*any}', toNodeHandler(auth));
//authRouter.post('/signup', asyncHandler(signup));
