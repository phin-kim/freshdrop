import { MdLogout, MdOutlineReceiptLong } from 'react-icons/md';

import { useStore } from '../Store/productStore';

export default function TabHistory() {
    const { user, orders, signOut } = useStore();

    if (!user) return null;

    return (
        <div className="space-y-6">
            <section className="border-outline-variant/25 flex flex-col border-b py-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="font-caveat text-primary text-[38px] font-bold">
                        Order History & Profiling
                    </h2>
                    <p className="text-outline text-xs font-semibold tracking-wider uppercase">
                        User Account: {user.email}
                    </p>
                </div>
                <button
                    onClick={signOut}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 px-4.5 py-2 text-xs font-bold text-rose-700 transition-all duration-100 hover:bg-rose-50/50 active:scale-95 sm:mt-0"
                >
                    <span className="material-symbols-outlined text-base">
                        <MdLogout />
                    </span>
                    Sign Out
                </button>
            </section>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Profiling panel */}
                <div className="border-outline-variant/15 space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
                    <h3 className="text-md border-b border-slate-100 pb-3 font-bold tracking-tight">
                        My Farmers Profile
                    </h3>
                    <div className="flex flex-col items-center p-4 text-center">
                        <img
                            alt={user.name}
                            src={
                                user.avatar ||
                                `https://api.dicebear.com/7.x/adventurer/svg?seed=avatar`
                            }
                            className="border-primary/20 mb-3 h-20 w-20 rounded-full border-2 bg-emerald-100 object-cover"
                        />
                        <h4 className="text-lg font-bold">{user.name}</h4>
                        <p className="text-outline text-xs font-semibold tracking-widest uppercase">
                            {user.email}
                        </p>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-700">
                        <div className="flex justify-between">
                            <span className="text-outline">
                                Account Created:
                            </span>
                            <span className="font-mono text-[11px]">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-outline">
                                Total Shillings Transacted:
                            </span>
                            <span className="text-primary font-black">
                                {orders
                                    .filter((o) => o.status === 'Completed')
                                    .reduce((sum, o) => sum + o.total, 0)
                                    .toLocaleString()}{' '}
                                sh
                            </span>
                        </div>
                    </div>
                </div>

                {/* Previous Orders pane */}
                <div className="border-outline-variant/15 space-y-4 rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
                    <h3 className="text-md border-b border-slate-100 pb-3 font-bold tracking-tight">
                        Previous Orders ({orders.length})
                    </h3>

                    {orders.length === 0 ? (
                        <div className="space-y-3 py-12 text-center text-slate-400">
                            <span className="material-symbols-outlined text-6xl text-slate-100">
                                <MdOutlineReceiptLong />
                            </span>
                            <p className="text-sm font-semibold">
                                You haven't placed any farm food orders yet!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 divide-y divide-slate-100">
                            {orders.map((o, idx) => (
                                <div
                                    key={o.id}
                                    className={`pt-4 ${idx === 0 ? '' : 'mt-4'}`}
                                >
                                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <span className="mr-2 rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs leading-none font-bold text-blue-600">
                                                {o.id}
                                            </span>
                                            <span className="text-outline text-xs font-semibold">
                                                {new Date(
                                                    o.createdAt
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black tracking-widest text-emerald-700 uppercase">
                                            Delivery Completed
                                        </span>
                                    </div>

                                    {/* Products Itemized item detail */}
                                    <div className="border-primary/20 mb-3 space-y-1.5 border-l-2 pl-2 text-xs leading-normal">
                                        {o.items.map((item) => (
                                            <div
                                                key={item.product.id}
                                                className="text-on-surface-variant flex justify-between font-medium"
                                            >
                                                <span>
                                                    {item.product.name} (×
                                                    {item.quantity})
                                                </span>
                                                <span>
                                                    {(
                                                        item.product.price *
                                                        item.quantity
                                                    ).toLocaleString()}{' '}
                                                    sh
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-outline">
                                            Delivery Destination:{' '}
                                            <strong className="text-on-surface">
                                                {o.shippingAddress}
                                            </strong>
                                        </span>
                                        <span className="text-primary text-sm font-bold">
                                            KSh {o.total.toLocaleString()}
                                        </span>
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
