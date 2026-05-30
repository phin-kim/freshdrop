import { useState, useMemo, FormEvent } from 'react';
import { z } from 'zod';

import { useStore } from '../Store/productStore';
import { calculateServiceCharge } from '../Utils/calculations';
const mpesaSchema = z.object({
  phone: z.string().refine((val) => {
    if (val.startsWith("01") || val.startsWith("07")) {
      return val.length === 10 && /^\d+$/.test(val);
    }
    if (val.startsWith("254")) {
      return val.length === 12 && /^\d+$/.test(val);
    }
    if (val.startsWith("+254")) {
      const numericPart = val.slice(1);
      return numericPart.length === 12 && /^\d+$/.test(numericPart);
    }
    return false;
  }, {
    message: "Phone must start with 01/07 (10 digits) or 254/+254 (12 digits total)"
  }),
  address: z.string().min(5, { message: "Delivery address must be detailed (min 5 chars)" }),
});

const cardSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, { message: "Card number must be exactly 16 digits" }),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: "Expiry must be in MM/YY format" }),
  cvv: z.string().regex(/^\d{3}$/, { message: "CVV must be 3 digits" }),
  address: z.string().min(5, { message: "Delivery address must be detailed (min 5 chars)" }),
});

interface CheckoutModalProps {
  setShowCheckoutModal: (show: boolean) => void;
  setActiveTab: (tab: "home" | "discovery" | "cart" | "history") => void;
}

