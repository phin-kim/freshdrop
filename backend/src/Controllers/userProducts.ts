import type { Request, Response } from 'express';

import { prisma } from '../Config/DB.js';
import AppError from '../Utils/appError.js';
import createLogger from '../Utils/logger.js';

const log = createLogger('UserProducts.ts');
export async function fetchUserProducts(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const limit =
            typeof req.query.limit === 'string' ? req.query.limit : '8';
        const cursor =
            typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const { category } = req.query;

        const take = parseInt(limit);
        //fetch the products and deeply inlude related relational metrics
        const products = await prisma.product.findMany({
            take: take + 1,
            ...(cursor
                ? {
                      skip: 1,
                      cursor: { id: cursor },
                  }
                : {}),
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
        const hasNextPage = products.length > take;
        const nextCursor = hasNextPage ? products[take - 1].id : null;
        const finalDataBlock = hasNextPage ? products.slice(0, take) : products;
        res.status(200).json({
            success: true,
            conunt: finalDataBlock.length,
            message: 'Product catalog fetched successfully ',
            data: finalDataBlock,
            nextCursor: nextCursor, //This will be picked up by getNextPageParam on your user storefront page
        });
    } catch (error) {
        log.error('Unable to fetch the products', { data: { error } });
        throw AppError.database('UNable to fetch the products');
    }
}
