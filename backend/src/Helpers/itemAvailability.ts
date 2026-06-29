import { prisma } from '../Config/DB.js';
import AppError from '../Utils/appError.js';

interface ToggleStockInput {
    hubId: string;
    productId: string;
    targetStatus: 'IN_STOCK' | 'OUT_OF_STOCK';
}
interface CartVerificationItem {
    productId: string;
}
interface ValidationResponse {
    canProceed: boolean;
    unavailableItems: string[];
}
interface UpdateMarketPriceInput {
    hubId: string;
    productId: string;
    adminUserId: string;
    newPrice: number;
}
export async function updateSupermarketStock(
    input: ToggleStockInput
): Promise<void> {
    await prisma.hubProductConfig.update({
        where: {
            hubId_productId: {
                hubId: input.hubId,
                productId: input.productId,
            },
        },
        data: {
            status: input.targetStatus,
        },
    });
}
export async function verifyCartAvailability(
    hubId: string,
    items: CartVerificationItem[]
): Promise<ValidationResponse> {
    const productIds = items.map((item) => item.productId);
    //find any items explicitly configured as out of stock at this hub
    const outOfStockConfigs = await prisma.hubProductConfig.findMany({
        where: {
            hubId: hubId,
            productId: { in: productIds },
            status: 'OUT_OF_STOCK',
        },
        include: { product: true },
    });
    if (outOfStockConfigs.length > 0) {
        return {
            canProceed: false,
            unavailableItems: outOfStockConfigs.map(
                (config) => config.product.name
            ),
        };
    }
    return { canProceed: true, unavailableItems: [] };
}
export async function adjustmarketPrice(
    input: UpdateMarketPriceInput
): Promise<void> {
    await prisma.$transaction(async (transaction) => {
        const currentConfig = await transaction.hubProductConfig.findUnique({
            where: {
                hubId_productId: {
                    hubId: input.hubId,
                    productId: input.productId,
                },
            },
        });
        if (!currentConfig) {
            throw AppError.notFound(
                "Product configuration for this hub doesn't exist"
            );
        }
        await transaction.priceLog.create({
            data: {
                hubProductConfigId: currentConfig.id,
                oldPrice: currentConfig.localPrice,
                newPrice: input.newPrice,
                changedById: input.adminUserId,
            },
        });
    });
}
