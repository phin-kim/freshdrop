import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Lock,
    ShieldAlert,
    Trash2,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmDelete: () => void;
    userName: string; // 🚨 Passed from Profile.tsx
}

export default function DeleteAccountModal({
    isOpen,
    onClose,
    onConfirmDelete,
    userName,
}: DeleteAccountModalProps) {
    const [confirmationText, setConfirmationText] = useState('');
    const [hasAcknowledged, setHasAcknowledged] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletionStepIndex, setDeletionStepIndex] = useState(0);

    const deletionSteps = [
        'Clearing saved addresses and cart items...',
        'Forfeiting remaining wallet credits & tokens...',
        'Permanently erasing user profile & session...',
    ];

    
    // Close on Escape key when not actively deleting
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isDeleting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isDeleting, onClose]);

    if (!isOpen) return null;

    const isPhraseValid = confirmationText.trim().toUpperCase() === 'DELETE';
    const canSubmit = isPhraseValid && hasAcknowledged && !isDeleting;

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setIsDeleting(true);
        setDeletionStepIndex(0);

        // Step through visible account deletion stages before executing final deletion
        setTimeout(() => setDeletionStepIndex(1), 500);
        setTimeout(() => setDeletionStepIndex(2), 1000);
        setTimeout(() => {
            onConfirmDelete(); // 🚨 Triggers the actual API call in Profile.tsx
        }, 1500);
    };

    return (
        <div
            id="delete-account-modal-backdrop"
            className="animate-fade-in fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-stone-950/75 p-4 backdrop-blur-sm"
            onClick={() => !isDeleting && onClose()}
        >
            <div
                id="delete-account-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-account-modal-title"
                className="my-8 w-full max-w-lg overflow-hidden rounded-3xl border border-red-900/20 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Deep Crimson Header */}
                <div className="relative flex items-start justify-between gap-4 bg-gradient-to-r from-red-900 to-red-800 px-6 py-5 text-white">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-black/20">
                            <ShieldAlert className="h-5 w-5 text-red-100" />
                        </div>
                        <div>
                            <span className="block text-[10px] font-black tracking-widest text-red-200 uppercase">
                                Irreversible Security Action
                            </span>
                            <h3
                                id="delete-account-modal-title"
                                className="text-lg font-black tracking-tight text-white"
                            >
                                Confirm Account Deletion
                            </h3>
                        </div>
                    </div>

                    {!isDeleting && (
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close delete confirmation modal"
                            className="cursor-pointer rounded-xl bg-black/20 p-1.5 text-white transition hover:bg-black/35"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Body */}
                {isDeleting ? (
                    <div className="space-y-5 p-8 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-red-900/25 bg-red-900/10 text-red-800">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                        <div>
                            <h4 className="text-base font-black text-stone-900">
                                Executing Account Deletion...
                            </h4>
                            <p className="mt-1 text-xs text-stone-500">
                                Please wait while we securely remove your
                                FreshDrop profile.
                            </p>
                        </div>

                        <div className="space-y-2.5 rounded-2xl border border-stone-200/80 bg-stone-50 p-4 text-left">
                            {deletionSteps.map((stepLabel, idx) => {
                                const isDone = idx < deletionStepIndex;
                                const isActive = idx === deletionStepIndex;
                                return (
                                    <div
                                        key={stepLabel}
                                        className="flex items-center gap-2.5 text-xs font-semibold"
                                    >
                                        {isDone ? (
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                                        ) : isActive ? (
                                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-red-800" />
                                        ) : (
                                            <div className="h-4 w-4 shrink-0 rounded-full border-2 border-stone-300" />
                                        )}
                                        <span
                                            className={
                                                isDone
                                                    ? 'text-stone-400 line-through'
                                                    : isActive
                                                      ? 'font-bold text-stone-900'
                                                      : 'text-stone-400'
                                            }
                                        >
                                            {stepLabel}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleConfirm} className="space-y-5 p-6">
                        {/* Warning Impact Summary */}
                        <div className="space-y-2.5 rounded-2xl border border-l-4 border-stone-200 border-l-red-800 bg-stone-100 p-4">
                            <div className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-red-900 uppercase">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-red-800" />
                                <span>
                                    What happens when you delete your account:
                                </span>
                            </div>
                            <ul className="list-disc space-y-1.5 pl-6 text-xs font-medium text-stone-700">
                                <li>
                                    Your profile (
                                    <strong className="font-bold text-stone-900">
                                        {userName}
                                    </strong>
                                    ) and login credentials will be permanently
                                    erased.
                                </li>
                                <li>
                                    Your FreshDrop Wallet balance and
                                    transaction history will be forfeited.
                                </li>
                                <li>
                                    Saved delivery addresses and cart items will
                                    be cleared immediately.
                                </li>
                            </ul>
                        </div>

                        {/* Type DELETE Verification Input */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="delete-confirm-phrase"
                                className="block text-[11px] font-extrabold tracking-wider text-stone-700 uppercase"
                            >
                                Type{' '}
                                <span className="rounded bg-red-900 px-1.5 py-0.5 font-mono text-white">
                                    DELETE
                                </span>{' '}
                                to confirm *
                            </label>
                            <div className="relative">
                                <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                                <input
                                    id="delete-confirm-phrase"
                                    type="text"
                                    autoComplete="off"
                                    value={confirmationText}
                                    onChange={(e) =>
                                        setConfirmationText(e.target.value)
                                    }
                                    placeholder="Type DELETE here"
                                    className={`w-full rounded-xl border py-2.5 pr-4 pl-10 font-mono text-sm font-bold transition outline-none ${
                                        confirmationText && !isPhraseValid
                                            ? 'border-red-700 bg-stone-50 text-red-900 focus:ring-2 focus:ring-red-800/30'
                                            : isPhraseValid
                                              ? 'border-red-800 bg-stone-50 text-red-900 ring-2 ring-red-800/20'
                                              : 'border-stone-300 bg-stone-50 focus:border-red-800 focus:bg-white focus:ring-2 focus:ring-red-800/20'
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Acknowledgment Checkbox */}
                        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-stone-200 bg-stone-50 p-3 transition hover:bg-stone-100">
                            <input
                                id="delete-acknowledge-checkbox"
                                type="checkbox"
                                checked={hasAcknowledged}
                                onChange={(e) =>
                                    setHasAcknowledged(e.target.checked)
                                }
                                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-red-800 focus:ring-red-800"
                            />
                            <span className="text-xs leading-relaxed font-semibold text-stone-700">
                                I understand that this action is permanent,
                                cannot be undone, and all my FreshDrop account
                                data will be deleted.
                            </span>
                        </label>

                        {/* Footer Buttons */}
                        <div className="flex flex-col-reverse items-center justify-end gap-2.5 border-t border-stone-200 pt-2 sm:flex-row">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full cursor-pointer rounded-xl bg-stone-100 px-5 py-2.5 text-xs font-bold text-stone-700 transition hover:bg-stone-200 sm:w-auto"
                            >
                                Keep My Account
                            </button>
                            <button
                                id="confirm-delete-account-btn"
                                type="submit"
                                disabled={!canSubmit}
                                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-800 px-5 py-2.5 text-xs font-black tracking-wider text-white uppercase shadow-sm transition hover:bg-red-900 active:scale-98 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 sm:w-auto"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>Permanently Delete Account</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
