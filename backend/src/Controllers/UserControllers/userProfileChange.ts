import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import type { Request, Response } from 'express';

import { prisma } from '../../Config/DB.js';
import BrevoEmailSend from '../../Services/emailService.js';
import type { AuthenticatedRequest } from '../../Types/auth.js';
import AppError from '../../Utils/appError.js';
import createLogger from '../../Utils/logger.js';

const log = createLogger('ProfileChange.ts');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const generateOTP = () => crypto.randomInt(100000, 999999).toString();
export async function syncUserImageToRider(userId: string, imageUrl: string) {
    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: userId },
            data: { image: imageUrl },
        });

        await tx.rider.updateMany({
            where: { userId },
            data: { profilePic: imageUrl },
        });
    });
}

export async function uploadImage(req: Request, res: Response) {
    try {
        //
        const authReq = req as AuthenticatedRequest;
        const user = authReq?.user;
        if (!user?.id) {
            throw AppError.unauthorized('User is unauthorized');
        }
        if (!req.file) {
            throw AppError.badRequest('No image file uploaded');
        }

        const uploadResult = await new Promise<{ secure_url: string }>(
            (resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        {
                            folder: `freshdrop/users/${user.id}`,
                            public_id: 'profile',
                            resource_type: 'image',
                            overwrite: true,
                            invalidate: true,
                        },
                        (error, result) => {
                            if (error || !result)
                                reject(
                                    error ||
                                        new Error('Cloudinary upload failed')
                                );
                            else resolve(result);
                        }
                    )
                    .end(req.file!.buffer);
            }
        );

        const imageUrl = uploadResult.secure_url;

        await syncUserImageToRider(user.id, imageUrl);

        return res.status(200).json({ url: imageUrl });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);

        log.error('Upload image error', { data: { message: errorMessage } });

        throw AppError.badRequest('Upload image error');
    }
}
export async function userEmailChange(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;
    const { newEmail } = req.body;
    if (!userId) {
        throw AppError.unauthorized('Unauthorized user');
    }
    if (!newEmail) {
        throw AppError.badRequest('New email is required');
    }
    const existingUser = await prisma.user.findUnique({
        where: {
            email: newEmail,
        },
    });
    if (existingUser) {
        throw AppError.badRequest('Email already in use');
    }
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    // We use the "Verification" table. Identifier format: "change-email:USER_ID:NEW_EMAIL"
    const identifier = `change-email:${userId}:${newEmail}`;
    //save to database delete any old pending requests for this user first;
    await prisma.verification.deleteMany({
        where: { identifier: { startsWith: `change-email:${userId}:` } },
    });
    await prisma.verification.create({
        data: {
            id: crypto.randomUUID(),
            identifier,
            value: otp,
            expiresAt,
        },
    });
    await BrevoEmailSend.sendEmail({
        to: newEmail,
        templateId: 10,
        params: { otp },
    });
    res.status(200).json({
        success: true,
        message: 'OTP sent to new email',
    });
}
export async function verifyCustomEmailChange(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq?.user?.id;
    const { newEmail, otp } = req.body;
    if (!userId) {
        throw AppError.unauthorized('Unauthorized user');
    }
    if (!newEmail || !otp) {
        throw AppError.badRequest('New email is required');
    }
    const identifier = `change-email:${userId}:${newEmail}`;
    const record = await prisma.verification.findFirst({
        where: { identifier },
    });
    if (!record)
        throw AppError.badRequest('No pending request found for this email');
    if (record.value !== otp) throw AppError.badRequest('Invalid OTP');
    if (new Date() > record.expiresAt)
        throw AppError.badRequest('OTP has expired');
    await prisma.user.update({
        where: { id: userId },
        data: { email: newEmail, emailVerified: true },
    });
    // clean up the verification record
    await prisma.verification.deleteMany({
        where: { identifier },
    });
    res.status(200).json({
        success: true,
        message: 'Email update successfully',
    });
}
