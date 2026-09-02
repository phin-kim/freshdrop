import { create } from 'zustand';

import { userApi } from '../Library/api';

interface LocalWalletTransaction {
    id: string;
    amount: number;
    type: 'TOPUP' | 'REFUND' | 'PURCHASE' | 'WITHDRAWAL';
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    reference: string;
    createdAt: string;
}

interface WalletStoreState {
    isTopUpModalOpen: boolean;
    walletBalance: number;
    user: { email?: string } | null;
    setIsTopUpModalOpen: (isOpen: boolean) => void;
    topUpWallet: (
        amount: number,
        phone: string,
        paymentMethod: string
    ) => Promise<{ success: boolean; transaction?: LocalWalletTransaction }>;
    checkTopUpStatus: (reference: string) => Promise<{
        status: 'SUCCESS' | 'PENDING' | 'FAILED';
        reference?: string;
    }>;
    creditWalletRefund: (
        amount: number,
        description: string,
        reference: string
    ) => void;
    withdrawFromWallet: (amount: number, phone: string) => void;
}

export const useWalletStore = create<WalletStoreState>((set) => ({
    isTopUpModalOpen: false,
    walletBalance: 0,
    user: null,
    setIsTopUpModalOpen: (isOpen) => set({ isTopUpModalOpen: isOpen }),
    topUpWallet: async (amount, phone, _paymentMethod) => {
        const idempotentKey = crypto.randomUUID();
        const response = await userApi.post('/user/wallet/top-up', {
            amount,
            phoneNumber: phone,
            idempotentKey,
        });
        const transaction = response.data.data;
        return {
            success: true,
            transaction: {
                id: transaction.transactionId,
                amount,
                type: 'TOPUP',
                status: 'PENDING',
                reference: transaction.reference,
                createdAt: new Date().toISOString(),
            },
        };
    },
    checkTopUpStatus: async (reference) => {
        const response = await userApi.get(
            `/user/wallet/top-up/status/${encodeURIComponent(reference)}`
        );
        return response.data.data;
    },
    creditWalletRefund: (amount) => {
        set((state) => ({ walletBalance: state.walletBalance + amount }));
    },
    withdrawFromWallet: (amount) => {
        set((state) => ({
            walletBalance: Math.max(state.walletBalance - amount, 0),
        }));
    },
}));
