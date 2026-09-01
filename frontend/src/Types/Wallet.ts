import type {
    TransactionStatus,
    TransactionType,
} from '../../../shared/sharedTypes';

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
