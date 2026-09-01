export type TransactionType = 'TOPUP' | 'REFUND' | 'PURCHASE' | 'WITHDRAWAL';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface WalletTransaction {
    id: string;
    amount: number;
    type: TransactionType;
    status: TransactionStatus;
    reference?: string;
    description?: string;
    createdAt: string;
    orderId?: string;
    paymentMethod?: string;
}
