import { useQuery } from '@tanstack/react-query';
import {
    CheckCircle2,
    ChevronRight,
    Clock,
    CreditCard,
    Eye,
    KeyRound,
    MapPin,
    Printer,
    Search,
    ShoppingBag,
    Truck,
    User,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import type { OrderStatus } from '../../../../../shared/sharedTypes';
import { adminAPI } from '../../../Library/api';
import useErrorStore from '../../../Store/errorStore';
import type { Order, OrderItem } from '../../../Types/Orders';
//import type { Rider } from '../../../Types/Riders';
import { getNextStage, getStageBadge } from '../../../Utils/adminUtils';
import handleApiError from '../../../Utils/apiError';
import createClientLogger from '../../../Utils/clientLogger';

const log = createClientLogger('AdminOrders.tsx');

//import { useStore } from '../../store';

export interface PaymentTransaction {
    id: string;
    status: string;
    channel: string;
    amount: number;
    createdAt: string;
}
interface AdminOrders extends Order {
    //rider?: Rider | null;
    payments: PaymentTransaction[];
    user?: {
        id: string;
        name: string;
        //phoneNumber: string;
        email: string;
    };
}
export interface AdminOrdersApiResponse {
    success: boolean;
    data: AdminOrders[];
    metrics: {
        totalOrders: number;
        activeInTransit: number;
        deliveredOrders: number;
        grossOrderValue: number;
    };
    meta: {
        totalCount: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}
function useAdminOrders(page: number = 1, limit: number = 10) {
    return useQuery<AdminOrdersApiResponse, Error>({
        queryKey: ['admin-orders', page, limit],
        queryFn: async (): Promise<AdminOrdersApiResponse> => {
            const response = await adminAPI.get<AdminOrdersApiResponse>(
                `/admin/orders?page=${page}&limit=${limit}`
            );
            return response.data;
        },
        refetchInterval: 1000 * 60 * 15, //WAS:15000 Auto-refetch every 15s for live status updates
        staleTime: 5000,
    });
}
export default function AdminOrders() {
    const setError = useErrorStore((state) => state.setError);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStage, setSelectedStage] = useState<string>('All');
    const [selectedPayment, setSelectedPayment] = useState<string>('All');
    const [viewingOrder, setViewingOrder] = useState<AdminOrders | null>(null);
    const [assigningOrderId, setAssigningOrderId] = useState<string | null>(
        null
    );
    const [page, setPage] = useState(1);
    const { data, isLoading, isError, error } = useAdminOrders(page, 10);
    const orders: AdminOrders[] = useMemo(() => data?.data ?? [], [data]);
    const totalPages = data?.meta?.totalPages ?? 1;

    // Stats calculation
    /*const assignRiderToOrder = async (
        orderId: string,
        riderId: string
    ): Promise<void> => {
        try {
            await adminAPI.patch(`/admin/orders/${orderId}/assign-rider`, {
                riderId,
            });
        } catch (err: unknown) {
            console.error('Failed to assign rider', err);
        }
    };*/
    const updateOrderStage = async (
        orderId: string,
        nextStatus: OrderStatus
    ): Promise<void> => {
        try {
            // Replace with your actual API service call
            await adminAPI.patch(`/admin/orders/${orderId}/status`, {
                status: nextStatus,
            });
        } catch (err: unknown) {
            console.error('Failed to update status', err);
        }
    };
    const stats = useMemo(() => {
        if (data?.metrics) {
            return {
                total: data.metrics.totalOrders,
                active: data.metrics.activeInTransit,
                delivered: data.metrics.deliveredOrders,
                grossVolume: data.metrics.grossOrderValue,
            };
        }

        const total = orders.length;
        const active = orders.filter((o: AdminOrders) =>
            ['PENDING', 'PAID', 'ASSIGNED', 'PICKED_UP'].includes(o.status)
        ).length;
        const delivered = orders.filter(
            (o: Order) => o.status === 'DELIVERY_COMPLETED'
        ).length;
        const grossVolume = orders.reduce(
            (sum: number, o: Order) => sum + Number(o.totalAmount),
            0
        );

        return { total, active, delivered, grossVolume };
    }, [data, orders]);

    // Client-side search and status filter
    const filteredOrders = useMemo(() => {
        return orders.filter((order: AdminOrders) => {
            const query = searchTerm.toLowerCase();
            const matchesSearch =
                !query ||
                order.reference.toLowerCase().includes(query) ||
                (order.user?.name &&
                    order.user.name.toLowerCase().includes(query)) ||
                order.deliveryDestination.toLowerCase().includes(query) ||
                (order.rider?.name &&
                    order.rider.name.toLowerCase().includes(query)) ||
                order.items.some((it: OrderItem) =>
                    it.productName.toLowerCase().includes(query)
                );

            const matchesStage =
                selectedStage === 'All' || order.status === selectedStage;

            const paymentChannel = order.payments[0]?.channel || '';
            const matchesPayment =
                selectedPayment === 'All' || paymentChannel === selectedPayment;

            return matchesSearch && matchesStage && matchesPayment;
        });
    }, [orders, searchTerm, selectedStage, selectedPayment]);

    if (isLoading) return <div>Loading dashboard orders...</div>;
    if (isError) {
        log.error('Error fetching orders', { data: { error } });
        handleApiError(error, setError);
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard?.writeText(text);
        //addToast(`PIN "${text}" copied to clipboard!`, 'info');
    };

    return (
        <div id="admin-orders-section" className="space-y-6">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
                <div>
                    <h2 className="font-caveat text-on-surface flex items-center gap-2 text-[38px] leading-tight font-black">
                        <ShoppingBag className="h-5 w-5 text-emerald-600" />
                        Customer Orders & Dispatch Management
                    </h2>
                    <p className="mt-0.5 text-sm text-stone-500">
                        Monitor real-time farm produce orders, assign couriers,
                        trigger stage updates, and verify delivery PINs.
                    </p>
                </div>
            </div>

            {/* KPI Counters */}
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-xs">
                    <p className="text-xs font-medium tracking-wider text-stone-500 uppercase">
                        Total Orders
                    </p>
                    <p className="mt-1 text-2xl font-black text-stone-900">
                        {stats.total}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-stone-500">
                        <ShoppingBag className="inline h-3 w-3 text-emerald-600" />{' '}
                        Recorded in database
                    </span>
                </div>

                <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-xs">
                    <p className="text-xs font-medium tracking-wider text-stone-500 uppercase">
                        Active In-Transit
                    </p>
                    <p className="mt-1 text-2xl font-black text-purple-700">
                        {stats.active}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-purple-700">
                        <Truck className="inline h-3 w-3" /> Live courier
                        dispatch
                    </span>
                </div>

                <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-xs">
                    <p className="text-xs font-medium tracking-wider text-stone-500 uppercase">
                        Delivered
                    </p>
                    <p className="mt-1 text-2xl font-black text-emerald-700">
                        {stats.delivered}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 className="inline h-3 w-3" /> 100%
                        Verified delivery
                    </span>
                </div>

                <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-xs">
                    <p className="text-xs font-medium tracking-wider text-stone-500 uppercase">
                        Gross Order Value
                    </p>
                    <p className="mt-1 text-2xl font-black text-stone-900">
                        KSh {stats.grossVolume.toLocaleString()}
                    </p>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-stone-500">
                        <CreditCard className="inline h-3 w-3 text-emerald-600" />{' '}
                        Payhero settled
                    </span>
                </div>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-stone-200/80 bg-white p-3.5 shadow-xs md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search by Order ID, Customer Name, Address, or Courier..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-stone-200 bg-stone-50/80 py-2 pr-3.5 pl-9 text-xs text-stone-900 placeholder-stone-400 transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30 focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1">
                        <span className="text-[11px] font-semibold text-stone-500">
                            Stage:
                        </span>
                        {[
                            'All',
                            'PENDING',
                            'PAID',
                            'CANCELLED',
                            'PICKED_UP',
                            'ASSIGNED',
                            'DELIVERY_COMPLETED',
                        ].map((st) => {
                            const formatted = st
                                .replace(/_/g, ' ')
                                .toLowerCase();
                            const label =
                                formatted.charAt(0).toUpperCase() +
                                formatted.slice(1);

                            return (
                                <button
                                    key={st}
                                    onClick={() => setSelectedStage(st)}
                                    className={`rounded px-2 py-1 text-xs font-semibold whitespace-nowrap transition ${
                                        selectedStage === st
                                            ? 'bg-emerald-700 text-white shadow-2xs'
                                            : 'text-stone-600 hover:bg-stone-200/70'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1">
                        <span className="text-[11px] font-semibold text-stone-500">
                            Payment:
                        </span>
                        <select
                            value={selectedPayment}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="cursor-pointer border-none bg-transparent text-xs font-medium text-stone-700 focus:ring-0 focus:outline-none"
                        >
                            <option value="All">All Methods</option>
                            <option value="Payhero M-PESA">
                                Payhero M-PESA
                            </option>
                            <option value="Payhero Card">Payhero Card</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-3.5">
                {filteredOrders.length === 0 ? (
                    <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-stone-400">
                        <ShoppingBag className="mx-auto mb-2 h-10 w-10 text-stone-300" />
                        <p className="font-semibold text-stone-700">
                            No orders found
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                            Orders placed in the app will appear here in
                            real-time.
                        </p>
                    </div>
                ) : (
                    filteredOrders.map((order) => {
                        const stageInfo = getStageBadge(order.status);
                        const StageIcon = stageInfo.icon;
                        const nextStage = getNextStage(order.status);

                        return (
                            <div
                                key={order.id}
                                className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs transition duration-150 hover:border-emerald-200 sm:p-5 md:flex-row md:items-center"
                            >
                                {/* Left Col: Order Details & Address */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-lg border border-stone-200 bg-stone-100 px-2.5 py-1 font-mono text-sm font-bold text-stone-900">
                                            #{order.id}
                                        </span>

                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${stageInfo.bg}`}
                                        >
                                            <StageIcon className="h-3.5 w-3.5" />
                                            {stageInfo.label}
                                        </span>

                                        <span className="flex items-center gap-1 text-xs text-stone-400">
                                            <Clock className="h-3 w-3" />
                                            {new Date(
                                                order.createdAt
                                            ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}{' '}
                                            •{' '}
                                            {new Date(
                                                order.createdAt
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Customer Name & Destination Address */}
                                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-stone-600">
                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-100/90 px-2.5 py-1 font-bold text-stone-900 shadow-2xs">
                                            <User className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                                            {order.user?.name || 'Customer'}
                                        </span>
                                        <span className="flex items-center gap-1.5 font-medium text-stone-700">
                                            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                            {order.deliveryDestination}
                                        </span>
                                    </div>

                                    {/* Items Strip */}
                                    <div className="flex items-center gap-2 overflow-x-auto pt-1">
                                        {order.items
                                            .slice(0, 4)
                                            .map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200/80 bg-stone-50 p-1.5 text-xs"
                                                >
                                                    <img
                                                        src={
                                                            item.product?.image
                                                        }
                                                        alt={item.productName}
                                                        className="h-5 w-5 rounded object-cover"
                                                    />
                                                    <span className="font-semibold text-stone-800">
                                                        {item.quantity}x
                                                    </span>
                                                    <span className="max-w-25 truncate text-stone-600">
                                                        {item.productName}
                                                    </span>
                                                </div>
                                            ))}
                                        {order.items.length > 4 && (
                                            <span className="rounded bg-stone-100 px-1.5 py-1 text-[11px] font-medium text-stone-500">
                                                +{order.items.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Center Col: Courier & Delivery PIN */}
                                <div className="flex shrink-0 flex-col items-start gap-3 border-t border-stone-100 pt-3 sm:flex-row sm:items-center md:flex-col md:border-t-0 md:pt-0 lg:flex-row">
                                    {/* Delivery PIN display */}
                                    <div className="flex items-center gap-2 rounded-xl border border-stone-800 bg-stone-900 px-3 py-2 text-white">
                                        <KeyRound className="h-4 w-4 text-emerald-400" />
                                        <div>
                                            <span className="block text-[9px] font-bold tracking-wider text-stone-400 uppercase">
                                                Delivery PIN
                                            </span>
                                            <span className="font-mono text-xs font-black tracking-widest text-emerald-400">
                                                {order.deliveryPin || '5 9 1 2'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() =>
                                                copyToClipboard(
                                                    order.deliveryPin ||
                                                        '5 9 1 2'
                                                )
                                            }
                                            className="ml-1 font-mono text-[10px] text-stone-400 underline hover:text-white"
                                            title="Copy PIN"
                                        >
                                            Copy
                                        </button>
                                    </div>

                                    {/* Assigned Rider Info */}
                                    <div className="min-w-45 rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs">
                                        <div className="mb-1 flex items-center justify-between gap-1">
                                            <span className="text-[10px] font-bold text-stone-500 uppercase">
                                                Courier Dispatch
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setAssigningOrderId(
                                                        order.id
                                                    )
                                                }
                                                className="text-[10px] font-bold text-emerald-700 hover:underline"
                                            >
                                                Change
                                            </button>
                                        </div>
                                        <p className="truncate font-bold text-stone-900">
                                            {order.courierName ||
                                                'Unassigned Rider'}
                                        </p>
                                        {order.rider?.phoneNumber && (
                                            <p className="mt-0.5 font-mono text-[11px] text-stone-500">
                                                {order.rider?.phoneNumber}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Col: Price & Action Buttons */}
                                <div className="flex shrink-0 flex-col items-end gap-2.5 border-t border-stone-100 pt-3 md:border-t-0 md:pt-0">
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-stone-400">
                                            Total Amount
                                        </p>
                                        <p className="text-lg font-black text-stone-900">
                                            KSh{' '}
                                            {order.totalAmount.toLocaleString()}
                                        </p>
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                            {order.payments?.[0]?.channel ??
                                                'M-pesa'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {nextStage && (
                                            <button
                                                onClick={() =>
                                                    updateOrderStage(
                                                        order.id,
                                                        nextStage
                                                    )
                                                }
                                                className="flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-800"
                                                title={`Advance to ${nextStage.replace(/_/g, ' ')}`}
                                            >
                                                Advance:{' '}
                                                {nextStage.replace(/_/g, ' ')}
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                        )}

                                        <button
                                            onClick={() =>
                                                setViewingOrder(order)
                                            }
                                            className="rounded-xl bg-stone-100 p-2 text-stone-600 transition hover:bg-stone-200 hover:text-stone-900"
                                            title="View Invoice & Details"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>

                                        {/*<button
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        `Remove order #${order.id} from records?`
                                                    )
                                                ) {
                                                    deleteOrder(order.id);
                                                }
                                            }}
                                            className="rounded-xl bg-stone-100 p-2 text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
                                            title="Delete Order"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>*/}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-500 sm:flex-row">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
                    <span className="font-medium text-slate-600">
                        Page summary:
                    </span>
                    <span className="font-bold text-slate-700">
                        {orders.length} orders on this page
                    </span>
                </div>

                <div className="flex items-center gap-1.5 font-black">
                    <button
                        disabled={page <= 1}
                        onClick={() =>
                            setPage((prev: number) => Math.max(prev - 1, 1))
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Previous
                    </button>

                    <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-800 shadow-inner">
                        Page {page} of {totalPages || 1}
                    </span>

                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((prev: number) => prev + 1)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Assign Rider Modal */}
            {assigningOrderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
                    <div className="animate-in fade-in zoom-in-95 w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                            <h3 className="flex items-center gap-2 text-base font-bold text-stone-900">
                                <Truck className="h-4 w-4 text-emerald-600" />
                                Assign Courier to Order #{assigningOrderId}
                            </h3>
                            <button
                                onClick={() => setAssigningOrderId(null)}
                                className="rounded-lg p-1 text-sm text-stone-400 hover:text-stone-700"
                            >
                                ✕
                            </button>
                        </div>

                        {/*<div className="max-h-72 space-y-2 overflow-y-auto py-4">
                            {riders.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => {
                                        assignRiderToOrder(
                                            assigningOrderId,
                                            r.id
                                        );
                                        setAssigningOrderId(null);
                                    }}
                                    className="group flex w-full items-center justify-between rounded-xl border border-stone-200/90 p-3 text-left transition hover:border-emerald-500 hover:bg-emerald-50/50"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-700">
                                            {r.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-stone-900 group-hover:text-emerald-800">
                                                {r.name}
                                            </p>
                                            <p className="text-[11px] text-stone-500">
                                                {r.vehicleType} •{' '}
                                                {r.vehiclePlate}
                                            </p>
                                        </div>
                                    </div>

                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                            r.status === 'AVAILABLE'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-amber-100 text-amber-800'
                                        }`}
                                    >
                                        {r.status}
                                    </span>
                                </button>
                            ))}
                        </div>*/}

                        <div className="flex justify-end border-t border-stone-200 pt-3">
                            <button
                                onClick={() => setAssigningOrderId(null)}
                                className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice & Order Details Modal */}
            {viewingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/60 p-4 backdrop-blur-xs">
                    <div className="animate-in fade-in zoom-in-95 my-8 w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-stone-900">
                                    Order Invoice #{viewingOrder.id}
                                </h3>
                                <p className="text-xs text-stone-500">
                                    Placed on{' '}
                                    {new Date(
                                        viewingOrder.createdAt
                                    ).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingOrder(null)}
                                className="rounded-lg p-1 text-sm text-stone-400 hover:text-stone-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 py-4 text-xs">
                            {/* Delivery PIN Highlight */}
                            <div className="flex items-center justify-between rounded-xl bg-stone-900 p-3.5 text-white">
                                <div>
                                    <span className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                                        Customer Verification PIN
                                    </span>
                                    <span className="font-mono text-base font-black tracking-widest text-emerald-400">
                                        {viewingOrder.deliveryPin || '5 9 1 2'}
                                    </span>
                                </div>
                                <span className="rounded-lg border border-emerald-800 bg-emerald-950 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                                    Verify upon delivery
                                </span>
                            </div>

                            {/* Customer Contact & Delivery Details Card */}
                            <div className="space-y-2.5 rounded-xl border border-stone-200 bg-stone-50 p-3.5">
                                <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-stone-500 uppercase">
                                        <User className="h-3.5 w-3.5 text-emerald-700" />{' '}
                                        Customer & Delivery Details
                                    </span>
                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                        {viewingOrder.payments?.[0]?.channel ??
                                            'M-pesa'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                    {/* 1. Customer Name */}
                                    <div className="rounded-lg border border-stone-200/80 bg-white p-2.5 shadow-2xs">
                                        <span className="block text-[10px] font-bold text-stone-400 uppercase">
                                            Customer Name
                                        </span>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                                            <p className="truncate text-xs font-bold text-stone-900">
                                                {viewingOrder.user?.name ||
                                                    'Customer'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. Phone Number */}
                                    <div className="rounded-lg border border-stone-200/80 bg-white p-2.5 shadow-2xs">
                                        <span className="block text-[10px] font-bold text-stone-400 uppercase">
                                            Phone Number
                                        </span>
                                        {/*<div className="mt-1 flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                                            <p className="truncate font-mono text-xs font-bold text-stone-800">
                                                {viewingOrder.user
                                                    ?.phoneNumber ||
                                                    'Not specified'}
                                            </p>
                                        </div>*/}
                                    </div>

                                    {/* 3. Delivery Address */}
                                    <div className="rounded-lg border border-stone-200/80 bg-white p-2.5 shadow-2xs">
                                        <span className="block text-[10px] font-bold text-stone-400 uppercase">
                                            Delivery Address
                                        </span>
                                        <div className="mt-1 flex items-start gap-1.5">
                                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                            <p className="text-xs leading-snug font-bold text-stone-800">
                                                {
                                                    viewingOrder.deliveryDestination
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="overflow-hidden rounded-xl border border-stone-200">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-stone-200 bg-stone-50 font-semibold text-stone-500">
                                        <tr>
                                            <th className="p-2.5">
                                                Produce Item
                                            </th>
                                            <th className="p-2.5 text-center">
                                                Qty
                                            </th>
                                            <th className="p-2.5 text-right">
                                                Price
                                            </th>
                                            <th className="p-2.5 text-right">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {viewingOrder.items.map((it, idx) => (
                                            <tr key={idx}>
                                                <td className="p-2.5 font-medium text-stone-800">
                                                    {it.productName}
                                                </td>
                                                <td className="p-2.5 text-center font-bold">
                                                    {it.quantity}
                                                </td>
                                                <td className="p-2.5 text-right text-stone-600">
                                                    KSh {it.priceAtPurchase}
                                                </td>
                                                <td className="p-2.5 text-right font-bold text-stone-900">
                                                    KSh{' '}
                                                    {(
                                                        Number(
                                                            it.priceAtPurchase
                                                        ) * it.quantity
                                                    ).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals Calculation Breakdown */}
                            <div className="space-y-1.5 border-t border-stone-200 pt-2 font-medium text-stone-600">
                                <div className="flex justify-between">
                                    <span>Produce Subtotal:</span>
                                    <span>
                                        KSh{' '}
                                        {viewingOrder.subtotal.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>
                                        Service & Packaging Charge (50%
                                        Compounding Rule):
                                    </span>
                                    <span>
                                        KSh{' '}
                                        {viewingOrder.serviceFee.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t border-stone-200 pt-2 text-sm font-black text-stone-900">
                                    <span>Grand Total Paid:</span>
                                    <span className="text-emerald-800">
                                        KSh{' '}
                                        {viewingOrder.totalAmount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-stone-200 pt-4">
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-1.5 rounded-xl bg-stone-100 px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-200"
                            >
                                <Printer className="h-3.5 w-3.5" />
                                Print Order Slip
                            </button>

                            <button
                                onClick={() => setViewingOrder(null)}
                                className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white transition hover:bg-emerald-800"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
