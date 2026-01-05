import { useState } from "react";
import { useRides } from "../../hooks/useRides";
import RideCard from "./RideCard";
import { Container, Title, Loader, Text, Stack, Select, Group, Input } from "@mantine/core";
import { useAuth } from "../../hooks/useAuth";

type RideStatus = "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";

export default function RideList() {
    const { isDriver } = useAuth();
    const [statusFilter, setStatusFilter] = useState<RideStatus | null>("OPEN");

    const { rides, loading, error } = useRides({
        statusFilter: statusFilter,
        rideType: isDriver ? "REQUEST" : "OFFER",
        excludePastRides: true
    });

    if (loading) {
        return (
            <Container size="md" py="xl">
                <Stack align="center" gap="md">
                    <Loader size="lg" />
                    <Text c="dimmed">Loading rides...</Text>
                </Stack>
            </Container>
        );
    }

    if (error) {
        return (
            <Container size="md" py="xl">
                <Text c="red" ta="center">{error}</Text>
            </Container>
        );
    }

    return (
        <Container size="md" py="xl" px="xs">
            <Title order={2} mb="lg" ta="center" size="h3" style={{ fontSize: 'var(--mantine-font-size-xl)' }}>
                {isDriver ? "Rider Requests" : "Driver Offers"}
            </Title>

            <Group grow mb="md" gap="sm">
                <Input
                    size="sm"
                    placeholder="Search..."
                    style={{ flex: 1, minWidth: '200px' }}
                />
                <Select
                    placeholder="Status"
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as RideStatus | null)}
                    data={[
                        { value: "OPEN", label: "Open" },
                        { value: "FULL", label: "Full" },
                        { value: "COMPLETED", label: "Completed" },
                        { value: "CANCELLED", label: "Cancelled" },
                    ]}
                    clearable
                    style={{ flex: 0, minWidth: '120px' }}
                />
            </Group>

            {rides.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                    No rides available. Be the first to post one!
                </Text>
            ) : (
                <Stack gap="md">
                    {rides.map((ride) => (
                        <RideCard key={ride.id} ride={ride} isDriver={isDriver} />
                    ))}
                </Stack>
            )}
        </Container>
    );
}
