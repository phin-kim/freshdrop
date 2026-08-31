import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Award,
    Bike,
    Car,
    CheckCircle,
    ChevronDown,
    Compass,
    DollarSign,
    ExternalLink,
    MapPin,
    MessageSquare,
    Navigation as NavIcon,
    PackageCheck,
    Phone,
    Send,
    ShieldCheck,
    Store,
    TrendingUp,
    Truck,
    UserCheck,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

import {
    type SelfServiceRiderStatus,
    useMissingItem,
    useUpdateOwnRiderStatus,
} from '../Hooks/riderSynchronization';
import { riderApi } from '../Library/api';
import type {
    RiderDashboardApiResponse,
    RiderDashboardData,
    RiderOrder,
} from '../Types/Riders';
import createClientLogger from '../Utils/clientLogger';

const log = createClientLogger('CourierDashboard.tsx');

export default function RiderDashboard() {
    const queryClient = useQueryClient();
    const { data: riderData, isFetching } = useQuery({
        queryKey: ['rider-dashboard'],
        queryFn: async () => {
            const res =
                await riderApi.get<RiderDashboardApiResponse>(
                    '/rider/dashboard'
                );
            return res.data.data;
        },
    });
    const { mutate: updateOwnStatus, isPending: riderStatusPending } =
        useUpdateOwnRiderStatus();
    const { mutate: updateMissingItem } = useMissingItem();
    /*const handleStatusChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        updateOwnStatus(event.target.value as SelfServiceRiderStatus);
    };*/

    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isMapExpanded, setIsMapExpanded] = useState<boolean>(true);
    const [filterTab, setFilterTab] = useState<
        'active' | 'available' | 'completed'
    >('active');

    if (isFetching || !riderData) {
        return (
            <div className="flex h-40 items-center justify-center">
                <span className="animate-pulse text-xs text-stone-500">
                    Loading profile...
                </span>
            </div>
        );
    }
    const activeOrders = riderData.tabs.activeOrders;
    const completedOrders = riderData.tabs.completedOrders;

    // Unassigned orders available for pickup
    const availableOrders = riderData.tabs.availablePool;

    const selectedOrder =
        [...activeOrders, ...availableOrders, ...completedOrders].find(
            (order) => order.id === selectedOrderId
        ) ||
        activeOrders[0] ||
        availableOrders[0] ||
        completedOrders[0];

    const handleOpenTelegram = (orderId?: string) => {
        const url = `https://t.me/freshdroppers?start=${encodeURIComponent(orderId || 'portal')}`;

        //const url = `https://t.me/FreshdroppersBot?start=${encodeURIComponent(orderId || 'portal')}`;
        window.open(url, '_blank');
    };
    const normalizeKenyanPhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '');

        if (digits.startsWith('0')) {
            return `254${digits.slice(1)}`;
        }

        if (digits.startsWith('254')) {
            return digits;
        }

        return digits;
    };

    const handleCallCustomer = (phone: string, _name: string) => {
        window.open(`tel:${phone}`, '_self');
    };

    const handleWhatsAppCustomer = (phone: string, orderId: string) => {
        log.debug(`Phone `);

        const whatsappNumber = normalizeKenyanPhone(phone);
        const msg = encodeURIComponent(
            `Hello! Your FreshDrop order #${orderId} has arrived. I am at your delivery location.`
        );

        window.open(
            `https://wa.me/${whatsappNumber}?text=${msg}`,
            '_blank',
            'noopener,noreferrer'
        );
    };

    const handleOpenGoogleMaps = (address: string) => {
        const query = encodeURIComponent(`${address}, Juja, Kiambu, Kenya`);
        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${query}`,
            '_blank'
        );
    };
    const handleMarkItemUnavailable = async (
        orderId: string,
        itemId: string
    ) => {
        updateMissingItem(
            {
                orderId,
                itemId,
            },
            {
                onSuccess: () => {
                    queryClient.setQueryData(['rider-dashboard'], (oldData: RiderDashboardData | undefined) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        tabs: {
                            ...oldData.tabs,
                            activeOrders: oldData.tabs.activeOrders.map((ord) => {
                                if (ord.id !== orderId) return ord;
                                return {
                                    ...ord,
                                    items: ord.items.map((item) =>
                                        item.id === itemId ? { ...item, isAvailable: false } : item
                                    ),
                                };
                            }),
                        },
                    };
                });
                },
            }
        );
    };
    const getVehicleIcon = (type: string) => {
        switch (type) {
            case 'Electric Van':
                return <Truck className="h-5 w-5" />;
            case 'Motorbike':
                return <Bike className="h-5 w-5" />;
            case 'Cargo Bicycle':
                return <Car className="h-5 w-5" />;
            default:
                return <Bike className="h-5 w-5" />;
        }
    };

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:py-8">
            {/* Top Courier Profile & Status Header */}
            <div className="relative overflow-visible rounded-3xl border border-[#becab9]/30 bg-white p-6 shadow-sm">
                <div className="pointer-events-none absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-linear-to-bl from-emerald-50 via-teal-50/40 to-transparent" />

                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    {/* Rider identity & active switcher */}
                    <div className="flex items-start gap-4 sm:items-center">
                        <div className="relative">
                            <img
                                src={
                                    riderData.profile.profilePic ||
                                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
                                }
                                alt={riderData.profile.name}
                                className="h-16 w-16 rounded-2xl border-2 border-emerald-600 object-cover shadow-md sm:h-20 sm:w-20"
                            />
                            <span
                                className={`absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${
                                    riderData.profile.status === 'AVAILABLE' ||
                                    riderData.profile.status === 'ON_DELIVERY'
                                        ? 'bg-emerald-500'
                                        : riderData.profile.status ===
                                            'ON_BREAK'
                                          ? 'bg-amber-500'
                                          : 'bg-stone-400'
                                }`}
                                title={riderData.profile.status}
                            >
                                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                            </span>
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-black tracking-tight text-stone-900 sm:text-2xl">
                                    {riderData.profile.name}
                                </h1>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-medium text-stone-600">
                                <span className="flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 font-bold text-stone-800 uppercase">
                                    {getVehicleIcon(
                                        riderData.profile.vehicleType
                                    )}
                                    {riderData.profile.vehiclePlate.toUpperCase()}
                                </span>
                                <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                                    {riderData.profile.dispatchHub}
                                </span>

                                {/*{activeRider.telegramUsername && (
                                    <span className="flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">
                                        <Send className="h-3 w-3 text-sky-500" />
                                        {activeRider.telegramUsername}
                                    </span>
                                )}*/}
                            </div>
                        </div>
                    </div>

                    {/* Right Controls: Online / Offline Toggle & Telegram Dispatch */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Telegram Dispatch Link */}
                        <button
                            onClick={() => handleOpenTelegram()}
                            className="flex cursor-pointer items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-bold text-sky-700 shadow-sm transition hover:bg-sky-100"
                        >
                            <Send className="h-4 w-4 text-sky-500" />
                            <span>Telegram Dispatch</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                        </button>

                        {/* Online/Offline Toggle */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() =>
                                    setIsStatusMenuOpen((open) => !open)
                                }
                                disabled={
                                    riderStatusPending ||
                                    riderData.profile.status === 'ON_DELIVERY'
                                }
                                className={`flex min-w-36 items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                    riderData.profile.status === 'OFFLINE'
                                        ? 'bg-stone-800 hover:bg-stone-900'
                                        : riderData.profile.status ===
                                            'ON_BREAK'
                                          ? 'bg-amber-500 hover:bg-amber-600'
                                          : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                            >
                                <span>
                                    {riderStatusPending
                                        ? 'UPDATING...'
                                        : riderData.profile.status ===
                                            'ON_DELIVERY'
                                          ? 'ON DELIVERY'
                                          : riderData.profile.status ===
                                              'ON_BREAK'
                                            ? 'ON BREAK'
                                            : riderData.profile.status}
                                </span>

                                <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                        isStatusMenuOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            {isStatusMenuOpen && (
                                <div className="absolute right-0 z-30 mt-2 w-36 overflow-visible rounded-xl border border-stone-200 bg-white p-1 shadow-xl">
                                    {[
                                        {
                                            value: 'AVAILABLE',
                                            label: 'Available',
                                            activeClass:
                                                'bg-emerald-50 text-emerald-700',
                                        },
                                        {
                                            value: 'ON_BREAK',
                                            label: 'On Break',
                                            activeClass:
                                                'bg-amber-50 text-amber-700',
                                        },
                                        {
                                            value: 'OFFLINE',
                                            label: 'Offline',
                                            activeClass:
                                                'bg-stone-100 text-stone-700',
                                        },
                                    ].map(({ value, label, activeClass }) => {
                                        const isActive =
                                            riderData.profile.status === value;

                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => {
                                                    updateOwnStatus(
                                                        value as SelfServiceRiderStatus
                                                    );
                                                    setIsStatusMenuOpen(false);
                                                }}
                                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-bold transition ${
                                                    isActive
                                                        ? activeClass
                                                        : 'text-stone-600 hover:bg-stone-100'
                                                }`}
                                            >
                                                <span>{label}</span>

                                                {isActive && (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {/*<button
                            onClick={() => undefined}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black shadow-sm transition ${
                                riderData.profile.status === 'OFFLINE'
                                    ? 'bg-stone-800 text-white hover:bg-stone-900'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                        >
                            <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                    riderData.profile.status === 'OFFLINE'
                                        ? 'bg-rose-400'
                                        : 'animate-ping bg-emerald-200'
                                }`}
                            />
                            <span>
                                {riderData.profile.status === 'OFFLINE'
                                    ? 'GO ONLINE'
                                    : riderData.profile.status.toUpperCase()}
                            </span>
                        </button>*/}
                    </div>
                </div>
            </div>

            {/* Metric Cards Grid: Today's Earnings, Cumulative Earnings, Ratings & Rates */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1: Today's Total Earnings */}
                <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#becab9]/30 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-wider text-stone-500 uppercase">
                            Today's Earnings
                        </span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-700">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
                            KSh{' '}
                            {(
                                riderData.metrics.todaysEarnings || 0
                            ).toLocaleString()}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                            <span className="inline-flex items-center gap-0.5">
                                <TrendingUp className="h-3.5 w-3.5" />
                                {riderData.metrics.todaysDropCount || 0} drops
                                completed
                            </span>
                            <span className="text-stone-300">•</span>
                            <span className="text-stone-500">
                                Avg KSh {riderData.metrics.avgPerDropToday}/drop
                            </span>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-[11px] text-stone-500">
                        <span>Payhero M-PESA B2C</span>
                        <span className="font-bold text-emerald-700">
                            Instant Daily Settlement
                        </span>
                    </div>
                </div>

                {/* Card 2: Cumulative All-Time Earnings */}
                <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#becab9]/30 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-wider text-stone-500 uppercase">
                            Cumulative Total
                        </span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 font-bold text-teal-700">
                            <Award className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
                            KSh{' '}
                            {(
                                riderData.metrics.cumulativeEarnings || 0
                            ).toLocaleString()}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-teal-700">
                            <span>
                                {riderData.metrics.lifetimeDropCount || 0} Total
                                Lifetime Drops
                            </span>
                            <span className="text-stone-300">•</span>
                            <span className="text-stone-500">
                                Since{' '}
                                {String(
                                    new Date(
                                        riderData.metrics.accountCreatedDate
                                    ).toLocaleDateString() || 'N/A'
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-[11px] text-stone-500">
                        <span>FreshDrop Green Fleet</span>
                        <span className="font-bold text-teal-700">
                            Level 4 Tier Rider
                        </span>
                    </div>
                </div>

                {/* Card 3: Rating & Customer Feedback */}
                <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#becab9]/30 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-wider text-stone-500 uppercase">
                            Customer Rating
                        </span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 font-bold text-amber-600">
                            ★
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
                                {riderData.profile.rating.toFixed(1)}
                            </span>
                            <span className="text-xs font-bold text-stone-400">
                                / 5.0
                            </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <span>★★★★★</span>
                            <span className="font-normal text-stone-500">
                                ({riderData.metrics.lifetimeDropCount} ratings)
                            </span>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-[11px] text-stone-500">
                        <span>Customer Satisfaction</span>
                        <span className="font-bold text-stone-800">
                            Top 5% in Hub
                        </span>
                    </div>
                </div>

                {/* Card 4: On-Time & Completion Rates */}
                <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#becab9]/30 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-wider text-stone-500 uppercase">
                            Performance Score
                        </span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-600">
                            <Zap className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-3 space-y-2">
                        <div>
                            <div className="mb-1 flex justify-between text-xs font-bold text-stone-700">
                                <span>On-Time Rate</span>
                                <span className="text-emerald-700">
                                    {riderData.performance.onTimeRate || 98.8}%
                                </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                                <div
                                    className="h-full rounded-full bg-emerald-600"
                                    style={{
                                        width: `${riderData.performance.onTimeRate || 98.8}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="mb-1 flex justify-between text-xs font-bold text-stone-700">
                                <span>Completion Rate</span>
                                <span className="text-teal-700">
                                    {riderData.performance.completionRate ||
                                        99.4}
                                    %
                                </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                                <div
                                    className="h-full rounded-full bg-teal-600"
                                    style={{
                                        width: `${riderData.performance.completionRate || 99.4}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-[11px] text-stone-500">
                        <span>Acceptance Rate</span>
                        <span className="font-bold text-emerald-800">
                            {riderData.performance.acceptanceRate || 96.5}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Interactive Workspace: Order Pipeline & Live Map */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left / Center Column: Order Tabs & Status Controls (7 cols) */}
                <div className="space-y-6 lg:col-span-7">
                    {/* Order Tabs Navigation */}
                    <div className="flex items-center gap-2 rounded-2xl border border-[#becab9]/30 bg-white p-2 shadow-sm">
                        <button
                            onClick={() => setFilterTab('active')}
                            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition ${
                                filterTab === 'active'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-stone-600 hover:bg-stone-100'
                            }`}
                        >
                            <PackageCheck className="h-4 w-4" />
                            <span>Active Orders</span>
                            <span
                                className={`py-0.2 rounded-full px-1.5 text-[10px] font-bold ${
                                    filterTab === 'active'
                                        ? 'bg-emerald-800 text-white'
                                        : 'bg-stone-200 text-stone-700'
                                }`}
                            >
                                {activeOrders.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setFilterTab('available')}
                            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition ${
                                filterTab === 'available'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-stone-600 hover:bg-stone-100'
                            }`}
                        >
                            <Store className="h-4 w-4" />
                            <span>Available Pool</span>
                            <span
                                className={`py-0.2 rounded-full px-1.5 text-[10px] font-bold ${
                                    filterTab === 'available'
                                        ? 'bg-emerald-800 text-white'
                                        : 'bg-stone-200 text-stone-700'
                                }`}
                            >
                                {availableOrders.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setFilterTab('completed')}
                            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition ${
                                filterTab === 'completed'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-stone-600 hover:bg-stone-100'
                            }`}
                        >
                            <CheckCircle className="h-4 w-4" />
                            <span>Completed ({completedOrders.length})</span>
                        </button>
                    </div>

                    {/* TAB 1: ACTIVE ORDERS */}
                    {filterTab === 'active' && (
                        <div className="space-y-4">
                            {activeOrders.length === 0 ? (
                                <div className="space-y-3 rounded-3xl border border-[#becab9]/30 bg-white p-10 text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                        <CheckCircle className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-base font-bold text-stone-900">
                                        No Active Deliveries Right Now
                                    </h3>
                                    <p className="mx-auto max-w-md text-xs text-stone-500">
                                        You're all caught up! Switch to the
                                        Available Pool tab to accept new farm
                                        grocery orders or open the Telegram
                                        dispatch bot.
                                    </p>
                                    <div className="flex justify-center gap-3 pt-3">
                                        <button
                                            onClick={() =>
                                                setFilterTab('available')
                                            }
                                            className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                                        >
                                            Browse Available Orders (
                                            {availableOrders.length})
                                        </button>
                                        <button
                                            onClick={() => handleOpenTelegram()}
                                            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                            <span>Telegram Bot</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                activeOrders.map((order: RiderOrder) => {
                                    const isSelected =
                                        selectedOrder?.id === order.id;

                                    return (
                                        <div
                                            key={order.id}
                                            onClick={() =>
                                                setSelectedOrderId(order.id)
                                            }
                                            className={`cursor-pointer rounded-3xl border bg-white p-5 transition-all md:p-6 ${
                                                isSelected
                                                    ? 'border-emerald-600 shadow-md ring-2 ring-emerald-600/20'
                                                    : 'border-[#becab9]/30 shadow-sm hover:border-emerald-300'
                                            }`}
                                        >
                                            {/* Order Header */}
                                            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                                                            #{order.id}
                                                        </span>
                                                        <span className="text-xs font-bold text-stone-900">
                                                            {order.user.name}
                                                        </span>
                                                        <span className="text-[10px] text-stone-400">
                                                            •{' '}
                                                            {new Date(
                                                                order.createdAt
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                }
                                                            )}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-stone-600">
                                                        <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                                                        <span>
                                                            {
                                                                order.deliveryDestination
                                                            }
                                                        </span>
                                                    </p>
                                                </div>

                                                <div className="shrink-0 text-right">
                                                    <span className="block text-xs font-bold text-stone-500">
                                                        Courier Payout
                                                    </span>
                                                    <span className="text-base font-black text-emerald-700">
                                                        KSh{' '}
                                                        {(
                                                            order.deliveryFee ||
                                                            320
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Customer Contact & Quick Actions */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCallCustomer(
                                                                order
                                                                    .payments[0]
                                                                    ?.phoneNumber ||
                                                                    '',
                                                                order.user
                                                                    .name ||
                                                                    'Customer'
                                                            );
                                                        }}
                                                        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 font-bold text-emerald-800 transition hover:bg-emerald-100"
                                                    >
                                                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                                                        <span>
                                                            Call Customer
                                                        </span>
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleWhatsAppCustomer(
                                                                order
                                                                    .payments[0]
                                                                    ?.phoneNumber ||
                                                                    '',
                                                                order.id
                                                            );
                                                        }}
                                                        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-green-50 px-3 py-1.5 font-bold text-green-800 transition hover:bg-green-100"
                                                    >
                                                        <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                                                        <span>WhatsApp</span>
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenGoogleMaps(
                                                            order.deliveryDestination
                                                        );
                                                    }}
                                                    className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-1.5 font-bold text-stone-700 transition hover:bg-stone-200"
                                                >
                                                    <NavIcon className="h-3.5 w-3.5 text-stone-600" />
                                                    <span>Google Maps GPS</span>
                                                </button>
                                            </div>

                                            {/* Produce Items Summary */}
                                            <div className="mb-4 rounded-2xl bg-stone-50 p-3">
                                                <span className="mb-2 block text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                                                    Order Basket (
                                                    {order.items.reduce(
                                                        (s, i) =>
                                                            s + i.quantity,
                                                        0
                                                    )}{' '}
                                                    items)
                                                </span>
                                                <div className="space-y-1.5">
                                                    {order.items.map(
                                                        (item, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center justify-between text-xs text-stone-700"
                                                            >
                                                                <span className="font-medium">
                                                                    <span className="font-bold text-stone-900">
                                                                        {
                                                                            item.quantity
                                                                        }
                                                                        x
                                                                    </span>{' '}
                                                                    {
                                                                        item
                                                                            .product
                                                                            .name
                                                                    }{' '}
                                                                    (
                                                                    {
                                                                        item
                                                                            .product
                                                                            .quantityText
                                                                    }
                                                                    )
                                                                </span>
                                                                <span className="font-mono text-stone-500">
                                                                    KSh{' '}
                                                                    {(
                                                                        Number(
                                                                            item.priceAtPurchase
                                                                        ) *
                                                                        item.quantity
                                                                    ).toLocaleString()}
                                                                </span>

                                                                <button
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleMarkItemUnavailable(
                                                                            order.id,
                                                                            item.id
                                                                        );
                                                                    }}
                                                                    className="shrink-0 rounded-lg bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700 transition hover:bg-red-100"
                                                                >
                                                                    Mark Missing
                                                                </button>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* TAB 2: AVAILABLE ORDERS POOL */}
                    {filterTab === 'available' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4 rounded-2xl border border-sky-200 bg-sky-50 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white">
                                        <Send className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-sky-950">
                                            Telegram Dispatch Bot Active
                                        </h4>
                                        <p className="text-[11px] text-sky-800">
                                            Receive instant broadcast alerts on
                                            Telegram when new farm orders are
                                            submitted in Juja & Kiambu.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleOpenTelegram()}
                                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold whitespace-nowrap text-white shadow-sm transition hover:bg-sky-700"
                                >
                                    <span>Open Bot</span>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            {availableOrders.length === 0 ? (
                                <div className="space-y-2 rounded-3xl border border-[#becab9]/30 bg-white p-10 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
                                        <Store className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-sm font-bold text-stone-800">
                                        No New Unassigned Orders
                                    </h3>
                                    <p className="text-xs text-stone-500">
                                        All currently placed orders have been
                                        assigned to couriers. New orders will
                                        appear here automatically.
                                    </p>
                                </div>
                            ) : (
                                availableOrders.map((order: RiderOrder) => (
                                    <div
                                        key={order.id}
                                        className="space-y-4 rounded-3xl border border-[#becab9]/30 bg-white p-5 shadow-sm transition hover:border-emerald-400 md:p-6"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                                                        #{order.id}
                                                    </span>
                                                    <span className="text-xs font-bold text-stone-900">
                                                        {order.user.name ||
                                                            'Customer'}
                                                    </span>
                                                    <span className="text-[10px] text-stone-400">
                                                        •{' '}
                                                        {new Date(
                                                            order.createdAt
                                                        ).toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            }
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-stone-600">
                                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                                                    <span>
                                                        {
                                                            order.deliveryDestination
                                                        }
                                                    </span>
                                                </p>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                <span className="block text-xs font-bold text-stone-500">
                                                    Est. Payout
                                                </span>
                                                <span className="text-base font-black text-emerald-700">
                                                    KSh{' '}
                                                    {(
                                                        Number(
                                                            order.deliveryFee
                                                        ) || 320
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Basket items summary */}
                                        <div className="rounded-2xl bg-stone-50 p-3 text-xs text-stone-600">
                                            <span className="font-bold text-stone-800">
                                                Items:{' '}
                                            </span>
                                            {order.items
                                                .map(
                                                    (i) =>
                                                        `${i.quantity}x ${i.product.name}`
                                                )
                                                .join(', ')}
                                        </div>

                                        {/* Acceptance Actions */}
                                        <div className="flex items-center gap-3 pt-2">
                                            <button
                                                onClick={() =>
                                                    handleOpenTelegram(order.id)
                                                }
                                                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                                            >
                                                <Send className="h-4 w-4 text-sky-500" />
                                                <span>Accept via Telegram</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* TAB 3: COMPLETED ORDERS HISTORY */}
                    {filterTab === 'completed' && (
                        <div className="space-y-3">
                            {completedOrders.length === 0 ? (
                                <div className="rounded-3xl border border-[#becab9]/30 bg-white p-10 text-center text-xs text-stone-500">
                                    No completed deliveries recorded yet in this
                                    session for {riderData.profile.name}.
                                </div>
                            ) : (
                                completedOrders.map((order: RiderOrder) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between gap-4 rounded-2xl border border-[#becab9]/30 bg-white p-4 shadow-sm"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-stone-900">
                                                    #{order.id}
                                                </span>
                                                <span className="text-xs text-stone-600">
                                                    •{' '}
                                                    {order.user.name ||
                                                        'Customer'}
                                                </span>
                                                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                    Delivered
                                                </span>
                                            </div>
                                            <p className="mt-0.5 max-w-sm truncate text-xs text-stone-500">
                                                {order.deliveryDestination}
                                            </p>
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <span className="block text-xs font-black text-emerald-700">
                                                + KSh{' '}
                                                {(
                                                    Number(order.deliveryFee) ||
                                                    320
                                                ).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-stone-400">
                                                {order.completedAt
                                                    ? new Date(
                                                          order.completedAt
                                                      ).toLocaleTimeString([], {
                                                          hour: '2-digit',
                                                          minute: '2-digit',
                                                      })
                                                    : 'Today'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Live Interactive Delivery Map & Hub Tracking (5 cols) */}
                <div className="space-y-6 lg:col-span-5">
                    <div className="space-y-4 rounded-3xl border border-[#becab9]/30 bg-white p-5 shadow-sm">
                        {/* Map Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <Compass className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-stone-900">
                                        Live GPS Dispatch Radar
                                    </h3>
                                    <p className="text-[11px] text-stone-500">
                                        Juja Central Hub & Customer Waypoints
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-500" />
                                    GPS Live
                                </span>
                                <button
                                    onClick={() =>
                                        setIsMapExpanded(!isMapExpanded)
                                    }
                                    className="text-xs font-bold text-stone-400 hover:text-stone-700"
                                >
                                    {isMapExpanded ? 'Minimize' : 'Expand'}
                                </button>
                            </div>
                        </div>

                        {/* Simulated High-Res SVG Vector Map Component */}
                        {isMapExpanded && (
                            <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 shadow-inner select-none">
                                {/* SVG Map Grid & Routes */}
                                <svg
                                    className="h-full w-full"
                                    viewBox="0 0 500 320"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    {/* Grid Lines */}
                                    <defs>
                                        <pattern
                                            id="grid"
                                            width="40"
                                            height="40"
                                            patternUnits="userSpaceOnUse"
                                        >
                                            <path
                                                d="M 40 0 L 0 0 0 40"
                                                fill="none"
                                                stroke="#292524"
                                                strokeWidth="0.8"
                                            />
                                        </pattern>
                                        <linearGradient
                                            id="routeGradient"
                                            x1="0%"
                                            y1="0%"
                                            x2="100%"
                                            y2="100%"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#10b981"
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#06b6d4"
                                            />
                                        </linearGradient>
                                    </defs>

                                    <rect
                                        width="100%"
                                        height="100%"
                                        fill="#1c1917"
                                    />
                                    <rect
                                        width="100%"
                                        height="100%"
                                        fill="url(#grid)"
                                    />

                                    {/* Road Network & Highway simulation */}
                                    <path
                                        d="M 0 160 Q 250 140 500 170"
                                        fill="none"
                                        stroke="#44403c"
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M 120 0 Q 150 160 220 320"
                                        fill="none"
                                        stroke="#44403c"
                                        strokeWidth="4"
                                    />
                                    <path
                                        d="M 380 0 Q 360 160 300 320"
                                        fill="none"
                                        stroke="#44403c"
                                        strokeWidth="4"
                                    />

                                    {/* Thika Superhighway identifier */}
                                    <text
                                        x="260"
                                        y="152"
                                        fill="#78716c"
                                        fontSize="9"
                                        fontWeight="bold"
                                        letterSpacing="1"
                                    >
                                        THIKA SUPERHIGHWAY (A2)
                                    </text>

                                    {/* Active Delivery Route Polyline */}
                                    <path
                                        d="M 140 120 C 180 130, 240 180, 360 210"
                                        fill="none"
                                        stroke="url(#routeGradient)"
                                        strokeWidth="4"
                                        strokeDasharray="6 4"
                                        className="animate-pulse"
                                    />

                                    {/* Central Hub Marker (Origin) */}
                                    <g transform="translate(140, 120)">
                                        <circle
                                            r="14"
                                            fill="#065f46"
                                            opacity="0.4"
                                            className="animate-ping"
                                        />
                                        <circle
                                            r="9"
                                            fill="#059669"
                                            stroke="#ffffff"
                                            strokeWidth="2"
                                        />
                                        <text
                                            x="0"
                                            y="24"
                                            textAnchor="middle"
                                            fill="#a7f3d0"
                                            fontSize="10"
                                            fontWeight="bold"
                                        >
                                            Juja Farm Hub
                                        </text>
                                    </g>

                                    {/* Courier Live Moving GPS Position */}
                                    <g transform="translate(240, 168)">
                                        <circle
                                            r="18"
                                            fill="#0284c7"
                                            opacity="0.3"
                                            className="animate-ping"
                                        />
                                        <circle
                                            r="11"
                                            fill="#0284c7"
                                            stroke="#ffffff"
                                            strokeWidth="2"
                                        />
                                        <polygon
                                            points="0,-6 5,5 0,2 -5,5"
                                            fill="#ffffff"
                                            transform="rotate(45)"
                                        />
                                        <text
                                            x="0"
                                            y="-16"
                                            textAnchor="middle"
                                            fill="#7dd3fc"
                                            fontSize="9"
                                            fontWeight="extrabold"
                                        >
                                            {
                                                riderData.profile.name.split(
                                                    ' '
                                                )[0]
                                            }{' '}
                                            (You)
                                        </text>
                                    </g>

                                    {/* Destination Customer Dropoff Pin */}
                                    <g transform="translate(360, 210)">
                                        <circle
                                            r="12"
                                            fill="#e11d48"
                                            opacity="0.3"
                                            className="animate-ping"
                                        />
                                        <circle
                                            r="8"
                                            fill="#e11d48"
                                            stroke="#ffffff"
                                            strokeWidth="2"
                                        />
                                        <text
                                            x="0"
                                            y="22"
                                            textAnchor="middle"
                                            fill="#fda4af"
                                            fontSize="10"
                                            fontWeight="bold"
                                        >
                                            {selectedOrder?.user.name ||
                                                'Drop-off'}
                                        </text>
                                    </g>
                                </svg>

                                {/* Live Distance & ETA floating HUD badge */}
                                <div className="absolute top-3 left-3 flex items-center gap-3 rounded-xl border border-stone-700/80 bg-stone-900/90 p-2.5 text-xs text-white shadow-lg backdrop-blur-md">
                                    <div>
                                        <span className="block text-[10px] font-bold text-stone-400 uppercase">
                                            Estimated ETA
                                        </span>
                                        <span className="text-sm font-black text-emerald-400">
                                            8 mins (2.4 km)
                                        </span>
                                    </div>
                                    <div className="h-6 w-px bg-stone-700" />
                                    <div>
                                        <span className="block text-[10px] font-bold text-stone-400 uppercase">
                                            Traffic
                                        </span>
                                        <span className="text-xs font-bold text-teal-300">
                                            Smooth (Green)
                                        </span>
                                    </div>
                                </div>

                                {/* External Maps Action HUD */}
                                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                                    <button
                                        onClick={() =>
                                            handleOpenGoogleMaps(
                                                selectedOrder?.deliveryDestination ||
                                                    'Juja Premier Suites'
                                            )
                                        }
                                        className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-500"
                                    >
                                        <NavIcon className="h-3.5 w-3.5" />
                                        <span>Navigate</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Selected Waypoint Details Card */}
                        {selectedOrder ? (
                            <div className="space-y-3 rounded-2xl border border-stone-200/70 bg-stone-50 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-stone-800">
                                        Target Destination
                                    </span>
                                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                        Order #{selectedOrder.id}
                                    </span>
                                </div>

                                <div className="space-y-1 text-xs">
                                    <div className="flex items-start gap-2 text-stone-700">
                                        <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                                        <div>
                                            <span className="font-bold text-stone-900">
                                                {selectedOrder.user.name ||
                                                    'Customer'}
                                            </span>
                                            <span className="text-stone-500">
                                                {' '}
                                                (
                                                {selectedOrder.payments[0]
                                                    ?.phoneNumber || 'N/A'}
                                                )
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2 text-stone-700">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                                        <span>
                                            {selectedOrder.deliveryDestination}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-stone-200 pt-2 text-xs">
                                    <button
                                        onClick={() =>
                                            handleCallCustomer(
                                                selectedOrder.payments[0]
                                                    ?.phoneNumber || '',
                                                selectedOrder.user.name ||
                                                    'Customer'
                                            )
                                        }
                                        className="flex cursor-pointer items-center gap-1 font-bold text-emerald-700 hover:underline"
                                    >
                                        <Phone className="h-3.5 w-3.5" />
                                        <span>Call Customer</span>
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleOpenTelegram(selectedOrder.id)
                                        }
                                        className="flex cursor-pointer items-center gap-1 font-bold text-sky-700 hover:underline"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        <span>Telegram Alert</span>
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Courier Support & Dispatch Helpline */}
                    <div className="space-y-3 rounded-3xl bg-linear-to-br from-stone-900 to-stone-800 p-5 text-white shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold">
                                    Juja Dispatch Control Desk
                                </h4>
                                <p className="text-xs text-stone-400">
                                    Hub Hotline: +254 700 000 120
                                </p>
                            </div>
                        </div>

                        <p className="text-xs leading-relaxed text-stone-300">
                            If an address is inaccessible, produce is damaged,
                            or customer is unavailable after 10 minutes, contact
                            hub dispatch immediately for instant re-routing or
                            escrow return.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
