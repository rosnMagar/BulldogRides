import { useState } from "react";
import { useRides } from "../../hooks/useRides";
import RideCard from "./RideCard";
import { Container, Title, Loader, Text, Stack, Select, Group, SegmentedControl } from "@mantine/core";

type RideStatus = "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";
type RideType = "OFFER" | "REQUEST";

export default function RideList() {
    const [statusFilter, setStatusFilter] = useState<RideStatus | null>("OPEN");
    const [rideType, setRideType] = useState<RideType>("OFFER");

    const { rides, loading, error } = useRides({
        statusFilter,
        rideType,
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
        <Container size="md" py="xl">
            <Title order={2} mb="lg" ta="center">Available Rides</Title>

            <Group justify="space-between" mb="md">
                <SegmentedControl
                    value={rideType}
                    onChange={(value) => setRideType(value as RideType)}
                    data={[
                        { value: "OFFER", label: "Ride Offers" },
                        { value: "REQUEST", label: "Ride Requests" },
                    ]}
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
                    w={130}
                />
            </Group>

            {rides.length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                    No rides available. Be the first to post one!
                </Text>
            ) : (
                <Stack gap="md">
                    {rides.map((ride) => (
                        <RideCard key={ride.id} ride={ride} />
                    ))}
                </Stack>
            )}
        </Container>
    );
}
