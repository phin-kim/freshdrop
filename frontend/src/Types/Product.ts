import type { ProductSource } from '../../../shared/sharedTypes';

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

export interface DBStoreResponse {
    id: string;
    name: string;
    slug: string;
    sourcingType: 'OPEN_MARKET' | 'SUPERMARKET';
    logo?: string | null;
    rating?: number | null;
}
export interface StoreConfigItem {
    id: string;
    storeId: string;
    productId: string;
    status: string;
    price: string | number;
    store?: {
        id: string;
        name: string;
        slug: string;
    };
}
export interface DBStoreProductConfigResponse {
    id: string;
    price: string | number;
    status: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK';
    store: DBStoreResponse;
}

// 3. The raw product response structure from the backend
export interface DBProductResponse {
    id: string;
    sku: string;
    name: string;
    category: 'Fruits' | 'Vegetables' | 'Dairy' | 'Bakery' | 'Household';
    basePrice: string | number;
    quantityText?: string | null;
    image?: string | null;
    isOrganic?: boolean | null;
    isSeasonal?: boolean | null;
    storeConfigs?: DBStoreProductConfigResponse[];
    localPrice: number;
    stock?: number;
    rating?: number;
}
export type ProductStoreSlug = 'QUICKMART' | 'NAIVAS' | 'OPEN_MARKET' | string;
export type StoreId = Exclude<ProductSource, 'all'>;
export interface StoreOption {
    id: StoreId;
    name: string;
    shortName: string;
    badge: string;
    image: string;
    description: string;
    deliveryTime: string;
    rating: number;
    ordersCount: string;
    accentBg: string;
    accentText: string;
    tagline: string;
    specialty: string[];
}
