import { useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Loader2,
    ShieldCheck,
    Smartphone,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { useWalletStore } from '../../Store/walletStore';

interface TopUpModalProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function TopUpModal({ isOpen, onClose }: TopUpModalProps) {
    const queryClient = useQueryClient();
    const {
        isTopUpModalOpen,
        setIsTopUpModalOpen,
        topUpWallet,
        checkTopUpStatus,
        walletBalance,
        user,
    } = useWalletStore();

    const showModal = isOpen !== undefined ? isOpen : isTopUpModalOpen;
    const handleClose = () => {
        if (onClose) onClose();
        else setIsTopUpModalOpen(false);
        resetState();
    };

    const [amount, setAmount] = useState<number>(500);
    const [customAmount, setCustomAmount] = useState<string>('500');
    const [phone, setPhone] = useState<string>(
        user?.email?.includes('@') ? '0712 345 678' : '0722 000 000'
    );
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [completedCode, setCompletedCode] = useState<string | null>(null);
    const [pendingReference, setPendingReference] = useState<string | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);

    const resetState = () => {
        setIsProcessing(false);
        setCompletedCode(null);
        setPendingReference(null);
        setError(null);
    };

    useEffect(() => {
        if (!pendingReference || completedCode) return;

        let attempts = 0;
        const pollStatus = async () => {
            attempts += 1;
            try {
                const result = await checkTopUpStatus(pendingReference);
                if (result.status === 'SUCCESS') {
                    setCompletedCode(result.reference || pendingReference);
                    setPendingReference(null);
                    await queryClient.invalidateQueries({
                        queryKey: ['wallet-dashboard'],
                    });
                    await queryClient.invalidateQueries({
                        queryKey: ['wallet-transactions'],
                    });
                    return;
                }
                if (result.status === 'FAILED') {
                    setError('Wallet top-up failed or was cancelled.');
                    setPendingReference(null);
                    return;
                }
            } catch {
                if (attempts >= 20) {
                    setError(
                        'Unable to confirm top-up status. Please refresh your wallet.'
                    );
                    setPendingReference(null);
                }
            }
        };

        void pollStatus();
        const intervalId = window.setInterval(() => {
            if (attempts >= 20) {
                window.clearInterval(intervalId);
                return;
            }
            void pollStatus();
        }, 3000);

        return () => window.clearInterval(intervalId);
    }, [checkTopUpStatus, completedCode, pendingReference, queryClient]);

    const presetAmounts = [200, 500, 1000, 2500, 5000];

    const handleSelectPreset = (val: number) => {
        setAmount(val);
        setCustomAmount(val.toString());
        setError(null);
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setCustomAmount(val);
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed)) {
            setAmount(parsed);
        } else {
            setAmount(0);
        }
        setError(null);
    };

    const handleTriggerTopUp = () => {
        if (amount < 1) {
            setError('Minimum top-up amount is KSh 50');
            return;
        }
        if (amount > 150000) {
            setError('Maximum single transaction limit is KSh 150,000');
            return;
        }
        if (!phone || phone.trim().length < 9) {
            setError('Please enter a valid M-PESA phone number');
            return;
        }

        setError(null);
        setIsProcessing(true);

        void (async () => {
            try {
                const res = await topUpWallet(amount, phone, 'M-PESA');
                if (res.success && res.transaction?.reference) {
                    setPendingReference(res.transaction.reference);
                }
            } catch {
                setError('Unable to start wallet top-up. Please try again.');
            }
            setIsProcessing(false);
        })();
    };

    if (!showModal) return null;

    return (
        <div className="animate-fadeIn fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div
                className="animate-scaleUp relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="relative bg-linear-to-r from-[#006e1c] to-emerald-700 p-6 text-white">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-white shadow-inner backdrop-blur-md">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black tracking-widest text-emerald-200 uppercase">
                                M-PESA Express
                            </span>
                            <h2 className="text-xl leading-tight font-black tracking-tight">
                                Top Up Wallet
                            </h2>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-xs font-semibold text-emerald-100">
                        <span>Current Available Balance:</span>
                        <span className="text-base font-black text-white">
                            KSh {walletBalance.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="space-y-6 p-6">
                    {completedCode ? (
                        /* Success View */
                        <div className="space-y-4 py-4 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-[#006e1c] shadow-sm">
                                <CheckCircle2 className="h-10 w-10 animate-bounce" />
                            </div>
                            <div>
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black tracking-wider text-emerald-800 uppercase">
                                    TOPUP SUCCESSFUL
                                </span>
                                <h3 className="mt-2 text-2xl font-black text-slate-800">
                                    +KSh {amount.toLocaleString()}
                                </h3>
                                <p className="mt-1 text-xs font-medium text-slate-500">
                                    Funds have been instantly credited to your
                                    FreshDrop Wallet.
                                </p>
                            </div>

                            <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-left font-mono text-xs">
                                <div className="flex justify-between text-slate-600">
                                    <span>M-PESA Ref:</span>
                                    <span className="font-bold text-slate-900">
                                        {completedCode}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Phone:</span>
                                    <span className="font-semibold text-slate-800">
                                        {phone}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>New Balance:</span>
                                    <span className="font-bold text-[#006e1c]">
                                        KSh {walletBalance.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full cursor-pointer rounded-xl bg-[#006e1c] px-4 py-3.5 text-sm font-extrabold text-white shadow-md transition-all hover:bg-emerald-800"
                            >
                                Done
                            </button>
                        </div>
                    ) : isProcessing || pendingReference ? (
                        /* STK Push Waiting Simulation View */
                        <div className="space-y-4 py-8 text-center">
                            <div className="relative mx-auto h-16 w-16">
                                <div className="absolute inset-0 animate-ping rounded-full border-4 border-emerald-200 opacity-75"></div>
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#006e1c] bg-emerald-50 text-[#006e1c]">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800">
                                    STK Push Sent
                                </h3>
                                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-600">
                                    A payment prompt for{' '}
                                    <strong className="text-slate-900">
                                        KSh {amount.toLocaleString()}
                                    </strong>{' '}
                                    has been sent to{' '}
                                    <strong className="text-slate-900">
                                        {phone}
                                    </strong>
                                    . Please enter your M-PESA PIN to complete.
                                </p>
                            </div>

                            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-[11px] text-amber-900">
                                <ShieldCheck className="h-4 w-4 shrink-0 text-amber-700" />
                                <span>
                                    Safely secured by Payhero M-PESA Daraja
                                    gateway.
                                </span>
                            </div>
                        </div>
                    ) : (
                        /* Form View */
                        <div className="space-y-5">
                            {/* Preset Amounts */}
                            <div>
                                <label className="mb-2 block text-xs font-black tracking-wider text-slate-700 uppercase">
                                    Select Top-Up Amount
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {presetAmounts.map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() =>
                                                handleSelectPreset(val)
                                            }
                                            className={`cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
                                                amount === val &&
                                                customAmount === val.toString()
                                                    ? 'border-[#006e1c] bg-[#006e1c] text-white shadow-sm ring-2 ring-emerald-300/50'
                                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                                            }`}
                                        >
                                            +{val.toLocaleString()}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCustomAmount('');
                                            setAmount(0);
                                        }}
                                        className={`cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
                                            !presetAmounts.includes(amount) ||
                                            customAmount === ''
                                                ? 'border-[#006e1c] bg-[#006e1c] text-white'
                                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        Custom
                                    </button>
                                </div>
                            </div>

                            {/* Custom Input */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                                    Amount to Credit (KSh)
                                </label>
                                <div className="relative">
                                    <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-black text-slate-400">
                                        KSh
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={customAmount}
                                        onChange={handleCustomChange}
                                        placeholder="e.g. 1500"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-12 text-base font-extrabold text-slate-900 transition-all outline-none focus:border-transparent focus:bg-white focus:ring-2 focus:ring-[#006e1c]"
                                    />
                                </div>
                            </div>

                            {/* M-PESA Phone Number */}
                            <div>
                                <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-600">
                                    <span>M-PESA Phone Number</span>
                                    <span className="text-[10px] font-semibold text-emerald-700">
                                        Safaricom Sim Toolkit
                                    </span>
                                </label>
                                <div className="relative">
                                    <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400">
                                        <Smartphone className="h-4 w-4" />
                                    </span>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) =>
                                            setPhone(e.target.value)
                                        }
                                        placeholder="07XX XXX XXX"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-sm font-semibold text-slate-900 transition-all outline-none focus:border-transparent focus:bg-white focus:ring-2 focus:ring-[#006e1c]"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                type="button"
                                onClick={handleTriggerTopUp}
                                disabled={amount < 1} //50
                                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#006e1c] px-5 py-3.5 text-sm font-black text-white shadow-md transition-all hover:bg-emerald-800 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                <span>
                                    Request STK Push (KSh{' '}
                                    {amount > 0 ? amount.toLocaleString() : '0'}
                                    )
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </button>

                            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                Zero transaction fees on FreshDrop Wallet
                                top-ups.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
