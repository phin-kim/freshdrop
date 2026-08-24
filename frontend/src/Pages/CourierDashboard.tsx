import {
    AlertCircle,
    ArrowRight,
    Award,
    BatteryCharging,
    Bike,
    Car,
    Check,
    CheckCircle,
    ChevronRight,
    Clock,
    Compass,
    DollarSign,
    ExternalLink,
    Info,
    KeyRound,
    Layers,
    MapPin,
    MessageSquare,
    Navigation as NavIcon,
    PackageCheck,
    Phone,
    RefreshCw,
    Send,
    ShieldCheck,
    Sliders,
    Store,
    TrendingUp,
    Truck,
    UserCheck,
    Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { useStore } from '../store';
import { DeliveryStage, Order, Rider } from '../types';

export default function TabCourier() {
    const {
        orders,
        riders,
        activeCourierId,
        setActiveCourierId,
        toggleCourierOnlineStatus,
        acceptOrderAsCourier,
        updateCourierOrderStage,
        verifyCustomerDeliveryPin,
        addToast,
    } = useStore();

    const activeRider: Rider =
        riders.find((r) => r.id === activeCourierId) || riders[0];

    // Active courier's assigned orders
    const assignedOrders = orders.filter(
        (o) => o.assignedRiderId === activeRider.id
    );
    const activeOrders = assignedOrders.filter(
        (o) => o.deliveryStage !== 'delivered'
    );
    const completedOrders = assignedOrders.filter(
        (o) => o.deliveryStage === 'delivered'
    );

    // Unassigned orders available for pickup
    const availableOrders = orders.filter(
        (o) => !o.assignedRiderId && o.deliveryStage !== 'delivered'
    );

    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(
        activeOrders.length > 0 ? activeOrders[0].id : null
    );
    const [pinInputs, setPinInputs] = useState<Record<string, string>>({});
    const [isMapExpanded, setIsMapExpanded] = useState<boolean>(true);
    const [filterTab, setFilterTab] = useState<
        'active' | 'available' | 'completed'
    >('active');
    const [showRiderSwitcher, setShowRiderSwitcher] = useState<boolean>(false);

    const selectedOrder =
        orders.find((o) => o.id === selectedOrderId) ||
        activeOrders[0] ||
        availableOrders[0];

    const handlePinChange = (orderId: string, val: string) => {
        // Only allow digits up to 4 characters
        const clean = val.replace(/\D/g, '').slice(0, 4);
        setPinInputs((prev) => ({ ...prev, [orderId]: clean }));
    };

    const handleVerifyPin = (orderId: string) => {
        const pin = pinInputs[orderId] || '';
        if (!pin || pin.length < 4) {
            addToast(
                'Please enter the full 4-digit security PIN given by the customer.',
                'warning'
            );
            return;
        }

        const res = verifyCustomerDeliveryPin(orderId, pin);
        if (res.success) {
            addToast(res.message, 'success');
            // Clear PIN input
            setPinInputs((prev) => ({ ...prev, [orderId]: '' }));
        }
    };

    const handleQuickPinFill = (order: Order) => {
        if (order.deliveryPin) {
            const clean = order.deliveryPin.replace(/\s+/g, '');
            setPinInputs((prev) => ({ ...prev, [order.id]: clean }));
            addToast(
                `Customer PIN "${clean}" filled for quick demo verification.`,
                'info'
            );
        }
    };

    const handleOpenTelegram = (orderId?: string) => {
        const text = orderId
            ? `FreshDrop Courier Dispatch Bot: Order #${orderId} accepted by ${activeRider.name}`
            : `FreshDrop Courier Dispatch Portal`;
        const url = `https://t.me/freshdrop_dispatch_bot?start=${encodeURIComponent(orderId || 'portal')}`;
        window.open(url, '_blank');
        addToast(
            `Connecting to Telegram Dispatch Bot for ${activeRider.name}...`,
            'info'
        );
    };

    const handleCallCustomer = (phone: string, name: string) => {
        window.location.href = `tel:${phone}`;
        addToast(`Dialing customer ${name} (${phone})...`, 'info');
    };

    const handleWhatsAppCustomer = (phone: string, orderId: string) => {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const msg = encodeURIComponent(
            `Hello! This is ${activeRider.name}, your FreshDrop courier with order #${orderId}. I am currently en route with your fresh produce.`
        );
        window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
        addToast(`Opening WhatsApp chat with customer...`, 'info');
    };

    const handleOpenGoogleMaps = (address: string) => {
        const query = encodeURIComponent(`${address}, Juja, Kiambu, Kenya`);
        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${query}`,
            '_blank'
        );
        addToast(`Launching GPS Navigation to "${address}"...`, 'info');
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

    const stagesList: {
        key: DeliveryStage;
        label: string;
        shortLabel: string;
        icon: string;
        desc: string;
    }[] = [
        {
            key: 'placed',
            label: '1. Placed & Confirmed',
            shortLabel: 'Placed',
            icon: 'store',
            desc: 'Order placed by customer',
        },
        {
            key: 'picked_up',
            label: '2. Picked Up at Stall',
            shortLabel: 'Picked Up',
            icon: 'shopping_bag',
            desc: 'Courier gathered goods',
        },
        {
            key: 'heading_to_hub',
            label: '3. Heading to Central Hub',
            shortLabel: 'To Hub',
            icon: 'warehouse',
            desc: 'Consolidation & cooling',
        },
        {
            key: 'out_for_delivery',
            label: '4. Out for Delivery',
            shortLabel: 'Out for Delivery',
            icon: 'near_me',
            desc: 'Live GPS navigation active',
        },
        {
            key: 'delivered',
            label: '5. Delivered',
            shortLabel: 'Delivered',
            icon: 'check_circle',
            desc: 'Verified with security PIN',
        },
    ];

    const getStageIndex = (stage: DeliveryStage) => {
        switch (stage) {
            case 'placed':
                return 0;
            case 'picked_up':
                return 1;
            case 'heading_to_hub':
                return 2;
            case 'out_for_delivery':
                return 3;
            case 'delivered':
                return 4;
            default:
                return 0;
        }
    };

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:py-8">
            {/* Top Courier Profile & Status Header */}
            <div className="relative overflow-hidden rounded-3xl border border-[#becab9]/30 bg-white p-6 shadow-sm">
                <div className="pointer-events-none absolute top-0 right-0 -mt-20 -mr-20 h-96 w-96 rounded-full bg-gradient-to-bl from-emerald-50 via-teal-50/40 to-transparent" />

                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    {/* Rider identity & active switcher */}
                    <div className="flex items-start gap-4 sm:items-center">
                        <div className="relative">
                            <img
                                src={
                                    activeRider.avatar ||
                                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
                                }
                                alt={activeRider.name}
                                className="h-16 w-16 rounded-2xl border-2 border-emerald-600 object-cover shadow-md sm:h-20 sm:w-20"
                            />
                            <span
                                className={`absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${
                                    activeRider.status === 'Available' ||
                                    activeRider.status === 'On Delivery'
                                        ? 'bg-emerald-500'
                                        : activeRider.status === 'On Break'
                                          ? 'bg-amber-500'
                                          : 'bg-stone-400'
                                }`}
                                title={activeRider.status}
                            >
                                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                            </span>
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-black tracking-tight text-stone-900 sm:text-2xl">
                                    {activeRider.name}
                                </h1>
                                <button
                                    onClick={() =>
                                        setShowRiderSwitcher(!showRiderSwitcher)
                                    }
                                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700 transition hover:bg-stone-200"
                                    title="Switch between courier profiles"
                                >
                                    <Sliders className="h-3.5 w-3.5" />
                                    <span>Switch Courier</span>
                                </button>
                            </div>

                            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-medium text-stone-600">
                                <span className="flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 font-bold text-stone-800">
                                    {getVehicleIcon(activeRider.vehicleType)}
                                    {activeRider.vehiclePlate}
                                </span>
                                <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                                    {activeRider.hubLocation}
                                </span>
                                {activeRider.batteryLevel !== undefined && (
                                    <span className="flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 font-semibold text-teal-800">
                                        <BatteryCharging className="h-3.5 w-3.5 text-teal-600" />
                                        {activeRider.batteryLevel}% Charge
                                    </span>
                                )}
                                {activeRider.telegramUsername && (
                                    <span className="flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">
                                        <Send className="h-3 w-3 text-sky-500" />
                                        {activeRider.telegramUsername}
                                    </span>
                                )}
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
                        <button
                            onClick={() =>
                                toggleCourierOnlineStatus(activeRider.id)
                            }
                            className={`flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black shadow-sm transition ${
                                activeRider.status === 'Offline'
                                    ? 'bg-stone-800 text-white hover:bg-stone-900'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                        >
                            <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                    activeRider.status === 'Offline'
                                        ? 'bg-rose-400'
                                        : 'animate-ping bg-emerald-200'
                                }`}
                            />
                            <span>
                                {activeRider.status === 'Offline'
                                    ? 'GO ONLINE'
                                    : activeRider.status.toUpperCase()}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Courier profile switcher modal/dropdown */}
                <AnimatePresence>
                    {showRiderSwitcher && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6 border-t border-stone-200 pt-5"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-bold tracking-wider text-stone-500 uppercase">
                                    Select Courier Profile Demo:
                                </span>
                                <button
                                    onClick={() => setShowRiderSwitcher(false)}
                                    className="text-xs font-bold text-stone-400 hover:text-stone-700"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                                {riders.map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => {
                                            setActiveCourierId(r.id);
                                            setShowRiderSwitcher(false);
                                        }}
                                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition ${
                                            r.id === activeRider.id
                                                ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                                                : 'border-stone-200 bg-stone-50/50 hover:border-stone-300 hover:bg-stone-100'
                                        }`}
                                    >
                                        <img
                                            src={r.avatar}
                                            alt={r.name}
                                            className="h-10 w-10 rounded-xl border border-stone-200 object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-bold text-stone-900">
                                                {r.name}
                                            </p>
                                            <p className="truncate text-[10px] text-stone-500">
                                                {r.vehicleType}
                                            </p>
                                            <div className="mt-0.5 flex items-center gap-1.5">
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${r.status === 'Offline' ? 'bg-stone-400' : 'bg-emerald-500'}`}
                                                />
                                                <span className="text-[9px] font-bold text-stone-600">
                                                    {r.status}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
                                activeRider.todayEarnings || 3850
                            ).toLocaleString()}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                            <span className="inline-flex items-center gap-0.5">
                                <TrendingUp className="h-3.5 w-3.5" />
                                {activeRider.completedToday || 0} drops
                                completed
                            </span>
                            <span className="text-stone-300">•</span>
                            <span className="text-stone-500">
                                Avg KSh 275/drop
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
                                activeRider.totalCumulativeEarnings || 148200
                            ).toLocaleString()}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-teal-700">
                            <span>
                                {activeRider.totalDeliveries || 342} Total
                                Lifetime Drops
                            </span>
                            <span className="text-stone-300">•</span>
                            <span className="text-stone-500">
                                Since {activeRider.joinedDate}
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
                                {activeRider.rating.toFixed(1)}
                            </span>
                            <span className="text-xs font-bold text-stone-400">
                                / 5.0
                            </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <span>★★★★★</span>
                            <span className="font-normal text-stone-500">
                                ({activeRider.totalDeliveries} ratings)
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
                                    {activeRider.onTimeRate || 98.8}%
                                </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                                <div
                                    className="h-full rounded-full bg-emerald-600"
                                    style={{
                                        width: `${activeRider.onTimeRate || 98.8}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="mb-1 flex justify-between text-xs font-bold text-stone-700">
                                <span>Completion Rate</span>
                                <span className="text-teal-700">
                                    {activeRider.completionRate || 99.4}%
                                </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                                <div
                                    className="h-full rounded-full bg-teal-600"
                                    style={{
                                        width: `${activeRider.completionRate || 99.4}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-[11px] text-stone-500">
                        <span>Acceptance Rate</span>
                        <span className="font-bold text-emerald-800">
                            {activeRider.acceptanceRate || 96.5}%
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
                                activeOrders.map((order) => {
                                    const currentIdx = getStageIndex(
                                        order.deliveryStage
                                    );
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
                                                            {order.customerName}
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
                                                                order.shippingAddress
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
                                                            order.courierPayout ||
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
                                                                order.customerPhone ||
                                                                    order.paymentPhone ||
                                                                    '+254 712 345 678',
                                                                order.customerName
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
                                                                order.customerPhone ||
                                                                    order.paymentPhone ||
                                                                    '+254 712 345 678',
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
                                                            order.shippingAddress
                                                        );
                                                    }}
                                                    className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-1.5 font-bold text-stone-700 transition hover:bg-stone-200"
                                                >
                                                    <NavIcon className="h-3.5 w-3.5 text-stone-600" />
                                                    <span>Google Maps GPS</span>
                                                </button>
                                            </div>

                                            {/* Delivery Instructions note */}
                                            {order.deliveryNotes && (
                                                <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200/60 bg-amber-50/70 p-3 text-xs font-medium text-amber-900">
                                                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                                                    <div>
                                                        <span className="font-bold">
                                                            Customer Delivery
                                                            Note:{' '}
                                                        </span>
                                                        {order.deliveryNotes}
                                                    </div>
                                                </div>
                                            )}

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
                                                                        item
                                                                            .product
                                                                            .price *
                                                                        item.quantity
                                                                    ).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            {/* Order Status Multi-Step Interactive Toggles */}
                                            <div className="border-t border-stone-100 pt-2">
                                                <span className="mb-2 block text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                                                    Update Order Progress Stage:
                                                </span>

                                                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateCourierOrderStage(
                                                                order.id,
                                                                'picked_up'
                                                            );
                                                        }}
                                                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                                                            order.deliveryStage ===
                                                            'picked_up'
                                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                                : currentIdx >=
                                                                    1
                                                                  ? 'bg-emerald-100 text-emerald-800'
                                                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                                        }`}
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                        <span>
                                                            1. Picked Up
                                                        </span>
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateCourierOrderStage(
                                                                order.id,
                                                                'heading_to_hub'
                                                            );
                                                        }}
                                                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                                                            order.deliveryStage ===
                                                            'heading_to_hub'
                                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                                : currentIdx >=
                                                                    2
                                                                  ? 'bg-emerald-100 text-emerald-800'
                                                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                                        }`}
                                                    >
                                                        <NavIcon className="h-3.5 w-3.5" />
                                                        <span>2. To Hub</span>
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateCourierOrderStage(
                                                                order.id,
                                                                'out_for_delivery'
                                                            );
                                                        }}
                                                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                                                            order.deliveryStage ===
                                                            'out_for_delivery'
                                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                                : currentIdx >=
                                                                    3
                                                                  ? 'bg-emerald-100 text-emerald-800'
                                                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                                        }`}
                                                    >
                                                        <Truck className="h-3.5 w-3.5" />
                                                        <span>
                                                            3. Out for Deliv
                                                        </span>
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Prompt PIN entry directly
                                                            const pinInput =
                                                                document.getElementById(
                                                                    `pin-input-${order.id}`
                                                                );
                                                            pinInput?.focus();
                                                            addToast(
                                                                'Ask customer for their 4-digit PIN to complete delivery.',
                                                                'info'
                                                            );
                                                        }}
                                                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                                                            order.deliveryStage ===
                                                            'delivered'
                                                                ? 'bg-emerald-600 text-white'
                                                                : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                                        }`}
                                                    >
                                                        <ShieldCheck className="h-3.5 w-3.5" />
                                                        <span>
                                                            4. Enter PIN
                                                        </span>
                                                    </button>
                                                </div>

                                                {/* Customer Security PIN Verification Area */}
                                                <div className="mt-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4">
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <KeyRound className="h-4 w-4 text-emerald-700" />
                                                            <span className="text-xs font-black text-emerald-950">
                                                                Customer
                                                                Handover PIN
                                                                Verification
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleQuickPinFill(
                                                                    order
                                                                );
                                                            }}
                                                            className="cursor-pointer text-[11px] font-bold text-emerald-700 hover:underline"
                                                            title="Fill customer test PIN"
                                                        >
                                                            Demo Auto-Fill PIN (
                                                            {order.deliveryPin})
                                                        </button>
                                                    </div>

                                                    <p className="mb-3 text-[11px] text-emerald-800/80">
                                                        For security, ask the
                                                        recipient at the
                                                        doorstep for their
                                                        4-digit confirmation PIN
                                                        before handing over the
                                                        produce.
                                                    </p>

                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            id={`pin-input-${order.id}`}
                                                            type="text"
                                                            maxLength={4}
                                                            placeholder="4-digit PIN"
                                                            value={
                                                                pinInputs[
                                                                    order.id
                                                                ] || ''
                                                            }
                                                            onChange={(e) =>
                                                                handlePinChange(
                                                                    order.id,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                            className="w-36 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-center text-lg font-black tracking-widest text-emerald-950 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                                        />

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleVerifyPin(
                                                                    order.id
                                                                );
                                                            }}
                                                            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800"
                                                        >
                                                            <ShieldCheck className="h-4 w-4" />
                                                            <span>
                                                                Verify &
                                                                Complete
                                                                Delivery
                                                            </span>
                                                        </button>
                                                    </div>
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
                                availableOrders.map((order) => (
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
                                                        {order.customerName}
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
                                                        {order.shippingAddress}
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
                                                        order.courierPayout ||
                                                        320
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
                                                    acceptOrderAsCourier(
                                                        order.id,
                                                        activeRider.id
                                                    )
                                                }
                                                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                                <span>Accept Order in App</span>
                                            </button>

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
                                    session for {activeRider.name}.
                                </div>
                            ) : (
                                completedOrders.map((order) => (
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
                                                    • {order.customerName}
                                                </span>
                                                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                    Delivered
                                                </span>
                                            </div>
                                            <p className="mt-0.5 max-w-sm truncate text-xs text-stone-500">
                                                {order.shippingAddress}
                                            </p>
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <span className="block text-xs font-black text-emerald-700">
                                                + KSh{' '}
                                                {(
                                                    order.courierPayout || 320
                                                ).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-stone-400">
                                                {order.deliveredAt
                                                    ? new Date(
                                                          order.deliveredAt
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
                                            {activeRider.name.split(' ')[0]}{' '}
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
                                            {selectedOrder?.customerName ||
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
                                            {selectedOrder?.estimatedMinutes ||
                                                8}{' '}
                                            mins (2.4 km)
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
                                                selectedOrder?.shippingAddress ||
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
                                                {selectedOrder.customerName}
                                            </span>
                                            <span className="text-stone-500">
                                                {' '}
                                                (
                                                {selectedOrder.customerPhone ||
                                                    selectedOrder.paymentPhone}
                                                )
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2 text-stone-700">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                                        <span>
                                            {selectedOrder.shippingAddress}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-stone-200 pt-2 text-xs">
                                    <button
                                        onClick={() =>
                                            handleCallCustomer(
                                                selectedOrder.customerPhone ||
                                                    selectedOrder.paymentPhone ||
                                                    '',
                                                selectedOrder.customerName
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
                    <div className="space-y-3 rounded-3xl bg-gradient-to-br from-stone-900 to-stone-800 p-5 text-white shadow-sm">
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
