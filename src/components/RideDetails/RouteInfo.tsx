import { Paper, Title, Text, Group, Stack, Grid, ThemeIcon } from "@mantine/core";
import { IconMapPin, IconMapPinFilled } from "@tabler/icons-react";

interface RouteInfoProps {
    pickupAddress: string;
    destinationAddress: string;
}

export default function RouteInfo({ pickupAddress, destinationAddress }: RouteInfoProps) {
    return (
        <Paper shadow="sm" p="lg" radius="md" mb="lg" withBorder>
            <Title order={4} mb="md">Route Details</Title>
            <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group gap="sm" align="flex-start">
                        <ThemeIcon color="green" size="lg" radius="xl">
                            <IconMapPin size={18} />
                        </ThemeIcon>
                        <Stack gap={4}>
                            <Text size="sm" c="dimmed">Pickup Location</Text>
                            <Text fw={500}>{pickupAddress}</Text>
                        </Stack>
                    </Group>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group gap="sm" align="flex-start">
                        <ThemeIcon color="red" size="lg" radius="xl">
                            <IconMapPinFilled size={18} />
                        </ThemeIcon>
                        <Stack gap={4}>
                            <Text size="sm" c="dimmed">Destination</Text>
                            <Text fw={500}>{destinationAddress}</Text>
                        </Stack>
                    </Group>
                </Grid.Col>
            </Grid>
        </Paper>
    );
}
