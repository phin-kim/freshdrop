import { useQuery } from '@tanstack/react-query';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    Copy,
    PlusCircle,
    Receipt,
    Search,
    SendHorizontal,
    ShieldCheck,
    Sparkles,
    Wallet,
    XCircle,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import type {
    TransactionStatus,
    TransactionType,
} from '../../../shared/sharedTypes';
import TopUpModal from '../Components/Pages/TopupModal';
import { userApi } from '../Library/api';
import { useWalletStore } from '../Store/walletStore';
import type { WalletTransaction } from '../Types/Wallet';

interface WalletTransactionResponse {
    transactions: WalletTransaction[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export default function TabWallet() {
    const { setIsTopUpModalOpen, creditWalletRefund, withdrawFromWallet } =
        useWalletStore();
    const {
        data: walletDashboard,
        isError: isDashboardError,
        error: dashboardError,
        isFetching: isDashboardFetching,
    } = useQuery({
        queryKey: ['wallet-dashboard'],
        queryFn: async () => {
            const response = await userApi.get('/user/wallet');
            return response.data.data;
        },
    });
    const [transactionPage, setTransactionPage] = useState(1);
    const transactionLimit = 10;
    const {
        data: walletTransactionData,
        isError: isTransactionError,
        error: transactionError,
        isFetching: isTransactionFetching,
    } = useQuery({
        queryKey: ['wallet-transactions', transactionPage, transactionLimit],
        queryFn: async () => {
            const response = await userApi.get<{
                data: WalletTransactionResponse;
            }>('/user/wallet/transactions', {
                params: { page: transactionPage, limit: transactionLimit },
            });
            return response.data.data;
        },
    });
    const walletBalance = Number(walletDashboard?.balance ?? 0);
    const walletTransactions = useMemo(
        () => walletTransactionData?.transactions ?? [],
        [walletTransactionData?.transactions]
    );
    const transactionPagination = walletTransactionData?.pagination ?? {
        total: 0,
        page: transactionPage,
        limit: transactionLimit,
        totalPages: 1,
    };
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
    const [selectedTransaction, setSelectedTransaction] =
        useState<WalletTransaction | null>(null);
    const [copiedRef, setCopiedRef] = useState<string | null>(null);

    // Withdrawal modal state
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] =
        useState<boolean>(false);
    const [withdrawAmount, setWithdrawAmount] = useState<string>('500');
    const [withdrawPhone, setWithdrawPhone] = useState<string>('0712 345 678');
    const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

    // Copy reference code helper
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedRef(text);
        setTimeout(() => setCopiedRef(null), 2000);
    };

    const metrics = walletDashboard?.stats ?? {
        totalTopUps: 0,
        totalRefunds: 0,
        totalPurchases: 0,
    };

