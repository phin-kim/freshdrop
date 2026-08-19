export interface AnalyticsSummary {
    grossSales: number;
    totalOrders: number;
    averageOrderAmount: number;
    platformCommission: number;
    fulfillmentRate: number;
}

export interface CustomerShare {
    newCustomers: number;
    returningCustomers: number;
    newPercentage: number;
    returningPercentage: number;
}

export interface CategoryShareItem {
    category: string;
    amount: number;
}

export interface SupplierMetric {
    amount: number;
    units: number;
}

export interface SupplierSplit {
    openmarket: SupplierMetric;
    supermarket: SupplierMetric;
}

export interface FunnelData {
    pending: number;
    accepted: number;
    packed: number;
    dispatched: number;
    delivered: number;
}
export interface SalesTimeline {
    time: string;
    day: string;
    week: string;
    revenue: number;
    orders: number;
}

export interface AnalyticsPayload {
    summary: AnalyticsSummary;
    customerShare: CustomerShare;
    categoryShare: CategoryShareItem[];
    supplierSplit: SupplierSplit;
    funnel: FunnelData;
    salesTimeline: SalesTimeline[];
}

export interface AnalyticsResponse {
    success: boolean;
    data: AnalyticsPayload;
}
