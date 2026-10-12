import type { ProductSource } from '../../../shared/sharedTypes';

export interface DBStoreResponse {
    id: string;
    name: string;
    slug: string;
    sourcingType: 'OPEN_MARKET' | 'SUPERMARKET';
    logo?: string | null;
    rating?: number | null;
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
