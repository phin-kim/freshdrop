import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import dotenv from 'dotenv';
import 'dotenv/config';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';

import { prisma } from './Config/DB.js';
import { adminRoute } from './Routes/adminRoute.js';
import { courierRoute } from './Routes/courierRoute.js';
import { paymentRoute } from './Routes/paymentRoute';
import { userRoute } from './Routes/user';
import {
    bot,
    initTelegramBot,
    startStaleOrderCron,
} from './Services/telegramService.js';
import errorHandler from './Utils/errorHandler';
import createLogger from './Utils/logger';
import { auth } from './lib/auth';

dotenv.config();
const log = createLogger('Server.ts');

const server = express();
const PORT = process.env.PORT;

function getAuthErrorStatus(err: unknown): number {
    if (err && typeof err === 'object') {
        const error = err as Record<string, unknown>;
        if (typeof error.status === 'number') return error.status;
        if (typeof error.statusCode === 'number') return error.statusCode;
    }
    return 500;
}

function getAuthErrorCode(err: unknown): string {
    if (err && typeof err === 'object') {
        const error = err as Record<string, unknown>;
        if (typeof error.code === 'string') return error.code;
        if (
            error.body &&
            typeof error.body === 'object' &&
            'code' in error.body
        ) {
            const code = (error.body as Record<string, unknown>).code;
            if (typeof code === 'string') return code;
        }
    }
    return 'ERROR';
}

if (!PORT || PORT === undefined) {
    log.error('Missing the port number ');
} else {
    log.debug(`Running on port ${PORT}`);
}
server.use((req, _res, next) => {
    console.log(
        `${new Date().toISOString()} - ${req.method} ${req.originalUrl} ${req.ip}`
    );
    next();
});
server.use(
    cors({
        origin: ['http://localhost:5173'],
        credentials: true,
    })
);
initTelegramBot();
startStaleOrderCron(bot);
server.get('/api/test-db', async (req, res) => {
    console.log('Route hit: GET /api/test-db');
    try {
        log.info('Testing manual Prisma query...');
        const users = await prisma.user.findMany({ take: 1 });
        res.status(200).json({
            success: true,
            message: 'Prisma works!',
            data: users,
        });
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        log.error('PRISMA CRASHED:', { data: { error } });

        res.status(500).json({
            success: false,
            error: errorMessage,
            stack: errorStack,
        });
    }
});

server.get('/api/auth/ok', (_req, res) => {
    res.status(200).send('ok');
});

// Better Auth handler - NO body parsing before this!
server.all(
    '/api/auth/*splat',
    async (req: Request, res: Response, next: NextFunction) => {
        console.log('Auth route hit:', req.method, req.path);
        try {
            const handler = toNodeHandler(auth);
            await handler(req, res);
        } catch (err: unknown) {
            console.error('=== AUTH ERROR CAUGHT ===');

            const errorObject = err instanceof Error ? err : null;
            const errorCode = getAuthErrorCode(err);
            const statusCode = getAuthErrorStatus(err);

            console.error('Message:', errorObject?.message);
            console.error('Stack:', errorObject?.stack);

            if (!res.headersSent) {
                console.error('Auth route error response:', {
                    path: req.path,
                    method: req.method,
                    message: errorObject?.message,
                    code: errorCode,
                    stack: errorObject?.stack,
                });

                res.status(statusCode).json({
                    success: false,
                    error: errorObject?.message || 'Unknown error',
                    code: errorCode,
                    stack: errorObject?.stack,
                });
            }
            next(err);
        }
    }
);

server.post(
    '/api/test-signin',
    express.json(),
    async (req: Request, res: Response) => {
        console.log('Route hit: POST /api/test-signin', {
            body: req.body,
            headers: req.headers,
        });
        try {
            const authApi = auth.api as unknown as {
                signInEmail: (args: {
                    body: unknown;
                    headers: Headers;
                }) => Promise<unknown>;
            };

            const result = await authApi.signInEmail({
                body: req.body,
                headers: new Headers({ 'content-type': 'application/json' }),
            });

            res.json(result);
        } catch (err: unknown) {
            const errorObject = err instanceof Error ? err : null;
            const errorCode = getAuthErrorCode(err);
            const statusCode = getAuthErrorStatus(err);

            console.error('Direct signin error:', {
                error: errorObject?.message,
                code: errorCode,
                statusCode,
                stack: errorObject?.stack,
            });
            res.status(statusCode).json({
                success: false,
                error: errorObject?.message || 'Unknown error',
                code: errorCode,
                stack: errorObject?.stack,
            });
        }
    }
);
server.use(express.json());

server.use('/api/user', userRoute);
server.use('/api/payments', paymentRoute);
server.use('/api/admin', adminRoute);
server.use('/api/courier', courierRoute);
server.get('/', (_req, res) => {
    console.log('We are live');
    res.status(200).send('We are live');
});

server.use((req, _res, next) => {
    console.warn(`No matching route for ${req.method} ${req.originalUrl}`);
    next();
});

server.use(errorHandler);

server.listen(PORT, () => {
    log.info(`Server is running on port ${PORT}`);
});
