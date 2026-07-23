import { QRCodeSVG } from 'qrcode.react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';

import { authClient } from '../../lib/auth-client';

export default function Setup2FA() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [totpUri, setTotpUri] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [sixDigitCode, setSixDigitCode] = useState('');
    const [step, setStep] = useState(1); // 1: Password Auth, 2: Scan & Backup, 3: Success Verified
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const generateQRCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { data, error } = await authClient.twoFactor.enable({
            password: password,
        });

        setLoading(false);

        if (error) {
            setError(
                error.message ||
                    'Failed to initialize 2FA. Please verify you are logged in.'
            );
            return;
        }

        if (data) {
            setTotpUri(data.totpURI);
            setBackupCodes(data.backupCodes);
            setStep(2);
        }
    };

    const verifyAndActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await authClient.twoFactor.verifyTotp({
            code: sixDigitCode,
        });

        setLoading(false);

        if (error) {
            setError(
                'Invalid authenticator code. Please check your app and try again.'
            );
            return;
        }

        setStep(3);
    };

    return (
        <div className="min-h-screen bg-[#FDFCF9] px-4 py-12 font-sans sm:px-6 lg:px-8">
            <div className="mx-auto max-w-xl">
                {/* Top Header Branding */}
                <div className="mb-8">
                    <h1 className="font-serif text-3xl font-normal tracking-tight text-slate-900">
                        Account Security Gate
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Configure dynamic two-factor verification codes via
                        Google Authenticator to protect your inventory
                        privileges.
                    </p>
                </div>

                {/* Custom Status Error Banner */}
                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50 p-4">
                        <span className="text-sm font-bold text-red-600">
                            ⚠️
                        </span>
                        <p className="text-xs font-medium text-red-800">
                            {error}
                        </p>
                    </div>
                )}

                {/* Main UI Card Wrapper */}
                <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                    {/* STEP 1: Verify Password Identity */}
                    {step === 1 && (
                        <form onSubmit={generateQRCode} className="space-y-6">
                            <div>
                                <label className="mb-2 block text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Confirm Admin Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter your password to unlock token pairing"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-[#476A3E] focus:outline-none"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-[#476A3E] py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#395432] disabled:opacity-50"
                            >
                                {loading
                                    ? 'Generating Connection...'
                                    : 'GENERATE SECURE QR LINK'}
                            </button>
                        </form>
                    )}

                    {/* STEP 2: Render Scan QR Target & Input Verification Code */}
                    {step === 2 && (
                        <form
                            onSubmit={verifyAndActivate}
                            className="space-y-6"
                        >
                            {/* QR Render block */}
                            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-[#FAF9F6] p-6">
                                <div className="rounded-xl border border-slate-200/60 bg-white p-3 shadow-inner">
                                    <QRCodeSVG value={totpUri} size={180} />
                                </div>
                                <p className="mt-4 max-w-xs text-center text-xs leading-relaxed text-slate-500">
                                    Scan this image context inside your mobile{' '}
                                    <b>Google Authenticator</b> utility app to
                                    sync token sequences.
                                </p>
                            </div>

                            {/* Recovery Codes Section */}
                            <div className="rounded-xl border border-amber-200/40 bg-amber-50/50 p-4">
                                <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-amber-800 uppercase">
                                    <span>⚠️</span> EMERGENCY BACKUP CODES
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-center font-mono text-[11px] text-amber-900">
                                    {backupCodes.map((code) => (
                                        <span
                                            key={code}
                                            className="rounded border border-amber-200/40 bg-white px-2 py-1 tracking-wider"
                                        >
                                            {code}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 6 Digit Verification Input */}
                            <div>
                                <label className="mb-2 block text-center text-xs font-bold tracking-wider text-slate-500 uppercase">
                                    Enter 6-Digit Authenticator Code
                                </label>
                                <input
                                    type="text"
                                    placeholder="000 000"
                                    maxLength={6}
                                    value={sixDigitCode}
                                    onChange={(e) =>
                                        setSixDigitCode(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 bg-[#FAF9F6] py-3 text-center text-xl font-bold tracking-[0.5em] text-slate-800 transition focus:border-[#476A3E] focus:outline-none"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-[#476A3E] py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#395432] disabled:opacity-50"
                            >
                                {loading
                                    ? 'Verifying Keys...'
                                    : 'VERIFY & ACTIVATE LAYER'}
                            </button>
                        </form>
                    )}

                    {/* STEP 3: Complete Activation Output */}
                    {step === 3 && (
                        <div className="space-y-6 py-6 text-center">
                            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-50 text-2xl text-[#476A3E]">
                                ✓
                            </div>
                            <div>
                                <h3 className="font-serif text-lg text-slate-900">
                                    Authenticator Sync Live
                                </h3>
                                <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-500">
                                    Your identity signature has been updated.
                                    Future access checkpoints now require your
                                    6-digit hardware keys alongside password
                                    criteria.
                                </p>
                            </div>

                            <button
                                onClick={() => navigate('/admin')}
                                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                            >
                                ENTER APPLICATION INVENTORY
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
