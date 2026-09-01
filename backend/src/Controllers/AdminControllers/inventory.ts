import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import type { Request, Response } from 'express';

import { HUB_SLUG_BY_SOURCING_TYPE } from '../../../../shared/constants.js';
import type { Product } from '../../../../shared/sharedTypes.js';
import { prisma } from '../../Config/DB.js';
import AppError from '../../Utils/appError.js';
import createLogger from '../../Utils/logger.js';
import { StockStatus } from '../../generated/prisma/client.js';

const log = createLogger('populateProducts.ts');

interface StatusToggleBody {
    productId: string;
    hubId: string;
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
    const { productId } = req.body as { productId?: string };

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
        isSeasonal,
        isOrganic,
        localPrice,
        inStock,
    } = productData as Product;
    try {
        const expectedHubSlug = HUB_SLUG_BY_SOURCING_TYPE[sourcingType];
        if (!expectedHubSlug) {
            throw AppError.badRequest('Unsupported product sourcing type');
        }
        const targetHub = await prisma.hub.findUnique({
            where: { slug: expectedHubSlug },
        });
        if (!targetHub) {
            throw AppError.notFound('Target operational hub not found');
        }
        const productFields = {
            name: String(name).trim(),
            quantityText: quantityText ? String(quantityText).trim() : '1 unit',
            category: String(category),
            sourcingType: sourcingType,
            isSeasonal: isSeasonal,
            isOrganic: isOrganic,
            basePrice: Number(basePrice),
            image: String(image),
        };
        // Existing products are identified by their immutable database ID.
        // New products are created with their unique SKU.
        const baseProduct = productId
            ? await prisma.product.update({
                  where: { id: productId },
                  data: productFields,
              })
            : await prisma.product.create({
                  data: {
                      sku: String(sku).trim(),
                      ...productFields,
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
    const { productId, hubId, status } = req.body as StatusToggleBody;
    try {
        if (!productId || !hubId || !status) {
            throw AppError.badRequest(
                'Product ID, hub ID, and stock status are required'
            );
        }
        const targetConfig = await prisma.hubProductConfig.findUnique({
            where: {
                hubId_productId: { hubId, productId },
            },
            include: {
                product: { select: { sourcingType: true } },
                hub: { select: { slug: true } },
            },
        });
        if (!targetConfig) {
            throw AppError.notFound('Config mapping target not found');
        }
        const expectedHubSlug =
            HUB_SLUG_BY_SOURCING_TYPE[targetConfig.product.sourcingType];
        if (targetConfig.hub.slug !== expectedHubSlug) {
            throw AppError.badRequest(
                'Product inventory is mapped to the wrong sourcing hub'
            );
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

// GET /api/admin/products?page=1&limit=10&category=Vegetables
export async function fetchAdminProducts(
    req: Request,
    res: Response
): Promise<void> {
    try {
        /* const page =
            typeof req.query.page === 'string' ? parseInt(req.query.page) : 1;
        const limit =
            typeof req.query.limit === 'string'
                ? parseInt(req.query.limit)
                : 10;*/
        const { category } = req.query;
        let page = parseInt(req.query.page as string, 10);
        let limit = parseInt(req.query.limit as string, 10);

        // Enforce baseline fallback ranges
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 10;

        // Calculate how many rows to skip based on the current page number
        const skip = (page - 1) * limit;

        // If category is falsy OR it is explicitly the string 'All', don't apply a database filter
        const categoryFilter =
            category && category !== 'All'
                ? { category: String(category) }
                : undefined;
        const whereClause = {
            isDeleted: false,
            ...categoryFilter,
        };
        // Execute both queries concurrently to keep database load low
        const [products, totalCount] = await Promise.all([
            prisma.product.findMany({
                take: limit,
                skip: skip,
                where: whereClause,
                include: {
                    hubConfigs: {
                        include: {
                            hub: {
                                select: { id: true, name: true, slug: true },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc', // Keep newest admin updates at the top
                },
            }),
            prisma.product.count({ where: whereClause }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        res.status(200).json({
            success: true,
            message: 'Admin product catalog fetched successfully',
            data: products,
            meta: {
                totalCount,
                totalPages,
                currentPage: page,
                limit,
            },
        });
    } catch (error) {
        log.error('Unable to fetch the admin products', { data: { error } });
        throw AppError.database('Unable to fetch the products for admin');
    }
}

//DELETE PRODUCTS ENDPOINT
export async function hardDeleteProducts(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    if (!id || typeof id !== 'string') {
        throw AppError.badRequest('A valid string product ID  must provided');
    }
    try {
        await prisma.$transaction([
            prisma.orderItem.deleteMany({
                where: { productId: id }, // Double-check if your schema uses 'productId'
            }),
            prisma.hubProductConfig.deleteMany({
                where: { productId: id },
            }),
            prisma.product.delete({
                where: { id },
            }),
        ]);
        return res.status(200).json({
            success: true,
            message: 'Product successfully deleted',
        });
    } catch (error: unknown) {
        log.error('Unable to delete product', { data: { error } });
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                throw AppError.badRequest(
                    'Cannot delete this product because it is tied to historical order records.'
                );
            }
        }
        throw AppError.database('Unable to delete the product');
    }
}
export async function softDeleteProducts(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    if (!id || typeof id !== 'string') {
        throw AppError.badRequest('A valid string product ID  must provided');
    }
    try {
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { isDeleted: true },
        });
        log.debug('Updated Products', { data: updatedProduct });
        return res.status(200).json({
            success: true,
            message: 'Product successfully deleted',
        });
    } catch (error: unknown) {
        log.error('Unable to delete product', { data: { error } });
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                throw AppError.badRequest(
                    'Cannot delete this product because it is tied to historical order records.'
                );
            }
        }
        throw AppError.database('Unable to delete the product');
    }
}
