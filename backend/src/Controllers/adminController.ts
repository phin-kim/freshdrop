import type { Request, Response } from 'express';

import { prisma } from '../Config/DB.js';
import AppError from '../Utils/appError.js';
import createLogger from '../Utils/logger.js';
import {
    Prisma,
    SourcingType,
    StockStatus,
} from '../generated/prisma/client.js';

const log = createLogger('populateProducts.ts');

interface ProductSyncBody {
    sku: string;
    name: string;
    category: string;
    sourcingType: SourcingType;
    basePrice: number;
    hubSlug: string;
    localPrice: number;
}
interface StatusToggleBody {
    sku: string;
    hubSlug: string;
    status: StockStatus;
}
/**
 * Endpoint to add or update items dynamically via Admin Panel form submission
 * POST /api/admin/products/sync
 */
export async function handleAdminProductSync(
    req: Request,
    res: Response
): Promise<Response> {
    const {
        sku,
        name,
        category,
        sourcingType,
        basePrice,
        hubSlug,
        localPrice,
    } = req.body as ProductSyncBody;
    try {
        const targetHub = await prisma.hub.findUnique({
            where: { slug: hubSlug },
        });
        if (!targetHub) {
            throw AppError.notFound('Target operational hub not found');
        }
        //atomic global upsert
        const product = await prisma.product.upsert({
            where: { sku: sku },
            update: {
                name,
                category,
                basePrice: new Prisma.Decimal(basePrice),
            },
            create: {
                sku,
                name,
                category,
                sourcingType,
                basePrice: new Prisma.Decimal(basePrice),
            },
        });
        //sync global hub localization metrics
        await prisma.hubProductConfig.upsert({
            where: {
                hubId_productId: {
                    hubId: targetHub.id,
                    productId: product.id,
                },
            },
            update: {
                localPrice: new Prisma.Decimal(localPrice),
            },
            create: {
                hubId: targetHub.id,
                productId: product.id,
                localPrice: new Prisma.Decimal(localPrice),
                status: StockStatus.IN_STOCK,
            },
        });
        return res.status(200).json({
            success: true,
            message: `Product ${name} synchronized successfully`,
        });
    } catch (error) {
        log.warn('', { context: 'AdminProductSync' });
        log.error(
            'Error in synchronizing the products to db',

            { data: { error } }
        );
        throw AppError.database('Unable to synchronize products');
    }
}
/**
 * Fast-action endpoint for supermarket updates
 * PATCH /api/admin/products/toggle-status
 */
export async function handleAdminToggleStatus(
    req: Request,
    res: Response
): Promise<Response> {
    const { sku, hubSlug, status } = req.body as StatusToggleBody;
    try {
        const targetConfig = await prisma.hubProductConfig.findFirst({
            where: {
                hub: { slug: hubSlug },
                product: { sku: sku },
            },
        });
        if (!targetConfig) {
            throw AppError.notFound('Config mapping target not found');
        }
        await prisma.hubProductConfig.update({
            where: { id: targetConfig.id },
            data: { status: status },
        });
        return res.status(200).json({
            success: true,
            message: `Product status changed to ${status} successfully`,
        });
    } catch (error) {
        log.warn('', { context: 'AdminStatusToggle' });
        log.error('Unable to toggle the status', { data: { error } });
        throw AppError.badRequest('Unable to toggle status');
    }
}
