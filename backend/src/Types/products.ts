export interface CheckoutRequestBody {
    phoneNumber: string;
    items: CartItemInput[];
    //macro location
    apartmentName: string;
    customerCoordinates: [number, number];
    deliveryDestination: string;
    deliveryFee: number;
    distanceKm: number;
    //micro location details
    buildingDetails: string;
    houseNumber: string;
    landmark?: string;
}
export interface CartItemInput {
    productName: string;
    quantity: number;
    pricePerItem: number;
}
