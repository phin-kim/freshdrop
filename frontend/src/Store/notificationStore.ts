import { create } from 'zustand';

import { notificationApi } from '../Library/api';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';
import useErrorStore from './errorStore';

const log = createClientLogger('NotificationStore.ts');

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
interface NotificationState {
    notifications: AppNotification[];
    unreadCount: number;
    isNotificationsDrawerOpen: boolean;
    isNotificationsLoading: boolean;
    setIsNotificationsDrawerOpen: (open: boolean) => void;
    fetchNotifications: () => Promise<void>;
    markNotificationAsRead: (id: string) => Promise<void>;
    markAllNotificationsAsRead: () => Promise<void>;
    setSelectedTrackingOrderId: (orderId: string) => void;
}
export interface NotificationsResponse {
    notifications: AppNotification[];
    unreadCount: number;
}
export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isNotificationsDrawerOpen: false,
    isNotificationsLoading: false,

    setIsNotificationsDrawerOpen: (open: boolean) => {
        set({ isNotificationsDrawerOpen: open });
        if (open) {
            get().fetchNotifications();
        }
    },
    fetchNotifications: async () => {
        set({ isNotificationsLoading: true });
        try {
            const response =
                await notificationApi.get<NotificationsResponse>(
                    '/notifications'
                );
            if (response) {
                const data = response.data;
                set({
                    notifications: data.notifications,
                    unreadCount: data.unreadCount,
                });
            }
        } catch (error) {
            const { setError } = useErrorStore.getState();
            log.error('Failed to fetch notifications', { data: { error } });
            handleApiError(error, setError);
        } finally {
            set({ isNotificationsLoading: false });
        }
    },
    markAllNotificationsAsRead: async () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({
                ...n,
                isRead: true,
            })),
        }));
        try {
            await notificationApi.patch('/notifications/read-all');
        } catch (error) {
            log.error('Unable to change the notification status', {
                data: error,
            });
            const { setError } = useErrorStore.getState();
            handleApiError(error, setError);
        }
    },
    markNotificationAsRead: async (notifId: string) => {
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === notifId ? { ...n, isRead: true } : n
            ),
        }));
        try {
            await notificationApi.patch(`/notifications/${notifId}/read`);
        } catch (error) {
            const { setError } = useErrorStore.getState();
            log.error('Unable to chnage the status of the notification', {
                data: { error },
            });
            handleApiError(error, setError);
        }
    },
    setSelectedTrackingOrderId: (orderId: string) => {},
}));
