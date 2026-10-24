import {
    BarChart3,
    LifeBuoy,
    Package,
    ShieldCheck,
    ShoppingBag,
    Store,
    Truck,
} from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';

import AdminAnalytics from '../Components/Pages/Admin/AdminAnalytics';
import AdminProductCatalog from '../Components/Pages/Admin/AdminInventory';
import AdminOrders from '../Components/Pages/Admin/AdminOrders';
import AdminRiders from '../Components/Pages/Admin/AdminRiders';
import AdminTickets from '../Components/Pages/Admin/AdminTickets';

export type AdminSection =
    | 'inventory'
    | 'merchants'
    | 'orders'
    | 'tickets'
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
        'tickets',
        'analytics',
    ];

    // Derive activeSection directly in the render body
    const secParam = searchParams.get('section') as AdminSection | null;
    const activeSection: AdminSection =
        secParam && VALID_SECTIONS.includes(secParam) ? secParam : 'inventory';

    const handleSelectSection = (section: AdminSection) => {
        setSearchParams({ section });
    };
    const quickmartCount = 10;
    const naivasCount = 12;
    const openmarketCount = 15;
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

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {/* Quickmart pill */}
                        <div className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-stone-800/90 px-3 py-1.5 text-xs">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0i3GLqH23ClCnFk33b5y6DVBjChOLniznYlxAN0-L_A&s=10"
                                alt="Quickmart"
                                className="h-4 w-4 rounded-full object-cover"
                            />
                            <span className="font-bold text-red-300">
                                Quickmart:
                            </span>
                            <span className="font-mono font-bold text-white">
                                {quickmartCount}
                            </span>
                        </div>

                        {/* Naivas pill */}
                        <div className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-stone-800/90 px-3 py-1.5 text-xs">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTv5nvrQwE0G8No_VQVOqzfR85sFHr8WJyQ4pkdWUqNGw&s=10"
                                alt="Naivas"
                                className="h-4 w-4 rounded-full object-cover"
                            />
                            <span className="font-bold text-blue-300">
                                Naivas:
                            </span>
                            <span className="font-mono font-bold text-white">
                                {naivasCount}
                            </span>
                        </div>

                        {/* Open Market pill */}
                        <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-stone-800/90 px-3 py-1.5 text-xs">
                            <img
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9ys0t-yA2GkurxH7hQVJot6HIVpFUrGzTI1WWXDQP2g&s=10"
                                alt="Open Market"
                                className="h-4 w-4 rounded-full object-cover"
                            />
                            <span className="font-bold text-emerald-300">
                                Open Market:
                            </span>
                            <span className="font-mono font-bold text-white">
                                {openmarketCount}
                            </span>
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
                    {/*Support and tickets */}
                    <button
                        onClick={() => handleSelectSection('tickets')}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition ${
                            activeSection === 'tickets'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                        }`}
                    >
                        <LifeBuoy className="h-4 w-4" />
                        <span>Support Tickets</span>
                        {/*<span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeSection === 'tickets' ? 'bg-emerald-800 text-white' : 'bg-stone-800 text-stone-300'
            }`}>
              {tickets.length}
            </span>
            {tickets.filter(t => t.status === 'Pending').length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-rose-500 text-white rounded-full font-bold">
                {tickets.filter(t => t.status === 'Pending').length} new
              </span>
            )}*/}
                    </button>
                </div>
            </div>
            <div className="transition-all duration-200">
                {activeSection === 'inventory' && <AdminProductCatalog />}

                {activeSection === 'riders' && <AdminRiders />}
                {activeSection === 'orders' && <AdminOrders />}
                {activeSection === 'analytics' && <AdminAnalytics />}
                {activeSection === 'tickets' && <AdminTickets />}
                {/* {activeSection === 'merchants' && <AdminMerchants />}
                {activeSection === 'orders' && <AdminOrders />}*/}
            </div>
        </div>
    );
}
