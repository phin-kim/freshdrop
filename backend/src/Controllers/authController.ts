import type { NextFunction, Request, Response } from 'express';

import { auth } from '../lib/auth.js';
import AppError from '../utils/appError.js';
import createLogger from '../utils/logger.js';

const log = createLogger('AuthContorller.ts');
export async function signup(req: Request, _res: Response) {
    const { name, email, password } = req.body;
    try {
        const response = await auth.api.signUpEmail({
            body: {
                name,
                email,
                password,
                callbackURL: '',
            },
            asResponse: true, // returns a response object instead of data
        });
        log.info('This is the response form better auth', {
            data: { response },
        });
    } catch (error) {
        log.error('Error in login', { data: { error } });
    }
}
export async function login(req: Request, _res: Response) {
    const { email, password } = req.body;
    try {
        const response = await auth.api.signInEmail({
            body: {
                email,
                password,
                callbackURL: '',
                rememberMe: true,
            },
            asResponse: true, // returns a response object instead of data
        });
        log.info('This is the response form better auth', {
            data: { response },
        });
    } catch (error) {
        log.error('Error in login', { data: { error } });
    }
}
