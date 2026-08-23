import { useQuery } from '@tanstack/react-query';
import {
    BarChart3,
    Calendar,
    CalendarRange,
    CheckCircle2,
    ChevronDown,
    HandCoins,
    PackageCheck,
    PieChart as PieIcon,
    Printer,
    Store,
    UsersRound,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { adminAPI } from '../../../Library/api';
import useErrorStore from '../../../Store/errorStore';
import type {
    AnalyticsOrderItem,
    AnalyticsResponse,
    CategoryBreakdownItem,
    OrderAnalytics,
} from '../../../Types/Analytics';

const CATEGORY_COLORS: Record<string, string> = {
    Fruits: '#4C6B36',
    Vegetables: '#2D4722',
    Dairy: '#3B82F6',
    Bakery: '#D4A373',
    Household: '#8C5D30',
    'Mixed Produce': '#5B7065',
};

const getCategoryColor = (category: string) =>
    CATEGORY_COLORS[category] || '#8C877E';
interface CustomerChartItem {
    name: string;
    value: number;
    revenue: number;
    percentage: number;
    color: string;
}

interface SupplierChartItem {
    name: string;
    revenue: number;
    units: number;
    color: string;
}
export type TimeRangeOption =
    | 'today'
    | '7days'
    | '30days'
    | '90days'
    | '6months'
    | '1year'
    | 'all'
    | 'custom';
const formatCurrency = (amount: number) =>
    `KSh ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (date: string) =>
    new Date(date).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

const getPercentage = (value: number, total: number) =>
    total > 0 ? Math.round((value / total) * 100) : 0;

const funnelStages = [
    { key: 'pending', label: 'Pending', color: '#8C877E' },
    { key: 'assigned', label: 'Assigned', color: '#6B705C' },
    { key: 'pickedUp', label: 'Picked Up', color: '#A3B18A' },
    { key: 'delivered', label: 'Delivered', color: '#2D4722' },
] as const;

const getTrendData = (orders: OrderAnalytics[], period: TimeRangeOption) => {
    const trend = new Map<string, { revenue: number; orders: number }>();
    orders.forEach((order) => {
        const date = new Date(order.createdAt);
        const key =
            period === 'today'
                ? `${date.getHours().toString().padStart(2, '0')}:00`
                : date.toISOString().slice(0, 10);
        const current = trend.get(key) || { revenue: 0, orders: 0 };
        current.revenue += order.totalAmount;
        current.orders += 1;
        trend.set(key, current);
    });
    return Array.from(trend.entries())
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([label, values]) => ({ label, ...values }));
};

const getSupplierData = (orders: OrderAnalytics[]): SupplierChartItem[] => {
    const supplierMap = new Map<
        'OPEN_MARKET' | 'SUPERMARKET',
        { revenue: number; units: number }
    >([
        ['OPEN_MARKET', { revenue: 0, units: 0 }],
        ['SUPERMARKET', { revenue: 0, units: 0 }],
    ]);
    orders.forEach((order) => {
        order.items.forEach((item: AnalyticsOrderItem) => {
            const current = supplierMap.get(item.product.sourcingType);
            if (current) {
                current.revenue += item.priceAtPurchase * item.quantity;
                current.units += item.quantity;
            }
        });
    });
    return [
        {
            name: 'Open Market',
            revenue: supplierMap.get('OPEN_MARKET')?.revenue || 0,
            units: supplierMap.get('OPEN_MARKET')?.units || 0,
            color: '#4C6B36',
        },
        {
            name: 'Supermarket',
            revenue: supplierMap.get('SUPERMARKET')?.revenue || 0,
            units: supplierMap.get('SUPERMARKET')?.units || 0,
            color: '#A3B18A',
        },
    ];
};

const getCustomerData = (orders: OrderAnalytics[]) => {
    const orderCounts = new Map<string, number>();
    orders.forEach((order) => {
        orderCounts.set(
            order.user.id,
            (orderCounts.get(order.user.id) || 0) + 1
        );
    });
    const returningOrders = orders.filter(
        (order) => (orderCounts.get(order.user.id) || 0) > 1
    );
    const firstTimeOrders = orders.filter(
        (order) => (orderCounts.get(order.user.id) || 0) === 1
    );
    const totalOrders = orders.length;
    const createSegment = (
        name: string,
        segmentOrders: OrderAnalytics[],
        color: string
    ): CustomerChartItem => ({
        name,
        value: segmentOrders.length,
        revenue: segmentOrders.reduce(
            (total, order) => total + order.totalAmount,
            0
        ),
        percentage: getPercentage(segmentOrders.length, totalOrders),
        color,
    });
    return [
        createSegment('Returning Shoppers', returningOrders, '#4C6B36'),
        createSegment('First-Time Shoppers', firstTimeOrders, '#D4A373'),
    ];
};

function CustomerTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ payload: CustomerChartItem }>;
}) {
    if (!active || !payload?.length) {
        return null;
    }
    const customer = payload[0].payload;
    return (
        <div className="rounded-xl bg-[#2D3025] px-3 py-2 text-xs text-white shadow-lg">
            <p className="font-bold" style={{ color: customer.color }}>
                {customer.name}
            </p>
            <p>{customer.value} Orders</p>
            <p>{customer.percentage}% of total orders</p>
            <p>{formatCurrency(customer.revenue)}</p>
        </div>
    );
}

export default function AdminAnalytics() {
    const [period, setPeriod] = useState<TimeRangeOption>('7days');
    const [customStartDate, setCustomStartDate] = useState('2026-08-01');
    const [customEndDate, setCustomEndDate] = useState('2026-08-23');
    const [isCustomOpen, setIsCustomOpen] = useState(false);
    const rangeButtons: { id: TimeRangeOption; label: string; sub?: string }[] =
        [
            { id: 'today', label: 'Today' },
            { id: '7days', label: 'Past 7 Days' },
            { id: '30days', label: 'Past 30 Days' },
            { id: '90days', label: 'Past 90 Days' },
            { id: '6months', label: '6 Months' },
            { id: '1year', label: '1 Year' },
            { id: 'all', label: 'All Time' },
        ];
    const setError = useErrorStore((state) => state.setError);
    const {
        data: response,
        isPending,
        isError,
        error,
    } = useQuery<AnalyticsResponse, Error>({
        queryKey: ['admin-analytics', period, customStartDate, customEndDate],
        queryFn: async () => {
            const params = new URLSearchParams({ period });

            if (period === 'custom') {
                if (!customStartDate || !customEndDate) {
                    throw new Error('Please select both custom dates');
                }

                params.set('startDate', customStartDate);
                params.set('endDate', customEndDate);
            }

            const res = await adminAPI.get<AnalyticsResponse>(
                `/admin/analytics?${params.toString()}`
            );

            return res.data;
        },
        enabled:
            period !== 'custom' || Boolean(customStartDate && customEndDate),
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (isError) {
            setError(`Failed to load analytics: ${error.message}`);
        }
    }, [error, isError, setError]);

    if (
        isPending &&
        !(period === 'custom' && (!customStartDate || !customEndDate))
    ) {
        return (
            <div className="flex h-96 items-center justify-center font-bold text-gray-500">
                Loading live analytics...
            </div>
        );
    }

    if (!response) {
        return (
            <div className="p-8 text-center text-sm font-semibold text-[#6B705C]">
                Select both dates to load analytics.
            </div>
        );
    }

    const { funnel, financials, categoryBreakdown, orders } = response.data;
    const completedPercentage = getPercentage(
        funnel.delivered,
        funnel.totalOrders
    );
    const averageOrderAmount =
        funnel.totalOrders > 0
            ? financials.totalRevenue / funnel.totalOrders
            : 0;
    const trendData = getTrendData(orders, period);
    const supplierData = getSupplierData(orders);
    const customerData = getCustomerData(orders);
    const returningCustomerData = customerData[0];

    return (
        <div id="admin-analytics-section" className="space-y-6 text-left">
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-xs">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#2D3025]">
                            <BarChart3 className="h-5 w-5 text-[#4C6B36]" />
                            Order Analytics
                        </h2>
                        <p className="mt-0.5 text-sm text-[#6B705C]">
                            Revenue, order progress, categories, and recent
                            order details.
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded-xl border border-[#E5E1D8] bg-[#F0EDE4] px-3 py-1.5 text-xs font-bold text-[#4C6B36]">
                            <CalendarRange className="h-4 w-4 text-[#4C6B36]" />
                            {/*{rangeButtons.label}*/}
                        </span>

                        <button
                            onClick={() => window.print()}
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E5E1D8] bg-white px-3.5 py-1.5 text-xs font-bold text-[#2D3025] shadow-2xs transition hover:bg-[#F0EDE4]"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            Print Report
                        </button>
                    </div>
                </div>

                {/*<div className="flex shrink-0 items-center gap-2.5">
                    <div className="flex items-center rounded-xl border border-[#E5E1D8] bg-[#F0EDE4] p-1">
                        {rangeButtons.map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => {
                                    setPeriod(btn.id);
                                    setIsCustomOpen(false);
                                }}
                                className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                    period === btn.id
                                        ? 'bg-[#4C6B36] text-white shadow-xs'
                                        : 'text-[#6B705C] hover:bg-white/50 hover:text-[#2D3025]'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}

                        <button
                            onClick={() => {
                                setPeriod('custom');
                                setIsCustomOpen(!isCustomOpen);
                            }}
                            className={`flex cursor-pointer items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                period === 'custom'
                                    ? 'bg-[#4C6B36] text-white shadow-xs'
                                    : 'text-[#6B705C] hover:bg-white/50 hover:text-[#2D3025]'
                            }`}
                        >
                            <span>Custom Range</span>
                            <ChevronDown className="h-3 w-3" />
                        </button>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E5E1D8] bg-white px-3.5 py-2 text-xs font-bold text-[#2D3025] shadow-2xs transition hover:bg-[#F0EDE4]"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        Print Report
                    </button>
                </div>*/}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E1D8]/60 pt-2">
                    <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-[#E5E1D8] bg-[#F0EDE4] p-1.5 shadow-inner">
                        {rangeButtons.map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => {
                                    setPeriod(btn.id);
                                    setIsCustomOpen(false);
                                }}
                                className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                    period === btn.id
                                        ? 'bg-[#4C6B36] text-white shadow-xs'
                                        : 'text-[#6B705C] hover:bg-white/50 hover:text-[#2D3025]'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}

                        <button
                            onClick={() => {
                                setPeriod('custom');
                                setIsCustomOpen(!isCustomOpen);
                            }}
                            className={`flex cursor-pointer items-center gap-1 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                                period === 'custom'
                                    ? 'bg-[#4C6B36] text-white shadow-xs'
                                    : 'text-[#6B705C] hover:bg-white/50 hover:text-[#2D3025]'
                            }`}
                        >
                            <span>Custom Range</span>
                            <ChevronDown className="h-3 w-3" />
                        </button>
                    </div>
                </div>
                {period === 'custom' && (
                    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#E5E1D8] bg-[#FDFCF8] p-4 text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-[#2D3025]">
                            <Calendar className="h-4 w-4 text-[#4C6B36]" />
                            Select Date Boundary:
                        </span>
                        <div className="flex items-center gap-2">
                            <label className="font-semibold text-[#6B705C]">
                                From:
                            </label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) =>
                                    setCustomStartDate(e.target.value)
                                }
                                className="rounded-lg border border-[#E5E1D8] bg-white px-3 py-1.5 font-mono text-xs text-[#2D3025] outline-hidden focus:ring-1 focus:ring-[#4C6B36]"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="font-semibold text-[#6B705C]">
                                To:
                            </label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) =>
                                    setCustomEndDate(e.target.value)
                                }
                                className="rounded-lg border border-[#E5E1D8] bg-white px-3 py-1.5 font-mono text-xs text-[#2D3025] outline-hidden focus:ring-1 focus:ring-[#4C6B36]"
                            />
                        </div>
                        <span className="rounded-md border border-[#E5E1D8] bg-[#F0EDE4] px-2.5 py-1 font-bold text-[#4C6B36]">
                            {customStartDate && customEndDate
                                ? 'Active Filter Applied'
                                : 'Select both dates'}
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
                <Metric
                    label="Total Revenue"
                    value={formatCurrency(financials.totalRevenue)}
                />
                <Metric
                    label="Service Fees"
                    value={formatCurrency(financials.totalServiceFees)}
                />
                <Metric
                    label="Total Orders"
                    value={funnel.totalOrders.toLocaleString()}
                />
                <Metric
                    label="Average Order"
                    value={formatCurrency(averageOrderAmount)}
                />
                <Metric
                    label="Fulfillment Rate"
                    value={`${completedPercentage}%`}
                />
                <Metric
                    label="Repeat Shoppers"
                    value={`${returningCustomerData.percentage}%`}
                />
                <Metric
                    label="Platform Commission"
                    value={formatCurrency(financials.totalServiceFees)}
                    icon={<HandCoins className="h-3.5 w-3.5" />}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartPanel
                    title="Revenue & Order Trend"
                    description="Order volume and revenue across the selected period."
                    className="lg:col-span-2"
                    icon={<BarChart3 className="h-4 w-4" />}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={trendData}
                            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient
                                    id="analyticsRevenue"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#4C6B36"
                                        stopOpacity={0.35}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#4C6B36"
                                        stopOpacity={0.03}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                stroke="#F0EDE4"
                                strokeDasharray="3 3"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="label"
                                stroke="#8C877E"
                                fontSize={11}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#8C877E"
                                fontSize={11}
                                tickLine={false}
                            />
                            <Tooltip />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                name="Revenue"
                                stroke="#4C6B36"
                                fill="url(#analyticsRevenue)"
                                strokeWidth={2.5}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel
                    title="Category Revenue Share"
                    description="Product revenue distribution by category."
                    contentClassName="mt-4"
                    icon={<PieIcon className="h-4 w-4" />}
                >
                    <div className="h-72 w-full sm:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryBreakdown}
                                    dataKey="revenue"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={3}
                                >
                                    {categoryBreakdown.map(
                                        (
                                            category: CategoryBreakdownItem
                                            //index: number
                                        ) => (
                                            <Cell
                                                key={category.category}
                                                fill={getCategoryColor(
                                                    category.category
                                                )}
                                            />
                                        )
                                    )}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-4 border-t border-[#E5E1D8] pt-3 sm:grid-cols-2">
                        {categoryBreakdown.map(
                            (
                                category: CategoryBreakdownItem
                                //index: number
                            ) => (
                                <div
                                    key={category.category}
                                    className="min-w-0"
                                >
                                    <CategoryRow
                                        category={category}
                                        color={getCategoryColor(
                                            category.category
                                        )}
                                    />
                                </div>
                            )
                        )}
                    </div>
                </ChartPanel>

                <ChartPanel
                    title="Customer Order Mix"
                    description="Customer repeat behavior calculated from returned orders."
                    contentClassName="mt-4"
                    icon={<UsersRound className="h-4 w-4" />}
                >
                    <div className="h-72 w-full sm:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={customerData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={4}
                                >
                                    {customerData.map((customer) => (
                                        <Cell
                                            key={customer.name}
                                            fill={customer.color}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomerTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[#E5E1D8] pt-3 sm:grid-cols-2">
                        {customerData.map((customer) => (
                            <div
                                key={customer.name}
                                className="rounded-xl border border-[#E5E1D8] bg-[#FDFCF8] p-3"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-[#2D3025]">
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor: customer.color,
                                            }}
                                        />
                                        <span className="truncate">
                                            {customer.name}
                                        </span>
                                    </span>
                                    <span
                                        className="shrink-0 text-lg font-black"
                                        style={{ color: customer.color }}
                                    >
                                        {customer.percentage}%
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[11px] text-[#6B705C]">
                                    <span>{customer.value} Orders</span>
                                    <span className="font-bold text-[#2D3025]">
                                        {formatCurrency(customer.revenue)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartPanel>
            </div>

            <ChartPanel
                title="Supplier Sourcing Split"
                description="Revenue and units derived from each product sourcing type in the returned order items."
                contentClassName="mt-4"
                icon={<Store className="h-4 w-4" />}
            >
                <div className="h-72 w-full sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={supplierData}
                            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid
                                stroke="#F0EDE4"
                                strokeDasharray="3 3"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="name"
                                stroke="#8C877E"
                                fontSize={11}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#8C877E"
                                fontSize={11}
                                tickLine={false}
                            />
                            <Tooltip />
                            <Bar
                                dataKey="revenue"
                                name="Revenue"
                                radius={[8, 8, 0, 0]}
                            >
                                {supplierData.map((supplier) => (
                                    <Cell
                                        key={supplier.name}
                                        fill={supplier.color}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[#E5E1D8] pt-3 sm:grid-cols-2">
                    {supplierData.map((supplier) => {
                        const totalSupplierRevenue = supplierData.reduce(
                            (total, item) => total + item.revenue,
                            0
                        );
                        const share = getPercentage(
                            supplier.revenue,
                            totalSupplierRevenue
                        );
                        return (
                            <div
                                key={supplier.name}
                                className="rounded-xl border border-[#E5E1D8] bg-[#FDFCF8] p-3"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-2 text-xs font-bold text-[#2D3025]">
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor: supplier.color,
                                            }}
                                        />
                                        {supplier.name}
                                    </span>
                                    <span
                                        className="text-lg font-black"
                                        style={{ color: supplier.color }}
                                    >
                                        {share}%
                                    </span>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-[#6B705C]">
                                    <span>
                                        Gross Sales:
                                        <strong className="ml-1 text-[#2D3025]">
                                            {formatCurrency(supplier.revenue)}
                                        </strong>
                                    </span>
                                    <span className="text-right">
                                        Units:
                                        <strong className="ml-1 text-[#2D3025]">
                                            {supplier.units.toLocaleString()}
                                        </strong>
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ChartPanel>

            <section className="space-y-5 rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-xs sm:p-6">
                <div className="flex flex-col justify-between gap-2 border-b border-[#E5E1D8]/60 pb-3 sm:flex-row sm:items-center">
                    <div>
                        <h3 className="flex items-center gap-2 text-base font-bold text-[#2D3025]">
                            <PackageCheck className="h-5 w-5 text-[#4C6B36]" />
                            Order Fulfillment Funnel
                        </h3>
                        <p className="mt-0.5 text-xs text-[#6B705C]">
                            Counts, percentages, and volume distribution for the
                            same four fulfillment stages.
                        </p>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full border border-[#E5E1D8] bg-[#F0EDE4] px-3 py-1 text-[11px] font-bold text-[#4C6B36]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {completedPercentage}% completion efficiency
                    </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {funnelStages.map((stage) => {
                        const count = funnel[stage.key];
                        const percentage = getPercentage(
                            count,
                            funnel.totalOrders
                        );
                        return (
                            <div
                                key={stage.key}
                                className="rounded-xl border border-[#E5E1D8] bg-[#FDFCF8] p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#6B705C]">
                                        {stage.label}
                                    </span>
                                    <span className="text-2xl font-black text-[#2D3025]">
                                        {count}
                                    </span>
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5E1D8]">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: stage.color,
                                        }}
                                    />
                                </div>
                                <p className="mt-2 text-[11px] font-semibold text-[#6B705C]">
                                    {percentage}% of orders
                                </p>
                            </div>
                        );
                    })}
                </div>
                <div className="h-80 w-full rounded-xl border border-[#E5E1D8] bg-[#FDFCF8] p-3 sm:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={funnelStages.map((stage) => ({
                                stage: stage.label,
                                count: funnel[stage.key],
                            }))}
                            margin={{ top: 8, right: 24, left: 44, bottom: 8 }}
                        >
                            <CartesianGrid
                                stroke="#F0EDE4"
                                strokeDasharray="3 3"
                                horizontal={false}
                            />
                            <XAxis
                                type="number"
                                stroke="#8C877E"
                                fontSize={11}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <YAxis
                                dataKey="stage"
                                type="category"
                                stroke="#2D3025"
                                fontSize={11}
                                tickLine={false}
                                width={72}
                            />
                            <Tooltip />
                            <Bar
                                dataKey="count"
                                name="Orders"
                                radius={[0, 8, 8, 0]}
                            >
                                {funnelStages.map((stage) => (
                                    <Cell key={stage.key} fill={stage.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <SettlementTable
                totalRevenue={financials.totalRevenue}
                serviceFees={financials.totalServiceFees}
                supplierData={supplierData}
            />
        </div>
    );
}

function Metric({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: ReactNode;
}) {
    return (
        <div className="rounded-xl border border-[#E5E1D8] bg-white p-3.5 shadow-xs">
            <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[#6B705C] uppercase">
                {icon}
                {label}
            </span>
            <p className="mt-1 text-xl font-black text-[#2D3025]">{value}</p>
        </div>
    );
}

function CategoryRow({
    category,
    color,
}: {
    category: CategoryBreakdownItem;
    color: string;
}) {
    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-2 font-bold text-[#2D3025]">
                    <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                    />
                    <span className="truncate">{category.category}</span>
                </span>
                <span className="shrink-0 font-semibold text-[#6B705C]">
                    {category.percentage}% | {category.itemCount} units
                </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E5E1D8]">
                <div
                    className="h-full rounded-full"
                    style={{
                        width: `${category.percentage}%`,
                        backgroundColor: color,
                    }}
                />
            </div>
            <p className="mt-1 text-right text-[11px] font-semibold text-[#6B705C]">
                {formatCurrency(category.revenue)}
            </p>
        </div>
    );
}

function SettlementTable({
    totalRevenue,
    serviceFees,
    supplierData,
}: {
    totalRevenue: number;
    serviceFees: number;
    supplierData: SupplierChartItem[];
}) {
    const openMarketRevenue = supplierData[0]?.revenue || 0;
    const supermarketRevenue = supplierData[1]?.revenue || 0;

    return (
        <section className="space-y-4 rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-base font-bold text-[#2D3025]">
                        <BarChart3 className="h-5 w-5 text-[#4C6B36]" />
                        Daily Executive Settlement Summary
                    </h3>
                    <p className="mt-0.5 text-xs text-[#6B705C]">
                        Financial reconciliation for the selected analytics
                        period.
                    </p>
                </div>
                <span className="hidden items-center gap-1.5 rounded-xl border border-[#E5E1D8] bg-[#F0EDE4] px-3 py-1.5 text-xs font-bold text-[#4C6B36] sm:flex">
                    <CheckCircle2 className="h-4 w-4" /> Audit Status: Balanced
                </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#E5E1D8]">
                <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                    <thead>
                        <tr className="border-b border-[#E5E1D8] bg-[#F0EDE4]/70 font-semibold tracking-wider text-[#6B705C] uppercase">
                            <th className="px-4 py-3">Metric / Ledger Item</th>
                            <th className="px-4 py-3">Period Total</th>
                            <th className="px-4 py-3">Settlement Channel</th>
                            <th className="px-4 py-3">Variance / Benchmark</th>
                            <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E1D8]/60 font-medium text-[#2D3025]">
                        <SettlementRow
                            label="Gross Consumer Sales"
                            value={totalRevenue}
                            channel="Payhero M-PESA & Card Gateways"
                            benchmark="Collected from customer orders"
                            status="Collected"
                        />
                        <SettlementRow
                            label="Open Market Farm Disbursements (Soko)"
                            value={openMarketRevenue}
                            channel="Direct M-PESA Till Disbursement"
                            benchmark="Local market supply payout"
                            status="Disbursed"
                        />
                        <SettlementRow
                            label="Supermarket Merchant Settlements"
                            value={supermarketRevenue}
                            channel="EFT / Bank Automated Reconciliation"
                            benchmark="Packaged goods supply payout"
                            status="Reconciled"
                        />
                        <SettlementRow
                            label="Service Fee Surcharge"
                            value={serviceFees}
                            channel="Logistics & Cold Storage Fund"
                            benchmark="Retained for operations"
                            status="Retained"
                        />
                        <SettlementRow
                            label="Platform Net Take Rate (Commission)"
                            value={serviceFees}
                            channel="Operating Net Margin"
                            benchmark="Service fee commission"
                            status="Cleared"
                        />
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function SettlementRow({
    label,
    value,
    channel,
    benchmark,
    status,
}: {
    label: string;
    value: number;
    channel: string;
    benchmark: string;
    status: string;
}) {
    return (
        <tr>
            <td className="px-4 py-3 font-bold">{label}</td>
            <td className="px-4 py-3 font-bold">{formatCurrency(value)}</td>
            <td className="px-4 py-3 text-[#6B705C]">{channel}</td>
            <td className="px-4 py-3 text-[#6B705C]">{benchmark}</td>
            <td className="px-4 py-3 text-right">
                <span className="rounded-full border border-[#4C6B36]/30 bg-[#4C6B36]/10 px-2.5 py-1 text-[10px] font-bold text-[#2D4722]">
                    {status}
                </span>
            </td>
        </tr>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <p className="rounded-xl border border-dashed border-[#E5E1D8] bg-[#FDFCF8] p-6 text-center text-sm text-[#6B705C]">
            {text}
        </p>
    );
}

function ChartPanel({
    title,
    description,
    className = '',
    contentClassName = 'mt-4 h-72 min-h-72 w-full sm:h-80 sm:min-h-80',
    icon,
    children,
}: {
    title: string;
    description: string;
    className?: string;
    contentClassName?: string;
    icon?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section
            className={`rounded-2xl border border-[#E5E1D8] bg-white p-5 shadow-xs sm:p-6 ${className}`}
        >
            <h3 className="flex items-center gap-2 text-base font-bold text-[#2D3025]">
                {icon && <span className="text-[#4C6B36]">{icon}</span>}
                {title}
            </h3>
            <p className="mt-0.5 text-xs text-[#6B705C]">{description}</p>
            <div className={contentClassName}>{children}</div>
        </section>
    );
}
