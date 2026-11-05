import {
    ArrowLeft,
    CheckCircle,
    KeyRound,
    Mail,
    RefreshCw,
    ShieldCheck,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import useErrorStore from '../../Store/errorStore';
import useSuccessStore from '../../Store/successStore';
import handleApiError from '../../Utils/apiError';
import { authClient } from '../../lib/auth-client';

// Adjust path if needed

export default function VerifyOtp() {
    const navigate = useNavigate();
    const { data: session } = authClient.useSession();
    const setSuccess = useSuccessStore((state) => state.setSuccess);
    // Get the email from the active session
    const targetEmail = session?.user?.email || 'your email';

    const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(60);
    const setError = useErrorStore((state) => state.setError);
    // 60-second cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) {
            return;
        }
        const timer = setInterval(() => {
            setResendCooldown((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [resendCooldown]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleDigitChange = (value: string, index: number) => {
        setError(null);
        const clean = value.replace(/\D/g, '');
        if (!clean && value !== '') return;

        const nextDigits = [...digits];
        nextDigits[index] = clean.slice(-1);
        setDigits(nextDigits);

        if (clean && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        index: number
    ) => {
        if (e.key === 'Backspace') {
            if (!digits[index] && index > 0) {
                const nextDigits = [...digits];
                nextDigits[index - 1] = '';
                setDigits(nextDigits);
                inputRefs.current[index - 1]?.focus();
            } else {
                const nextDigits = [...digits];
                nextDigits[index] = '';
                setDigits(nextDigits);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        setError(null);
        const pasted = e.clipboardData.getData('text').trim();
        const numbersOnly = pasted.replace(/\D/g, '').slice(0, 6);

        if (numbersOnly.length > 0) {
            const nextDigits = [...digits];
            for (let i = 0; i < 6; i++) {
                nextDigits[i] = numbersOnly[i] || '';
            }
            setDigits(nextDigits);
            const targetIndex = Math.min(numbersOnly.length, 5);
            inputRefs.current[targetIndex]?.focus();
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;

        try {
            await authClient.emailOtp.sendVerificationOtp({
                email: targetEmail,
                type: 'email-verification',
            });
            setDigits(Array(6).fill(''));
            setError(null);
            setResendCooldown(60);
            inputRefs.current[0]?.focus();
            setSuccess('New code successfully sent yo your email');
        } catch (error) {
            handleApiError(error, setError);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullCode = digits.join('').trim();

        if (fullCode.length < 6) {
            setError('Please enter the full 6-digit verification code.');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            // 🚨 THE REAL INTEGRATION 🚨
            const { error } = await authClient.emailOtp.verifyEmail({
                email: targetEmail,
                otp: fullCode,
            });

            if (error) {
                setError(error.message || 'Invalid or expired code.');
            } else {
                // Success! They are now verified.
                // Navigate to home (or dashboard)
                navigate('/', { replace: true });
            }
        } catch (error) {
            handleApiError(error, setError);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isComplete = digits.every((d) => d !== '');

    return (
        <main className="flex min-h-[calc(100vh-140px)] flex-grow items-center justify-center px-4 py-8 md:p-12">
            <div className="bg-surface-container-lowest border-outline-variant/30 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border bg-white shadow-xl lg:grid-cols-2">
                {/* Visual Brand Panel on Left */}
                <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-[#d9e6da] p-12 text-center lg:flex">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-10"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 2px 2px, #006e1c 1px, transparent 0)',
                            backgroundSize: '24px 24px',
                        }}
                    />

                    <div className="animate-fade-in relative z-10">
                        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-emerald-200/60 bg-white/90 text-[#006e1c] shadow-sm">
                            <KeyRound size={48} className="animate-pulse" />
                        </div>
                        <img
                            alt="FreshDrop Fresh Organic Harvest"
                            className="mx-auto mb-8 h-auto w-full max-w-xs rounded-lg object-cover shadow-sm"
                            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"
                        />
                    </div>

                    <h2 className="font-caveat mb-3 text-5xl leading-tight font-bold text-[#006e1c]">
                        Verify Your Pantry
                    </h2>
                    <p className="font-inter mx-auto max-w-xs text-sm leading-relaxed font-medium text-[#3e4a41]">
                        Just one quick step to secure your FreshDrop account and
                        unlock express door-to-door organic deliveries!
                    </p>

                    <div className="mt-8 flex items-center gap-2 rounded-full border border-emerald-300/60 bg-white/70 px-4 py-2 text-xs font-bold text-emerald-900 shadow-2xs">
                        <ShieldCheck size={16} className="text-[#006e1c]" />
                        <span>256-bit Encrypted Token Verification</span>
                    </div>
                </div>

                {/* OTP Input Form on Right */}
                <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
                    <div className="mb-6">
                        <div className="mb-4 flex items-center justify-between">
                            <Link
                                to="/"
                                className="flex items-center gap-2 text-[#006e1c] transition hover:opacity-90"
                            >
                                <span className="material-symbols-outlined text-4xl font-bold">
                                    eco
                                </span>
                                <span className="font-caveat text-4xl font-bold">
                                    FreshDrop
                                </span>
                            </Link>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-[#006e1c]">
                                Step 2 of 2
                            </span>
                        </div>

                        <h1 className="font-caveat text-on-surface text-[34px] leading-tight font-bold">
                            Enter Verification OTP
                        </h1>

                        <p className="mt-1 text-sm font-medium text-stone-600">
                            We sent a 6-digit confirmation code to:
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-stone-200/80 bg-stone-50 px-3.5 py-2">
                            <div className="flex items-center gap-2 truncate">
                                <Mail
                                    size={16}
                                    className="shrink-0 text-emerald-700"
                                />
                                <span className="truncate text-xs font-bold text-stone-900">
                                    {targetEmail}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/auth/signup')}
                                className="shrink-0 cursor-pointer text-[11px] font-bold text-[#006e1c] hover:underline"
                            >
                                Change
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label className="block text-[11px] font-bold tracking-wider text-stone-700 uppercase">
                                    6-Digit One-Time Code
                                </label>
                                <span className="font-mono text-[11px] text-stone-400">
                                    {digits.filter(Boolean).length}/6 filled
                                </span>
                            </div>

                            <div className="grid grid-cols-6 gap-2 sm:gap-3">
                                {digits.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => {
                                            inputRefs.current[idx] = el;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) =>
                                            handleDigitChange(
                                                e.target.value,
                                                idx
                                            )
                                        }
                                        onKeyDown={(e) => handleKeyDown(e, idx)}
                                        onPaste={handlePaste}
                                        className={`aspect-square w-full rounded-xl border text-center font-mono text-xl font-black transition-all outline-none sm:text-2xl ${
                                            digit
                                                ? 'border-emerald-600 bg-emerald-50/40 text-stone-900 ring-1 ring-emerald-600/30'
                                                : 'border-stone-300 bg-stone-50 text-stone-900 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/30'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !isComplete}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#006e1c] py-3.5 text-[15px] font-bold text-white shadow-lg transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#005313] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw
                                        size={18}
                                        className="animate-spin"
                                    />
                                    <span>Verifying Code...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    <span>Verify & Activate Account</span>
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-between border-t border-stone-200/80 pt-1 text-xs">
                            <span className="font-medium text-stone-500">
                                Didn't receive the email code?
                            </span>

                            {resendCooldown === 0 ? (
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    className="flex cursor-pointer items-center gap-1 font-bold text-[#006e1c] hover:underline"
                                >
                                    <RefreshCw size={12} />
                                    <span>Resend Code</span>
                                </button>
                            ) : (
                                <span className="font-semibold text-stone-400">
                                    Resend in{' '}
                                    <strong className="font-mono text-stone-600">
                                        {resendCooldown}s
                                    </strong>
                                </span>
                            )}
                        </div>

                        <div className="pt-2 text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/auth/signup')}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 transition hover:text-stone-900"
                            >
                                <ArrowLeft size={14} />
                                <span>Return to registration form</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
