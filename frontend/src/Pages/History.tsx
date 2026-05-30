import { useStore } from '../Store/productStore';

export default function TabHistory() {
  const { user, orders, signOut } = useStore();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-outline-variant/25">
        <div>
          <h2 className="font-caveat text-[38px] font-bold text-primary">Order History & Profiling</h2>
          <p className="text-xs text-outline font-semibold uppercase tracking-wider">User Account: {user.email}</p>
        </div>
        <button
          onClick={signOut}
          className="mt-4 sm:mt-0 flex items-center justify-center gap-1.5 px-4.5 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50/50 rounded-xl text-xs font-bold transition-all active:scale-95 duration-100"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Sign Out
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profiling panel */}
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/15 shadow-sm space-y-4">
          <h3 className="font-bold text-md tracking-tight border-b border-slate-100 pb-3">My Farmers Profile</h3>
          <div className="flex flex-col items-center text-center p-4">
            <img
              alt={user.name}
              src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=avatar`}
              className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-primary/20 object-cover mb-3"
            />
            <h4 className="font-bold text-lg">{user.name}</h4>
            <p className="text-xs text-outline font-semibold uppercase tracking-widest">{user.email}</p>
          </div>
          
          <div className="space-y-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-700">
            <div className="flex justify-between">
              <span className="text-outline">Account Created:</span>
              <span className="font-mono text-[11px]">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Total Shillings Transacted:</span>
              <span className="font-black text-primary">
                {orders.filter(o => o.status === "Completed").reduce((sum, o) => sum + o.total, 0).toLocaleString()} sh
              </span>
            </div>
          </div>
        </div>

        {/* Previous Orders pane */}
        <div className="lg:col-span-2 space-y-4 bg-white p-6 rounded-2xl border border-outline-variant/15 shadow-sm">
          <h3 className="font-bold text-md tracking-tight border-b border-slate-100 pb-3">Previous Orders ({orders.length})</h3>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <span className="material-symbols-outlined text-6xl text-slate-100">receipt_long</span>
              <p className="text-sm font-semibold">You haven't placed any farm food orders yet!</p>
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-slate-100">
              {orders.map((o, idx) => (
                <div key={o.id} className={`pt-4 ${idx === 0 ? '' : 'mt-4'}`}>
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 py-1 px-2.5 rounded-lg mr-2 leading-none">{o.id}</span>
                      <span className="text-xs text-outline font-semibold">{new Date(o.createdAt).toLocaleString()}</span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black tracking-widest uppercase rounded-full">
                      Delivery Completed
                    </span>
                  </div>
                  
                  {/* Products Itemized item detail */}
                  <div className="space-y-1.5 pl-2 border-l-2 border-primary/20 mb-3 text-xs leading-normal">
                    {o.items.map(item => (
                      <div key={item.product.id} className="flex justify-between text-on-surface-variant font-medium">
                        <span>{item.product.name} (×{item.quantity})</span>
                        <span>{(item.product.price * item.quantity).toLocaleString()} sh</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-outline">Delivery Destination: <strong className="text-on-surface">{o.shippingAddress}</strong></span>
                    <span className="text-sm font-bold text-primary">KSh {o.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
