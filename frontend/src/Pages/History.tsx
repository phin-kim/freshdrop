import { useCallback, useEffect, useRef, useState } from 'react';
import {
    MdLogout,
    MdOutlineLocationSearching,
    MdOutlineReceiptLong,
} from 'react-icons/md';
import { useLocation } from 'react-router';

import { ACTIVE_STATUSES } from '../../../shared/constants';
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
    const location = useLocation();
    const logout = useAuthStore((state) => state.logout);

    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [isTrackingLoading, setIsTrackingLoading] = useState(true);

    const [orders, setOrders] = useState<Order[]>([]);
    const [page, setPage] = useState<number>(1);
    const [pagination, setPagination] = useState<PaginationMeta>({
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 1,
    });
    //this is for history
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const setError = useErrorStore((state) => state.setError);
    const selectedTrackingOrderId = new URLSearchParams(location.search).get(
        'orderId'
    );

    // Ref to track activeOrder state inside polling timer without stale closure issues
    const activeOrderRef = useRef<Order | null>(null);
    useEffect(() => {
        activeOrderRef.current = activeOrder;
    }, [activeOrder]);
    const fetchUserOrderHistory = useCallback(async (): Promise<void> => {
        if (!user?.id) return;
        try {
            setError(null);

            const response = await userApi.get(
                `/user/orders?userId=${user.id}&page=${page}&limit=5`
            );

            const data: OrdersApiResponse = response.data.responsePayload;
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
    }, [user, page, setError]);
    // Active order status
    const fetchActiveOrder = useCallback(
        async (isBackground: boolean = false): Promise<void> => {
            if (!user?.id) return;
            try {
                if (!isBackground) setIsTrackingLoading(true);

                //fetch current active order for the user
                const response = await userApi.get(
                    `/user/orders/active?userId=${user.id}`
                );
                const data = response?.data;

                //detect when order transisitons from active to completed
                const previousStatus = activeOrderRef.current?.status;
                const newStatus = data?.status;
                log.debug('The full response from the active order fetching', {
                    data: {
                        data,
                    },
                });
                setActiveOrder(data);

                //if order just completed, autorefresh history list
                if (
                    previousStatus &&
                    ACTIVE_STATUSES.includes(previousStatus) &&
                    (newStatus === 'DELIVERY_COMPLETED' || data === null)
                ) {
                    fetchUserOrderHistory();
                }
            } catch (error) {
                log.error('Unable to fetch active order ', { data: { error } });
                handleApiError(error, setError);
                setActiveOrder(null);
            } finally {
                if (!isBackground) setIsTrackingLoading(false);
            }
        },
        [user, fetchUserOrderHistory, setError]
    );
    // 1. ALWAYS fetch active order and history on initial page mount/refresh
    useEffect(() => {
        if (!user?.id) return;

        let isMounted = true;

        const loadInitialData = async (): Promise<void> => {
            // Yield to microtask queue so setState doesn't run synchronously in the effect body
            await Promise.resolve();

            if (!isMounted) return;

            await Promise.all([
                fetchActiveOrder(false),
                fetchUserOrderHistory(),
            ]);
        };

        void loadInitialData();

        return () => {
            isMounted = false;
        };
    }, [user?.id, fetchActiveOrder, fetchUserOrderHistory]);
    // 2. ONLY poll background updates if activeOrder is currently active
    useEffect(() => {
        const currentStatus = activeOrder?.status;
        const isCurrentlyActive =
            currentStatus !== undefined &&
            ACTIVE_STATUSES.includes(currentStatus);
        // Stop polling if there's no active order (or if completed/cancelled)
        if (!isCurrentlyActive) return;

        const intervalId = setInterval(() => {
            void fetchActiveOrder(true); // Silent background fetch
        }, 4000);

        return () => clearInterval(intervalId);
    }, [activeOrder?.status, fetchActiveOrder]);
    const handlePageChange = (newPage: number): void => {
        setIsLoading(true);
        setPage(newPage);
    };

    const hasActiveOrder =
        activeOrder !== null && ACTIVE_STATUSES.includes(activeOrder.status);

    if (!user) return null;

    // Guard against non-array states so .filter() never crashes the app
    const safeOrders = Array.isArray(orders) ? orders : [];
    log.debug('Are there any orders returned', { data: { safeOrders } });
    // Calculate total for orders on the current page that have been paid or delivered
    const getDriverDisplayName = () => {
        // If a rider object exists from Prisma relation
        if (activeOrder?.rider?.name) {
            return `${activeOrder.rider.name} (${activeOrder.rider.vehicleType || 'Courier'})`;
        }

        // If telegram courier name exists
        if (activeOrder?.courierName) {
            return activeOrder.courierName;
        }

        // If order is still waiting for a courier to click Accept on Telegram
        if (
            activeOrder?.status === 'PAID' ||
            activeOrder?.status === 'PENDING'
        ) {
            return 'Searching for nearby courier...';
        }

        return 'Unassigned Rider';
    };
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
                <div className="h-fit space-y-5 rounded-2xl border border-white/10 bg-[#2D3025] p-6 text-white shadow-md">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-2xl font-bold text-emerald-400">
                                distance
                            </span>
                            <h3 className="text-base font-extrabold tracking-tight text-[#FCFAF2]">
                                Active Order Tracking
                            </h3>
                        </div>
                        {activeOrder && (
                            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black tracking-wider text-emerald-300 uppercase">
                                Live
                            </span>
                        )}
                    </div>
                    {isTrackingLoading ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                            Checking active orders...
                        </div>
                    ) : hasActiveOrder ? (
                        (() => {
                            const status = activeOrder.status;
                            const pinCode =
                                activeOrder.deliveryPin || '4 8 2 1';

                            const stageText =
                                status === 'PAID'
                                    ? 'Placed & Packing (Step 1 of 4)'
                                    : status === 'ASSIGNED'
                                      ? 'Picked Up by Courier (Step 2 of 4)'
                                      : status === 'PICKED_UP'
                                        ? 'Out for Delivery (Step 3 of 4)'
                                        : 'Delivered (Step 4 of 4)';

                            return (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-300">
                                            Order ID:
                                        </span>
                                        <span className="rounded bg-white/10 px-2 py-0.5 font-mono font-bold text-amber-300">
                                            # {activeOrder.reference}
                                        </span>
                                    </div>

                                    <div className="space-y-1 rounded-xl border border-white/10 bg-white/5 p-3">
                                        <span className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                            Status
                                        </span>
                                        <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-300">
                                            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                                            <span>{stageText}</span>
                                        </p>
                                    </div>

                                    {/* BACKEND GENERATED DELIVERY PIN BOX */}
                                    <div className="relative space-y-1 overflow-hidden rounded-xl border-2 border-dashed border-amber-400/70 bg-[#191b14] p-4 text-center shadow-inner">
                                        <div className="flex items-center justify-center gap-2 text-xs font-black tracking-wider text-amber-300 uppercase sm:text-sm">
                                            <span className="text-base">
                                                🔑
                                            </span>
                                            <span>YOUR DELIVERY PIN:</span>
                                            <span className="rounded border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 font-mono text-xl tracking-[0.25em] text-white">
                                                {pinCode}
                                            </span>
                                        </div>
                                        <p className="pt-0.5 text-[11px] font-medium text-slate-300 italic">
                                            (Give this code to your courier)
                                        </p>
                                    </div>

                                    {/* Driver Info */}
                                    <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-700/50 font-bold text-white">
                                                <span className="material-symbols-outlined text-base">
                                                    person
                                                </span>
                                            </div>
                                            <div className="truncate">
                                                <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                                                    Assigned Driver
                                                </span>
                                                <p className="truncate text-xs font-extrabold text-white">
                                                    {getDriverDisplayName()}
                                                </p>
                                            </div>
                                        </div>

                                        {/*<a
                                            href={`tel:${activeOrder.courierPhone || '+254712345678'}`}
                                            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#47663b] px-3 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#39532f] active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                call
                                            </span>
                                            <span>[Call Driver]</span>
                                        </a>*/}
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <div className="space-y-2 py-8 text-center text-slate-400">
                            <span className="material-symbols-outlined text-4xl text-slate-500">
                                local_shipping
                            </span>
                            <p className="text-xs font-medium text-slate-300">
                                No active delivery in progress.
                            </p>
                            <p className="text-[11px] text-slate-400">
                                Place an order to view your live PIN & courier
                                status here.
                            </p>
                        </div>
                    )}
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
                                You haven't placed any grocery orders yet!
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

                                    const isHighlighted =
                                        o.id === selectedTrackingOrderId;
                                    const effectiveStatus =
                                        activeOrder &&
                                        activeOrder.status !==
                                            'DELIVERY_COMPLETED'
                                            ? activeOrder.status
                                            : o.status;

                                    const isSuccess =
                                        effectiveStatus ===
                                            'DELIVERY_COMPLETED' ||
                                        effectiveStatus === 'PAID';
                                    return (
                                        <div
                                            key={o.id}
                                            className={`rounded-2xl border p-4 transition-all ${
                                                isHighlighted
                                                    ? 'border-[#47663b] bg-emerald-50/80 shadow-sm'
                                                    : 'border-transparent bg-white'
                                            } ${idx === 0 ? '' : 'mt-4'}`}
                                        >
                                            {isHighlighted && (
                                                <div className="mb-3 flex items-center gap-2 text-[11px] font-black tracking-wider text-[#47663b] uppercase">
                                                    <span className="material-symbols-outlined text-sm">
                                                        <MdOutlineLocationSearching />
                                                    </span>
                                                    <span>
                                                        Currently tracking this
                                                        order
                                                    </span>
                                                </div>
                                            )}
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
                                                        /*o.status ===
                                                            'DELIVERY_COMPLETED' ||
                                                        o.status === 'PAID'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                            : 'border-amber-200 bg-amber-50 text-amber-700'*/
                                                        isSuccess
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                            : 'border-amber-200 bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {/* {o.status.replace('_', ' ')}*/}
                                                    {effectiveStatus.replace(
                                                        '_',
                                                        ' '
                                                    )}
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
                                            handlePageChange(
                                                Math.max(1, page - 1)
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
                                            handlePageChange(page + 1)
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
