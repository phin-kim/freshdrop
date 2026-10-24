import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Building2,
    Check,
    CheckCircle2,
    Copy,
    CreditCard,
    Receipt,
    RotateCcw,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Store,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

import { useStore } from '../store';
import { Order, OrderTransaction } from '../types';

export type PaymentChannel = 'paybill' | 'pochi_send' | 'till';

interface AllowTransactionModalProps {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
    defaultAmount?: number;
}

export default function AllowTransactionModal({
    order,
    isOpen,
    onClose,
    defaultAmount,
}: AllowTransactionModalProps) {
    const { recordOrderTransaction, addToast } = useStore();

    const [paymentChannel, setPaymentChannel] =
        useState<PaymentChannel>('paybill');

    // Form fields
    const [businessNumber, setBusinessNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [tillNumber, setTillNumber] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [amount, setAmount] = useState<string>(
        defaultAmount
            ? defaultAmount.toString()
            : (order.total || 850).toString()
    );
    const [notes, setNotes] = useState('');

    // Processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState<
        'idle' | 'stk_prompt' | 'completed'
    >('idle');
    const [lastTransaction, setLastTransaction] =
        useState<OrderTransaction | null>(null);
    const [copiedRef, setCopiedRef] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    // Preset demo values for quick testing
    const handleQuickPreset = (type: PaymentChannel) => {
        setPaymentChannel(type);
        setErrorMessage('');
        if (type === 'paybill') {
            setBusinessNumber('247247');
            setAccountName(`SOKO-${order.id.slice(-4)}`);
            setNotes('Farm produce collection from Juja Soko');
            addToast('Preset: Equity/Soko Paybill 247247 loaded', 'info');
        } else if (type === 'till') {
            setTillNumber('5829104');
            setNotes('Payment to Mama Mboga Farm Stall #12');
            addToast('Preset: Buy Goods Till 5829104 loaded', 'info');
        } else if (type === 'pochi_send') {
            setMobileNumber('0712345678');
            setRecipientName('Agnes Wambui (Farmer)');
            setNotes('Direct payout for fresh spinach & avocados');
            addToast('Preset: Pochi la Biashara 0712345678 loaded', 'info');
        }
    };

    const handlePay = (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage('');

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setErrorMessage('Please enter a valid amount greater than KSh 0.');
            return;
        }

        if (paymentChannel === 'paybill') {
            if (!businessNumber.trim() || businessNumber.trim().length < 4) {
                setErrorMessage(
                    'Please enter a valid Paybill Business Number (minimum 4 digits).'
                );
                return;
            }
            if (!accountName.trim()) {
                setErrorMessage(
                    'Please enter the Account Name or Reference Number.'
                );
                return;
            }
        } else if (paymentChannel === 'till') {
            if (!tillNumber.trim() || tillNumber.trim().length < 4) {
                setErrorMessage(
                    'Please enter a valid Till Number (minimum 4 digits).'
                );
                return;
            }
        } else if (paymentChannel === 'pochi_send') {
            const cleanMobile = mobileNumber.replace(/\D/g, '');
            if (cleanMobile.length < 9) {
                setErrorMessage(
                    'Please enter a valid Kenyan Mobile Number (e.g., 0712345678).'
                );
                return;
            }
        }

        setIsProcessing(true);
        setProcessingStep('stk_prompt');

        // Simulate STK Push & M-PESA settlement
        setTimeout(() => {
            const tx = recordOrderTransaction(order.id, {
                type: paymentChannel,
                amount: parsedAmount,
                businessNumber:
                    paymentChannel === 'paybill'
                        ? businessNumber.trim()
                        : undefined,
                accountName:
                    paymentChannel === 'paybill'
                        ? accountName.trim()
                        : undefined,
                tillNumber:
                    paymentChannel === 'till' ? tillNumber.trim() : undefined,
                mobileNumber:
                    paymentChannel === 'pochi_send'
                        ? mobileNumber.trim()
                        : undefined,
                recipientName:
                    paymentChannel === 'pochi_send'
                        ? recipientName.trim()
                        : undefined,
                notes: notes.trim() || undefined,
                status: 'Completed',
            });

            setIsProcessing(false);
            setProcessingStep('completed');
            setLastTransaction(tx);
        }, 1200);
    };

    const handleResetForm = () => {
        setProcessingStep('idle');
        setLastTransaction(null);
        setErrorMessage('');
    };

    const handleCopyRef = (ref: string) => {
        navigator.clipboard.writeText(ref);
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
        addToast(`Transaction reference "${ref}" copied!`, 'info');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/60 p-4 backdrop-blur-xs">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative my-6 w-full max-w-xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-[#006e1c] to-[#1e824c] px-6 py-5 text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-xs">
                            <CreditCard className="h-5 w-5 text-emerald-200" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black tracking-tight">
                                    Allow Transaction
                                </h3>
                                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-100 uppercase">
                                    M-PESA / Vendor Settlement
                                </span>
                            </div>
                            <p className="text-xs text-emerald-100/80">
                                Order #{order.id} •{' '}
                                {order.customerName || 'Customer'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {processingStep === 'completed' && lastTransaction ? (
                            /* Transaction Success View */
                            <motion.div
                                key="completed"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6 py-2 text-center"
                            >
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 shadow-inner">
                                    <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
                                </div>

                                <div>
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold tracking-wider text-emerald-800 uppercase">
                                        Payment Dispatched
                                    </span>
                                    <h4 className="mt-2 text-2xl font-black text-stone-900">
                                        KSh{' '}
                                        {lastTransaction.amount.toLocaleString()}{' '}
                                        Sent Successfully!
                                    </h4>
                                    <p className="mt-1 text-xs text-stone-500">
                                        The transaction was verified and debited
                                        to the merchant / supplier.
                                    </p>
                                </div>

                                {/* Receipt Card */}
                                <div className="space-y-2.5 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left text-xs">
                                    <div className="flex items-center justify-between border-b border-stone-200/80 pb-2 font-mono">
                                        <span className="text-stone-500">
                                            M-PESA Ref:
                                        </span>
                                        <button
                                            onClick={() =>
                                                handleCopyRef(
                                                    lastTransaction.referenceCode
                                                )
                                            }
                                            className="flex cursor-pointer items-center gap-1.5 rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 transition hover:bg-emerald-100"
                                            title="Copy Reference"
                                        >
                                            <span>
                                                {lastTransaction.referenceCode}
                                            </span>
                                            {copiedRef ? (
                                                <Check
                                                    size={12}
                                                    className="text-emerald-600"
                                                />
                                            ) : (
                                                <Copy size={12} />
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-stone-500">
                                            Channel Type:
                                        </span>
                                        <span className="font-bold text-stone-900 uppercase">
                                            {lastTransaction.type === 'paybill'
                                                ? 'Paybill'
                                                : lastTransaction.type ===
                                                    'till'
                                                  ? 'Buy Goods / Till'
                                                  : 'Pochi la Biashara / Send Money'}
                                        </span>
                                    </div>

                                    {lastTransaction.businessNumber && (
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">
                                                Business No:
                                            </span>
                                            <span className="font-mono font-bold text-stone-900">
                                                {lastTransaction.businessNumber}
                                            </span>
                                        </div>
                                    )}

                                    {lastTransaction.accountName && (
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">
                                                Account Name:
                                            </span>
                                            <span className="font-bold text-stone-900">
                                                {lastTransaction.accountName}
                                            </span>
                                        </div>
                                    )}

                                    {lastTransaction.tillNumber && (
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">
                                                Till Number:
                                            </span>
                                            <span className="font-mono font-bold text-stone-900">
                                                {lastTransaction.tillNumber}
                                            </span>
                                        </div>
                                    )}

                                    {lastTransaction.mobileNumber && (
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">
                                                Recipient Phone:
                                            </span>
                                            <span className="font-mono font-bold text-stone-900">
                                                {lastTransaction.mobileNumber}
                                            </span>
                                        </div>
                                    )}

                                    {lastTransaction.recipientName && (
                                        <div className="flex justify-between">
                                            <span className="text-stone-500">
                                                Recipient Name:
                                            </span>
                                            <span className="font-bold text-stone-900">
                                                {lastTransaction.recipientName}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span className="text-stone-500">
                                            Order ID:
                                        </span>
                                        <span className="font-mono text-stone-700">
                                            #{order.id}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-stone-500">
                                            Timestamp:
                                        </span>
                                        <span className="text-stone-700">
                                            {new Date(
                                                lastTransaction.timestamp
                                            ).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleResetForm}
                                        className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-stone-100 px-4 py-3 text-xs font-bold text-stone-800 transition hover:bg-stone-200"
                                    >
                                        <RotateCcw size={14} />
                                        <span>Another Transaction</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#006e1c] px-4 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#005313]"
                                    >
                                        <span>Done & Close</span>
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            /* Transaction Entry Form */
                            <motion.div
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-5"
                            >
                                {/* Channel Selector: Paybill, Pochi/Send, Till */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="block text-[11px] font-extrabold tracking-wider text-stone-600 uppercase">
                                            Select Transaction Channel:
                                        </label>
                                        <span className="text-[10px] font-medium text-stone-400">
                                            Kenyan Mobile Money
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-stone-100 p-1.5">
                                        {/* 1. Paybill */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPaymentChannel('paybill');
                                                setErrorMessage('');
                                            }}
                                            className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition sm:flex-row ${
                                                paymentChannel === 'paybill'
                                                    ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-600/20'
                                                    : 'text-stone-600 hover:text-stone-900'
                                            }`}
                                        >
                                            <Building2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                            <span>Paybill</span>
                                        </button>

                                        {/* 2. Pochi la Biashara / Send */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPaymentChannel('pochi_send');
                                                setErrorMessage('');
                                            }}
                                            className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition sm:flex-row ${
                                                paymentChannel === 'pochi_send'
                                                    ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-600/20'
                                                    : 'text-stone-600 hover:text-stone-900'
                                            }`}
                                        >
                                            <Smartphone className="h-4 w-4 shrink-0 text-emerald-600" />
                                            <span className="truncate">
                                                Pochi / Send
                                            </span>
                                        </button>

                                        {/* 3. Till */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPaymentChannel('till');
                                                setErrorMessage('');
                                            }}
                                            className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition sm:flex-row ${
                                                paymentChannel === 'till'
                                                    ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-600/20'
                                                    : 'text-stone-600 hover:text-stone-900'
                                            }`}
                                        >
                                            <Store className="h-4 w-4 shrink-0 text-emerald-600" />
                                            <span>Till</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Auto-Fill Preset */}
                                <div className="flex items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2 text-xs">
                                    <div className="flex items-center gap-1.5 font-medium text-emerald-900">
                                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                                        <span>
                                            Quick-fill demo vendor credentials:
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleQuickPreset(paymentChannel)
                                        }
                                        className="cursor-pointer text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950"
                                    >
                                        Auto-Fill Preset
                                    </button>
                                </div>

                                {/* Dynamic Form based on Channel */}
                                <form
                                    onSubmit={handlePay}
                                    className="space-y-4"
                                >
                                    {/* OPTION 1: PAYBILL */}
                                    {paymentChannel === 'paybill' && (
                                        <motion.div
                                            key="paybill-fields"
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-3"
                                        >
                                            <div className="space-y-1">
                                                <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                                                    Business Number (Paybill)
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-stone-400">
                                                        <Building2 size={16} />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={businessNumber}
                                                        onChange={(e) =>
                                                            setBusinessNumber(
                                                                e.target.value.replace(
                                                                    /\D/g,
                                                                    ''
                                                                )
                                                            )
                                                        }
                                                        placeholder="e.g. 247247 or 522522"
                                                        className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pr-4 pl-10 font-mono text-sm font-bold text-stone-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                                                    Account Name / Reference
                                                    Number
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-stone-400">
                                                        <Receipt size={16} />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={accountName}
                                                        onChange={(e) =>
                                                            setAccountName(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="e.g. SOKO-042 or Vendor Name"
                                                        className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pr-4 pl-10 text-sm font-semibold text-stone-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* OPTION 2: TILL */}
                                    {paymentChannel === 'till' && (
                                        <motion.div
                                            key="till-fields"
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-3"
                                        >
                                            <div className="space-y-1">
                                                <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                                                    Enter Till Number (Buy Goods
                                                    & Services)
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-stone-400">
                                                        <Store size={16} />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={tillNumber}
                                                        onChange={(e) =>
                                                            setTillNumber(
                                                                e.target.value.replace(
                                                                    /\D/g,
                                                                    ''
                                                                )
                                                            )
                                                        }
                                                        placeholder="e.g. 5829104"
                                                        className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pr-4 pl-10 font-mono text-sm font-bold text-stone-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* OPTION 3: POCHI LA BIASHARA / SEND MONEY */}
                                    {paymentChannel === 'pochi_send' && (
                                        <motion.div
                                            key="pochi-fields"
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-3"
                                        >
                                            <div className="space-y-1">
                                                <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                                                    Enter Mobile / Phone Number
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-stone-400">
                                                        <Smartphone size={16} />
                                                    </span>
                                                    <input
                                                        type="tel"
                                                        value={mobileNumber}
                                                        onChange={(e) =>
                                                            setMobileNumber(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="e.g. 0712 345 678 or 2547..."
                                                        className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pr-4 pl-10 font-mono text-sm font-bold text-stone-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                                                    Recipient Name{' '}
                                                    <span className="font-normal text-stone-400">
                                                        (Optional)
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={recipientName}
                                                    onChange={(e) =>
                                                        setRecipientName(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. Agnes Wambui (Juja Farm Stall)"
                                                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2 text-xs font-medium text-stone-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600"
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Common Amount Field */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                                                Transaction Amount (KSh)
                                            </label>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setAmount(
                                                            (
                                                                order.subtotal ||
                                                                750
                                                            ).toString()
                                                        )
                                                    }
                                                    className="cursor-pointer rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 transition hover:bg-emerald-50"
                                                >
                                                    Subtotal (KSh{' '}
                                                    {order.subtotal?.toLocaleString()}
                                                    )
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setAmount(
                                                            (
                                                                order.total ||
                                                                850
                                                            ).toString()
                                                        )
                                                    }
                                                    className="cursor-pointer rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 transition hover:bg-emerald-50"
                                                >
                                                    Total (KSh{' '}
                                                    {order.total?.toLocaleString()}
                                                    )
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-stone-500">
                                                KSh
                                            </span>
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={amount}
                                                onChange={(e) =>
                                                    setAmount(e.target.value)
                                                }
                                                placeholder="0.00"
                                                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pr-4 pl-12 font-mono text-base font-black text-stone-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Optional Note / Purpose */}
                                    <div className="space-y-1">
                                        <label className="block text-[11px] font-bold tracking-wider text-stone-600 uppercase">
                                            Transaction Note / Memo{' '}
                                            <span className="font-normal text-stone-400">
                                                (Optional)
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={notes}
                                            onChange={(e) =>
                                                setNotes(e.target.value)
                                            }
                                            placeholder="e.g. Soko market fresh greens collection"
                                            className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2 text-xs font-medium text-stone-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600"
                                        />
                                    </div>

                                    {/* Error display */}
                                    {errorMessage && (
                                        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-600">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            <span>{errorMessage}</span>
                                        </div>
                                    )}

                                    {/* Primary Pay Action Button */}
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isProcessing}
                                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#006e1c] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#005313] active:scale-95 disabled:bg-stone-300 disabled:text-stone-500"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    <span>
                                                        Processing M-PESA STK
                                                        Push...
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldCheck size={18} />
                                                    <span>
                                                        Pay KSh{' '}
                                                        {parseFloat(
                                                            amount || '0'
                                                        ).toLocaleString()}{' '}
                                                        via{' '}
                                                        {paymentChannel ===
                                                        'paybill'
                                                            ? 'Paybill'
                                                            : paymentChannel ===
                                                                'till'
                                                              ? 'Till'
                                                              : 'Pochi / Send'}
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>

                                {/* Past Transactions for this Order */}
                                {order.transactions &&
                                    order.transactions.length > 0 && (
                                        <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
                                            <span className="block text-[11px] font-extrabold tracking-wider text-stone-500 uppercase">
                                                Prior Order Transactions (
                                                {order.transactions.length})
                                            </span>
                                            <div className="max-h-32 space-y-1.5 overflow-y-auto pr-1">
                                                {order.transactions.map(
                                                    (tx) => (
                                                        <div
                                                            key={tx.id}
                                                            className="flex items-center justify-between rounded-lg border border-stone-200/60 bg-stone-50 p-2 text-xs"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-[11px] font-bold text-emerald-800">
                                                                    {
                                                                        tx.referenceCode
                                                                    }
                                                                </span>
                                                                <span className="text-[10px] text-stone-500 uppercase">
                                                                    • {tx.type}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-stone-900">
                                                                    KSh{' '}
                                                                    {tx.amount.toLocaleString()}
                                                                </span>
                                                                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                                                                    Paid
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
