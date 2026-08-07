export type NotificationType =
    | 'ORDER_PLACED'
    | 'ORDER_ASSIGNED'
    | 'ORDER_PICKED_UP'
    | 'ORDER_DELIVERED'
    | 'ORDER_CANCELLED';

export interface AppNotification {
    id: string;
    userId: string;
    orderId?: string | null;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    createdAt: string;
}
