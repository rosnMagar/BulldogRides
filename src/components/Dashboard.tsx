import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router";
import {
    Container,
    Title,
    Text,
    Button,
    Group,
    Paper,
    Avatar,
    Stack,
    Badge,
} from "@mantine/core";

/**
 * Dashboard - The main page after login
 * Shows user info and navigation to other features
 */
export default function Dashboard() {
    const { user, signOut } = useAuth();

    return (
        <Container size="sm" py="xl">
            <Paper withBorder shadow="md" p="xl" radius="md">
                {/* Header */}
                <Group justify="space-between" mb="xl">
                    <Title order={2}>🐶 Bulldog Rides</Title>
                    <Badge color="violet" variant="light" size="lg">
                        Logged In
                    </Badge>
                </Group>

                {/* User Info */}
                <Stack align="center" mb="xl">
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

                {/* Actions */}
                <Stack gap="sm">
                    <Button
                        component={Link}
                        to="/createRide"
                        size="md"
                        fullWidth
                    >
                        Post a Ride
                    </Button>

                    <Button
                        variant="subtle"
                        color="gray"
                        size="md"
                        fullWidth
                        onClick={signOut}
                    >
                        Sign Out
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
}
