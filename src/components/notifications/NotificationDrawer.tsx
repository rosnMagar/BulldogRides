import { Drawer, Stack, Text, Badge, Group, ActionIcon, ScrollArea, Button } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useNotifications } from "../../hooks/useNotifications";
import { client } from "../../lib/amplifyClient";
import { useState } from "react";

interface NotificationDrawerProps {
    opened: boolean;
    onClose: () => void;
}

interface NotificationItemData {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    relatedRequestID?: string;
    relatedRequestStatus?: string;
}

function NotificationItem({ notification, onMarkRead, onRefetch }: {
    notification: NotificationItemData;
    onMarkRead: (id: string) => void;
    onRefetch: () => void;
}) {
    const [responding, setResponding] = useState(false);

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'RIDE_REQUEST': return 'blue';
            case 'REQUEST_ACCEPTED': return 'green';
            case 'REQUEST_DECLINED': return 'red';
            default: return 'gray';
        }
    };

    const handleResponse = async (response: 'ACCEPT' | 'DECLINE') => {
        if (!notification.relatedRequestID) {
            notifications.show({
                title: 'Error',
                message: 'Could not find the associated ride request',
                color: 'red'
            });
            return;
        }

        setResponding(true);
        try {
            const { data, errors } = await client.mutations.respondToRideRequest({
                requestID: notification.relatedRequestID,
                response: response,
            });

            if (errors || !data?.success) {
                throw new Error(data?.error || errors?.[0]?.message || 'Failed to respond');
            }

            notifications.show({
                title: response === 'ACCEPT' ? 'Request Approved!' : 'Request Declined',
                message: response === 'ACCEPT'
                    ? 'The rider has been notified and added to the trip.'
                    : 'The rider has been notified.',
                color: response === 'ACCEPT' ? 'green' : 'orange'
            });

            // Mark this notification as read and refresh
            onMarkRead(notification.id);
            onRefetch();
        } catch (error: any) {
            notifications.show({
                title: 'Error',
                message: error.message || 'Failed to respond to request',
                color: 'red'
            });
        } finally {
            setResponding(false);
        }
    };

    // Determine if buttons should be shown (only for RIDE_REQUEST type)
    const isRideRequest = notification.type === 'RIDE_REQUEST' && notification.relatedRequestID;
    const isPending = notification.relatedRequestStatus === 'PENDING';
    const showActionButtons = isRideRequest && isPending;
    const showStatus = isRideRequest && !isPending && notification.relatedRequestStatus;

    return (
        <Stack
            gap="xs"
            p="md"
            style={{
                backgroundColor: notification.read ? 'transparent' : 'var(--mantine-color-blue-0)',
                borderRadius: '8px',
                border: '1px solid var(--mantine-color-gray-3)'
            }}
        >
            <Group justify="space-between">
                <Badge color={getTypeColor(notification.type || 'RIDE_REQUEST')} size="sm">
                    {(notification.type || 'NOTIFICATION').replace('_', ' ')}
                </Badge>
                {!notification?.read && (
                    <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => onMarkRead(notification.id)}
                    >
                        <IconCheck size={16} />
                    </ActionIcon>
                )}
            </Group>
            <Text fw={600} size="sm">{notification?.title}</Text>
            <Text size="xs" c="dimmed">{notification?.message}</Text>
            <Group justify="space-between">
                <Text size="xs" c="dimmed">
                    {new Date(notification?.createdAt).toLocaleString()}
                </Text>
                {showActionButtons && (
                    <Group gap="xs">
                        <Button
                            variant="outline"
                            size="xs"
                            color="green"
                            loading={responding}
                            onClick={() => handleResponse('ACCEPT')}
                        >
                            Approve
                        </Button>
                        <Button
                            variant="outline"
                            size="xs"
                            color="red"
                            loading={responding}
                            onClick={() => handleResponse('DECLINE')}
                        >
                            Decline
                        </Button>
                    </Group>
                )}
                {showStatus && (
                    <Badge variant="dot" color={notification.relatedRequestStatus === 'ACCEPTED' ? 'green' : 'red'}>
                        {notification.relatedRequestStatus}
                    </Badge>
                )}
            </Group>
        </Stack>
    );
}

export default function NotificationDrawer({ opened, onClose }: NotificationDrawerProps) {
    // No need to pass userID - determined server-side from authenticated identity
    const { notifications: notificationList, loading, markAsRead, refetch } = useNotifications();

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            title="Notifications"
            position="right"
            size="md"
            zIndex={100000}
        >
            <ScrollArea h="calc(100vh - 80px)">
                {loading ? (
                    <Text c="dimmed" ta="center" mt="xl">Loading...</Text>
                ) : !Array.isArray(notificationList) || notificationList.length === 0 ? (
                    <Text c="dimmed" ta="center" mt="xl">No notifications</Text>
                ) : (
                    <Stack gap="md">
                        {notificationList.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkRead={markAsRead}
                                onRefetch={refetch}
                            />
                        ))}
                    </Stack>
                )}
            </ScrollArea>
        </Drawer>
    );
}
