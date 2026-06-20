export interface CheckoutRequestBody {
    phoneNumber: string;
    items: CartItemInput[];
    //macro location
    apartmentName: string;
    customerCoordinates: {
        lat: number;
        lng: number;
    };
    deliveryDestination: string;
    deliveryFee: number;
    distanceKm: number;
    //micro location details
    buildingDetails: string;
    houseNumber: string;
    landmark?: string;
}
export interface CartItemInput {
    product: Product;
    quantity: number;
    //price: number;
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
}
