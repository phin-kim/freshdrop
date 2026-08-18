import {
    BarChart3,
    Package,
    ShieldCheck,
    ShoppingBag,
    Store,
    Truck,
} from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';

import AdminProductCatalog from '../Components/Pages/Admin/AdminInventory';
import AdminOrders from '../Components/Pages/Admin/AdminOrders';
import AdminRiders from '../Components/Pages/Admin/AdminRiders';

export type AdminSection =
    | 'inventory'
    | 'merchants'
    | 'orders'
    | 'riders'
    | 'analytics';
export default function Admin() {
    const [searchParams, setSearchParams] = useSearchParams();
    //const { products, merchants, orders, riders } = useStore();

    const initialSection =
        (searchParams.get('section') as AdminSection) || 'inventory';

    useState<AdminSection>(initialSection);

    const VALID_SECTIONS: AdminSection[] = [
        'inventory',
        'merchants',
        'orders',
        'riders',
        'analytics',
    ];

    // Derive activeSection directly in the render body
    const secParam = searchParams.get('section') as AdminSection | null;
    const activeSection: AdminSection =
        secParam && VALID_SECTIONS.includes(secParam) ? secParam : 'inventory';

    const handleSelectSection = (section: AdminSection) => {
        setSearchParams({ section });
    };

    return (
        <div
            id="admin-main-page"
            className="mx-auto w-full max-w-7xl space-y-6 pb-16"
        >
            <div className="relative overflow-hidden rounded-3xl bg-stone-900 p-6 text-white shadow-lg sm:p-7">
                <div className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

                <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                            <ShieldCheck className="h-4 w-4" />
                            <span>
                                JUJA FARM CENTRAL DISPATCH & ADMIN CONSOLE
                            </span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                            Agri-Fulfillment Management
                        </h1>
                        <p className="mt-1 max-w-2xl text-xs text-stone-300 sm:text-sm">
                            Real-time oversight of organic inventory, local farm
                            merchant settlements, automated courier dispatch,
                            and daily revenue intelligence.
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-stone-700/80 bg-stone-800/80 p-2 text-xs">
                        <div className="rounded-xl border border-emerald-800/80 bg-emerald-950 px-3 py-1 font-mono font-bold text-emerald-300">
                            Hub: Juja Central (Active)
                        </div>
                        <div className="rounded-xl bg-stone-700/80 px-3 py-1 font-mono text-stone-300">
                            v3.2.0 Pro
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs Bar */}
                <div className="no-scrollbar relative z-10 mt-6 flex items-center gap-2 overflow-x-auto border-t border-stone-800 pt-5">
                    {/* Tab: Inventory */}
                    <button
                        onClick={() => handleSelectSection('inventory')}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition ${
                            activeSection === 'inventory'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                        }`}
                    >
                        <Package className="h-4 w-4" />
                        <span>Produce Inventory</span>
                        {/*<span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                activeSection === 'inventory'
                                    ? 'bg-emerald-800 text-white'
                                    : 'bg-stone-800 text-stone-300'
                            }`}
                        >
                            {products.length}
                        </span>*/}
                    </button>

                    {/* Tab: Merchants */}
                    <button
                        onClick={() => handleSelectSection('merchants')}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition ${
                            activeSection === 'merchants'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                        }`}
                    >
                        <Store className="h-4 w-4" />
                        <span>Merchants & Farms</span>
                        {/*<span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                activeSection === 'merchants'
                                    ? 'bg-emerald-800 text-white'
                                    : 'bg-stone-800 text-stone-300'
                            }`}
                        >
                            {merchants.length}
                        </span>
                        {pendingMerchantsCount > 0 && (
                            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                        )}*/}
                    </button>

                    {/* Tab: Orders */}
                    <button
                        onClick={() => handleSelectSection('orders')}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition ${
                            activeSection === 'orders'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                        }`}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        <span>Customer Orders</span>
                        {/*<span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                activeSection === 'orders'
                                    ? 'bg-emerald-800 text-white'
                                    : 'bg-stone-800 text-stone-300'
                            }`}
                        >
                            {orders.length}
                        </span>
                        {activeOrdersCount > 0 && (
                            <span className="py-0.2 rounded-full bg-purple-500 px-1.5 text-[10px] font-bold text-white">
                                {activeOrdersCount} live
                            </span>
                        )}*/}
                    </button>
                    {/* Tab: Riders */}
                    <button
                        onClick={() => handleSelectSection('riders')}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition ${
                            activeSection === 'riders'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                        }`}
                    >
                        <Truck className="h-4 w-4" />
                        <span>Courier Fleet</span>
                        {/*<span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                activeSection === 'riders'
                                    ? 'bg-emerald-800 text-white'
                                    : 'bg-stone-800 text-stone-300'
                            }`}
                        >
                            {riders.length}
                        </span>
                        <span className="text-[10px] font-medium text-emerald-400">
                            ({availableRidersCount} avail)
                        </span>*/}
                    </button>

                    {/* Tab: Analytics */}
                    <button
                        onClick={() => handleSelectSection('analytics')}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition ${
                            activeSection === 'analytics'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                        }`}
                    >
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics & Reports</span>
                        <span className="rounded border border-amber-400/30 bg-amber-400/20 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                            Recharts
                        </span>
                    </button>
                </div>
            </div>
            <div className="transition-all duration-200">
                {activeSection === 'inventory' && <AdminProductCatalog />}

                {activeSection === 'riders' && <AdminRiders />}
                {activeSection === 'orders' && <AdminOrders />}
                {/*{activeSection === 'analytics' && <AdminAnalytics />}
                 {activeSection === 'merchants' && <AdminMerchants />}
                {activeSection === 'orders' && <AdminOrders />}*/}
            </div>
        </div>
    );
}
