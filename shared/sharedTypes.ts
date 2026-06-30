export interface CartItem {
    product: Product;
    quantity: number;
}
export interface Product {
    id: string;
    name: string;
    category: 'Fruits' | 'Vegetables' | 'Dairy' | 'Bakery' | 'Household';
    price: number; // in Shillings (sh)
    quantityText: string;
    image?: string;
    rating?: number;
    isOrganic?: boolean;
    isSeasonal?: boolean;
    sku?: string;
    stock?: number;
    basePrice?: number;
    inStock: boolean;
}
