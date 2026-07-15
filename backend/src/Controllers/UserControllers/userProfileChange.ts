import { v2 as cloudinary } from 'cloudinary';
import type { Request, Response } from 'express';

import AppError from '../../Utils/appError';
import createLogger from '../../Utils/logger';
import { auth } from '../../lib/auth.js';

const log = createLogger('ProfileChange.ts');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
export async function uploadImage(req: Request, res: Response) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session) {
            throw AppError.unauthorized('User is unauthorized');
        }
        if (!req.file) {
            throw AppError.badRequest('No image file uploaded');
        }

        // 5. Convert the Web File object to a Node Buffer for Cloudinary SDK

        const uploadResult = await new Promise<{ secure_url: string }>(
            (resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        {
                            folder: `freshdrop/users/${session.user.id}`,
                            public_id: 'profile', // Hardcoding this means it overwrites the old image automatically
                            resource_type: 'image',
                            overwrite: true,
                            invalidate: true, // Tells Cloudinary's CDN to clear out the old cached image immediately
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

        // 7. Send the successful URL back to your frontend TanStack Query mutation
        return res.status(200).json({ url: uploadResult.secure_url });
    } catch (error) {
        // Check if the error is a standard Error object safely
        const errorMessage =
            error instanceof Error ? error.message : String(error);

        log.error('Upload image error', { data: { message: errorMessage } });

        throw AppError.badRequest('Upload image error');
    }
}
