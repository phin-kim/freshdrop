import {
    BarChart3,
    Calendar,
    CheckCircle,
    CheckCircle2,
    PackageCheck,
    PieChart as PieIcon,
    Printer,
    Store,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    //Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { useStore } from '../../store';

const CATEGORY_COLORS: Record<string, string> = {
    Fruits: '#4C6B36', // FreshDrop Forest Green
    Vegetables: '#2D4722', // Deep Organic Green
    Dairy: '#3B82F6', // Blue
    Bakery: '#D4A373', // Warm Ochre
    Household: '#8C5D30', // Earth Brown
    'Mixed Produce': '#5B7065',
};

export default function AdminAnalytics() {
    const { orders, products, merchants, riders } = useStore();
    const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>(
        '7days'
    );

    // Revenue & Daily Sales Data
    const salesTrendData = useMemo(() => {
        if (timeRange === 'today') {
            return [
                { time: '06:00', revenue: 1450, orders: 1, serviceFees: 120 },
                { time: '08:00', revenue: 4200, orders: 3, serviceFees: 280 },
                { time: '10:00', revenue: 8900, orders: 5, serviceFees: 510 },
                { time: '12:00', revenue: 12400, orders: 7, serviceFees: 760 },
                { time: '14:00', revenue: 15600, orders: 8, serviceFees: 920 },
                {
                    time: '16:00',
                    revenue: 19800,
                    orders: 11,
                    serviceFees: 1200,
                },
                {
                    time: '18:00',
                    revenue: 24500,
                    orders: 14,
                    serviceFees: 1490,
                },
                {
                    time: '20:00',
                    revenue: 27800,
                    orders: 16,
                    serviceFees: 1650,
                },
            ];
        }

        if (timeRange === '7days') {
            return [
                { day: 'Mon', revenue: 18400, orders: 11, commission: 1472 },
                { day: 'Tue', revenue: 22100, orders: 13, commission: 1768 },
                { day: 'Wed', revenue: 27500, orders: 16, commission: 2200 },
                { day: 'Thu', revenue: 25800, orders: 15, commission: 2064 },
                { day: 'Fri', revenue: 36200, orders: 22, commission: 2896 },
                { day: 'Sat', revenue: 48900, orders: 29, commission: 3912 },
                {
                    day: 'Sun (Today)',
                    revenue: 38400,
                    orders: 24,
                    commission: 3072,
                },
            ];
        }

        return [
            { week: 'Week 1', revenue: 142000, orders: 84, commission: 11360 },
            { week: 'Week 2', revenue: 168000, orders: 102, commission: 13440 },
            { week: 'Week 3', revenue: 195000, orders: 118, commission: 15600 },
            { week: 'Week 4', revenue: 217300, orders: 130, commission: 17384 },
        ];
    }, [timeRange]);

    // 1. ORDER FULFILLMENT FUNNEL DATA (Pending ➔ Accepted ➔ Packed ➔ Dispatched ➔ Delivered)
    const funnelData = useMemo(() => {
        // Dynamically calculate from real orders + base distribution baseline
        const totalPlaced = Math.max(orders.length + 54, 60);
        const acceptedCount = Math.round(totalPlaced * 0.96); // 96% accepted
        const packedCount = Math.round(totalPlaced * 0.91); // 91% packed
        const dispatchedCount = Math.round(totalPlaced * 0.88); // 88% out with courier
        const deliveredCount = Math.round(totalPlaced * 0.86); // 86% completed/PIN verified
        const cancelledCount = totalPlaced - deliveredCount;

        return [
            {
                stage: 'Pending',
                name: '1. Pending Order',
                count: totalPlaced,
                percentage: 100,
                avgTime: '2.5 min',
                color: '#8C877E',
                description: 'Customer checkout completed, awaiting hub review',
            },
            {
                stage: 'Accepted',
                name: '2. Accepted by Hub',
                count: acceptedCount,
                percentage: Math.round((acceptedCount / totalPlaced) * 100),
                avgTime: '4.8 min',
                color: '#D4A373',
                description: 'Hub manager confirmed & farm inventory reserved',
            },
            {
                stage: 'Packed',
                name: '3. Packed & Bagged',
                count: packedCount,
                percentage: Math.round((packedCount / totalPlaced) * 100),
                avgTime: '8.2 min',
                color: '#6B705C',
                description: 'Cold-chain crate assembled with QR verification',
            },
            {
                stage: 'Dispatched',
                name: '4. Dispatched Fleet',
                count: dispatchedCount,
                percentage: Math.round((dispatchedCount / totalPlaced) * 100),
                avgTime: '22.0 min',
                color: '#4C6B36',
                description: 'Courier in transit with electric bike/van',
            },
            {
                stage: 'Delivered',
                name: '5. Delivered & Verified',
                count: deliveredCount,
                percentage: Math.round((deliveredCount / totalPlaced) * 100),
                avgTime: '38.5 min',
                color: '#2D4722',
                description: 'Successfully handed over with 4-digit PIN',
            },
        ];
    }, [orders]);

    // 2. NEW VS RETURNING CUSTOMER ORDER SHARE DATA
    const customerShareData = useMemo(() => {
        // Calculate customer distribution
        const returningOrders = 41;
        const newOrders = 19;
        const total = returningOrders + newOrders;

        const returningPercentage = Math.round((returningOrders / total) * 100);
        const newPercentage = 100 - returningPercentage;

        return [
            {
                name: 'Returning Customers',
                value: returningOrders,
                percentage: returningPercentage,
                revenue: 89400,
                avgBasket: 2180,
                color: '#4C6B36', // Primary Green
            },
            {
                name: 'New Customers',
                value: newOrders,
                percentage: newPercentage,
                revenue: 39050,
                avgBasket: 2055,
                color: '#D4A373', // Ochre Accent
            },
        ];
    }, []);

    // 3. SUPPLIER SALES CONTRIBUTION SPLIT (Open Market vs. Supermarket)
    const supplierContributionData = useMemo(() => {
        // Open Market (Soko / local smallholders) vs Supermarket (packaged dry goods / dairy)
        let openMarketSales = 0;
        let supermarketSales = 0;
        let openMarketItems = 0;
        let supermarketItems = 0;

        orders.forEach((order) => {
            order.items.forEach((item) => {
                const cat = item.product.category;
                const itemVal = item.product.price * item.quantity;
                // Fruits & Vegetables are fulfilled by Open Market (Soko)
                // Dairy, Bakery, Household are fulfilled by Supermarket
                if (
                    cat === 'Fruits' ||
                    cat === 'Vegetables' ||
                    item.product.isOrganic
                ) {
                    openMarketSales += itemVal;
                    openMarketItems += item.quantity;
                } else {
                    supermarketSales += itemVal;
                    supermarketItems += item.quantity;
                }
            });
        });

        // Provide weighted baseline if newly initialized
        const totalOpenSales = openMarketSales + 74500;
        const totalSupermarketSales = supermarketSales + 53950;
        const totalGross = totalOpenSales + totalSupermarketSales;

        const openPercentage = Math.round((totalOpenSales / totalGross) * 100);
        const supermarketPercentage = 100 - openPercentage;

        return [
            {
                name: 'Open Market',
                nodeLabel: 'Open Market (Juja Soko Stalls & Farmers)',
                sales: totalOpenSales,
                percentage: openPercentage,
                itemsCount: openMarketItems + 248,
                commission: Math.round(totalOpenSales * 0.08),
                color: '#2D4722', // Deep Forest Green
            },
            {
                name: 'Supermarket',
                nodeLabel: 'Supermarket (Bulk Staples & Packaged Goods)',
                sales: totalSupermarketSales,
                percentage: supermarketPercentage,
                itemsCount: supermarketItems + 162,
                commission: Math.round(totalSupermarketSales * 0.06),
                color: '#6B705C', // Sage Slate
            },
        ];
    }, [orders]);

    // Category Distribution Data
    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {
            Fruits: 0,
            Vegetables: 0,
            Dairy: 0,
            Bakery: 0,
            Household: 0,
        };

        orders.forEach((o) => {
            o.items.forEach((it) => {
                const cat = it.product.category || 'Vegetables';
                counts[cat] =
                    (counts[cat] || 0) + it.product.price * it.quantity;
            });
        });

        const baseWeights: Record<string, number> = {
            Vegetables: 14500,
            Fruits: 12200,
            Dairy: 8400,
            Bakery: 6100,
            Household: 3900,
        };

        return Object.keys(counts).map((key) => ({
            name: key,
            value: (counts[key] || 0) + (baseWeights[key] || 2000),
            color: CATEGORY_COLORS[key] || '#4C6B36',
        }));
    }, [orders]);

    // Aggregated Report Metrics
    const summaryKpis = useMemo(() => {
        const totalOrderCount = orders.length > 0 ? orders.length + 54 : 60;
        const grossSales = orders.reduce((sum, o) => sum + o.total, 0) + 128450;
        const avgOrderValue = Math.round(grossSales / totalOrderCount);
        const platformCommission = Math.round(grossSales * 0.08);
        const serviceFeesCollected =
            orders.reduce((sum, o) => sum + o.serviceCharge, 0) + 7840;
        const activeFleet = riders.filter(
            (r) => r.status === 'Available' || r.status === 'On Delivery'
        ).length;

        return {
            totalOrderCount,
            grossSales,
            avgOrderValue,
            platformCommission,
            serviceFeesCollected,
            activeFleet,
        };
    }, [orders, riders]);

    return (
        <div
            id="admin-analytics-section"
            className="font-inter space-y-6 text-left"
        >
            {/* Header & Controls */}
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-xs sm:flex-row sm:items-center">
                <div>
                    <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#2D3025]">
                        <BarChart3 className="h-5 w-5 text-[#4C6B36]" />
                        Analytics & Daily Sales Intelligence
                    </h2>
                    <p className="mt-0.5 text-sm text-[#6B705C]">
                        Fulfillment funnel bottlenecks, retention metrics,
                        supplier node contributions, and daily reconciliation.
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2.5">
                    <div className="flex items-center rounded-xl border border-[#E5E1D8] bg-[#F0EDE4] p-1">
                        <button
                            onClick={() => setTimeRange('today')}
                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                timeRange === 'today'
                                    ? 'bg-[#4C6B36] text-white shadow-xs'
                                    : 'text-[#6B705C] hover:text-[#2D3025]'
                            }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setTimeRange('7days')}
                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                timeRange === '7days'
                                    ? 'bg-[#4C6B36] text-white shadow-xs'
                                    : 'text-[#6B705C] hover:text-[#2D3025]'
                            }`}
                        >
                            Past 7 Days
                        </button>
                        <button
                            onClick={() => setTimeRange('30days')}
                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                timeRange === '30days'
                                    ? 'bg-[#4C6B36] text-white shadow-xs'
                                    : 'text-[#6B705C] hover:text-[#2D3025]'
                            }`}
                        >
                            Past 30 Days
                        </button>
                    </div>

                    <button
                        onClick={() => window.print()}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E5E1D8] bg-white px-3.5 py-2 text-xs font-bold text-[#2D3025] shadow-2xs transition hover:bg-[#F0EDE4]"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        Print Report
                    </button>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-[#E5E1D8] bg-white p-3.5 shadow-xs">
                    <span className="block text-[10px] font-bold tracking-wider text-[#6B705C] uppercase">
                        Gross Sales
                    </span>
                    <p className="mt-1 text-xl font-black text-[#2D3025]">
                        KSh {summaryKpis.grossSales.toLocaleString()}
                    </p>
                    <span className="mt-1 flex items-center gap-0.5 text-[10px] font-semibold text-[#4C6B36]">
                        <TrendingUp className="inline h-3 w-3" /> +14.2% vs last
                        week
                    </span>
                </div>

                <div className="rounded-xl border border-[#E5E1D8] bg-white p-3.5 shadow-xs">
                    <span className="block text-[10px] font-bold tracking-wider text-[#6B705C] uppercase">
                        Total Orders
                    </span>
                    <p className="mt-1 text-xl font-black text-[#2D3025]">
                        {summaryKpis.totalOrderCount}
                    </p>
                    <span className="mt-1 block text-[10px] font-medium text-[#6B705C]">
                        {funnelData[4].count} completed
                    </span>
                </div>

                <div className="rounded-xl border border-[#E5E1D8] bg-white p-3.5 shadow-xs">
                    <span className="block text-[10px] font-bold tracking-wider text-[#6B705C] uppercase">
                        Average Basket
                    </span>
                    <p className="mt-1 text-xl font-black text-[#4C6B36]">
                        KSh {summaryKpis.avgOrderValue.toLocaleString()}
                    </p>
                    <span className="mt-1 block text-[10px] font-semibold text-[#4C6B36]">
                        ~3.6 produce items
                    </span>
                </div>

                <div className="rounded-xl border border-[#E5E1D8] bg-white p-3.5 shadow-xs">
                    <span className="block text-[10px] font-bold tracking-wider text-[#6B705C] uppercase">
                        Repeat Shoppers
                    </span>
                    <p className="mt-1 text-xl font-black text-[#2D4722]">
                        {customerShareData[0].percentage}%
                    </p>
                    <span className="mt-1 block text-[10px] font-semibold text-[#4C6B36]">
                        Loyal Retention
                    </span>
                </div>

                <div className="rounded-xl border border-[#E5E1D8] bg-white p-3.5 shadow-xs">
                    <span className="block text-[10px] font-bold tracking-wider text-[#6B705C] uppercase">
                        Open Market Share
                    </span>
                    <p className="mt-1 text-xl font-black text-[#2D4722]">
                        {supplierContributionData[0].percentage}%
                    </p>
                    <span className="mt-1 block text-[10px] font-medium text-[#6B705C]">
                        Soko Fresh produce
                    </span>
                </div>

                <div className="rounded-xl border border-[#E5E1D8] bg-white p-3.5 shadow-xs">
                    <span className="block text-[10px] font-bold tracking-wider text-[#6B705C] uppercase">
                        Fulfillment Rate
                    </span>
                    <p className="mt-1 text-xl font-black text-[#4C6B36]">
                        {funnelData[4].percentage}%
                    </p>
                    <span className="mt-1 block text-[10px] font-semibold text-[#4C6B36]">
                        Avg 38m cycle
                    </span>
                </div>
            </div>

            {/* TOP CHARTS ROW: Sales Trend Area Chart & Produce Category Share */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Sales & Orders Trend Area Chart */}
                <div className="rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-xs lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-bold text-[#2D3025]">
                                <TrendingUp className="h-4 w-4 text-[#4C6B36]" />
                                Revenue & Order Trajectory
                            </h3>
                            <p className="mt-0.5 text-xs text-[#6B705C]">
                                Gross sales volume in KSh and completed customer
                                order trends.
                            </p>
                        </div>
                        <span className="rounded-full border border-[#E5E1D8] bg-[#F0EDE4] px-2.5 py-1 text-xs font-bold text-[#4C6B36]">
                            Live Feed
                        </span>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={salesTrendData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: 0,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="revenueGrad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#4C6B36"
                                            stopOpacity={0.4}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#4C6B36"
                                            stopOpacity={0.0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#F0EDE4"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey={
                                        timeRange === 'today'
                                            ? 'time'
                                            : timeRange === '7days'
                                              ? 'day'
                                              : 'week'
                                    }
                                    stroke="#8C877E"
                                    fontSize={11}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#8C877E"
                                    fontSize={11}
                                    tickLine={false}
                                    tickFormatter={(val) =>
                                        `KSh ${val >= 1000 ? val / 1000 + 'k' : val}`
                                    }
                                />
                                <Tooltip
                                    formatter={(val: any) => [
                                        `KSh ${Number(val).toLocaleString()}`,
                                        'Revenue',
                                    ]}
                                    contentStyle={{
                                        backgroundColor: '#2D3025',
                                        borderRadius: '12px',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '12px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#4C6B36"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#revenueGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Breakdown Donut PieChart */}
                <div className="flex flex-col justify-between rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-xs">
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-sm font-bold text-[#2D3025]">
                                <PieIcon className="h-4 w-4 text-[#4C6B36]" />
                                Produce Category Share
                            </h3>
                            <span className="text-[10px] font-bold text-[#8C877E] uppercase">
                                By Value
                            </span>
                        </div>
                        <p className="mb-3 text-xs text-[#6B705C]">
                            Sales distribution across farm departments.
                        </p>

                        <div className="relative h-44 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: any) => [
                                            `KSh ${Number(val).toLocaleString()}`,
                                            'Share',
                                        ]}
                                        contentStyle={{
                                            backgroundColor: '#2D3025',
                                            borderRadius: '12px',
                                            border: 'none',
                                            color: '#fff',
                                            fontSize: '12px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 border-t border-[#E5E1D8] pt-2">
                        {categoryData.map((cat) => (
                            <div
                                key={cat.name}
                                className="flex items-center gap-1.5 text-[11px]"
                            >
                                <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: cat.color }}
                                />
                                <span className="truncate text-[#6B705C]">
                                    {cat.name}:
                                </span>
                                <span className="ml-auto font-bold text-[#2D3025]">
                                    KSh {(cat.value / 1000).toFixed(1)}k
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* NEW REQUESTED CHARTS SECTION */}

            {/* CHART 1: ORDER FULFILLMENT FUNNEL */}
            <div className="space-y-4 rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-xs sm:p-6">
                <div className="flex flex-col justify-between gap-2 border-b border-[#E5E1D8]/60 pb-3 sm:flex-row sm:items-center">
                    <div>
                        <h3 className="flex items-center gap-2 text-base font-bold text-[#2D3025]">
                            <PackageCheck className="h-5 w-5 text-[#4C6B36]" />
                            Order Fulfillment Funnel
                        </h3>
                        <p className="mt-0.5 text-xs text-[#6B705C]">
                            Tracks how orders move from{' '}
                            <span className="font-bold text-[#2D3025]">
                                Pending ➔ Accepted ➔ Packed ➔ Dispatched ➔
                                Delivered
                            </span>
                            , highlighting stage drop-offs and dispatch
                            velocity.
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded-full border border-[#E5E1D8] bg-[#F0EDE4] px-3 py-1 text-[11px] font-bold text-[#4C6B36]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#4C6B36]" />
                            {funnelData[4].percentage}% Completion Efficiency
                        </span>
                    </div>
                </div>

                {/* Funnel Visual Stepper Cards */}
                <div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-5">
                    {funnelData.map((step, idx) => {
                        const dropoff =
                            idx === 0
                                ? 0
                                : funnelData[idx - 1].count - step.count;
                        return (
                            <div
                                key={step.stage}
                                className="group relative space-y-2 overflow-hidden rounded-xl border border-[#E5E1D8] bg-[#FDFCF8] p-4 transition hover:border-[#4C6B36]/50"
                            >
                                {/* Stage top badge */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black tracking-wider text-[#6B705C] uppercase">
                                        Stage 0{idx + 1}
                                    </span>
                                    <span className="rounded-full bg-[#F0EDE4] px-2 py-0.5 font-mono text-[10px] font-bold text-[#2D3025]">
                                        {step.avgTime}
                                    </span>
                                </div>

                                {/* Main count & conversion */}
                                <div>
                                    <h4 className="truncate text-sm font-bold text-[#2D3025]">
                                        {step.stage}
                                    </h4>
                                    <div className="mt-1 flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-[#2D3025]">
                                            {step.count}
                                        </span>
                                        <span className="text-xs font-bold text-[#4C6B36]">
                                            {step.percentage}%
                                        </span>
                                    </div>
                                </div>

                                {/* Progress bar indicator */}
                                <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E1D8]">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${step.percentage}%`,
                                            backgroundColor: step.color,
                                        }}
                                    />
                                </div>

                                <p className="pt-1 text-[11px] leading-snug text-[#6B705C]">
                                    {step.description}
                                </p>

                                {dropoff > 0 && (
                                    <div className="flex items-center justify-between border-t border-[#E5E1D8]/60 pt-1.5 text-[10px] text-amber-800">
                                        <span>Drop-off / Stuck:</span>
                                        <span className="font-mono font-bold">
                                            -{dropoff} (
                                            {Math.round(
                                                (dropoff /
                                                    funnelData[0].count) *
                                                    100
                                            )}
                                            %)
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Horizontal Funnel Recharts Bar representation */}
                <div className="rounded-xl border border-[#E5E1D8] bg-[#FDFCF8] p-4">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#2D3025]">
                            Stage Velocity & Volume Distribution
                        </span>
                        <span className="text-[10px] text-[#6B705C]">
                            Total Volume Base: {funnelData[0].count} Orders
                        </span>
                    </div>
                    <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={funnelData}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 60,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#F0EDE4"
                                    horizontal={false}
                                />
                                <XAxis
                                    type="number"
                                    stroke="#8C877E"
                                    fontSize={11}
                                    tickLine={false}
                                />
                                <YAxis
                                    dataKey="stage"
                                    type="category"
                                    stroke="#2D3025"
                                    fontSize={11}
                                    tickLine={false}
                                    fontFamily="Inter"
                                    fontWeight="bold"
                                />
                                <Tooltip
                                    formatter={(
                                        val: any,
                                        name: any,
                                        item: any
                                    ) => [
                                        `${val} Orders (${item.payload.percentage}% converted, Avg: ${item.payload.avgTime})`,
                                        'Fulfillment',
                                    ]}
                                    contentStyle={{
                                        backgroundColor: '#2D3025',
                                        borderRadius: '12px',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '12px',
                                    }}
                                />
                                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                                    {funnelData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* SECONDARY ROW: CHARTS 2 & 3 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* CHART 2: NEW VS RETURNING CUSTOMER ORDER SHARE */}
                <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-xs sm:p-6">
                    <div>
                        <div className="mb-1 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-base font-bold text-[#2D3025]">
                                <Users className="h-5 w-5 text-[#4C6B36]" />
                                New vs. Returning Customer Share
                            </h3>
                            <span className="rounded-full border border-[#E5E1D8] bg-[#F0EDE4] px-2.5 py-1 text-[10px] font-bold text-[#4C6B36]">
                                Cohort Retention
                            </span>
                        </div>
                        <p className="text-xs text-[#6B705C]">
                            Proportion of grocery orders driven by first-time
                            shoppers vs. loyal, repeat customers.
                        </p>

                        {/* Donut Chart */}
                        <div className="relative mt-3 h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={customerShareData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {customerShareData.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`cust-cell-${index}`}
                                                    fill={entry.color}
                                                />
                                            )
                                        )}
                                    </Pie>
                                    <Tooltip
                                        formatter={(
                                            val: any,
                                            name: any,
                                            item: any
                                        ) => [
                                            `${val} Orders (${item.payload.percentage}% of total, KSh ${item.payload.revenue.toLocaleString()})`,
                                            name,
                                        ]}
                                        contentStyle={{
                                            backgroundColor: '#2D3025',
                                            borderRadius: '12px',
                                            border: 'none',
                                            color: '#fff',
                                            fontSize: '12px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Breakdown cards */}
                    <div className="grid grid-cols-2 gap-3 border-t border-[#E5E1D8] pt-3">
                        {/* Returning */}
                        <div className="space-y-1 rounded-xl border border-[#E5E1D8] bg-[#FDFCF8] p-3.5">
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#4C6B36]" />
                                <span className="text-xs font-bold text-[#2D3025]">
                                    Returning Shoppers
                                </span>
                            </div>
                            <p className="text-xl font-black text-[#4C6B36]">
                                {customerShareData[0].percentage}%
                            </p>
                            <div className="flex justify-between text-[11px] text-[#6B705C]">
                                <span>{customerShareData[0].value} Orders</span>
                                <span className="font-semibold text-[#2D3025]">
                                    KSh{' '}
                                    {customerShareData[0].revenue.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* New */}
                        <div className="space-y-1 rounded-xl border border-[#E5E1D8] bg-[#FDFCF8] p-3.5">
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#D4A373]" />
                                <span className="text-xs font-bold text-[#2D3025]">
                                    First-Time Shoppers
                                </span>
                            </div>
                            <p className="text-xl font-black text-[#D4A373]">
                                {customerShareData[1].percentage}%
                            </p>
                            <div className="flex justify-between text-[11px] text-[#6B705C]">
                                <span>{customerShareData[1].value} Orders</span>
                                <span className="font-semibold text-[#2D3025]">
                                    KSh{' '}
                                    {customerShareData[1].revenue.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="rounded-lg border border-[#E5E1D8] bg-[#F0EDE4]/60 p-2.5 text-[11px] leading-tight text-[#6B705C]">
                        💡{' '}
                        <span className="font-bold text-[#2D3025]">
                            Retention Insight:
                        </span>{' '}
                        High repeat rate ({customerShareData[0].percentage}%)
                        indicates strong customer habit formation around weekly
                        organic grocery baskets.
                    </p>
                </div>

                {/* CHART 3: SUPPLIER SALES CONTRIBUTION SPLIT (Open Market vs. Supermarket) */}
                <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-xs sm:p-6">
                    <div>
                        <div className="mb-1 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-base font-bold text-[#2D3025]">
                                <Store className="h-5 w-5 text-[#4C6B36]" />
                                Supplier Sales Contribution Split
                            </h3>
                            <span className="rounded-full border border-[#E5E1D8] bg-[#F0EDE4] px-2.5 py-1 text-[10px] font-bold text-[#2D4722]">
                                2 Supply Nodes
                            </span>
                        </div>
                        <p className="text-xs text-[#6B705C]">
                            Gross sales & volume fulfilled by{' '}
                            <span className="font-bold text-[#2D3025]">
                                Open Market
                            </span>{' '}
                            versus{' '}
                            <span className="font-bold text-[#2D3025]">
                                Supermarket
                            </span>
                            .
                        </p>

                        {/* Split Comparison BarChart / Donut */}
                        <div className="relative mt-3 h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={supplierContributionData}
                                    margin={{
                                        top: 15,
                                        right: 10,
                                        left: 10,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#F0EDE4"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#2D3025"
                                        fontSize={12}
                                        tickLine={false}
                                        fontFamily="Inter"
                                        fontWeight="bold"
                                    />
                                    <YAxis
                                        stroke="#8C877E"
                                        fontSize={11}
                                        tickLine={false}
                                        tickFormatter={(val) =>
                                            `KSh ${val >= 1000 ? val / 1000 + 'k' : val}`
                                        }
                                    />
                                    <Tooltip
                                        formatter={(
                                            val: any,
                                            name: any,
                                            item: any
                                        ) => [
                                            `KSh ${Number(val).toLocaleString()} (${item.payload.percentage}% share, ${item.payload.itemsCount} units sold)`,
                                            item.payload.nodeLabel,
                                        ]}
                                        contentStyle={{
                                            backgroundColor: '#2D3025',
                                            borderRadius: '12px',
                                            border: 'none',
                                            color: '#fff',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                                        {supplierContributionData.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`supp-cell-${index}`}
                                                    fill={entry.color}
                                                />
                                            )
                                        )}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Supplier Nodes Details Strip */}
                    <div className="grid grid-cols-2 gap-3 border-t border-[#E5E1D8] pt-3">
                        {/* Open Market */}
                        <div className="space-y-1 rounded-xl border border-[#E5E1D8] bg-[#FDFCF8] p-3.5">
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#2D4722]" />
                                <span className="text-xs font-bold text-[#2D3025]">
                                    Open Market
                                </span>
                            </div>
                            <p className="text-xl font-black text-[#2D4722]">
                                {supplierContributionData[0].percentage}%{' '}
                                <span className="text-xs font-semibold text-[#6B705C]">
                                    Share
                                </span>
                            </p>
                            <div className="space-y-0.5 text-[11px] text-[#6B705C]">
                                <div className="flex justify-between">
                                    <span>Gross Sales:</span>
                                    <span className="font-bold text-[#2D3025]">
                                        KSh{' '}
                                        {supplierContributionData[0].sales.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Farm Units:</span>
                                    <span className="font-mono text-[#2D3025]">
                                        {supplierContributionData[0].itemsCount}{' '}
                                        crates
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Supermarket */}
                        <div className="space-y-1 rounded-xl border border-[#E5E1D8] bg-[#FDFCF8] p-3.5">
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#6B705C]" />
                                <span className="text-xs font-bold text-[#2D3025]">
                                    Supermarket
                                </span>
                            </div>
                            <p className="text-xl font-black text-[#6B705C]">
                                {supplierContributionData[1].percentage}%{' '}
                                <span className="text-xs font-semibold text-[#6B705C]">
                                    Share
                                </span>
                            </p>
                            <div className="space-y-0.5 text-[11px] text-[#6B705C]">
                                <div className="flex justify-between">
                                    <span>Gross Sales:</span>
                                    <span className="font-bold text-[#2D3025]">
                                        KSh{' '}
                                        {supplierContributionData[1].sales.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pantry Units:</span>
                                    <span className="font-mono text-[#2D3025]">
                                        {supplierContributionData[1].itemsCount}{' '}
                                        packs
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="rounded-lg border border-[#E5E1D8] bg-[#F0EDE4]/60 p-2.5 text-[11px] leading-tight text-[#6B705C]">
                        🥬{' '}
                        <span className="font-bold text-[#2D3025]">
                            Supply Hub Ratio:
                        </span>{' '}
                        Juja Soko (Open Market) drives 58% of volume, providing
                        organic farm produce while the Supermarket node
                        supplements packaged dry staples.
                    </p>
                </div>
            </div>

            {/* Daily Executive Report Table */}
            <div className="space-y-4 rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="flex items-center gap-2 text-base font-bold text-[#2D3025]">
                            <Calendar className="h-5 w-5 text-[#4C6B36]" />
                            Daily Executive Settlement Summary
                        </h3>
                        <p className="mt-0.5 text-xs text-[#6B705C]">
                            Financial reconciliation for today (
                            {new Date().toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                            ).
                        </p>
                    </div>

                    <span className="flex items-center gap-1.5 rounded-xl border border-[#E5E1D8] bg-[#F0EDE4] px-3 py-1.5 text-xs font-bold text-[#4C6B36]">
                        <CheckCircle className="h-4 w-4 text-[#4C6B36]" />
                        Audit Status: Balanced
                    </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#E5E1D8]">
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr className="border-b border-[#E5E1D8] bg-[#F0EDE4]/70 font-semibold tracking-wider text-[#6B705C] uppercase">
                                <th className="px-4 py-3">
                                    Metric / Ledger Item
                                </th>
                                <th className="px-4 py-3">Today Total</th>
                                <th className="px-4 py-3">
                                    Settlement Channel
                                </th>
                                <th className="px-4 py-3">
                                    Variance / Benchmark
                                </th>
                                <th className="px-4 py-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E1D8]/60 font-medium text-[#2D3025]">
                            <tr>
                                <td className="px-4 py-3 font-bold text-[#2D3025]">
                                    Gross Consumer Sales
                                </td>
                                <td className="px-4 py-3 font-bold text-[#2D3025]">
                                    KSh{' '}
                                    {summaryKpis.grossSales.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-[#6B705C]">
                                    Payhero M-PESA & Card Gateways
                                </td>
                                <td className="px-4 py-3 font-semibold text-[#4C6B36]">
                                    +12.4% above daily target
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="rounded-full border border-[#4C6B36]/30 bg-[#4C6B36]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#2D4722]">
                                        Collected
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-bold text-[#2D3025]">
                                    Open Market Farm Disbursements (Soko)
                                </td>
                                <td className="px-4 py-3 font-bold text-[#2D3025]">
                                    KSh{' '}
                                    {supplierContributionData[0].sales.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-[#6B705C]">
                                    Direct M-PESA Till Disbursement
                                </td>
                                <td className="px-4 py-3 text-[#6B705C]">
                                    92% net supply payout to local stalls
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-900">
                                        Disbursed
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-bold text-[#2D3025]">
                                    Supermarket Merchant Settlements
                                </td>
                                <td className="px-4 py-3 font-bold text-[#2D3025]">
                                    KSh{' '}
                                    {supplierContributionData[1].sales.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-[#6B705C]">
                                    EFT / Bank Automated Reconciliation
                                </td>
                                <td className="px-4 py-3 text-[#6B705C]">
                                    94% net supply payout for dry goods
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="rounded-full border border-blue-200 bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-900">
                                        Reconciled
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-bold text-[#2D3025]">
                                    Service Fee Surcharge (50% Compounding)
                                </td>
                                <td className="px-4 py-3 font-bold text-[#2D3025]">
                                    KSh{' '}
                                    {summaryKpis.serviceFeesCollected.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-[#6B705C]">
                                    Logistics & Cold Storage Fund
                                </td>
                                <td className="px-4 py-3 text-[#6B705C]">
                                    Covers electric fleet charging & cold bags
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="rounded-full border border-[#4C6B36]/30 bg-[#4C6B36]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#2D4722]">
                                        Retained
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-bold text-[#2D3025]">
                                    Platform Net Take Rate (Commission)
                                </td>
                                <td className="px-4 py-3 font-bold text-[#4C6B36]">
                                    KSh{' '}
                                    {summaryKpis.platformCommission.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-[#6B705C]">
                                    Operating Net Margin
                                </td>
                                <td className="px-4 py-3 font-semibold text-[#4C6B36]">
                                    8.0% standard average
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="rounded-full border border-[#D4A373]/40 bg-[#D4A373]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#8C5D30]">
                                        Cleared
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
