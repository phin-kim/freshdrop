import type { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';

import AppError from './appError';

export interface ErrorType {
    statusCode: number;
    message: string;
    type: string;
}
const errorHandler = (
    err: ErrorType,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    const requestId = req.headers['x-request-id'] ?? crypto.randomUUID();
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('🔥 Caught in Error Handler', {
        requestId,
        message: err.message,
        stack: stack,
    });
    let appError: AppError;
    if (err instanceof AppError) {
        appError = err;
    } else {
        appError = new AppError('Internal Server Error', 500, 'InternalError');
    }
    const statusCode = appError.statusCode || 500;
    const message = appError.message;
    const type = appError.type || 'Server Error';
    return res.status(statusCode).json({
        success: false,
        requestId,
        error: {
            message,
            type,
            statusCode,
        },
    });
};
export default errorHandler;
