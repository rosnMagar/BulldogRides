import type { AppSyncResolverHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/notification-operations';

// Configure Amplify using the proper helper
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    env as Parameters<typeof getAmplifyDataClientConfig>[0]
);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

// Types for different operations
interface GetNotificationsArgs { }

interface MarkAsReadArgs {
    notificationID: string;
}

interface NotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    userID: string;
    relatedRideID?: string;
    relatedRequestID?: string;
    createdAt: string;
    updatedAt: string;
}

interface GetNotificationsResponse {
    success: boolean;
    error?: string;
    notifications: NotificationItem[];
    unreadCount: number;
}

interface MarkAsReadResponse {
    success: boolean;
    error?: string;
}

// Handler for getMyNotifications query
export const getMyNotifications: AppSyncResolverHandler<GetNotificationsArgs, GetNotificationsResponse> = async (event) => {
    // SECURITY: Get user ID from authenticated identity
    const identity = event.identity as { sub?: string } | undefined;
    const userID = identity?.sub;

    if (!userID) {
        return {
            success: false,
            error: "Unauthorized: Could not identify user",
            notifications: [],
            unreadCount: 0,
        };
    }

    try {
        const { data, errors } = await client.models.Notification.list({
            filter: { userID: { eq: userID } }
        });

        if (errors) {
            throw new Error(errors[0]?.message || "Failed to fetch notifications");
        }

        // Sort by creation date (newest first)
        const sorted = (data || [])
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(n => ({
                id: n.id,
                type: n.type || 'RIDE_REQUEST',
                title: n.title,
                message: n.message,
                read: n.read ?? false,
                userID: n.userID,
                relatedRideID: n.relatedRideID || undefined,
                relatedRequestID: n.relatedRequestID || undefined,
                createdAt: n.createdAt,
                updatedAt: n.updatedAt,
            }));

        return {
            success: true,
            notifications: sorted,
            unreadCount: sorted.filter(n => !n.read).length,
        };
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch notifications",
            notifications: [],
            unreadCount: 0,
        };
    }
};

// Handler for markNotificationAsRead mutation
export const markNotificationAsRead: AppSyncResolverHandler<MarkAsReadArgs, MarkAsReadResponse> = async (event) => {
    const { notificationID } = event.arguments;

    // SECURITY: Get user ID from authenticated identity
    const identity = event.identity as { sub?: string } | undefined;
    const userID = identity?.sub;

    if (!userID) {
        return {
            success: false,
            error: "Unauthorized: Could not identify user",
        };
    }

    try {
        // First, verify the notification belongs to this user
        const { data: notification, errors: getErrors } = await client.models.Notification.get({
            id: notificationID
        });

        if (getErrors || !notification) {
            return {
                success: false,
                error: "Notification not found",
            };
        }

        // SECURITY: Verify ownership
        if (notification.userID !== userID) {
            return {
                success: false,
                error: "Unauthorized: You cannot modify this notification",
            };
        }

        // Update the notification
        const { errors: updateErrors } = await client.models.Notification.update({
            id: notificationID,
            read: true,
        });

        if (updateErrors) {
            throw new Error(updateErrors[0]?.message || "Failed to update notification");
        }

        return { success: true };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update notification",
        };
    }
};

// Main handler that routes to the appropriate function
export const handler: AppSyncResolverHandler<any, any> = async (event, context, callback) => {
    // For Amplify Gen 2, event.info may not exist - check fieldName from different sources
    const fieldName = event.info?.fieldName ||
        (event as any).fieldName ||
        (event.arguments?.notificationID ? 'markNotificationAsRead' : 'getMyNotifications');

    console.log('Event received:', JSON.stringify(event, null, 2));
    console.log('Resolved fieldName:', fieldName);

    switch (fieldName) {
        case 'getMyNotifications':
            return getMyNotifications(event, context, callback);
        case 'markNotificationAsRead':
            return markNotificationAsRead(event, context, callback);
        default:
            // If we can't determine the field, try getMyNotifications by default
            console.log('Could not determine fieldName, defaulting to getMyNotifications');
            return getMyNotifications(event, context, callback);
    }
};
