import { Paper, Title, Text, Group, Stack, Grid, Divider, ThemeIcon } from "@mantine/core";
import { IconClock, IconUsers, IconGift } from "@tabler/icons-react";

interface RideInfoProps {
    pickupTime: string;
    seatsAvailable: number;
    rewardText: string;
}

// Format date nicely
function formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function RideInfo({ pickupTime, seatsAvailable, rewardText }: RideInfoProps) {
    return (
        <Paper shadow="sm" p="lg" radius="md" mb="lg" withBorder>
            <Title order={4} mb="md">Ride Information</Title>
            <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group gap="sm">
                        <ThemeIcon color="blue" size="lg" radius="xl" variant="light">
                            <IconClock size={18} />
                        </ThemeIcon>
                        <Stack gap={4}>
                            <Text size="sm" c="dimmed">Pickup Time</Text>
                            <Text fw={500}>{formatDateTime(pickupTime)}</Text>
                        </Stack>
                    </Group>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group gap="sm">
                        <ThemeIcon color="violet" size="lg" radius="xl" variant="light">
                            <IconUsers size={18} />
                        </ThemeIcon>
                        <Stack gap={4}>
                            <Text size="sm" c="dimmed">Seats Available</Text>
                            <Text fw={500}>{seatsAvailable} seat{seatsAvailable !== 1 ? "s" : ""}</Text>
                        </Stack>
                    </Group>
                </Grid.Col>
                {rewardText && (
                    <Grid.Col span={12}>
                        <Divider my="sm" />
                        <Group gap="sm">
                            <ThemeIcon color="yellow" size="lg" radius="xl" variant="light">
                                <IconGift size={18} />
                            </ThemeIcon>
                            <Stack gap={4}>
                                <Text size="sm" c="dimmed">Reward Offered</Text>
                                <Text fw={500}>{rewardText}</Text>
                            </Stack>
                        </Group>
                    </Grid.Col>
                )}
            </Grid>
        </Paper>
    );
}
