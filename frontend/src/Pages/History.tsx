import { useEffect, useState } from 'react';
import { MdLogout, MdOutlineReceiptLong } from 'react-icons/md';

import { userApi } from '../Library/api';
import { useAuthStore } from '../Store/authStore';
import useErrorStore from '../Store/errorStore';
import type { Order } from '../Types/Orders';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';

const log = createClientLogger('OrderHistory.tsx');

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface OrdersApiResponse {
    orders: Order[];
    pagination: PaginationMeta;
}

export default function TabHistory() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const [orders, setOrders] = useState<Order[]>([]);
    const [page, setPage] = useState<number>(1);
    const [pagination, setPagination] = useState<PaginationMeta>({
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 1,
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const setError = useErrorStore((state) => state.setError);

    useEffect(() => {
        if (!user?.id) return;

        const fetchUserOrders = async (): Promise<void> => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await userApi(
                    `/user/orders?userId=${user.id}&page=${page}&limit=5`
                );

                const data: OrdersApiResponse = response.data;
                setOrders(data.orders || []);
                if (data.pagination) {
                    setPagination(data.pagination);
                }
            } catch (error: unknown) {
                log.error('Failed to load user orders', { data: { error } });
                handleApiError(error, setError);
                setOrders([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserOrders();
    }, [user?.id, page, setError]);

    if (!user) return null;

    // Guard against non-array states so .filter() never crashes the app
    const safeOrders = Array.isArray(orders) ? orders : [];

    // Calculate total for orders on the current page that have been paid or delivered
    const totalTransacted = safeOrders
        .filter((o) => o.status === 'DELIVERY_COMPLETED' || o.status === 'PAID')
        .reduce((sum: number, o: Order) => sum + Number(o.totalAmount), 0);

    return (
        <div className="space-y-6">
            {/* Header section */}
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
                    onClick={logout}
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
                                `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`
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
                                Page Total Transacted:
                            </span>
                            <span className="text-primary font-black">
                                {totalTransacted.toLocaleString()} sh
                            </span>
                        </div>
                    </div>
                </div>

                {/* Previous Orders pane */}
                <div className="border-outline-variant/15 space-y-4 rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2">
                    <h3 className="text-md border-b border-slate-100 pb-3 font-bold tracking-tight">
                        Previous Orders ({pagination.total})
                    </h3>

                    {isLoading ? (
                        <div className="space-y-3 py-12 text-center text-slate-400">
                            <p className="animate-pulse text-sm font-semibold">
                                Loading your order history...
                            </p>
                        </div>
                    ) : safeOrders.length === 0 ? (
                        <div className="space-y-3 py-12 text-center text-slate-400">
                            <span className="material-symbols-outlined text-6xl text-slate-100">
                                <MdOutlineReceiptLong />
                            </span>
                            <p className="text-sm font-semibold">
                                You haven't placed any farm food orders yet!
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 divide-y divide-slate-100">
                                {safeOrders.map((o, idx) => {
                                    const formattedAddress = [
                                        o.deliveryDestination,
                                        o.apartmentName,
                                        o.houseNumber
                                            ? `House ${o.houseNumber}`
                                            : null,
                                        o.landmark
                                            ? `(Near ${o.landmark})`
                                            : null,
                                    ]
                                        .filter(Boolean)
                                        .join(', ');

                                    return (
                                        <div
                                            key={o.id}
                                            className={`pt-4 ${
                                                idx === 0 ? '' : 'mt-4'
                                            }`}
                                        >
                                            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                                                <div>
                                                    <span className="mr-2 rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs leading-none font-bold text-blue-600">
                                                        #
                                                        {o.reference ||
                                                            o.id.slice(0, 8)}
                                                    </span>
                                                    <span className="text-outline text-xs font-semibold">
                                                        {new Date(
                                                            o.createdAt
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`rounded-full border px-3 py-1 text-[10px] font-black tracking-widest uppercase ${
                                                        o.status ===
                                                            'DELIVERY_COMPLETED' ||
                                                        o.status === 'PAID'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                            : 'border-amber-200 bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {o.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {/* Products Itemized item detail */}
                                            <div className="border-primary/20 mb-3 space-y-1.5 border-l-2 pl-2 text-xs leading-normal">
                                                {o.items?.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="text-on-surface-variant flex justify-between font-medium"
                                                    >
                                                        <span>
                                                            {item.productName}{' '}
                                                            (×
                                                            {item.quantity})
                                                        </span>
                                                        <span>
                                                            {(
                                                                Number(
                                                                    item.priceAtPurchase
                                                                ) *
                                                                item.quantity
                                                            ).toLocaleString()}{' '}
                                                            sh
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex flex-col gap-1 text-xs font-semibold sm:flex-row sm:items-center sm:justify-between">
                                                <span className="text-outline">
                                                    Delivery Destination:{' '}
                                                    <strong className="text-on-surface font-semibold">
                                                        {formattedAddress}
                                                    </strong>
                                                </span>
                                                <span className="text-primary text-sm font-bold">
                                                    KSh{' '}
                                                    {Number(
                                                        o.totalAmount
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination Navigation Bar */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold">
                                    <button
                                        type="button"
                                        disabled={page <= 1 || isLoading}
                                        onClick={() =>
                                            setPage((prev: number) =>
                                                Math.max(prev - 1, 1)
                                            )
                                        }
                                        className="rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                                    >
                                        Previous
                                    </button>
                                    <span className="font-mono text-[11px] text-slate-500">
                                        Page {pagination.page} of{' '}
                                        {pagination.totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={
                                            page >= pagination.totalPages ||
                                            isLoading
                                        }
                                        onClick={() =>
                                            setPage((prev: number) =>
                                                Math.min(
                                                    prev + 1,
                                                    pagination.totalPages
                                                )
                                            )
                                        }
                                        className="rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
