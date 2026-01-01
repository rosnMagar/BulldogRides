import { useAuth } from "../hooks/useAuth";
import {
    Container,
    Title,
    Text,
    Paper,
    Avatar,
    Stack,
} from "@mantine/core";

/**
 * Dashboard - The main page after login
 * Shows user info. Navigation is now handled by AppLayout.
 */
export default function Dashboard() {
    const { user } = useAuth();

    return (
        <Container size="sm" py="xl">
            <Paper withBorder shadow="md" p="xl" radius="md">
                {/* Header */}
                <Title order={2} mb="xl" ta="center">Welcome Back</Title>

                {/* User Info */}
                <Stack align="center">
                    <Avatar
                        size="xl"
                        radius="xl"
                        color="violet"
                    >
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </Avatar>
                    <Stack gap={4} align="center">
                        <Text fw={600} size="lg">
                            {user?.firstName} {user?.lastName}
                        </Text>
                        <Text size="sm" c="dimmed">
                            {user?.email}
                        </Text>
                        {user?.bio && (
                            <Text size="xs" c="dimmed" fs="italic">
                                {user.bio}
                            </Text>
                        )}
                    </Stack>
                </Stack>
            </Paper>
        </Container>
    );
}
