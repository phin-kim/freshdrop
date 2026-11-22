import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

import AppError from '../Utils/appError.js';
import createLogger from '../Utils/logger.js';

const log = createLogger('scraperAuth.ts');
const SECRET = process.env.SCRAPER_SHARED_SECRET;
const SKEW_MS = Number(process.env.SCRAPER_ALLOWED_SKEW_SECONDS ?? 300) * 1000;
export function verifyScrapperRequest(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (!SECRET) {
        log.error('SCRAPER_SHARED_SECRET missing');
        throw AppError.badRequest('SCRAPER_SHARED_SECRET not set');
    }
    const timestamp = req.header('x-scraper-timestamp');
    const signature = req.header('x-scraper-signature');
    const rawBody = (req as Request & { rawBody?: string }).rawBody;
    if (!timestamp || !signature) {
        log.error('missing headers', {
            data: {
                timestamp: timestamp ? 'Timestamp is present' : 'No timestamp',
                signature: signature ? 'Signature is set' : 'No signature',
            },
        });
        return {
            success: false,
            message: 'Missing timestamp',
        };
    }
    const timeStp = Number(timestamp);
    if (!Number.isFinite(timeStp)) {
        log.error('Bad timestamp');
        return {
            success: false,
            message: 'Bad timestamp',
        };
    }
    if (Math.abs(Date.now() - timeStp) > SKEW_MS) {
        log.error('Stale timestamp');
        return {
            success: false,
            message: 'Stale timestamp',
        };
    }
    const expected = crypto
        .createHmac('sha256', SECRET)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');
    const exp = Buffer.from(expected);
    const sig = Buffer.from(signature);
    log.debug('Whats the expected after and before buffer same to signature', {
        data: {
            signatureBefore: signature,
            signatureAfter: sig,
            expectedBefore: expected,
            expectedAfter: exp,
        },
    });
    if (exp.length !== sig.length || !crypto.timingSafeEqual(exp, sig)) {
        return {
            success: false,
            message: 'Bad signature',
        };
    }
    return next();
}
