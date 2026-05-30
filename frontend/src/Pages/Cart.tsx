import { useMemo } from 'react';
import { useStore } from '../Store/productStore';
import { calculateServiceCharge } from '../Utils/calculations';
interface TabCartProps {
  setActiveTab: (tab: "home" | "discovery" | "cart" | "history") => void;
  setSelectedCategory: (category: string) => void;
  setShowCheckoutModal: (show: boolean) => void;
}

export default function TabCart({
  setActiveTab,
  setSelectedCategory,
  setShowCheckoutModal,
}: TabCartProps) {
  const { cart, updateCartQuantity, removeFromCart, addToast } = useStore();

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart list panel (2 cols) */}
      <div className="lg:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-outline-variant/15 shadow-sm">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <h2 className="font-caveat text-[38px] font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px]">shopping_basket</span>
            My Basket ({cartTotals.totalCount} items)
          </h2>
          {cart.length > 0 && (
            <button
              onClick={() => { useStore.getState().clearCart(); addToast("Cart cleared.", "info"); }}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline py-1 px-2.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              Clear All Items
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto space-y-5">
            <span className="material-symbols-outlined text-7xl text-primary/30">shopping_cart_checkout</span>
            <h3 className="font-bold text-lg">Your Farm Smart Basket is Empty</h3>
            <p className="text-sm text-outline font-semibold">Ready to grab fresh local food? Head back over to our marketplace catalog.</p>
            <button
              onClick={() => { setActiveTab("discovery"); setSelectedCategory("All Items"); }}
              className="px-6 py-3 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-primary-container inline-block"
            >
              Browse Produce Catalog
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {cart.map((item) => (
              <div key={item.product.id} className="flex gap-4 py-4 items-center">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-xl object-cover border border-outline-variant/20 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-on-surface truncate leading-tight">{item.product.name}</h4>
                  <p className="text-xs text-outline font-semibold mb-1">{item.product.quantityText}</p>
                  <span className="text-xs font-black text-primary block">{item.product.price} sh / unit</span>
                </div>

                {/* Multiplier unit adjustment controls */}
                <div className="flex items-center gap-2 border border-[#becab9]/50 rounded-xl bg-slate-50 p-1">
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg hover:bg-white text-on-surface flex items-center justify-center font-bold focus:outline-none transition-colors border-none"
                  >
                    <span className="material-symbols-outlined text-sm font-black">remove</span>
                  </button>
                  <span className="text-xs font-black text-center w-6">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg hover:bg-white text-on-surface flex items-center justify-center font-bold focus:outline-none transition-colors border-none"
                  >
                    <span className="material-symbols-outlined text-sm font-black">add</span>
                  </button>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-on-surface">{(item.product.price * item.quantity).toLocaleString()} sh</span>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="block text-rose-500 hover:text-rose-700 ml-auto mt-1 p-1 hover:bg-rose-50 rounded"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing summary view with dynamic Compound Service Charge calculator */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/15 shadow-sm space-y-5">
          <h3 className="font-bold text-md tracking-tight border-b border-slate-100 pb-3">Order Invoice Details</h3>
          
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between font-semibold text-on-surface-variant">
              <span>Items Subtotal:</span>
              <span>{cartTotals.subtotal.toLocaleString()} sh</span>
            </div>

            {/* Compound Calculator Details panel */}
            <div className="bg-[#f1f3ff] p-4 rounded-xl border border-blue-100 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-[#141b2b]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-blue-700">calculate</span>
                  Compounded Service Fee
                </span>
                <span className="text-blue-700 font-extrabold">{cartTotals.serviceCharge.toLocaleString()} sh</span>
              </div>
              {cart.length > 0 ? (
                <div className="space-y-1.5 border-t border-blue-200/50 pt-2 text-[10px] text-[#3e4a41] max-h-36 overflow-y-auto custom-scrollbar">
                  <p className="italic font-medium leading-normal mb-1">
                    <strong>Logic Rule:</strong> Base fee of 10 sh for 1st item, with fee compounding by 50% for each additional quantity in cart!
                  </p>
                  {cartTotals.steps.map((st) => (
                    <div key={st.quantity} className="flex justify-between items-center font-mono">
                      <span>Item #{st.quantity} fee:</span>
                      <span>+{st.charge} sh</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-outline italic">No items count on basket to process calculator logic.</p>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-lg font-black text-primary">
              <span>Total Due:</span>
              <span>{cartTotals.total.toLocaleString()} sh</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (cart.length === 0) {
                addToast("Cannot checkout an empty basket!", "error");
              } else {
                setShowCheckoutModal(true);
              }
            }}
            className="w-full bg-primary hover:bg-primary-container text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 duration-150 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">payments</span>
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
