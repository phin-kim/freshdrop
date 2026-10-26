import { Router } from 'express';

import { getTickets, saveTickets } from '../Controllers/ticketController.js';
import asyncHandler from '../Middleware/asyncHandler.js';
import authenticate from '../Middleware/authenticate.js';

export const ticketRoute: Router = Router();

ticketRoute.post('/send', authenticate, asyncHandler(saveTickets));
ticketRoute.get('/fetch', authenticate, asyncHandler(getTickets));
