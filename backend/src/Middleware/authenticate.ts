import { fromNodeHeaders } from 'better-auth/node';
import type { RequestHandler } from 'express';

import type { AuthenticatedRequest } from '../Types/auth.js';
import AppError from '../Utils/appError.js';
import createLogger from '../Utils/logger.js';
import { auth } from '../lib/auth.js';

const log = createLogger('Authenticate.js');

const authenticate: RequestHandler = async (req, _res, next) => {
    try {
        const rawHeaders = { ...req.headers };
        if (!rawHeaders.authorization && req.body?.id) {
            rawHeaders.authorization = `Bearer ${req.body.idToken}`;
        }
        const formattedHeaders = fromNodeHeaders(rawHeaders);
        const sessionContext = await auth.api.getSession({
            headers: formattedHeaders,
        });
        if (!sessionContext) {
            log.error('Missing or expired session', {
                data: { sessionContext },
            });
            throw AppError.unauthorized('Missing,invalid or expired session');
        }
        (req as AuthenticatedRequest).user = sessionContext.user;
        (req as AuthenticatedRequest).session = sessionContext.session;
        log.debug(
            `Authenticated user session verified : ${sessionContext.user.email || sessionContext.user.id}`
        );
        return next();
    } catch (error) {
        log.error(`Authentication verification loop failed`, {
            data: { error },
        });
        if (error instanceof AppError) {
            return next(error);
        }
        return next(AppError.unauthorized('Invalid or expired credentials'));
    }
};
export default authenticate;
