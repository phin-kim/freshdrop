export interface CartItem {
    product: Product;
    quantity: number;
}
export interface Product {
    id: string;
    name: string;
    category: 'Fruits' | 'Vegetables' | 'Dairy' | 'Bakery' | 'Household';
    localPrice: number; // in Shillings (sh)
    quantityText: string;
    inStock: boolean;
    sourcingType: 'OPEN_MARKET' | 'SUPERMARKET';
    hubSlug?: string;
    image?: string;
    rating?: number;
    isOrganic?: boolean;
    isSeasonal?: boolean;
    sku: string;
    stock?: number;
    basePrice: number;
}
