import { motion } from 'framer-motion';
import { Clock, RefreshCw, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { deliveryApi } from '../Library/api';
import { useDeliveryStore } from '../Store/delivery';
import useErrorStore from '../Store/errorStore';
import useSuccessStore from '../Store/successStore';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';
import {
    type DebounceState,
    ExponentialBackoffDebouncer,
} from '../Utils/exponentialBackoffDebouncer';

const log = createClientLogger('CheckoutModal.tsx');

function validateKenyanPhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('254')) return cleaned.length === 12;
    if (cleaned.startsWith('07') || cleaned.startsWith('01'))
        return cleaned.length === 10;
    return false;
}

export default function CheckoutModal({
    grandTotalDue,
    setShowCheckoutModal,
}: {
    setShowCheckoutModal: React.Dispatch<React.SetStateAction<boolean>>;
    grandTotalDue: number;
}) {
    const setError = useErrorStore((state) => state.setError);
    const setSuccess = useSuccessStore((state) => state.setSuccess);
    const customerCoordinates = useDeliveryStore((state) => state.coords);
    const address = useDeliveryStore((state) => state.address);
    const deliveryFee = useDeliveryStore((state) => state.deliveryFee);
    const deliveryDistance = useDeliveryStore(
        (state) => state.deliveryDistance
    );
    const deliveryLocation = useDeliveryStore(
        (state) => state.deliveryLocation
    );
    const [isProcessing, setIsProcessing] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [debounceState, setDebounceState] = useState<DebounceState>({
        isDebounced: false,
        remainingDelay: 0,
        attemptCount: 0,
        nextRetryTime: null,
    });
    const debouncer = useRef<ExponentialBackoffDebouncer | null>(null);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (!debouncer.current) {
            debouncer.current = new ExponentialBackoffDebouncer({
                initialDelay: 500,
                maxDelay: 30000,
                backoffMultiplier: 1.5,
                maxAttempts: 5,
            });
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debouncer.current) {
                debouncer.current.cancel();
            }
        };
    }, []);

    // Compute aggregate Cart totals & service charge details dynamically

    const isPhoneValid = useCallback(
        () => validateKenyanPhoneNumber(phoneNumber),
        [phoneNumber]
    );
    const handlePay = useCallback(async () => {
        if (!isPhoneValid() || !debouncer.current) {
            setError('Please enter a valid phone number  ');
            return;
        }
        setError(null);
        setIsProcessing(true);
        const baseURL = 'http://localhost:5100';
        if (!baseURL) {
            setIsProcessing(false);
            setError('API URL is not configured.');
            return;
        }
        try {
            const response = await debouncer.current.execute(
                async () => {
                    const initialResponse = await deliveryApi.post(
                        `${baseURL}/api/payments/initiate`,
                        {
                            phoneNumber,
                            amount: grandTotalDue,
                        }
                    );
                    return initialResponse.data;
                },
                (state) => {
                    setDebounceState(state);
                }
            );
            const reference = response.data.reference;
            setSuccess('Confirm payment in yur phone');
            let pollAttempts = 0;
            const maxPollAttempts = 30; // 60 seconds with 2s intervals
            const pollStatus = async () => {
                if (pollAttempts >= maxPollAttempts) {
                    setIsProcessing(false);
                    setError('Payment confirmation timed out.');
                    return;
                }
                try {
                    const statusRes = await deliveryApi.get(
                        `${baseURL}/api/payments/status/${reference}`
                    );
                    const paymentStatus = statusRes.data.data.status;
                    if (paymentStatus === 'SUCCESS') {
                        setIsProcessing(false);
                        setSuccess('You have successfully purchased items');
                        setTimeout(() => {
                            setShowCheckoutModal(false);
                            setPhoneNumber('');
                            setSuccess('');
                        }, 4000);
                        return;
                    } else if (
                        paymentStatus === 'FAILED' ||
                        paymentStatus === 'CANCELLED'
                    ) {
                        setIsProcessing(false);
                        const reason =
                            paymentStatus === 'CANCELLED'
                                ? 'Transaction was cancelled on your device'
                                : 'Transaction failed.Please check if you have sufficient funds and try again';
                        setError(`${reason}`);
                        return;
                    }
                } catch (error) {
                    log.error('Polling error', { data: { error } });
                }
                pollAttempts++;
                setTimeout(pollStatus, 2000);
            };
            void pollStatus();
        } catch (error) {
            setIsProcessing(false);

            log.error('Payment error', { data: { error } });
            // Safe structural extraction of errors from Axios without type assertions to 'any'
            handleApiError(error, setError);
        }
    }, [
        grandTotalDue,
        isPhoneValid,
        phoneNumber,
        setError,
        setSuccess,
        setShowCheckoutModal,
    ]);
    // Derived values to satisfy React tracking rules safely
    const showCountdown =
        debounceState.isDebounced && debounceState.nextRetryTime !== null;
    // Countdown interval manager safely driven off derived state changes
    // Countdown interval manager safely driven off derived state changes
    useEffect(() => {
        // If we shouldn't show the countdown, just exit. No synchronous state updates!
        if (!showCountdown || !debounceState.nextRetryTime) {
            return;
        }

        const calculateRemaining = () => {
            const remaining = Math.ceil(
                (debounceState.nextRetryTime! - Date.now()) / 1000
            );
            return Math.max(0, remaining);
        };

        // All state updates are now safely wrapped in an asynchronous callback
        const interval = setInterval(() => {
            setCountdown(calculateRemaining());
        }, 100);

        return () => clearInterval(interval);
    }, [showCountdown, debounceState.nextRetryTime]);

    return (
        <div className="animate-fade-in fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between bg-[#006e1c] p-5 text-white">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-2xl">
                            verified_user
                        </span>
                        <div>
                            <h3 className="text-base leading-none font-bold">
                                Checkout
                            </h3>
                            <span className="mt-1 block text-[10px] font-bold tracking-widest text-emerald-100 uppercase">
                                256-Bit SSL Encrypted checkout
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (!isProcessing) setShowCheckoutModal(false);
                        }}
                        className="cursor-pointer text-white transition-colors hover:text-slate-100 focus:outline-none"
                    >
                        <span className="material-symbols-outlined text-2xl">
                            close
                        </span>
                    </button>
                </div>

                {/* Modal Form body */}
                <div className="space-y-4 p-6">
                    {/* Checkout billing details block */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs">
                        <div>
                            <span className="text-outline block font-bold">
                                Invoice Total:
                            </span>
                            <span className="text-sm font-extrabold text-slate-800">
                                Basket total + compounded service fee
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-primary block text-lg leading-none font-black">
                                KSh {grandTotalDue.toLocaleString()}
                            </span>
                            <span className="text-[9px] font-black text-[#006e1c] uppercase">
                                Kenya Shillings
                            </span>
                        </div>
                    </div>

                    {/* Payment Methods Tabs 
                      <div className="space-y-1">
                          <label className="text-[10px] font-black tracking-wider text-[#3e4a41] uppercase">
                              Select Payment Channel
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                              <button
                                  type="button"
                                  onClick={() => {
                                      setPaymentMethod('Payhero M-PESA');
                                      setPayErrors({});
                                  }}
                                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border py-3.5 transition-all ${
                                      paymentMethod === 'Payhero M-PESA'
                                          ? 'border-emerald-400 bg-emerald-50 font-extrabold text-emerald-800'
                                          : 'text-on-surface border-slate-200 bg-white hover:bg-slate-50'
                                  }`}
                              >
                                  <span className="text-xs font-black">
                                      📲 M-PESA Mobile Pay
                                  </span>
                              </button>

                              <button
                                  type="button"
                                  onClick={() => {
                                      setPaymentMethod('Payhero Card');
                                      setPayErrors({});
                                  }}
                                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border py-3.5 transition-all ${
                                      paymentMethod === 'Payhero Card'
                                          ? 'border-blue-400 bg-blue-50 font-extrabold text-blue-800'
                                          : 'text-on-surface border-slate-200 bg-white hover:bg-slate-50'
                                  }`}
                              >
                                  <span className="text-xs font-black">
                                      💳 Credit/Debit Card
                                  </span>
                              </button>
                          </div>
                      </div>
                    */}
                    {/* Shipping Address Input */}
                    <div className="space-y-1">
                        <label
                            className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase"
                            htmlFor="ship-address"
                        >
                            Shipping Delivery Destination
                        </label>
                        <div className="relative">
                            <span className="material-symbols-outlined text-outline absolute top-1/2 left-3 -translate-y-1/2 text-lg">
                                home_pin
                            </span>
                            <input
                                id="ship-address"
                                type="text"
                                placeholder="e.g. Apartment 12B, Westlands Mall Area, Nairobi"
                                value={deliveryLocation}
                                readOnly
                                className={`'border-outline-variant/65 w-full rounded-xl border bg-[#f1f3ff]/50 py-2.5 pr-4 pl-10 text-sm outline-none focus:bg-white`}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label
                            className="block text-[10px] font-black tracking-wider text-[#3e4a41] uppercase"
                            htmlFor="mpesa-number"
                        >
                            M-PESA Phone Number
                        </label>
                        <div className="relative">
                            <span className="material-symbols-outlined text-outline absolute top-1/2 left-3 -translate-y-1/2 text-lg">
                                smartphone
                            </span>
                            <input
                                id="mpesa-number"
                                type="text"
                                placeholder="e.g. 0712345678 or 254712345678"
                                value={phoneNumber}
                                onChange={(e) => {
                                    setPhoneNumber(e.target.value);
                                }}
                                className={`border-outline-variant/65 w-full rounded-xl border bg-[#f1f3ff]/50 py-2.5 pr-4 pl-10 text-sm outline-none focus:bg-white`}
                            />
                        </div>
                        <p className="pt-0.5 text-[9px] leading-normal font-semibold text-[#6f7a6b] italic">
                            Secure on-screen M-PESA STK push prompt will arrive
                            on this device for code validation.
                        </p>
                    </div>
                    {/* M-PESA mobile input view */}

                    {/* Action checkout CTAs */}
                    <div className="flex gap-3 pt-3">
                        <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => setShowCheckoutModal(false)}
                            className="flex-1 cursor-pointer rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-800 transition-all duration-100 hover:bg-slate-200 active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handlePay}
                            disabled={
                                isProcessing ||
                                !isPhoneValid() ||
                                debounceState.isDebounced
                            }
                            className={`flex flex-1 items-center ${isPhoneValid() && !isProcessing && !debounceState.isDebounced ? 'cursor-pointer bg-[#006e1c] hover:-translate-y-0.5 hover:bg-[#005313] active:scale-95' : 'cursor-not-allowed bg-slate-100 text-slate-400'} justify-center gap-2 rounded-xl py-3 text-xs font-bold text-white shadow-lg transition-all duration-150 disabled:bg-emerald-800/60`}
                        >
                            {isProcessing ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1,
                                            ease: 'linear',
                                        }}
                                    >
                                        <RefreshCw size={20} />
                                    </motion.div>
                                    Processing...
                                </>
                            ) : debounceState.isDebounced ? (
                                <>
                                    <Clock size={20} />
                                    Retry in {countdown}s
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={20} />
                                    Pay KSh {grandTotalDue.toLocaleString()}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
