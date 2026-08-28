import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { authClient } from '../lib/auth-client';

export default function ResetPassword() {
    const navigate = useNavigate();
    const token = new URLSearchParams(window.location.search).get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationError, setValidationError] = useState('');

    const resetMutation = useMutation({
        mutationFn: async () => {
            if (!token) {
                throw new Error('Invalid or missing reset token');
            }

            if (newPassword.length < 8) {
                throw new Error('Password must contain at least 8 characters');
            }

            if (newPassword !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            const response = await authClient.resetPassword({
                newPassword,
                token,
            });

            if (response.error) {
                throw new Error(
                    response.error.message || 'Unable to reset password'
                );
            }

            return response.data;
        },
        onError: (error) => {
            setValidationError(
                error instanceof Error
                    ? error.message
                    : 'Unable to reset password'
            );
        },
        onSuccess: () => {
            setValidationError('');
            navigate('/auth/login', {
                replace: true,
                state: { passwordReset: true },
            });
        },
    });

    const submitReset = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setValidationError('');
        resetMutation.mutate();
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
            <form
                onSubmit={submitReset}
                className="w-full max-w-md space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-lg"
            >
                <div>
                    <h1 className="text-xl font-black text-stone-900">
                        Reset Password
                    </h1>
                    <p className="mt-1 text-sm text-stone-500">
                        Choose a new password for your FreshDrop account.
                    </p>
                </div>

                <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="New password"
                        className="w-full rounded-xl border border-stone-300 py-2 pr-11 pl-10 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={() =>
                            setShowNewPassword((visible) => !visible)
                        }
                        aria-label={
                            showNewPassword
                                ? 'Hide new password'
                                : 'Show new password'
                        }
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-500 hover:text-stone-800"
                    >
                        {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>

                <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        placeholder="Confirm new password"
                        className="w-full rounded-xl border border-stone-300 py-2 pr-11 pl-10 text-sm focus:border-emerald-600 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={() =>
                            setShowConfirmPassword((visible) => !visible)
                        }
                        aria-label={
                            showConfirmPassword
                                ? 'Hide confirmed password'
                                : 'Show confirmed password'
                        }
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-500 hover:text-stone-800"
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>

                {validationError && (
                    <p className="text-sm text-rose-600">{validationError}</p>
                )}

                <button
                    type="submit"
                    disabled={resetMutation.isPending || !token}
                    className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {resetMutation.isPending
                        ? 'Resetting password...'
                        : 'Reset password'}
                </button>
            </form>
        </main>
    );
}