export default function CheckoutModal({
  setShowCheckoutModal,
  setActiveTab,
}: CheckoutModalProps) {
  const { cart, submitOrder, addToast } = useStore();

  const [paymentMethod, setPaymentMethod] = useState<"Payhero M-PESA" | "Payhero Card">("Payhero M-PESA");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [payErrors, setPayErrors] = useState<{ [key: string]: string }>({});
  const [isPaying, setIsPaying] = useState(false);

  // Compute aggregate Cart totals & service charge details dynamically
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const service = calculateServiceCharge(totalCount);
    const total = subtotal + service.total;

    return {
      subtotal,
      totalCount,
      serviceCharge: service.total,
      steps: service.steps,
      total
    };
  }, [cart]);

  const handlePaySubmit = (e: FormEvent) => {
    e.preventDefault();
    setPayErrors({});

    if (paymentMethod === "Payhero M-PESA") {
      const result = mpesaSchema.safeParse({ phone: paymentPhone, address: shippingAddress });
      if (!result.success) {
        const errors: { [key: string]: string } = {};
        result.error.issues.forEach(err => {
          if (err.path[0]) errors[err.path[0].toString()] = err.message;
        });
        setPayErrors(errors);
        addToast("Please check payment fields.", "error");
        return;
      }
    } else {
      const result = cardSchema.safeParse({
        cardNumber,
        expiry: cardExpiry,
        cvv: cardCvv,
        address: shippingAddress
      });
      if (!result.success) {
        const errors: { [key: string]: string } = {};
        result.error.issues.forEach(err => {
          if (err.path[0]) errors[err.path[0].toString()] = err.message;
        });
        setPayErrors(errors);
        addToast("Please check card fields.", "error");
        return;
      }
    }

    setIsPaying(true);
    addToast("Initiating secure payment connection...", "info");

    // Simulate remote transaction callback window delay
    setTimeout(() => {
      const success = submitOrder({
        paymentMethod,
        paymentPhone: paymentMethod === "Payhero M-PESA" ? paymentPhone : undefined,
        shippingAddress
      });

      setIsPaying(false);
      if (success) {
        setShowCheckoutModal(false);
        setActiveTab("history"); // Redirect to history tab to view orders
        // Reset checkout fields
        setPaymentPhone("");
        setCardNumber("");
        setCardExpiry("");
        setCardCvv("");
        setShippingAddress("");
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#006e1c] text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl">verified_user</span>
            <div>
              <h3 className="font-bold text-base leading-none">Checkout</h3>
              <span className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest block mt-1">256-Bit SSL Encrypted checkout</span>
            </div>
          </div>
          <button
            onClick={() => { if (!isPaying) setShowCheckoutModal(false); }}
            className="text-white hover:text-slate-100 transition-colors focus:outline-none"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Modal Form body */}
        <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
          
          {/* Checkout billing details block */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-outline block">Invoice Total:</span>
              <span className="font-extrabold text-slate-800 text-sm">Basket total + compounded service fee</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-primary leading-none block">{cartTotals.total.toLocaleString()} sh</span>
              <span className="text-[9px] text-[#006e1c] font-black uppercase">Kenya Shillings</span>
            </div>
          </div>

          {/* Payment Methods Tabs */}
          <div className="space-y-1">
            <label className="text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">Select Payment Channel</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setPaymentMethod("Payhero M-PESA"); setPayErrors({}); }}
                className={`py-3.5 rounded-xl flex flex-col items-center justify-center transition-all border ${
                  paymentMethod === "Payhero M-PESA"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-extrabold"
                    : "bg-white border-slate-200 text-on-surface hover:bg-slate-50"
                }`}
              >
                <span className="font-black text-xs">📲 M-PESA Mobile Pay</span>
              </button>

              <button
                type="button"
                onClick={() => { setPaymentMethod("Payhero Card"); setPayErrors({}); }}
                className={`py-3.5 rounded-xl flex flex-col items-center justify-center transition-all border ${
                  paymentMethod === "Payhero Card"
                    ? "bg-blue-50 border-blue-400 text-blue-800 font-extrabold"
                    : "bg-white border-slate-200 text-on-surface hover:bg-slate-50"
                }`}
              >
                <span className="font-black text-xs">💳 Credit/Debit Card</span>
              </button>
            </div>
          </div>

          {/* Shipping Address Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-black tracking-wider text-[#3e4a41] uppercase block" htmlFor="ship-address">Shipping Delivery Destination</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">home_pin</span>
              <input
                id="ship-address"
                type="text"
                placeholder="e.g. Apartment 12B, Westlands Mall Area, Nairobi"
                value={shippingAddress}
                onChange={(e) => {
                  setShippingAddress(e.target.value);
                  if (payErrors.address) setPayErrors(prev => { const c = { ...prev }; delete c.address; return c; });
                }}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl bg-[#f1f3ff]/50 focus:bg-white text-sm outline-none ${payErrors.address ? 'border-error ring-1 ring-error' : 'border-outline-variant/65'}`}
              />
            </div>
            {payErrors.address && (
              <p className="text-[11px] text-error font-medium">{payErrors.address}</p>
            )}
          </div>

          {/* M-PESA mobile input view */}
          {paymentMethod === "Payhero M-PESA" ? (
            <div className="space-y-1">
              <label className="text-[10px] font-black tracking-wider text-[#3e4a41] uppercase block" htmlFor="mpesa-number">M-PESA Phone Number</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">smartphone</span>
                <input
                  id="mpesa-number"
                  type="text"
                  placeholder="e.g. 0712345678 or 254712345678"
                  value={paymentPhone}
                  onChange={(e) => {
                    setPaymentPhone(e.target.value);
                    if (payErrors.phone) setPayErrors(prev => { const c = { ...prev }; delete c.phone; return c; });
                  }}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl bg-[#f1f3ff]/50 focus:bg-white text-sm outline-none ${payErrors.phone ? 'border-error ring-1 ring-error' : 'border-outline-variant/65'}`}
                />
              </div>
              <p className="text-[9px] text-[#6f7a6b] italic font-semibold pt-0.5 leading-normal">
                Secure on-screen M-PESA STK push prompt will arrive on this device for code validation.
              </p>
              {payErrors.phone && (
                <p className="text-[11px] text-error font-medium">{payErrors.phone}</p>
              )}
            </div>
          ) : (
            /* Card Input View */
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-wider text-[#3e4a41] uppercase block" htmlFor="card-number">Card Number</label>
                <div className="relative text-xs">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">credit_card</span>
                  <input
                    id="card-number"
                    type="text"
                    placeholder="16-digit card number"
                    maxLength={16}
                    value={cardNumber}
                    onChange={(e) => {
                      setCardNumber(e.target.value);
                      if (payErrors.cardNumber) setPayErrors(prev => { const c = { ...prev }; delete c.cardNumber; return c; });
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl bg-[#f1f3ff]/55 focus:bg-white text-sm outline-none ${payErrors.cardNumber ? 'border-error ring-1 ring-error' : 'border-outline-variant/65'}`}
                  />
                </div>
                {payErrors.cardNumber && (
                  <p className="text-[11px] text-error font-medium">{payErrors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-wider text-[#3e4a41] uppercase block" htmlFor="card-expiry">Expiry Date</label>
                  <input
                    id="card-expiry"
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => {
                      setCardExpiry(e.target.value);
                      if (payErrors.expiry) setPayErrors(prev => { const c = { ...prev }; delete c.expiry; return c; });
                    }}
                    className={`w-full px-3 py-2.5 border rounded-xl bg-[#f1f3ff]/55 text-sm outline-none focus:bg-white ${payErrors.expiry ? 'border-error ring-1 ring-error' : 'border-outline-variant/65'}`}
                  />
                  {payErrors.expiry && (
                    <p className="text-[11px] text-error font-medium">{payErrors.expiry}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-wider text-[#3e4a41] uppercase block" htmlFor="card-cvv">CVV Code</label>
                  <input
                    id="card-cvv"
                    type="password"
                    placeholder="3 digits"
                    maxLength={3}
                    value={cardCvv}
                    onChange={(e) => {
                      setCardCvv(e.target.value);
                      if (payErrors.cvv) setPayErrors(prev => { const c = { ...prev }; delete c.cvv; return c; });
                    }}
                    className={`w-full px-3 py-2.5 border rounded-xl bg-[#f1f3ff]/55 text-sm outline-none focus:bg-white ${payErrors.cvv ? 'border-error ring-1 ring-error' : 'border-outline-variant/65'}`}
                  />
                  {payErrors.cvv && (
                    <p className="text-[11px] text-error font-medium">{payErrors.cvv}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action checkout CTAs */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              disabled={isPaying}
              onClick={() => setShowCheckoutModal(false)}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all active:scale-95 duration-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPaying}
              className="flex-1 py-3 bg-[#006e1c] hover:bg-[#005313] disabled:bg-emerald-800/60 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all duration-150"
            >
              {isPaying ? (
                <>
                  <span className="animate-spin text-sm material-symbols-outlined">sync</span>
                  Processing Gateways...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">credit_score</span>
                  Pay {cartTotals.total.toLocaleString()} sh
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
