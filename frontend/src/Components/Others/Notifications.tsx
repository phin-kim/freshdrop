import { useEffect } from 'react';

import { useStore } from '../store';
import { NotificationType } from '../types/notification';

export default function NotificationDrawer() {
    const {
        notifications,
        isNotificationsDrawerOpen,
        isNotificationsLoading,
        setIsNotificationsDrawerOpen,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        setSelectedTrackingOrderId,
    } = useStore();

    // Fetch when drawer opens
    useEffect(() => {
        if (isNotificationsDrawerOpen) {
            fetchNotifications();
        }
    }, [isNotificationsDrawerOpen, fetchNotifications]);

    if (!isNotificationsDrawerOpen) return null;

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const handleNotificationClick = (
        orderId?: string | null,
        notifId?: string
    ) => {
        if (notifId) markNotificationAsRead(notifId);
        if (orderId) {
            setSelectedTrackingOrderId(orderId);
            setIsNotificationsDrawerOpen(false);
        }
    };

    // Icon & Theme mapping based on Prisma NotificationType
    const getNotificationStyle = (type: NotificationType) => {
        switch (type) {
            case 'ORDER_PICKED_UP':
                return {
                    icon: 'local_shipping',
                    badgeClass:
                        'bg-amber-100 text-amber-800 border border-amber-300',
                };
            case 'ORDER_ASSIGNED':
                return {
                    icon: 'near_me',
                    badgeClass:
                        'bg-blue-100 text-blue-800 border border-blue-200',
                };
            case 'ORDER_DELIVERED':
                return {
                    icon: 'verified',
                    badgeClass:
                        'bg-emerald-100 text-emerald-800 border border-emerald-200',
                };
            case 'ORDER_CANCELLED':
                return {
                    icon: 'warning',
                    badgeClass:
                        'bg-rose-100 text-rose-800 border border-rose-200',
                };
            case 'ORDER_PLACED':
            default:
                return {
                    icon: 'inventory_2',
                    badgeClass:
                        'bg-slate-100 text-slate-700 border border-slate-200',
                };
        }
    };

    return (
        <div className="animate-fade-in fixed inset-0 z-100 flex justify-end bg-black/50 backdrop-blur-xs">
            <div
                className="animate-slide-left flex h-full w-full max-w-md flex-col justify-between overflow-hidden border-l border-slate-100 bg-white shadow-2xl"
                id="notifications-drawer-container"
            >
                {/* Drawer Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#2D3025] p-4 text-white sm:p-5">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="material-symbols-outlined text-2xl font-bold text-emerald-400">
                                notifications
                            </span>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 animate-pulse items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className="text-base leading-tight font-black">
                                Notifications Center
                            </h3>
                            <p className="text-[11px] font-medium text-emerald-200/80">
                                Real-time Backend Order Updates
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsNotificationsDrawerOpen(false)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        id="close-notifications-btn"
                    >
                        <span className="material-symbols-outlined text-xl">
                            close
                        </span>
                    </button>
                </div>

                {/* Action bar */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-slate-50 p-3 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500">
                        {isNotificationsLoading
                            ? 'Syncing updates...'
                            : `${notifications.length} total messages`}
                    </span>

                    {unreadCount > 0 && (
                        <button
                            onClick={markAllNotificationsAsRead}
                            className="cursor-pointer text-[11px] font-bold text-slate-600 underline hover:text-[#47663b]"
                            id="mark-all-read-btn"
                        >
                            Mark all read ({unreadCount})
                        </button>
                    )}
                </div>

                {/* Notifications list / Loading skeleton */}
                <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
                    {isNotificationsLoading ? (
                        /* Loading Skeleton State */
                        <div className="animate-pulse space-y-3">
                            {[1, 2, 3].map((i: number) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5"
                                >
                                    <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-200" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-1/2 rounded-md bg-slate-200" />
                                        <div className="h-2.5 w-5/6 rounded-md bg-slate-200" />
                                        <div className="h-2 w-1/4 rounded-md bg-slate-200 pt-1" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        /* Empty State */
                        <div className="space-y-3 py-16 text-center text-slate-400">
                            <span className="material-symbols-outlined text-5xl text-slate-200">
                                notifications_off
                            </span>
                            <p className="text-xs font-semibold">
                                No notifications yet. Place an order to receive
                                live updates!
                            </p>
                        </div>
                    ) : (
                        /* Render Notification Items */
                        notifications.map((notif) => {
                            const { icon, badgeClass } = getNotificationStyle(
                                notif.type
                            );

                            return (
                                <div
                                    key={notif.id}
                                    onClick={() =>
                                        handleNotificationClick(
                                            notif.orderId,
                                            notif.id
                                        )
                                    }
                                    className={`group relative cursor-pointer rounded-2xl border p-3.5 transition-all ${
                                        notif.isRead
                                            ? 'border-slate-200/80 bg-white opacity-90'
                                            : 'border-[#47663b]/40 bg-[#FCFAF2] shadow-sm hover:border-[#47663b]'
                                    }`}
                                >
                                    {!notif.isRead && (
                                        <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-[#47663b]" />
                                    )}

                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${badgeClass}`}
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                {icon}
                                            </span>
                                        </div>

                                        <div className="flex-1 space-y-1 pr-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-extrabold tracking-tight text-slate-800">
                                                    {notif.title}
                                                </h4>
                                            </div>
                                            <p className="text-xs leading-relaxed font-normal text-slate-600">
                                                {notif.message}
                                            </p>

                                            <div className="flex items-center justify-between pt-1 text-[10px] font-medium text-slate-400">
                                                <span>
                                                    {new Date(
                                                        notif.createdAt
                                                    ).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                                {notif.orderId && (
                                                    <span className="font-bold text-[#47663b] group-hover:underline">
                                                        Track Order &rarr;
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
