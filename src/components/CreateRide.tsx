import { useState } from "react";
import { generateClient } from "aws-amplify/api";
import type { Schema } from "../../amplify/data/resource";
import { useAuth } from "../hooks/useAuth";

import {
    NumberInput,
    Button,
    Group,
    Paper,
    Title,
    Container
} from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";

const client = generateClient<Schema>();

export default function CreateRide() {
    const { user } = useAuth();

    const [pickupLatitude, setPickupLatitude] = useState<number | string>("");
    const [pickupLongitude, setPickupLongitude] = useState<number | string>("");
    const [destinationLatitude, setDestinationLatitude] = useState<number | string>("");
    const [destinationLongitude, setDestinationLongitude] = useState<number | string>("");
    const [pickupDate, setPickupDate] = useState<string | null>(null);
    const [pickupTime, setPickupTime] = useState<string>("");
    const [seats, setSeats] = useState<number | string>(3);
    const [loading, setLoading] = useState(false);

    if (!user) {
        return <div style={{ padding: '2rem' }}>Loading user information...</div>;
    }

    async function handleSubmit() {
        if (!pickupLatitude || !pickupLongitude || !destinationLatitude || !destinationLongitude || !pickupDate || !pickupTime) return;

        setLoading(true);

        // Combine date (YYYY-MM-DD) and time (HH:MM) into a Date object
        const dateTimeStr = `${pickupDate}T${pickupTime}:00`;
        const localDateTime = new Date(dateTimeStr);

        // Convert to UTC ISO string
        const utcDateTime = localDateTime.toISOString();

        try {
            await client.models.Ride.create({
                pickupLat: Number(pickupLatitude),
                pickupLong: Number(pickupLongitude),
                destinationLat: Number(destinationLatitude),
                destinationLong: Number(destinationLongitude),
                pickupTime: utcDateTime,
                seatsAvailable: Number(seats),
                driverID: user?.id
            });

            // onRideCreated();
        } catch (error) {
            console.error("Error creating ride:", error);
        } finally {
            setLoading(false);
        }
    }
    return (
        <Container size="xs">
            <Paper withBorder shadow="md" p="xl" radius="md" mt="xl">
                {
                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                        Logged in as <strong>{user?.firstName} {user?.lastName}</strong>
                    </div>
                }
                <Title order={3} mb="lg" ta="center">🚗 Post a Ride</Title>

                <Group grow mb="md">
                    <NumberInput
                        label="Pickup Latitude"
                        placeholder="e.g., 40.3495"
                        required
                        value={pickupLatitude}
                        onChange={setPickupLatitude}
                        step={0.0001}
                    />
                    <NumberInput
                        label="Pickup Longitude"
                        placeholder="e.g., -92.1787"
                        required
                        value={pickupLongitude}
                        onChange={setPickupLongitude}
                        step={0.0001}
                    />
                </Group>

                <Group grow mb="md">
                    <NumberInput
                        label="Destination Latitude"
                        placeholder="e.g., 38.6270"
                        required
                        value={destinationLatitude}
                        onChange={setDestinationLatitude}
                        step={0.0001}
                    />
                    <NumberInput
                        label="Destination Longitude"
                        placeholder="e.g., -90.1994"
                        required
                        value={destinationLongitude}
                        onChange={setDestinationLongitude}
                        step={0.0001}
                    />
                </Group>

                <Group grow mb="md">
                    <DateInput
                        label="Departure Date"
                        placeholder="Pick a date"
                        value={pickupDate}
                        onChange={setPickupDate}
                        required
                    />
                    <TimeInput
                        label="Departure Time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.currentTarget.value)}
                        required
                    />
                </Group>

                <NumberInput
                    label="Seats"
                    value={seats}
                    onChange={setSeats}
                    min={1}
                    max={6}
                    mb="xl"
                />

                <Button
                    fullWidth
                    size="md"
                    loading={loading}
                    onClick={handleSubmit}
                    color="blue"
                >
                    Post Ride
                </Button>
            </Paper>
        </Container>
    );
}



