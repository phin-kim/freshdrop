import { useMemo, useState } from 'react';
import {
    MdAdd,
    MdOutlineCalculate,
    MdOutlineDeleteForever,
    MdOutlineRemove,
    MdOutlineShoppingBasket,
    MdPayments,
} from 'react-icons/md';
import { useNavigate } from 'react-router';

import { STRATEGY_SERVICE_FEE } from '../../../shared/constants';
import CheckoutModal from '../Components/Pages/CheckoutModal';
import { useDeliveryStore } from '../Store/delivery';
import useErrorStore from '../Store/errorStore';
import { useStore } from '../Store/productStore';
import useSuccessStore from '../Store/successStore';
import createClientLogger from '../Utils/clientLogger';

const log = createClientLogger('Cart.tsx');
export default function TabCart() {
    // 2. Fetch distance details from your global location tracking state
    // (e.g., Zustand, React Context, or component props)
    const deliveryFee = useDeliveryStore((state) => state.deliveryFee) ?? 0;
    const customerCoordinates = useDeliveryStore((state) => state.coords);
    const distanceKm = useDeliveryStore((state) => state.deliveryDistance); // 3. Compute delivery fee display step matching backend expectations

    // 4. Update your grand total tracker
    const { cart, updateCartQuantity, removeFromCart } = useStore();
    const setError = useErrorStore((state) => state.setError);
    const setSuccess = useSuccessStore((state) => state.setSuccess);
    const navigate = useNavigate();
    const [checkoutModal, setShowCheckoutModal] = useState(false);

    // Compute aggregate Cart totals & service charge details dynamically
    const cartTotals = useMemo(() => {
        // A. Calculate item cost subtotal
        const subtotal = cart.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
        );

        // B. Calculate total item piece count
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

        // C. Calculate distance logistics fee mapping our business rule

        // D. Calculate final grand total safely
        const grandTotalDue = subtotal + STRATEGY_SERVICE_FEE + deliveryFee;

        return {
            subtotal,
            totalCount,
            deliveryFee,
            fixedServiceFee: STRATEGY_SERVICE_FEE,
            grandTotalDue,
        };
    }, [cart, deliveryFee]); // Runs only when cart or destination updates
    log.debug('Cart totals', { data: { cartTotals } });
    // 4. Quick reference variable for your CheckoutModal component down below
    const grandTotalDue = cartTotals.grandTotalDue;

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Cart list panel (2 cols) */}
            {checkoutModal && (
                <CheckoutModal
                    grandTotalDue={grandTotalDue}
                    setShowCheckoutModal={setShowCheckoutModal}
                />
            )}
            <div className="border-outline-variant/15 space-y-6 rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h2 className="font-caveat text-primary flex items-center gap-2 text-[38px] font-bold">
                        <span className="material-symbols-outlined text-[32px]">
                            <MdOutlineShoppingBasket />
                        </span>
                        My Basket ({cartTotals.totalCount} items)
                    </h2>
                    {cart.length > 0 && (
                        <button
                            onClick={() => {
                                useStore.getState().clearCart();
                                setSuccess('Cart cleared.');
                            }}
                            className="rounded-lg px-2.5 py-1 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-800 hover:underline"
                        >
                            Clear All Items
                        </button>
                    )}
                </div>

                {cart.length === 0 ? (
                    <div className="mx-auto max-w-sm space-y-5 py-16 text-center">
                        <span className="material-symbols-outlined text-primary/30 text-7xl">
                            shopping_cart_checkout
                        </span>
                        <h3 className="text-lg font-bold">
                            Your Farm Smart Basket is Empty
                        </h3>
                        <p className="text-outline text-sm font-semibold">
                            Ready to grab fresh local food? Head back over to
                            our marketplace catalog.
                        </p>
                        <button
                            onClick={() => {
                                navigate(
                                    '/discovery'
                                ); /*setSelectedCategory("All Items");*/
                            }}
                            className="bg-primary hover:bg-primary-container inline-block rounded-xl px-6 py-3 text-xs font-bold tracking-wider text-white uppercase shadow-md"
                        >
                            Browse Produce Catalog
                        </button>
                    </div>
                ) : (
                    <div className="custom-scrollbar max-h-[500px] divide-y divide-slate-100 overflow-y-auto pr-2">
                        {cart.map((item) => (
                            <div
                                key={item.product.id}
                                className="flex items-center gap-4 py-4"
                            >
                                <img
                                    src={item.product.image}
                                    alt={item.product.name}
                                    className="border-outline-variant/20 h-16 w-16 shrink-0 rounded-xl border object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-on-surface truncate text-sm leading-tight font-bold">
                                        {item.product.name}
                                    </h4>
                                    <p className="text-outline mb-1 text-xs font-semibold">
                                        {item.product.quantityText}
                                    </p>
                                    <span className="text-primary block text-xs font-black">
                                        {item.product.price} sh / unit
                                    </span>
                                </div>

                                {/* Multiplier unit adjustment controls */}
                                <div className="flex items-center gap-2 rounded-xl border border-[#becab9]/50 bg-slate-50 p-1">
                                    <button
                                        onClick={() =>
                                            updateCartQuantity(
                                                item.product.id,
                                                item.quantity - 1
                                            )
                                        }
                                        className="text-on-surface flex h-7 w-7 items-center justify-center rounded-lg border-none font-bold transition-colors hover:bg-white focus:outline-none"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">
                                            <MdOutlineRemove />
                                        </span>
                                    </button>
                                    <span className="w-6 text-center text-xs font-black">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() =>
                                            updateCartQuantity(
                                                item.product.id,
                                                item.quantity + 1
                                            )
                                        }
                                        className="text-on-surface flex h-7 w-7 items-center justify-center rounded-lg border-none font-bold transition-colors hover:bg-white focus:outline-none"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">
                                            <MdAdd />
                                        </span>
                                    </button>
                                </div>

                                <div className="shrink-0 text-right">
                                    <span className="text-on-surface text-sm font-black">
                                        {(
                                            item.product.price * item.quantity
                                        ).toLocaleString()}{' '}
                                        sh
                                    </span>
                                    <button
                                        onClick={() =>
                                            removeFromCart(item.product.id)
                                        }
                                        className="mt-1 ml-auto block rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                                    >
                                        <span className="material-symbols-outlined text-sm">
                                            <MdOutlineDeleteForever />
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pricing summary view with dynamic Compound Service Charge calculator */}
            <div className="space-y-6">
                <div className="border-outline-variant/15 space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
                    <h3 className="text-md border-b border-slate-100 pb-3 font-bold tracking-tight">
                        Order Invoice Details
                    </h3>

                    <div className="space-y-2.5 text-sm">
                        <div className="text-on-surface-variant flex justify-between font-semibold">
                            <span>Items Subtotal:</span>
                            <span>
                                {cartTotals.subtotal.toLocaleString()} sh
                            </span>
                        </div>

                        {/* Compound Calculator Details panel */}
                        <div className="space-y-3 rounded-xl border border-blue-100 bg-[#f1f3ff] p-4">
                            <div className="flex items-center justify-between text-xs font-bold text-[#141b2b]">
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px] text-blue-700">
                                        <MdOutlineCalculate />
                                    </span>
                                    Compounded Service Fee
                                </span>
                                <span className="font-extrabold text-blue-700">
                                    {cartTotals.deliveryFee.toLocaleString()} sh
                                </span>
                            </div>
                            {cart.length > 0 ? (
                                <div className="custom-scrollbar max-h-36 space-y-1.5 overflow-y-auto border-t border-blue-200/50 pt-2 text-[10px] text-[#3e4a41]">
                                    <p className="mb-2 leading-normal font-medium italic">
                                        <strong>Logic Rule:</strong> Fixed
                                        platform service fee of 50 sh + dynamic
                                        distance delivery fee (50 sh base for
                                        first 2 km, then 25 sh per additional
                                        km).
                                    </p>

                                    {/* 1. Fixed Platform Service Fee Row */}
                                    <div className="flex items-center justify-between font-mono">
                                        <span>Fixed Service Fee:</span>
                                        <span>+{STRATEGY_SERVICE_FEE} sh</span>
                                    </div>

                                    {/* 2. Dynamic Distance Delivery Fee Row */}
                                    {customerCoordinates ? (
                                        <div className="flex items-center justify-between font-mono">
                                            <span>
                                                Delivery Fee (
                                                {distanceKm
                                                    ? `${distanceKm} km`
                                                    : 'Calculating...'}
                                                ):
                                            </span>
                                            <span>+{deliveryFee} sh</span>
                                        </div>
                                    ) : (
                                        <div className="flex animate-pulse items-center justify-between font-mono text-red-600/80 italic">
                                            <span>Delivery Fee:</span>
                                            <span>
                                                📍 Please set your home page
                                                address
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-outline text-[10px] italic">
                                    No items count on basket to process
                                    calculator logic.
                                </p>
                            )}
                        </div>

                        <div className="text-primary flex items-center justify-between border-t border-slate-100 pt-3 text-lg font-black">
                            <span>Total Due:</span>
                            <span>
                                {cartTotals.grandTotalDue.toLocaleString()} sh
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (cart.length === 0) {
                                setError('Cannot checkout an empty basket!');
                            } else {
                                setShowCheckoutModal(true);
                            }
                        }}
                        className="bg-primary hover:bg-primary-container flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition-all duration-150 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-base">
                            <MdPayments />
                        </span>
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    );
}
