import {
    BASE_DELIVERY_FEE,
    MULTI_STORE_PLATFORM_RATE,
    MULTI_STORE_RIDER_RATE,
    ONE_TO_THREE_KM_CHARGE,
    PLATFORM_COMMISSION_RATE,
    STRATEGY_SERVICE_FEE,
    THREE_STOP_SURCHARGE,
    THREE_TO_FIVE_KM_CHARGE,
    TWO_STOP_SURCHARGE,
} from '../../../shared/constants';

/**
 * Calculates the exact compounding service fee and cart totals
 
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
*/
export function calculateDeliveryFee(distanceKm: number): number {
    let fee = BASE_DELIVERY_FEE;
    if (distanceKm <= 1) {
        return fee;
    }
    if (distanceKm <= 3) {
        fee += (distanceKm - 1) * ONE_TO_THREE_KM_CHARGE;
        return fee;
    }
    fee += 2 * ONE_TO_THREE_KM_CHARGE;
    fee += (distanceKm - 3) * THREE_TO_FIVE_KM_CHARGE;
    return Math.round(fee);
}
export function splitDeliveryFee(deliveryFee: number): {
    riderPay: number;
    platformPay: number;
} {
    const additional = deliveryFee - BASE_DELIVERY_FEE;
    if (additional <= 0) {
        return { riderPay: BASE_DELIVERY_FEE, platformPay: 0 };
    }
    const platformPay = additional * PLATFORM_COMMISSION_RATE;
    const riderPay = BASE_DELIVERY_FEE + (additional - platformPay);
    return { riderPay, platformPay };
}
export function getMultiStoreSurcharge(storeCount: number): number {
    if (storeCount >= 3) return THREE_STOP_SURCHARGE;
    if (storeCount === 2) return TWO_STOP_SURCHARGE;
    return 0;
}
export function calculateFinancials(
    distanceKm: number,
    storeCount: number,
    itemsSubtotal: number
) {
    const baseDistanceFee = calculateDeliveryFee(distanceKm); //calculates the fee based on the distance
    const multiStoreSurcharge = getMultiStoreSurcharge(storeCount); //identifies if we have more than 1 store
    const secureDeliveryFee = baseDistanceFee + multiStoreSurcharge;
    const additionalDistanceFee = Math.max(
        0,
        baseDistanceFee - BASE_DELIVERY_FEE
    );
    const { riderPay: baseRiderPay, platformPay: basePlatformPay } =
        splitDeliveryFee(baseDistanceFee); //separaes the platform fee from the rider payout
    const riderMultiStorePay = multiStoreSurcharge * MULTI_STORE_RIDER_RATE;
    const platformMultiStorePay =
        multiStoreSurcharge * MULTI_STORE_PLATFORM_RATE;

    const riderPayout = baseRiderPay + riderMultiStorePay;
    const platformCommission = basePlatformPay + platformMultiStorePay;
    const platformTotal = platformCommission + STRATEGY_SERVICE_FEE;
    const totalAmount =
        itemsSubtotal + STRATEGY_SERVICE_FEE + secureDeliveryFee;
    return {
        distanceKm,
        multiStoreSurcharge,
        subtotal: itemsSubtotal,
        serviceFee: STRATEGY_SERVICE_FEE,
        deliveryFee: secureDeliveryFee,
        totalAmount,
        baseDistanceFee,
        baseDeliveryFee: BASE_DELIVERY_FEE,
        additionalDistanceFee,
        riderPayout,
        platformCommission,
        platformTotal,
        commissionRate: PLATFORM_COMMISSION_RATE,
    };
}
