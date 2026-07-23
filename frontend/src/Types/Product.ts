import type { CartItem } from '../../../shared/sharedTypes';

export interface Order {
    id: string;
    items: CartItem[];
    subtotal: number;
    serviceCharge: number;
    total: number;
    paymentMethod: 'Payhero M-PESA' | 'Payhero Card';
    paymentPhone?: string;
    shippingAddress: string;
    status: 'Completed' | 'Pending' | 'Failed';
    createdAt: string;
}
// 1. The nested Hub relation details
interface DBHub {
    id: string;
    name: string;
    slug: string;
}

// 2. The nested localization configuration layout from Prisma
interface DBHubConfig {
    id: string;
    hubId: string;
    productId: string;
    status: 'IN_STOCK' | 'OUT_OF_STOCK';
    localPrice: string | number; // Prisma Decimals often arrive as strings
    hub: DBHub;
}

// 3. The raw product response structure from the backend
export interface DBProductResponse {
    id: string;
    sku: string;
    name: string;
    category: 'Fruits' | 'Vegetables' | 'Dairy' | 'Bakery' | 'Household';
    sourcingType: 'OPEN_MARKET' | 'SUPERMARKET';
    basePrice: string | number;
    quantityText?: string | null;
    image?: string | null;
    isOrganic?: boolean | null;
    isSeasonal?: boolean | null;
    hubConfigs?: DBHubConfig[];
    localPrice: number;
    stock?: number;
    rating?: number;
}
