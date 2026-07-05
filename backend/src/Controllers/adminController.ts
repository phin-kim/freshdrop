import type { Request, Response } from 'express';

import type { Product } from '../../../shared/sharedTypes.js';
import { prisma } from '../Config/DB.js';
import AppError from '../Utils/appError.js';
import createLogger from '../Utils/logger.js';
import { StockStatus } from '../generated/prisma/client.js';

const log = createLogger('populateProducts.ts');

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
    const { productData } = req.body;

    if (!productData) {
        throw AppError.badRequest(
            "Synchronization rejected: Missing 'productData' wrapper payload."
        );
    }
    const {
        sku,
        name,
        category,
        sourcingType,
        basePrice,
        quantityText,
        image,

        localPrice,
        inStock,
    } = productData as Product;
    const { hubSlug } = req.body;
    try {
        const targetHub = await prisma.hub.findUnique({
            where: { slug: hubSlug },
        });
        if (!targetHub) {
            throw AppError.notFound('Target operational hub not found');
        }
        //atomic global upsert
        const baseProduct = await prisma.product.upsert({
            where: { sku: String(sku).trim() },
            update: {
                name: String(name).trim(),
                quantityText: quantityText
                    ? String(quantityText).trim()
                    : '1 unit',
                category: String(category),
                sourcingType: sourcingType,
                basePrice: Number(basePrice),
                image: String(image),
            },
            create: {
                sku: String(sku).trim(),
                name: String(name).trim(),
                quantityText: quantityText
                    ? String(quantityText).trim()
                    : '1 unit',
                category: String(category),
                sourcingType: sourcingType,
                basePrice: Number(basePrice),

                image: String(image),
            },
        });
        const computedStatus = inStock ? 'IN_STOCK' : 'OUT_OF_STOCK';
        //sync global hub localization metrics
        const localConfig = await prisma.hubProductConfig.upsert({
            where: {
                // Targets your composite unique key constraint directly.
                // ⚠️ If your schema maps the relation using 'productId', match that key name precisely here:
                hubId_productId: {
                    hubId: targetHub.id,
                    productId: baseProduct.id, // Employs the authentic ID generated or verified in step one
                },
            },
            update: {
                localPrice: Number(localPrice),
                //stock: Number(stock),
                status: computedStatus,
            },
            create: {
                hubId: targetHub.id,
                productId: baseProduct.id,
                localPrice: Number(localPrice),
                //stock: Number(stock),
                status: computedStatus,
            },
        });
        return res.status(200).json({
            success: true,
            message: `Product ${name} synchronized successfully`,
            data: {
                product: baseProduct,
                config: localConfig,
            },
        });
    } catch (error) {
        log.warn('', { context: 'AdminProductSync' });
        if (error && typeof error === 'object') {
            console.error(
                '❌ REAL PRISMA ERROR CODE:',
                (error as Record<string, unknown>).code
            );
            console.error(
                '❌ REAL PRISMA MESSAGE:',
                (error as Record<string, unknown>).message
            );
            console.error(
                '❌ REAL PRISMA META DETAILS:',
                (error as Record<string, unknown>).meta
            );
        }
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
        const updatedHub = await prisma.hubProductConfig.update({
            where: { id: targetConfig.id },
            data: { status: status },
        });
        log.debug('The structure of the hub', { data: updatedHub });
        log.highlight(`The status ${status}`);
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
/**
 * Controller to fetch the data from the database to display it to the admin panel
 */
export async function fetchProducts(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const { category } = req.query;
        //fetch the products and deeply inlude related relational metrics
        const products = await prisma.product.findMany({
            where: category ? { category: String(category) } : undefined,
            include: {
                hubConfigs: {
                    include: {
                        hub: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc', //newly added items first
            },
        });
        res.status(200).json({
            success: true,
            conunt: products.length,
            message: 'Product catalog fetched successfully ',
            data: products,
        });
    } catch (error) {
        log.error('Unable to fetch the products', { data: { error } });
        throw AppError.database('UNable to fetch the products');
    }
}
