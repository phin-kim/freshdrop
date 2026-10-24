import { Router } from 'express';

import { getTickets, saveTickets } from '../Controllers/ticketController';
import asyncHandler from '../Middleware/asyncHandler';
import authenticate from '../Middleware/authenticate';

export const ticketRoute: Router = Router();

ticketRoute.post('/send', authenticate, asyncHandler(saveTickets));
ticketRoute.get('/fetch', authenticate, asyncHandler(getTickets));
