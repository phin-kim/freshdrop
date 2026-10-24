import { create } from 'zustand';

import { notificationApi } from '../Library/api';
import type { AppNotification } from '../Types/notificationTypes';
import handleApiError from '../Utils/apiError';
import createClientLogger from '../Utils/clientLogger';
import useErrorStore from './errorStore';

const log = createClientLogger('NotificationStore.ts');

interface NotificationState {
    notifications: AppNotification[];
    unreadCount: number;
    isNotificationsDrawerOpen: boolean;
    isNotificationsLoading: boolean;
    selectedTrackingOrderId: string | null;
    setIsNotificationsDrawerOpen: (open: boolean) => void;
    fetchNotifications: () => Promise<void>;
    markNotificationAsRead: (id: string) => Promise<void>;
    markAllNotificationsAsRead: () => Promise<void>;
    setSelectedTrackingOrderId: (orderId: string | null) => void;
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
    selectedTrackingOrderId: null,

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
                const unreadFromResponse = Number.isFinite(
                    data.unreadCount
                )
                    ? data.unreadCount
                    : data.notifications.filter((n) => !n.isRead).length;
                set({
                    notifications: data.notifications,
                    unreadCount: unreadFromResponse,
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
            unreadCount: 0,
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
        set((state) => {
            const updatedNotifications = state.notifications.map((n) =>
                n.id === notifId ? { ...n, isRead: true } : n
            );
            return {
                notifications: updatedNotifications,
                unreadCount: updatedNotifications.filter((n) => !n.isRead)
                    .length,
            };
        });
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
    setSelectedTrackingOrderId: (orderId: string | null) => {
        set({ selectedTrackingOrderId: orderId });
    },
}));
