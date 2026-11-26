import type { Request, Response } from 'express';

import { prisma } from '../Config/DB.js';
import { sendScraperReport } from '../Services/scrapperReportService.js';
import AppError from '../Utils/appError.js';
import createLogger from '../Utils/logger.js';
import { Prisma } from '../generated/prisma/client.js';

/**
 *    // 3. Remove filler adjectives that cause mismatches
    const fillerWords = ["home baking", "all purpose"];
    for (const word of fillerWords) {
        cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    }
 *In the future, when all your DB names perfectly align with the scrapers, you simply delete those 4 lines.
 */
const log = createLogger('ScraperController.ts');
interface IncomingItem {
    name: string;
    currentPrice: string;
    oldPrice: string | null;
    discount: string | null;
}
interface ScrapperPayload {
    storeId: string;
    runId: string;
    items: IncomingItem[];
}
function parsePrice(price: string): number | null {
    const priceNum = Number(String(price).replace(/[^\d.]/g, ''));
    return Number.isFinite(priceNum) ? priceNum : null;
}
function extractQuantity(text: string): string {
    // Looks for numbers followed by kg, g, ml, l, pcs, pack, etc.
    const match = text.match(
        /(\d+(?:\.\d+)?)\s*(kg|g|ml|l|ltr|litre|pcs|piece|pack|pk|sachet|bunch)/i
    );
    if (!match) return '';
    const value = match[1];
    const unit = match[2].toLowerCase();
    // Normalize common units
    if (unit === 'g' || unit === 'gm' || unit === 'grams') return `${value}g`;
    if (unit === 'kg' || unit === 'kgs') return `${value}kg`;
    if (unit === 'ml' || unit === 'mls') return `${value}ml`;
    if (unit === 'l' || unit === 'ltr' || unit === 'litre') return `${value}l`;
    if (unit === 'pcs' || unit === 'piece') return `${value}pcs`;
    if (unit === 'pack' || unit === 'pk') return `${value}pack`;
    return `${value}${unit}`;
}
function cleanBaseName(text: string): string {
    let cleaned = text.toLowerCase();
    // 1. Remove specific generic words
    cleaned = cleaned
        .replace(/packet/g, '')
        .replace(/pack/g, '')
        .replace(/packed/g, '');

    // 2. Remove the quantity from the name (e.g., "2kg", "500ml")
    cleaned = cleaned.replace(
        /\d+(?:\.\d+)?\s*(?:kg|g|ml|l|ltr|litre|pcs|piece|pk|sachet|bunch)/gi,
        ''
    );
    //remove filler adjectives that cause mismatches
    const fillerWords = ['home baking', 'all purpose'];
    for (const word of fillerWords) {
        cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    }

    // 3. Remove punctuation (apostrophes, commas, dashes) and extra spaces
    cleaned = cleaned
        .replace(/[^\w\s]/g, '') // removes ' , -
        .replace(/\s+/g, ' ') // collapses spaces
        .trim();

    return cleaned;
}
function checkIsOnOffer(discountStr: string | null): boolean {
    if (!discountStr) return false;
    const normalized = discountStr.toLowerCase().trim();
    if (
        normalized === '' ||
        normalized === '0% off' ||
        normalized === 'no discount'
    ) {
        return false;
    }
    return true;
}
export async function handleScrapperPriceSync(req: Request, res: Response) {
    const { storeId, runId, items } = req.body as ScrapperPayload;
    if (!storeId || !runId || !Array.isArray(items)) {
        throw AppError.badRequest('Invalid scrapper payload');
    }
    const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
            products: {
                include: {
                    product: true,
                },
            },
        },
    });
    log.debug('Whats the store.products and whats store.products.product', {
        data: {
            storeProducts: store?.products,
            types: typeof store?.products,
        },
    });
    if (!store) {
        throw AppError.notFound(`Store ${storeId} not found`);
    }
    const byNameAndQty = new Map<string, (typeof store.products)[number]>();

    for (const cfg of store.products) {
        // For DB: combine the name and quantityText (e.g. "Dola All Purpose Flour" + "2kg packet")
        const dbFullString = `${cfg.product.name} ${cfg.product.quantityText || ''}`;

        const dbBase = cleanBaseName(cfg.product.name);
        const dbQty = extractQuantity(dbFullString);

        // The key is "dola all purpose flour|2kg"
        const mapKey = `${dbBase}|${dbQty}`;
        byNameAndQty.set(mapKey, cfg);
    }
    log.debug('Map keys created', {
        data: { keys: Array.from(byNameAndQty.keys()) },
    });

    const updates: Array<{
        productName: string;
        oldPrice: number;
        newPrice: number;
        oldIsOnOffer: boolean;
        newIsOnOffer: boolean;
        storeProductConfigId: string;
        productId: string; // <-- ADD THIS LINE
    }> = [];
    let unchanged = 0;
    let skipped = 0;
    for (const item of items) {
        const scrapedBase = cleanBaseName(item.name);
        const scrapedQty = extractQuantity(item.name);
        const mapKey = `${scrapedBase}|${scrapedQty}`;

        const cfg = byNameAndQty.get(mapKey);

        if (!cfg) {
            log.debug('Skipped product (no match)', {
                data: { scrapedName: item.name, scrapedKey: mapKey },
            });
            skipped += 1;
            continue;
        }

        const newPrice = parsePrice(item.currentPrice);
        if (newPrice === null) {
            skipped += 1;
            continue;
        }

        const oldPrice = Number(cfg.price);
        const newIsOnOffer = checkIsOnOffer(item.discount); // <-- Determine offer status
        const oldIsOnOffer = cfg.product.isOnOffer;

        // Check if BOTH price and offer status are unchanged
        const priceUnchanged = Math.abs(oldPrice - newPrice) < 0.01;
        const offerUnchanged = oldIsOnOffer === newIsOnOffer;

        if (priceUnchanged && offerUnchanged) {
            unchanged += 1;
            continue;
        }

        updates.push({
            productName: cfg.product.name,
            productId: cfg.productId,
            oldPrice,
            newPrice,
            oldIsOnOffer,
            newIsOnOffer,
            storeProductConfigId: cfg.id,
        });
    }
    await prisma.scraperRun.create({
        data: {
            runId,
            storeId,
            itemsScraped: items.length,
            updated: updates.length,
            unchanged,
            skipped,
        },
    });

    if (updates.length > 0) {
        // 1. Create a typed array for Prisma transactions
        const transactionQueries: Prisma.PrismaPromise<unknown>[] = [];

        for (const update of updates) {
            const priceChanged =
                Math.abs(update.oldPrice - update.newPrice) >= 0.01;

            // Update Price in StoreProductConfig
            transactionQueries.push(
                prisma.storeProductConfig.update({
                    where: { id: update.storeProductConfigId },
                    data: { price: update.newPrice.toFixed(2) },
                })
            );

            // Update isOnOffer in Product
            transactionQueries.push(
                prisma.product.update({
                    where: { id: update.productId },
                    data: { isOnOffer: update.newIsOnOffer },
                })
            );

            // Create PriceLog ONLY if the actual price changed
            if (priceChanged) {
                transactionQueries.push(
                    prisma.priceLog.create({
                        data: {
                            storeProductConfigId: update.storeProductConfigId,
                            oldPrice: update.oldPrice.toFixed(2),
                            newPrice: update.newPrice.toFixed(2),
                            changedById: null,
                        },
                    })
                );
            }
        }

        // Execute all queries in a single transaction
        await prisma.$transaction(transactionQueries);
    }

    log.info('Scraper sync complete', {
        data: {
            storeId,
            runId,
            updated: updates.length,
            unchanged,
            skipped,
        },
    });
    if (updates.length > 0) {
        sendScraperReport({
            storeName: store.name,
            runId,
            updates: updates.map((u) => ({
                productName: u.productName,
                oldPrice: u.oldPrice,
                newPrice: u.newPrice,
                oldIsOnOffer: u.oldIsOnOffer, // <-- Add this
                newIsOnOffer: u.newIsOnOffer,
            })),
            unchanged,
            skipped,
        }).catch((error) => {
            log.error('Failed to send scrapper report email', {
                data: {
                    error,
                },
            });
        });
    }
    return res.status(200).json({
        success: true,
        message: 'Scrapper successfully edited prices',
        runId,
        updated: updates.length,
        skipped,
        unchanged,
    });
}
