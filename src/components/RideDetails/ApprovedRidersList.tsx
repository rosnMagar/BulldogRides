import { Paper, Title, Stack, Group, Avatar, Text, Skeleton, Alert } from '@mantine/core';
import { IconUserCircle, IconAlertCircle } from '@tabler/icons-react';
import { useApprovedRiders } from '../../hooks/useApprovedRiders';

interface ApprovedRidersListProps {
    rideID: string;
}

export default function ApprovedRidersList({ rideID }: ApprovedRidersListProps) {
    const { riders, loading, error } = useApprovedRiders(rideID);

    if (loading) {
        return (
            <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Title order={3} mb="md">
                    Passengers
                </Title>
                <Stack gap="md">
                    {[1, 2].map((i) => (
                        <Group key={i} wrap="nowrap">
                            <Skeleton height={40} circle />
                            <div style={{ flex: 1 }}>
                                <Skeleton height={12} width="60%" mb={6} />
                                <Skeleton height={10} width="40%" />
                            </div>
                        </Group>
                    ))}
                </Stack>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper shadow="sm" p="lg" radius="md" withBorder>
                <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
                    {error}
                </Alert>
            </Paper>
        );
    }

    const formatJoinDate = (isoString: string): string => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    return (
        <Paper shadow="sm" p="lg" radius="md" mb="md" withBorder>
            <Title order={3} mb="md">
                Passengers {riders.length > 0 && `(${riders.length})`}
            </Title>

            {riders.length === 0 ? (
                <Text c="dimmed" size="sm">
                    No approved riders yet
                </Text>
            ) : (
                <Stack gap="md">
                    {riders && riders.map((rider) => (
                        <Group key={rider.id} wrap="nowrap">
                            {rider.profilePicture ? (
                                <Avatar src={rider.profilePicture} size={40} radius="xl" />
                            ) : (
                                <Avatar radius="xl" size={40} color="blue">
                                    <IconUserCircle size={24} />
                                </Avatar>
                            )}
                            <div style={{ flex: 1 }}>
                                <Text fw={500} size="sm">
                                    {rider.firstName} {rider.lastName}
                                </Text>
                                <Text c="dimmed" size="xs">
                                    Joined {formatJoinDate(rider.joinedAt)}
                                </Text>
                            </div>
                        </Group>
                    ))}
                </Stack>
            )}
        </Paper>
    );
}
