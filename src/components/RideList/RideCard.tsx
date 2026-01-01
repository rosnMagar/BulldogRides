import { Card, Text, Group, Badge, Stack, Divider, Button } from "@mantine/core";
import type { Schema } from "../../../amplify/data/resource";
import MiniMap from "../map/MiniMap";

type Ride = Schema["Ride"]["type"];

interface RideCardProps {
    ride: Ride;
}

// Format date nicely
function formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

// Get badge color based on status
function getStatusColor(status: string | null | undefined): string {
    switch (status) {
        case "OPEN": return "green";
        case "FULL": return "yellow";
        case "COMPLETED": return "blue";
        case "CANCELLED": return "red";
        default: return "gray";
    }
}

// Get reward display text
function getRewardText(reward: string | null | undefined): string {
    switch (reward) {
        case "MEAL_SWIPES": return "Meal Swipes";
        case "HOSE_DINNER": return "Hose Dinner";
        case "GAS_MONEY": return "Gas Money";
        case "OTHER": return "Other";
        case "NONE": return "";
        default: return "";
    }
}

export default function RideCard({ ride }: RideCardProps) {
    const pickupDisplay = ride.pickupAddress || `${ride.pickupLat?.toFixed(4)}, ${ride.pickupLong?.toFixed(4)}`;
    const destinationDisplay = ride.destinationAddress || `${ride.destinationLat?.toFixed(4)}, ${ride.destinationLong?.toFixed(4)}`;
    const rewardText = getRewardText(ride.reward);

    // Check if we have valid coordinates for the map
    const hasValidCoordinates =
        ride.pickupLat != null &&
        ride.pickupLong != null &&
        ride.destinationLat != null &&
        ride.destinationLong != null;

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="sm">
                {/* Mini Map Preview */}
                {hasValidCoordinates && (
                    <MiniMap
                        pickupLat={ride.pickupLat!}
                        pickupLng={ride.pickupLong!}
                        destinationLat={ride.destinationLat!}
                        destinationLng={ride.destinationLong!}
                        height={300}
                    />
                )}

                {/* Route */}
                <Group justify="space-between" align="flex-start">
                    <Stack gap={4} style={{ flex: 1 }}>
                        <Text size="sm" c="dimmed">From</Text>
                        <Text fw={500} lineClamp={1}>{pickupDisplay}</Text>
                    </Stack>
                    <Text size="xl" c="dimmed" px="md">→</Text>
                    <Stack gap={4} style={{ flex: 1 }}>
                        <Text size="sm" c="dimmed">To</Text>
                        <Text fw={500} lineClamp={1}>{destinationDisplay}</Text>
                    </Stack>
                </Group>

                <Divider />

                {/* Details */}
                <Group justify="space-between">
                    <Text size="sm">{formatDateTime(ride.pickupTime)}</Text>
                    <Group>
                        <Badge color={getStatusColor(ride.status)} variant="light">
                            {ride.status || "Unknown"}
                        </Badge>
                        {rewardText && (
                            <Badge variant="outline" color="gray">{rewardText}</Badge>
                        )}
                    </Group>
                </Group>
                <Group justify="space-between">
                    <Text size="sm">{ride.seatsAvailable} seats available</Text>
                    <Button size="xs">
                        Join Ride
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
}
