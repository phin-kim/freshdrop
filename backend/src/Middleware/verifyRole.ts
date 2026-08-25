import { NextFunction, Request, Response } from 'express';

export const verifyRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = req.user; // Attached by your existing JWT verification middleware

        if (!user || !allowedRoles.includes(user.role)) {
            res.status(403).json({
                success: false,
                message: 'Access denied: Insufficient permissions.',
            });
            return;
        }
        next();
    };
};
