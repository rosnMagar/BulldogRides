import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
    Container,
    Paper,
    Group,
    Badge,
    Button,
    Loader,
    Center,
    Alert,
    Grid,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconAlertCircle } from "@tabler/icons-react";

import type { Schema } from "../../../amplify/data/resource";
import MiniMap from "../map/MiniMap";
import RouteInfo from "./RouteInfo";
import RideInfo from "./RideInfo";
import PersonCard from "./PersonCard";
import ApprovedRidersList from "./ApprovedRidersList";
import { useRideRequests } from "../../hooks/useRideRequests";
import { useDriverAssignment } from "../../hooks/useDriverAssignment";
import { useAuth } from "../../hooks/useAuth";
import { client } from "../../lib/amplifyClient";

type Ride = Schema["Ride"]["type"];
type User = Schema["User"]["type"];

// Get badge colors
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

function getRewardText(reward: string | null | undefined, description: string | null | undefined): string {
    if (!reward || reward === "NONE") return "";
    if (reward === "OTHER" && description) return description;
    return reward.replace("_", " ");
}

export default function RideDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { createRequest, loading: joinLoading, error: joinError } = useRideRequests();
    const { assignDriver, loading: assignLoading, error: assignError } = useDriverAssignment();

    const [ride, setRide] = useState<Ride | null>(null);
    const [driver, setDriver] = useState<User | null>(null);
    const [creator, setCreator] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasExistingRequest, setHasExistingRequest] = useState(false);

    // Fetch ride and related data
    useEffect(() => {
        async function fetchRideDetails() {
            if (!id) {
                setError("No ride ID provided");
                setLoading(false);
                return;
            }

            try {
                const { data: rideData, errors } = await client.models.Ride.get({ id });

                if (errors || !rideData) {
                    setError("Ride not found");
                    setLoading(false);
                    return;
                }

                setRide(rideData);

                // Fetch driver and creator
                if (rideData.driverID) {
                    const { data: driverData } = await client.models.User.get({ id: rideData.driverID });
                    if (driverData) setDriver(driverData);
                }
                if (rideData.creatorID) {
                    const { data: creatorData } = await client.models.User.get({ id: rideData.creatorID });
                    if (creatorData) setCreator(creatorData);
                }

                // Check existing request
                if (user?.id) {
                    const { data: requests } = await client.models.RideRequest.list({
                        filter: { rideID: { eq: id }, requesterID: { eq: user.id } }
                    });
                    if (requests && requests.length > 0) setHasExistingRequest(true);
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching ride details:", err);
                setError("Failed to load ride details");
                setLoading(false);
            }
        }

        fetchRideDetails();
    }, [id, user?.id]);

    const handleJoinRide = async () => {
        if (!user?.id || !ride?.id) return;
        const success = await createRequest(ride.id);
        if (success) {
            setHasExistingRequest(true);
            notifications.show({ title: "Request sent!", message: "The driver will be notified", color: "green" });
        } else if (joinError) {
            notifications.show({ title: "Failed to join ride", message: joinError, color: "red" });
        }
    };

    const handleOfferRide = async () => {
        if (!user?.id || !ride?.id) return;
        const success = await assignDriver(ride.id);
        if (success) {
            setHasExistingRequest(true);
            notifications.show({ title: "You are now the driver!", message: "The requester will be notified", color: "green" });
            window.location.reload();
        } else if (assignError) {
            notifications.show({ title: "Failed to assign driver", message: assignError, color: "red" });
        }
    };

    if (loading) {
        return <Center h="60vh"><Loader size="xl" /></Center>;
    }

    if (error || !ride) {
        return (
            <Container size="md" py="xl">
                <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">{error || "Ride not found"}</Alert>
                <Button mt="md" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate("/rides")}>Back to Rides</Button>
            </Container>
        );
    }

    const isOwnRide = ride.driverID === user?.id;
    const isCreator = ride.creatorID === user?.id;
    const isFull = (ride.seatsAvailable || 0) <= 0;
    const hasDriverAssigned = !!ride.driverID;
    const isDriverMode = ride.type === "REQUEST";
    const rewardText = getRewardText(ride.reward, ride.rewardDescription);
    const pickupDisplay = ride.pickupAddress || `${ride.pickupLat?.toFixed(4)}, ${ride.pickupLong?.toFixed(4)}`;
    const destinationDisplay = ride.destinationAddress || `${ride.destinationLat?.toFixed(4)}, ${ride.destinationLong?.toFixed(4)}`;
    const hasValidCoordinates = ride.pickupLat != null && ride.pickupLong != null && ride.destinationLat != null && ride.destinationLong != null;

    return (
        <Container size="md" py="xl">
            {/* Header */}
            <Group justify="space-between" mb="lg">
                <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate("/rides")}>
                    Back to Rides
                </Button>
                <Group>
                    <Badge size="lg" color={getTypeColor(ride.type)} variant="filled">
                        {ride.type === "OFFER" ? "Ride Offer" : "Ride Request"}
                    </Badge>
                    <Badge size="lg" color={getStatusColor(ride.status)} variant="light">
                        {ride.status || "Unknown"}
                    </Badge>
                </Group>
            </Group>

            {/* Map */}
            {hasValidCoordinates && (
                <Paper radius="md" mb="md" style={{ overflow: "hidden" }}>
                    <MiniMap
                        pickupLat={ride.pickupLat!}
                        pickupLng={ride.pickupLong!}
                        destinationLat={ride.destinationLat!}
                        destinationLng={ride.destinationLong!}
                        height={window.innerWidth < 600 ? 250 : 350}
                    />
                </Paper>
            )}

            {/* Route & Ride Info */}
            <RouteInfo pickupAddress={pickupDisplay} destinationAddress={destinationDisplay} />
            <RideInfo pickupTime={ride.pickupTime} seatsAvailable={ride.seatsAvailable || 0} rewardText={rewardText} />

            {/* People */}
            <Grid mb="lg">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                    <PersonCard title="Posted By" person={creator} variant="creator" />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                    <PersonCard title="Driver" person={driver} variant="driver" emptyText="No driver assigned yet" />
                </Grid.Col>
            </Grid>

            {/* Approved Riders */}
            <ApprovedRidersList rideID={ride.id} />

            {/* Action Button */}
            <Paper shadow="sm" p="lg" radius="md" withBorder>
                {isDriverMode ? (
                    <Button size="lg" fullWidth color="green" onClick={handleOfferRide} loading={assignLoading}
                        disabled={isCreator || hasDriverAssigned || isFull || hasExistingRequest}>
                        {isCreator ? "This is Your Request" : hasDriverAssigned ? "Driver Already Assigned" : "Offer to Drive"}
                    </Button>
                ) : (
                    <Button size="lg" fullWidth color="blue" onClick={handleJoinRide} loading={joinLoading}
                        disabled={isOwnRide || isFull || hasExistingRequest}>
                        {isOwnRide ? "This is Your Ride" : hasExistingRequest ? "Request Sent ✓" : isFull ? "Ride Full" : "Request to Join"}
                    </Button>
                )}
            </Paper>
        </Container>
    );
}
