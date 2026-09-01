import { create } from 'zustand';

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
    ) => { success: boolean; transaction?: LocalWalletTransaction };
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
    topUpWallet: (amount, _phone, _paymentMethod) => {
        const reference = `LOCAL-${Date.now()}`;
        set((state) => ({ walletBalance: state.walletBalance + amount }));
        return {
            success: true,
            transaction: {
                id: reference,
                amount,
                type: 'TOPUP',
                status: 'SUCCESS',
                reference,
                createdAt: new Date().toISOString(),
            },
        };
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
