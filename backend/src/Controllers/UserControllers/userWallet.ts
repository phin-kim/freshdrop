import type { Request, Response } from 'express';

import prisma from '../../Config/DB.js';
import type { AuthenticatedRequest } from '../../Types/auth.js';
import AppError from '../../Utils/appError.js';
import createLogger from '../../Utils/logger.js';

const log = createLogger('userWallet.ts');
export function getWalletDashboard(
    req: Request,
    res: Response
): Promise<Response> {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;
    if (!userId) {
        throw AppError.unauthorized('Unauthorized access');
    }
}
