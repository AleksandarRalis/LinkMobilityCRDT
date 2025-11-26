import { useState, useEffect, useCallback } from 'react';

/**
 * Notification types and their styling
 */
const NOTIFICATION_STYLES = {
    edit: {
        icon: '✏️',
        bgClass: 'bg-zinc-800',
        borderClass: 'border-zinc-700',
    },
    join: {
        icon: '👋',
        bgClass: 'bg-emerald-900/50',
        borderClass: 'border-emerald-700/50',
    },
    leave: {
        icon: '👋',
        bgClass: 'bg-zinc-800',
        borderClass: 'border-zinc-700',
    },
};

/**
 * Single Notification Item
 */
function NotificationItem({ notification, onDismiss }) {
    const [isExiting, setIsExiting] = useState(false);
    const style = NOTIFICATION_STYLES[notification.type] || NOTIFICATION_STYLES.edit;

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onDismiss(notification.id), 300);
        }, 3000);

        return () => clearTimeout(timer);
    }, [notification.id, onDismiss]);

    return (
        <div
            className={`
                ${style.bgClass} ${style.borderClass}
                border rounded-lg px-4 py-2.5 shadow-lg
                transform transition-all duration-300 ease-out
                ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
            `}
        >
            <div className="flex items-center gap-2">
                <span className="text-base">{style.icon}</span>
                <p className="text-sm text-zinc-300">
                    <span className="font-medium text-amber-500">{notification.userName}</span>
                    {' '}{notification.message}
                </p>
            </div>
        </div>
    );
}

/**
 * Notifications Container - manages notification stack
 */
export default function Notifications({ notifications, onDismiss }) {
    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {notifications.slice(0, 5).map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDismiss={onDismiss}
                />
            ))}
        </div>
    );
}

/**
 * Hook for managing notifications
 */
export function useNotifications() {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((type, userName, message) => {
        const id = Date.now() + Math.random();
        setNotifications((prev) => [
            { id, type, userName, message },
            ...prev.slice(0, 4), // Keep max 5 notifications
        ]);
    }, []);

    const dismissNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const notifyEdit = useCallback((userName) => {
        addNotification('edit', userName, 'made a change');
    }, [addNotification]);

    const notifyJoin = useCallback((userName) => {
        addNotification('join', userName, 'joined the document');
    }, [addNotification]);

    const notifyLeave = useCallback((userName) => {
        addNotification('leave', userName, 'left the document');
    }, [addNotification]);

    return {
        notifications,
        dismissNotification,
        notifyEdit,
        notifyJoin,
        notifyLeave,
    };
}