    // Filtered transactions list
    const filteredTransactions = useMemo(() => {
        return walletTransactions.filter((t) => {
            // Type Filter
            if (selectedType !== 'ALL' && t.type !== selectedType) {
                return false;
            }
            // Status Filter
            if (selectedStatus !== 'ALL' && t.status !== selectedStatus) {
                return false;
            }
            // Search Query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const refMatch =
                    t.reference?.toLowerCase().includes(q) || false;
                const descMatch =
                    t.description?.toLowerCase().includes(q) || false;
                const orderMatch =
                    t.orderId?.toLowerCase().includes(q) || false;
                const amountMatch = t.amount.toString().includes(q);
                return refMatch || descMatch || orderMatch || amountMatch;
            }
            return true;
        });
    }, [walletTransactions, selectedType, selectedStatus, searchQuery]);

    if (isDashboardFetching && !walletDashboard) {
        return <div className="p-8 text-center text-sm">Loading wallet...</div>;
    }
    if (isDashboardError) {
        return (
            <div className="p-8 text-center text-sm text-red-600">
                {dashboardError instanceof Error
                    ? dashboardError.message
                    : 'Unable to load wallet data.'}
            </div>
        );
    }

    // Demo refund generator
    const handleSimulateRefund = () => {
        const demoItems = [
            { name: 'Organic Heirloom Tomatoes', price: 350 },
            { name: 'Juja Farm Baby Spinach (250g)', price: 180 },
            { name: 'Artisan Whole Grain Sourdough', price: 420 },
            { name: 'Fresh Country Milk (1L)', price: 160 },
        ];
        const item = demoItems[Math.floor(Math.random() * demoItems.length)];
        const mockOrderNum = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
        creditWalletRefund(
            item.price,
            `Added automatically when an item is dropped from an order: ${item.name} (${mockOrderNum})`,
            mockOrderNum
        );
    };

    // Process withdrawal
    const handleProcessWithdrawal = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(withdrawAmount);
        if (isNaN(amt) || amt <= 0) return;
        if (amt > walletBalance) return;

        setIsWithdrawing(true);
        setTimeout(() => {
            withdrawFromWallet(amt, withdrawPhone);
            setIsWithdrawing(false);
            setIsWithdrawModalOpen(false);
        }, 1200);
    };

    // Helper for Type styling
    const getTypeBadge = (type: TransactionType) => {
        switch (type) {
            case 'TOPUP':
                return (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black tracking-wider text-[#006e1c] uppercase">
                        <ArrowDownLeft className="h-3 w-3 text-[#006e1c]" />
                        TOPUP
                    </span>
                );
            case 'REFUND':
                return (
                    <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-black tracking-wider text-blue-700 uppercase">
                        <Sparkles className="h-3 w-3 text-blue-600" />
                        REFUND
                    </span>
                );
            case 'PURCHASE':
                return (
                    <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-black tracking-wider text-purple-700 uppercase">
                        <ArrowUpRight className="h-3 w-3 text-purple-600" />
                        PURCHASE
                    </span>
                );
            case 'WITHDRAWAL':
                return (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-black tracking-wider text-amber-700 uppercase">
                        <SendHorizontal className="h-3 w-3 text-amber-600" />
                        WITHDRAWAL
                    </span>
                );
            default:
                return null;
        }
    };

    // Helper for Status styling
    const getStatusBadge = (status: TransactionStatus) => {
        switch (status) {
            case 'SUCCESS':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-emerald-800 uppercase">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        SUCCESS
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-amber-800 uppercase">
                        <Clock className="h-2.5 w-2.5 animate-spin" />
                        PENDING
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-red-800 uppercase">
                        <XCircle className="h-2.5 w-2.5" />
                        FAILED
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="animate-fadeIn mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
            <TopUpModal />

            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-6 md:flex-row md:items-center">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-tr from-[#006e1c] to-emerald-500 text-white shadow-md">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                FreshDrop Digital Wallet
                            </h1>
                            <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">
                                Real-time balance, instant M-PESA top-ups,
                                automated out-of-stock refunds, and ledger
                                history.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleSimulateRefund}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-100"
                        title="Simulate an item out of stock automatic wallet refund"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Simulate Refund</span>
                    </button>

                    <button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-200"
                    >
                        <SendHorizontal className="h-3.5 w-3.5" />
                        <span>Withdraw to M-Pesa</span>
                    </button>

                    <button
                        onClick={() => setIsTopUpModalOpen(true)}
                        className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#006e1c] px-5 py-2.5 text-xs font-extrabold tracking-wider text-white shadow-md transition-all hover:bg-emerald-800 hover:shadow-lg"
                    >
                        <PlusCircle className="h-4 w-4" />
                        <span>TOP UP WALLET</span>
                    </button>
                </div>
            </div>

            {/* Main Metric Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Primary Available Balance Card */}
                <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-linear-to-br from-[#006e1c] to-emerald-800 p-5 text-white shadow-xl shadow-emerald-950/10">
                    <div className="pointer-events-none absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-xl"></div>

                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-[11px] font-black tracking-widest text-emerald-200 uppercase">
                                Available Balance
                            </span>
                            <div className="mt-2 flex items-baseline gap-1">
                                <span className="text-sm font-black text-emerald-200">
                                    KSh
                                </span>
                                <span className="text-3xl font-black tracking-tight sm:text-4xl">
                                    {walletBalance.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white backdrop-blur-md">
                            <Wallet className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-3">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-100">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                            Active & Verified
                        </span>
                        <button
                            onClick={() => setIsTopUpModalOpen(true)}
                            className="flex cursor-pointer items-center gap-1 text-xs font-black text-white hover:underline"
                        >
                            Top Up <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* Total Top-Ups Credited */}
                <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase">
                                Total Top-Ups (M-Pesa)
                            </span>
                            <div className="mt-2 flex items-baseline gap-1">
                                <span className="text-xs font-bold text-slate-400">
                                    KSh
                                </span>
                                <span className="text-2xl font-black tracking-tight text-slate-900">
                                    {Number(
                                        metrics.totalTopUps
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-[#006e1c]">
                            <ArrowDownLeft className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-500">
                        <span>Direct STK Push Deposits</span>
                        <span className="font-bold text-[#006e1c]">Free</span>
                    </div>
                </div>

                {/* Total Refunds Received */}
                <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase">
                                Total Refunds Credited
                            </span>
                            <div className="mt-2 flex items-baseline gap-1">
                                <span className="text-xs font-bold text-slate-400">
                                    KSh
                                </span>
                                <span className="text-2xl font-black tracking-tight text-blue-700">
                                    {Number(
                                        metrics.totalRefunds
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700">
                            <Sparkles className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-500">
                        <span>Out-of-stock item drops</span>
                        <span className="font-bold text-blue-700">
                            Auto-settled
                        </span>
                    </div>
                </div>

                {/* Total Purchases / Spent */}
                <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-[11px] font-black tracking-wider text-slate-500 uppercase">
                                Orders Paid with Wallet
                            </span>
                            <div className="mt-2 flex items-baseline gap-1">
                                <span className="text-xs font-bold text-slate-400">
                                    KSh
                                </span>
                                <span className="text-2xl font-black tracking-tight text-purple-700">
                                    {Number(
                                        metrics.totalPurchases
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50 text-purple-700">
                            <ArrowUpRight className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-500">
                        <span>1-Click Checkout Usage</span>
                        <span className="font-bold text-purple-700">
                            Instant
                        </span>
                    </div>
                </div>
            </div>

            {/* Transaction Type Legend & DB Schema Explainer Bar */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-black tracking-wider text-slate-700 uppercase">
                    <Receipt className="h-4 w-4 text-emerald-700" />
                    <span>
                        Postgres Database Transaction Schema & Classification
                    </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="font-black text-[#006e1c]">
                                TOPUP
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                                CREDIT
                            </span>
                        </div>
                        <p className="text-[11px] leading-tight font-medium text-slate-600">
                            Added via M-Pesa STK push.
                        </p>
                    </div>

                    <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="font-black text-blue-700">
                                REFUND
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                                CREDIT
                            </span>
                        </div>
                        <p className="text-[11px] leading-tight font-medium text-slate-600">
                            Added automatically when an item is dropped from an
                            order.
                        </p>
                    </div>

                    <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="font-black text-purple-700">
                                PURCHASE
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                                DEBIT
                            </span>
                        </div>
                        <p className="text-[11px] leading-tight font-medium text-slate-600">
                            Subtracted when paying for an order using wallet
                            balance.
                        </p>
                    </div>

                    <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="font-black text-amber-700">
                                WITHDRAWAL
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                                DEBIT
                            </span>
                        </div>
                        <p className="text-[11px] leading-tight font-medium text-slate-600">
                            Payout to customer M-Pesa account.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Ledger / Transaction History Section */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
                {/* Ledger Controls Bar */}
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-4 sm:p-6 lg:flex-row lg:items-center">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900">
                            <span>Transaction History & Ledger</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                                {filteredTransactions.length} of{' '}
                                {transactionPagination.total} transactions
                                {isTransactionFetching && (
                                    <span className="ml-2 text-emerald-600">
                                        Loading...
                                    </span>
                                )}
                            </span>
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Live audit trail of all credits, refunds, order
                            payments, and payouts.
                        </p>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Search Input */}
                        <div className="relative min-w-50 flex-1 sm:flex-initial">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search reference, note..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-xs font-semibold text-slate-800 placeholder-slate-400 transition-all outline-none focus:bg-white focus:ring-2 focus:ring-[#006e1c]"
                            />
                        </div>

                        {/* Type Filter Dropdown / Pills */}
                        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
                            {[
                                'ALL',
                                'TOPUP',
                                'REFUND',
                                'PURCHASE',
                                'WITHDRAWAL',
                            ].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setSelectedType(t)}
                                    className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-[11px] font-black tracking-wider whitespace-nowrap uppercase transition-all ${
                                        selectedType === t
                                            ? 'border border-slate-200/80 bg-white font-extrabold text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* Status Filter Dropdown */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            aria-label="Filter transactions by status"
                            className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#006e1c]"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="SUCCESS">SUCCESS</option>
                            <option value="PENDING">PENDING</option>
                            <option value="FAILED">FAILED</option>
                        </select>
                    </div>
                </div>

                {/* Transactions Table / List */}
                {filteredTransactions.length === 0 ? (
                    <div className="space-y-3 px-4 py-16 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700">
                            No transactions match your filter
                        </h3>
                        <p className="mx-auto max-w-sm text-xs text-slate-500">
                            Try adjusting your search keywords, transaction
                            type, or status filters.
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedType('ALL');
                                setSelectedStatus('ALL');
                            }}
                            className="mt-2 cursor-pointer text-xs font-black text-[#006e1c] hover:underline"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[10px] font-black tracking-wider text-slate-500 uppercase">
                                    <th className="px-4 py-3.5 sm:px-6">
                                        Type & Status
                                    </th>
                                    <th className="px-4 py-3.5">
                                        Description (Note)
                                    </th>
                                    <th className="px-4 py-3.5">
                                        Reference Code
                                    </th>
                                    <th className="px-4 py-3.5">Date & Time</th>
                                    <th className="px-4 py-3.5 text-right sm:px-6">
                                        Amount (KES)
                                    </th>
                                    <th className="px-4 py-3.5 text-center">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredTransactions.map((tx) => {
                                    const isCredit =
                                        tx.type === 'TOPUP' ||
                                        tx.type === 'REFUND';
                                    return (
                                        <tr
                                            key={tx.id}
                                            className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                                            onClick={() =>
                                                setSelectedTransaction(tx)
                                            }
                                        >
                                            {/* Type & Status */}
                                            <td className="px-4 py-4 align-top sm:px-6">
                                                <div className="space-y-1.5">
                                                    <div>
                                                        {getTypeBadge(tx.type)}
                                                    </div>
                                                    <div>
                                                        {getStatusBadge(
                                                            tx.status
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Description */}
                                            <td className="max-w-xs px-4 py-4 align-top sm:max-w-md">
                                                <div className="leading-snug font-semibold text-slate-900">
                                                    {tx.description ||
                                                        'Wallet transaction'}
                                                </div>
                                                {tx.orderId && (
                                                    <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-blue-600">
                                                        <span>Order ID:</span>
                                                        <span className="py-0.2 rounded border border-blue-200 bg-blue-50 px-1.5 font-mono">
                                                            {tx.orderId}
                                                        </span>
                                                    </div>
                                                )}
                                                {tx.paymentMethod && (
                                                    <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                                                        Method:{' '}
                                                        {tx.paymentMethod}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Reference */}
                                            <td className="px-4 py-4 align-top">
                                                {tx.reference ? (
                                                    <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold text-slate-800">
                                                        <span>
                                                            {tx.reference}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopy(
                                                                    tx.reference!
                                                                );
                                                            }}
                                                            className="cursor-pointer text-slate-400 hover:text-slate-700"
                                                            title="Copy reference code"
                                                        >
                                                            {copiedRef ===
                                                            tx.reference ? (
                                                                <Check className="h-3 w-3 text-[#006e1c]" />
                                                            ) : (
                                                                <Copy className="h-3 w-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 italic">
                                                        None
                                                    </span>
                                                )}
                                            </td>

                                            {/* Timestamp */}
                                            <td className="px-4 py-4 align-top text-[11px] font-medium whitespace-nowrap text-slate-500">
                                                <div>
                                                    {new Date(
                                                        tx.createdAt
                                                    ).toLocaleDateString(
                                                        undefined,
                                                        {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        }
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {new Date(
                                                        tx.createdAt
                                                    ).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </div>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-4 py-4 text-right align-top whitespace-nowrap sm:px-6">
                                                <div
                                                    className={`text-sm font-black ${
                                                        isCredit
                                                            ? 'text-[#006e1c]'
                                                            : 'text-slate-900'
                                                    }`}
                                                >
                                                    {isCredit ? '+' : '-'}KSh{' '}
                                                    {tx.amount.toLocaleString(
                                                        undefined,
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}
                                                </div>
                                                <div className="font-mono text-[10px] text-slate-400 uppercase">
                                                    {isCredit
                                                        ? 'Credit'
                                                        : 'Debit'}
                                                </div>
                                            </td>

                                            {/* Detail Trigger */}
                                            <td className="px-4 py-4 text-center align-top">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTransaction(
                                                            tx
                                                        );
                                                    }}
                                                    className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-[#006e1c]"
                                                    title="View transaction receipt"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {isTransactionError ? (
                    <p className="border-t border-slate-100 p-4 text-center text-xs text-red-600">
                        {transactionError instanceof Error
                            ? transactionError.message
                            : 'Unable to load transactions.'}
                    </p>
                ) : (
                    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs sm:px-6">
                        <span className="font-semibold text-slate-500">
                            Page {transactionPagination.page} of{' '}
                            {Math.max(transactionPagination.totalPages, 1)}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setTransactionPage((page) =>
                                        Math.max(page - 1, 1)
                                    )
                                }
                                disabled={
                                    transactionPage === 1 ||
                                    isTransactionFetching
                                }
                                className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setTransactionPage((page) =>
                                        Math.min(
                                            page + 1,
                                            Math.max(
                                                transactionPagination.totalPages,
                                                1
                                            )
                                        )
                                    )
                                }
                                disabled={
                                    transactionPage >=
                                        transactionPagination.totalPages ||
                                    isTransactionFetching
                                }
                                className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction Detail Receipt Modal */}
            {selectedTransaction && (
                <div className="animate-fadeIn fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div
                        className="animate-scaleUp relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative bg-slate-900 p-6 text-white">
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                            >
                                ✕
                            </button>
                            <div className="flex items-center gap-2">
                                <Receipt className="h-5 w-5 text-emerald-400" />
                                <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">
                                    Transaction Receipt
                                </span>
                            </div>
                            <h3 className="mt-2 text-2xl font-black text-white">
                                {selectedTransaction.type === 'TOPUP' ||
                                selectedTransaction.type === 'REFUND'
                                    ? '+'
                                    : '-'}
                                KSh{' '}
                                {selectedTransaction.amount.toLocaleString()}
                            </h3>
                            <div className="mt-2 flex items-center gap-2">
                                {getTypeBadge(selectedTransaction.type)}
                                {getStatusBadge(selectedTransaction.status)}
                            </div>
                        </div>

                        <div className="space-y-4 p-6 text-xs font-medium text-slate-700">
                            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center justify-between border-b border-slate-200/60 py-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                        Reference
                                    </span>
                                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                                        <span>
                                            {selectedTransaction.reference ||
                                                'N/A'}
                                        </span>
                                        {selectedTransaction.reference && (
                                            <button
                                                onClick={() =>
                                                    handleCopy(
                                                        selectedTransaction.reference!
                                                    )
                                                }
                                                className="cursor-pointer text-slate-400 hover:text-slate-700"
                                            >
                                                {copiedRef ===
                                                selectedTransaction.reference ? (
                                                    <Check className="h-3 w-3 text-[#006e1c]" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start justify-between border-b border-slate-200/60 py-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                        Description
                                    </span>
                                    <span className="max-w-50 text-right font-semibold text-slate-800">
                                        {selectedTransaction.description}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between border-b border-slate-200/60 py-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                        Timestamp
                                    </span>
                                    <span className="font-mono text-slate-700">
                                        {new Date(
                                            selectedTransaction.createdAt
                                        ).toLocaleString()}
                                    </span>
                                </div>

                                {selectedTransaction.orderId && (
                                    <div className="flex items-center justify-between border-b border-slate-200/60 py-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                                            Linked Order
                                        </span>
                                        <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono font-bold text-blue-700">
                                            {selectedTransaction.orderId}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                        Database ID
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-400">
                                        {selectedTransaction.id}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-800">
                                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" />
                                <span>
                                    Audited on Juja Farm ledger database.
                                </span>
                            </div>

                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="w-full cursor-pointer rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-slate-800"
                            >
                                Close Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Withdraw Modal */}
            {isWithdrawModalOpen && (
                <div className="animate-fadeIn fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div
                        className="animate-scaleUp relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative bg-linear-to-r from-amber-600 to-amber-700 p-6 text-white">
                            <button
                                onClick={() => setIsWithdrawModalOpen(false)}
                                className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                            >
                                ✕
                            </button>
                            <div className="flex items-center gap-2">
                                <SendHorizontal className="h-5 w-5" />
                                <span className="text-xs font-black tracking-widest text-amber-200 uppercase">
                                    M-PESA B2C Payout
                                </span>
                            </div>
                            <h3 className="mt-1 text-xl font-black text-white">
                                Withdraw Funds
                            </h3>
                            <p className="mt-0.5 text-xs text-amber-100">
                                Transfer available wallet balance directly to
                                your M-PESA number.
                            </p>
                        </div>

                        <form
                            onSubmit={handleProcessWithdrawal}
                            className="space-y-4 p-6 text-xs"
                        >
                            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 font-bold text-amber-900">
                                <span>Available to Withdraw:</span>
                                <span className="text-sm font-black text-amber-950">
                                    KSh {walletBalance.toLocaleString()}
                                </span>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                                    Amount to Withdraw (KSh)
                                </label>
                                <input
                                    type="number"
                                    min="50"
                                    max={walletBalance}
                                    value={withdrawAmount}
                                    onChange={(e) =>
                                        setWithdrawAmount(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-extrabold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                                    Recipient M-PESA Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={withdrawPhone}
                                    onChange={(e) =>
                                        setWithdrawPhone(e.target.value)
                                    }
                                    placeholder="07XX XXX XXX"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsWithdrawModalOpen(false)
                                    }
                                    className="flex-1 cursor-pointer rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        isWithdrawing ||
                                        parseFloat(withdrawAmount) >
                                            walletBalance ||
                                        parseFloat(withdrawAmount) <= 0
                                    }
                                    className="flex-1 cursor-pointer rounded-xl bg-amber-600 py-3 font-extrabold text-white shadow-md transition-all hover:bg-amber-700 disabled:bg-slate-300"
                                >
                                    {isWithdrawing
                                        ? 'Processing...'
                                        : 'Confirm Payout'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
