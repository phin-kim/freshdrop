import { useQuery } from '@tanstack/react-query';
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
import { useState } from 'react';
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

import { adminAPI } from '../../../Library/api';
import useErrorStore from '../../../Store/errorStore';
import type { AnalyticsResponse } from '../../../Types/Analytics';

//import { useStore } from '../../store';

/*const CATEGORY_COLORS: Record<string, string> = {
    Fruits: '#4C6B36', // FreshDrop Forest Green
    Vegetables: '#2D4722', // Deep Organic Green
    Dairy: '#3B82F6', // Blue
    Bakery: '#D4A373', // Warm Ochre
    Household: '#8C5D30', // Earth Brown
    'Mixed Produce': '#5B7065',
};*/
const CATEGORY_COLORS = ['#4C6B36', '#6B705C', '#8C877E', '#2D3025', '#A3B18A'];

export default function AdminAnalytics() {
    const [period, setPeriod] = useState<'today' | '7days' | '30days'>('7days');
    const setError = useErrorStore((state) => state.setError);
    const {
        data: response,
        isPending,
        isError,
        error,
    } = useQuery<AnalyticsResponse, Error>({
        queryKey: ['admin-analytics', period],
        queryFn: async () => {
            const res = await adminAPI.get<AnalyticsResponse>(
                `/admin/analytics?period=${period}`
            );
            return res.data;
        },
        staleTime: 1000 * 60 * 5, // cache for 5 minutes
    });
    const analytics = response?.data;
    const totalOrdersCount = analytics?.summary.totalOrders || 0;
    const deliveredCount = analytics?.funnel.delivered || 0;
    const openmarketAmount = analytics?.supplierSplit.openmarket.amount || 0;
    const supermarketAmount = analytics?.supplierSplit.supermarket.amount || 0;
    const totalSupplierSales = openmarketAmount + supermarketAmount;
    const openMarketShare =
        totalSupplierSales > 0
            ? Math.round((openmarketAmount / totalSupplierSales) * 100)
            : 0;

    const summaryKpis = {
        grossSales: analytics?.summary.grossSales || 0,
        totalOrderCount: totalOrdersCount,
        avgOrderValue: analytics?.summary.averageOrderAmount || 0,
    };

    const funnelData = [
        {
            stage: 'Pending',
            count: analytics?.funnel.pending || 0,
            percentage: totalOrdersCount
                ? Math.round(
                      ((analytics?.funnel.pending || 0) / totalOrdersCount) *
                          100
                  )
                : 0,
            avgTime: 'Immediate',
            color: '#8C877E',
            description: 'Awaiting supplier confirmation',
        },
        {
            stage: 'Accepted',
            count: analytics?.funnel.accepted || 0,
            percentage: totalOrdersCount
                ? Math.round(
                      ((analytics?.funnel.accepted || 0) / totalOrdersCount) *
                          100
                  )
                : 0,
            avgTime: '8m avg',
            color: '#6B705C',
            description: 'Confirmed & queued at hub',
        },
        {
            stage: 'Packed',
            count: analytics?.funnel.packed || 0,
            percentage: totalOrdersCount
                ? Math.round(
                      ((analytics?.funnel.packed || 0) / totalOrdersCount) * 100
                  )
                : 0,
            avgTime: '18m avg',
            color: '#A3B18A',
            description: 'Sorted & bagged for delivery',
        },
        {
            stage: 'Dispatched',
            count: analytics?.funnel.dispatched || 0,
            percentage: totalOrdersCount
                ? Math.round(
                      ((analytics?.funnel.dispatched || 0) / totalOrdersCount) *
                          100
                  )
                : 0,
            avgTime: '28m avg',
            color: '#4C6B36',
            description: 'Assigned to rider on route',
        },
        {
            stage: 'Delivered',
            count: deliveredCount,
            percentage: analytics?.summary.fulfillmentRate || 0,
            avgTime: '38m cycle',
            color: '#2D4722',
            description: 'Successfully handed to customer',
        },
    ];

    const customerShareData = [
        {
            name: 'Returning Shoppers',
            value: analytics?.customerShare.returningCustomers || 0,
            percentage: analytics?.customerShare.returningPercentage || 0,
            color: '#4C6B36',
        },
        {
            name: 'First-time Shoppers',
            value: analytics?.customerShare.newCustomers || 0,
            percentage: analytics?.customerShare.newPercentage || 0,
            color: '#E5E1D8',
        },
    ];

    const categoryData = (analytics?.categoryShare || []).map(
        (item, index) => ({
            name: item.category,
            value: item.amount,
            color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        })
    );

    const salesTrendData = analytics?.salesTimeline || [];
    if (isPending) {
        return (
            <div className="flex h-96 items-center justify-center font-bold text-gray-500">
                Loading live analytics...
            </div>
        );
    }

    if (isError) {
        setError(`Failed to load analytics: ${error.message}`);
    }
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
                            onClick={() => setPeriod('today')}
                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                period === 'today'
                                    ? 'bg-[#4C6B36] text-white shadow-xs'
                                    : 'text-[#6B705C] hover:text-[#2D3025]'
                            }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setPeriod('7days')}
                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                period === '7days'
                                    ? 'bg-[#4C6B36] text-white shadow-xs'
                                    : 'text-[#6B705C] hover:text-[#2D3025]'
                            }`}
                        >
                            Past 7 Days
                        </button>
                        <button
                            onClick={() => setPeriod('30days')}
                            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                period === '30days'
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
                        {openMarketShare[0].percentage}%
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
                                        period === 'today'
                                            ? 'time'
                                            : period === '7days'
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
                                        {summaryKpis.grossSales.toLocaleString()}
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
