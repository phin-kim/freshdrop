export interface CheckoutRequestBody {
    phoneNumber: string;
    items: CartItemInput[];
    //macro location
    deliveryDestination: string;
    customerCoordinates: [number, number];
    //micro location details
    buildingDetails: string;
    houseNumber: string;
    landmark?: string;
}
export interface CartItemInput {
    productName: string;
    quantity: number;
    price: number;
}
