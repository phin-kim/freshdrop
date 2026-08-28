import { useMutation, useQuery } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { riderApi } from '../../Library/api';
import useErrorStore from '../../Store/errorStore';
import handleApiError from '../../Utils/apiError';
import createClientLogger from '../../Utils/clientLogger';

const log = createClientLogger('RiderActivation.tsx');

export default function RiderActivation() {
    const token = new URLSearchParams(window.location.search).get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
        useState(false);
    const setError = useErrorStore((state) => state.setError);

    const activationCheck = useQuery({
        queryKey: ['rider-activation-check', token],
        enabled: Boolean(token),
        queryFn: async () => {
            const response = await riderApi.get(
                `/rider/activation/check?token=${encodeURIComponent(token!)}`
            );

            return response.data;
        },
    });
    const activationMutation = useMutation({
        mutationFn: async () => {
            if (!token) {
                throw new Error('Activation token is missing');
            }

            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            const response = await riderApi.post('/rider/activate', {
                token,
                password,
            });
            log.debug('Activation data', {
                data: response.data.existingUser,
            });
            return response.data;
        },
    });
    if (activationMutation.isError) {
        handleApiError(activationMutation.error, setError);
    }
    const existingAccount = activationCheck.data?.existingAccount === true;
    return (
        <main className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    activationMutation.mutate();
                }}
                className="w-full max-w-md space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-lg"
            >
                <div>
                    <h1 className="text-xl font-black text-stone-900">
                        Activate Courier Account
                    </h1>

                    <p className="mt-1 text-sm text-stone-500">
                        {existingAccount
                            ? 'You already have a FreshDrop account. Your current password will remain unchanged. After activation, log in using your existing password.'
                            : 'Create a permanent password for your new FreshDrop account.'}
                    </p>
                </div>

                <div className="relative">
                    <input
                        type={isPasswordVisible ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Create password"
                        className="w-full rounded-xl border border-stone-300 py-2 pr-11 pl-3 text-sm"
                    />
                    <button
                        type="button"
                        onClick={() =>
                            setIsPasswordVisible((visible) => !visible)
                        }
                        aria-label={
                            isPasswordVisible
                                ? 'Hide password'
                                : 'Show password'
                        }
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-500 transition hover:text-stone-800"
                    >
                        {isPasswordVisible ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>

                <div className="relative">
                    <input
                        type={isConfirmPasswordVisible ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        placeholder="Confirm password"
                        className="w-full rounded-xl border border-stone-300 py-2 pr-11 pl-3 text-sm"
                    />
                    <button
                        type="button"
                        onClick={() =>
                            setIsConfirmPasswordVisible((visible) => !visible)
                        }
                        aria-label={
                            isConfirmPasswordVisible
                                ? 'Hide confirmed password'
                                : 'Show confirmed password'
                        }
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-stone-500 transition hover:text-stone-800"
                    >
                        {isConfirmPasswordVisible ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>

                {activationMutation.isError && (
                    <p className="text-sm text-rose-600">
                        {activationMutation.error instanceof Error
                            ? activationMutation.error.message
                            : 'Activation failed'}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={activationMutation.isPending}
                    className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                    {activationMutation.isPending
                        ? 'Activating...'
                        : 'Activate Account'}
                </button>

                {activationMutation.isSuccess && (
                    <p className="text-sm font-semibold text-emerald-700">
                        Account activated. You can now log in.
                    </p>
                )}
            </form>
        </main>
    );
}
