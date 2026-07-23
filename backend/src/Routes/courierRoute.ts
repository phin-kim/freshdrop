import { Router } from 'express';

import asyncHandler from '../Middleware/asyncHandler';
import authenticate from '../Middleware/authenticate';
import { testSms } from '../Scripts/smsTest';

export const courierRoute: Router = Router();
courierRoute.post('/send-sms', asyncHandler(testSms));
