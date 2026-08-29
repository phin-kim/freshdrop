import { v2 as cloudinary } from 'cloudinary';
import type { Request, Response } from 'express';

import { prisma } from '../../Config/DB.js';
import AppError from '../../Utils/appError';
import createLogger from '../../Utils/logger';
import { auth } from '../../lib/auth.js';

const log = createLogger('ProfileChange.ts');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session) {
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
                            folder: `freshdrop/users/${session.user.id}`,
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

        await syncUserImageToRider(session.user.id, imageUrl);

        return res.status(200).json({ url: imageUrl });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);

        log.error('Upload image error', { data: { message: errorMessage } });

        throw AppError.badRequest('Upload image error');
    }
}
