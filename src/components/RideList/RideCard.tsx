import { Card, Text, Group, Badge, Stack, Divider, Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { Schema } from "../../../amplify/data/resource";
import MiniMap from "../map/MiniMap";
import { useRideRequests } from "../../hooks/useRideRequests";
import { useAuth } from "../../hooks/useAuth";

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
    const { user } = useAuth();
    const { createRequest, loading, error } = useRideRequests();

    // Format reward text
    const getRewardText = (reward: string | null | undefined, description: string | null | undefined): string => {
        if (!reward || reward === 'NONE') return '';
        if (reward === 'OTHER' && description) return description;
        return reward.replace('_', ' ');
    };
    const rewardText = getRewardText(ride.reward, ride.rewardDescription);

    const handleJoinRide = async () => {
        if (!user?.id) {
            notifications.show({
                title: 'Error',
                message: 'You must be logged in to join a ride',
                color: 'red'
            });
            return;
        }

        // User ID is determined server-side from authenticated identity
        const success = await createRequest(ride.id);

        if (success) {
            notifications.show({
                title: 'Request sent!',
                message: 'The driver will be notified of your request',
                color: 'green'
            });
        } else if (error) {
            notifications.show({
                title: 'Failed to join ride',
                message: error,
                color: 'red'
            });
        }
    };

    const isOwnRide = ride.driverID === user?.id;
    const isFull = (ride.seatsAvailable || 0) <= 0;
    const pickupDisplay = ride.pickupAddress || `${ride.pickupLat?.toFixed(4)}, ${ride.pickupLong?.toFixed(4)}`;
    const destinationDisplay = ride.destinationAddress || `${ride.destinationLat?.toFixed(4)}, ${ride.destinationLong?.toFixed(4)}`;
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
                    <Button
                        size="xs"
                        onClick={handleJoinRide}
                        loading={loading}
                        disabled={isOwnRide || isFull}
                    >
                        {isOwnRide ? "Your Ride" : isFull ? "Full" : "Join Ride"}
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
}
