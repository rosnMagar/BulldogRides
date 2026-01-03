import { Indicator, ActionIcon } from "@mantine/core";
import { IconBell } from "@tabler/icons-react";
import { useNotifications } from "../../hooks/useNotifications";

interface NotificationBellProps {
    onClick: () => void;
}

export default function NotificationBell({ onClick }: NotificationBellProps) {
    // No need to pass userID - determined server-side from authenticated identity
    const { unreadCount } = useNotifications();

    return (
        <Indicator
            label={unreadCount}
            size={16}
            disabled={unreadCount === 0}
            color="red"
        >
            <ActionIcon
                variant="subtle"
                size="lg"
                onClick={onClick}
            >
                <IconBell size={20} />
            </ActionIcon>
        </Indicator>
    );
}
