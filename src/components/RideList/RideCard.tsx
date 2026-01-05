import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, Text, Group, Badge, Stack, Divider, Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { Schema } from "../../../amplify/data/resource";
import MiniMap from "../map/MiniMap";
import { useRideRequests } from "../../hooks/useRideRequests";
import { useDriverAssignment } from "../../hooks/useDriverAssignment";
import { useAuth } from "../../hooks/useAuth";
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

export default function RideCard({ ride, isDriver }: RideCardProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { createRequest, loading: joinLoading, error: joinError } = useRideRequests();
    const { assignDriver, loading: assignLoading, error: assignError } = useDriverAssignment();
    const [hasExistingRequest, setHasExistingRequest] = useState(false);

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
    const isCreator = ride.creatorID === user?.id;
    const isFull = (ride.seatsAvailable || 0) <= 0;
    const hasDriverAssigned = !!ride.driverID;
    const pickupDisplay = ride.pickupAddress || `${ride.pickupLat?.toFixed(4)}, ${ride.pickupLong?.toFixed(4)}`;
    const destinationDisplay = ride.destinationAddress || `${ride.destinationLat?.toFixed(4)}, ${ride.destinationLong?.toFixed(4)}`;
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
                        height={300}
                    />
                </Card.Section>
            )}

            <Stack gap="sm" mt="md">
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
                    {isDriver ? (
                        // Driver mode: show Offer Ride button for REQUEST type rides
                        <Button
                            size="xs"
                            color="green"
                            onClick={(e) => { e.stopPropagation(); handleOfferRide(); }}
                            loading={assignLoading}
                            disabled={isCreator || hasDriverAssigned || isFull || hasExistingRequest}
                        >
                            {isCreator ? "Your Request" : hasDriverAssigned ? "Driver Assigned" : "Offer Ride"}
                        </Button>
                    ) : (
                        // Rider mode: show Join Ride button for OFFER type rides
                        <Button
                            size="xs"
                            color="blue"
                            onClick={(e) => { e.stopPropagation(); handleJoinRide(); }}
                            loading={joinLoading}
                            disabled={isOwnRide || isFull || hasExistingRequest}
                        >
                            {isOwnRide ? "Your Ride" : hasExistingRequest ? "Requested ✓" : isFull ? "Full" : "Join Ride"}
                        </Button>
                    )}
                </Group>
            </Stack>
        </Card>
    );
}
