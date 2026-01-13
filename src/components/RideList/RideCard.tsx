import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, Text, Group, Badge, Stack, Button, Grid, ThemeIcon } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
    IconMapPin,
    IconMapPinFilled,
    IconClock,
    IconUsers,
    IconGift,
    IconUserCheck
} from "@tabler/icons-react";
import type { Schema } from "../../../amplify/data/resource";
import MiniMap from "../map/MiniMap";
import { useRideRequests } from "../../hooks/useRideRequests";
import { useDriverAssignment } from "../../hooks/useDriverAssignment";
import { useAuth } from "../../hooks/useAuth";
import { useApprovedRiders } from "../../hooks/useApprovedRiders";
import { client } from "../../lib/amplifyClient";

type Ride = Schema["Ride"]["type"];

interface RideCardProps {
    ride: Ride;
    isDriver: boolean;
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

function getTypeColor(type: string | null | undefined): string {
    return type === "OFFER" ? "blue" : "orange";
}

export default function RideCard({ ride, isDriver }: RideCardProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { createRequest, loading: joinLoading, error: joinError } = useRideRequests();
    const { assignDriver, loading: assignLoading, error: assignError } = useDriverAssignment();
    const [hasExistingRequest, setHasExistingRequest] = useState(false);
    const { riders } = useApprovedRiders(ride.id);

    // Navigate to ride details page
    const handleCardClick = () => {
        navigate(`/ride/${ride.id}`);
    };

    // Check if user has already requested this ride
    useEffect(() => {
        async function checkExistingRequest() {
            if (!user?.id || !ride.id) return;

            try {
                const { data: requests } = await client.models.RideRequest.list({
                    filter: {
                        rideID: { eq: ride.id },
                        requesterID: { eq: user.id }
                    }
                });

                if (requests && requests.length > 0) {
                    setHasExistingRequest(true);
                }
            } catch (error) {
                console.error("Error checking existing request:", error);
            }
        }

        checkExistingRequest();
    }, [user?.id, ride.id]);

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
            setHasExistingRequest(true);
            notifications.show({
                title: 'Request sent!',
                message: 'The driver will be notified of your request',
                color: 'green'
            });
        } else if (joinError) {
            notifications.show({
                title: 'Failed to join ride',
                message: joinError,
                color: 'red'
            });
        }
    };

    const handleOfferRide = async () => {
        if (!user?.id) {
            notifications.show({
                title: 'Error',
                message: 'You must be logged in to offer a ride',
                color: 'red'
            });

            return;
        }

        const success = await assignDriver(ride.id);

        if (success) {
            setHasExistingRequest(true);
            notifications.show({
                title: 'You are now the driver!',
                message: 'The requester will be notified that you have volunteered to drive.',
                color: 'green'
            });
        } else if (assignError) {
            notifications.show({
                title: 'Failed to assign driver',
                message: assignError,
                color: 'red'
            });
        }
    };

    const isOwnRide = ride.driverID === user?.id;
    const isFull = (ride.seatsAvailable || 0) <= 0;
    const hasDriverAssigned = !!ride.driverID;

    // Check if we have valid coordinates for the map
    const hasValidCoordinates =
        ride.pickupLat != null &&
        ride.pickupLong != null &&
        ride.destinationLat != null &&
        ride.destinationLong != null;

    return (
        <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            onClick={handleCardClick}
            style={{ cursor: "pointer" }}
        >
            {/* Mini Map Preview - edge to edge */}
            {hasValidCoordinates && (
                <Card.Section>
                    <MiniMap
                        pickupLat={ride.pickupLat!}
                        pickupLng={ride.pickupLong!}
                        destinationLat={ride.destinationLat!}
                        destinationLng={ride.destinationLong!}
                        height={200}
                    />
                </Card.Section>
            )}

            <Stack gap="sm" mt="md">
                <Group justify="space-between" mb="xs" wrap="nowrap">
                    <Badge color={getTypeColor(ride.type)} variant="filled" size="sm">
                        {ride.type === "OFFER" ? "Ride Offer" : "Ride Request"}
                    </Badge>
                    <Badge color={getStatusColor(ride.status)} variant="light" size="sm">
                        {ride.status || "Unknown"}
                    </Badge>
                </Group>

                {/* Creator Info */}
                <Group gap={4} mb="xs">
                    <Text size="xs" c="dimmed">Posted by:</Text>
                    <Text size="xs" fw={500}>
                        {(ride as any).creator ? `${(ride as any).creator.firstName} ${(ride as any).creator.lastName}` : "Unknown User"}
                    </Text>
                </Group>

                <Grid mb="xs" gutter="xs">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Group align="flex-start" wrap="nowrap">
                            <ThemeIcon color="green" size="md" radius="xl">
                                <IconMapPin size={14} />
                            </ThemeIcon>
                            <Stack gap={0} style={{ overflow: "hidden" }}>
                                <Text size="xs" c="dimmed" lh={1}>From</Text>
                                <Text size="sm" fw={500} truncate="end">{ride.pickupAddress || `${ride.pickupLat?.toFixed(2)}, ${ride.pickupLong?.toFixed(2)}`}</Text>
                            </Stack>
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Group align="flex-start" wrap="nowrap">
                            <ThemeIcon color="red" size="md" radius="xl">
                                <IconMapPinFilled size={14} />
                            </ThemeIcon>
                            <Stack gap={0} style={{ overflow: "hidden" }}>
                                <Text size="xs" c="dimmed" lh={1}>To</Text>
                                <Text size="sm" fw={500} truncate="end">{ride.destinationAddress || `${ride.destinationLat?.toFixed(2)}, ${ride.destinationLong?.toFixed(2)}`}</Text>
                            </Stack>
                        </Group>
                    </Grid.Col>
                </Grid>

                <Group gap="sm" mb="md" wrap="wrap">
                    <Group gap={4}>
                        <IconClock size={14} color="gray" />
                        <Text size="xs" c="dimmed">{formatDateTime(ride.pickupTime)}</Text>
                    </Group>
                    <Group gap={4}>
                        <IconUsers size={14} color="gray" />
                        <Text size="xs" c="dimmed">{ride.seatsAvailable} seats left</Text>
                    </Group>
                    {riders.length > 0 && (
                        <Group gap={4}>
                            <IconUserCheck size={14} color="green" />
                            <Text size="xs" c="green" fw={500}>{riders.length} joined</Text>
                        </Group>
                    )}
                    {rewardText && (
                        <Group gap={4}>
                            <IconGift size={14} color="gray" />
                            <Text size="xs" c="dimmed">{rewardText}</Text>
                        </Group>
                    )}
                </Group>

                {isDriver ? (
                    <Button
                        fullWidth
                        size="xs"
                        color="green"
                        onClick={(e) => { e.stopPropagation(); handleOfferRide(); }}
                        loading={assignLoading}
                        disabled={isOwnRide || hasDriverAssigned || isFull || hasExistingRequest}
                    >
                        {isOwnRide ? "Your Request" : hasDriverAssigned ? "Driver Assigned" : "Offer to Drive"}
                    </Button>
                ) : (
                    <Button
                        fullWidth
                        size="xs"
                        color="blue"
                        onClick={(e) => { e.stopPropagation(); handleJoinRide(); }}
                        loading={joinLoading}
                        disabled={isOwnRide || isFull || hasExistingRequest}
                    >
                        {isOwnRide ? "Your Ride" : hasExistingRequest ? "Request Sent" : isFull ? "Full" : "Join Ride"}
                    </Button>
                )}
            </Stack>
        </Card>
    );
}
