import { useState, useEffect, useCallback } from "react";
import { client } from "../lib/amplifyClient";

interface NotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    userID: string;
    relatedRideID?: string;
    relatedRequestID?: string;
    relatedRequestStatus?: string;
    createdAt: string;
    updatedAt: string;
}

interface UseNotificationsReturn {
    notifications: NotificationItem[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    markAsRead: (notificationID: string) => Promise<boolean>;
    refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Use the secure server-side query (no userID needed - determined from identity)
            const { data, errors } = await client.queries.getMyNotifications({});

            if (errors) {
                throw new Error(errors[0]?.message || "Failed to fetch notifications");
            }

            if (!data?.success) {
                throw new Error(data?.error || "Failed to fetch notifications");
            }

            // Parse the notifications - handle various formats
            console.log('Raw notifications data:', data.notifications, 'Type:', typeof data.notifications);
            let notificationList: NotificationItem[] = [];

            if (data.notifications) {
                if (typeof data.notifications === 'string') {
                    try {
                        notificationList = JSON.parse(data.notifications);
                    } catch {
                        console.error('Failed to parse notifications JSON');
                    }
                } else if (Array.isArray(data.notifications)) {
                    notificationList = data.notifications;
                } else {
                    console.error('Unexpected notifications format:', data.notifications);
                }
            }

            // Ensure it's an array
            if (!Array.isArray(notificationList)) {
                console.error('notificationList is not an array, resetting to empty');
                notificationList = [];
            }

            setNotifications(notificationList);
            setUnreadCount(data.unreadCount || 0);
        } catch (err: any) {
            console.error("Error fetching notifications:", err);
            setError(err.message || "Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = useCallback(async (notificationID: string): Promise<boolean> => {
        try {
            // Use the secure server-side mutation
            const { data, errors } = await client.mutations.markNotificationAsRead({
                notificationID
            });

            if (errors) {
                throw new Error(errors[0]?.message || "Failed to mark as read");
            }

            if (!data?.success) {
                throw new Error(data?.error || "Failed to mark as read");
            }

            // Update local state
            setNotifications(prev =>
                prev.map(n => n.id === notificationID ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            return true;
        } catch (err: any) {
            console.error("Error marking notification as read:", err);
            return false;
        }
    }, []);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        refetch: fetchNotifications,
    };
}