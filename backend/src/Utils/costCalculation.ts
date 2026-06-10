export interface CartItemInput {
    productName: string;
    quantity: number;
    price: number;
}

/**
 * Calculates the exact compounding service fee and cart totals
 */
export function calculateOrderTotals(items: CartItemInput[]): {
    subtotal: number;
    serviceFee: number;
    totalDue: number;
} {
    const subtotal = items.reduce(
        (sum: number, item: CartItemInput) => sum + item.price * item.quantity,
        0
    );
    const totalUnits = items.reduce(
        (sum: number, item: CartItemInput) => sum + item.quantity,
        0
    );

    let calculatedFee = 0;
    let currentUnitFee = 10; // Base fee for 1st unit

    for (let i = 0; i < totalUnits; i++) {
        calculatedFee += currentUnitFee;
        currentUnitFee *= 1.5; // Compounding by 50%
    }

    // Rounding nicely to match currency standards
    const serviceFee = Math.round(calculatedFee * 100) / 100;
    const totalDue = Math.round((subtotal + serviceFee) * 100) / 100;

    return { subtotal, serviceFee, totalDue };
}
