import React, { useState } from "react";
import { generateClient } from "aws-amplify/api";
import type { Schema } from "../../amplify/data/resource";
import { useAuth } from "../hooks/useAuth";
import RouteMap from "./map/RouteMap";
import { getAddress } from "../services/addressService";

import {
    NumberInput,
    Button,
    Group,
    Paper,
    Title,
    Container,
    TextInput,
    Alert
} from "@mantine/core";
import { DateInput, TimeInput } from "@mantine/dates";

const client = generateClient<Schema>();

export default function CreateRide() {
    const { user } = useAuth();

    const [pickupLatitude, setPickupLatitude] = useState<number | string>("");
    const [pickupLongitude, setPickupLongitude] = useState<number | string>("");
    const [pickupAddress, setPickupAddress] = useState<string>("");
    const [destinationLatitude, setDestinationLatitude] = useState<number | string>("");
    const [destinationLongitude, setDestinationLongitude] = useState<number | string>("");
    const [destinationAddress, setDestinationAddress] = useState<string>("");
    const [pickupDate, setPickupDate] = useState<string | null>(null);
    const [pickupTime, setPickupTime] = useState<string>("");
    const [seats, setSeats] = useState<number | string>(3);
    const [loading, setLoading] = useState(false);
    const [timeError, setTimeError] = useState<string | null>(null);
    const [pickupAddressLoading, setPickupAddressLoading] = useState(false);
    const [destinationAddressLoading, setDestinationAddressLoading] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    if (!user) {
        return <div style={{ padding: '2rem' }}>Loading user information...</div>;
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.currentTarget.value;
        setPickupTime(time);

        // If date is today, need to validate so that time is in the future 
        const today = new Date().toISOString().split("T")[0];

        if (pickupDate === today) {
            const now = new Date();
            const [hours, minutes] = time.split(':').map(Number);
            if (hours < now.getHours() || (hours === now.getHours() && minutes <= now.getMinutes())) {
                setTimeError("Time cannot be in the past");
            } else {
                setTimeError(null);
            }
        }
    };

    async function handleSubmit() {
        if (!pickupLatitude || !pickupLongitude || !destinationLatitude || !destinationLongitude || !pickupDate || !pickupTime) return;

        setLoading(true);
        setSubmitSuccess(false);
        setSubmitError(null);

        if (timeError) {
            setLoading(false);
            return;
        }

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

            // Success! Reset form
            setSubmitSuccess(true);
            setPickupLatitude("");
            setPickupLongitude("");
            setPickupAddress("");
            setDestinationLatitude("");
            setDestinationLongitude("");
            setDestinationAddress("");
            setPickupDate(null);
            setPickupTime("");
            setSeats(3);
        } catch (error) {
            console.error("Error creating ride:", error);
            setSubmitError("Failed to create ride. Please try again.");
        } finally {
            setLoading(false);
        }
    }
    return (
        <Container size="md">
            <Paper withBorder shadow="md" p="xl" radius="md" mt="xl">
                {
                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                        Logged in as <strong>{user?.firstName} {user?.lastName}</strong>
                    </div>
                }
                <Title order={3} mb="lg" ta="center">🚗 Post a Ride</Title>

                {submitSuccess && (
                    <Alert color="green" mb="md" onClose={() => setSubmitSuccess(false)} withCloseButton>
                        Ride posted successfully!
                    </Alert>
                )}

                {submitError && (
                    <Alert color="red" mb="md" onClose={() => setSubmitError(null)} withCloseButton>
                        {submitError}
                    </Alert>
                )}
                <Group grow mb="md">
                    <TextInput
                        label="Pickup Address"
                        placeholder={pickupAddressLoading ? "Fetching address..." : "e.g., 123 Main St"}
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.currentTarget.value)}
                        disabled={pickupAddressLoading}
                    />
                </Group>
                <RouteMap onPickupSelect={(lat, lng) => {
                    setPickupLatitude(lat);
                    setPickupLongitude(lng);
                    setPickupAddressLoading(true);
                    getAddress(lat, lng)
                        .then(address => setPickupAddress(address))
                        .finally(() => setPickupAddressLoading(false));
                }} onDestinationSelect={(lat, lng) => {
                    setDestinationLatitude(lat);
                    setDestinationLongitude(lng);
                    setDestinationAddressLoading(true);
                    getAddress(lat, lng)
                        .then(address => setDestinationAddress(address))
                        .finally(() => setDestinationAddressLoading(false));
                }} />
                <Group grow mb="md">
                    <TextInput
                        label="Destination Address"
                        placeholder={destinationAddressLoading ? "Fetching address..." : "e.g., 123 Main St"}
                        value={destinationAddress}
                        onChange={(e) => setDestinationAddress(e.currentTarget.value)}
                        disabled={destinationAddressLoading}
                    />
                </Group>
                <Group grow mb="md">
                    <DateInput
                        label="Departure Date"
                        placeholder="Pick a date"
                        value={pickupDate}
                        onChange={setPickupDate}
                        required
                        minDate={new Date().toISOString().split('T')[0]}
                        maxDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    />
                    <TimeInput
                        label="Departure Time"
                        value={pickupTime}
                        onChange={handleTimeChange}
                        required
                        error={timeError}
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
                >
                    Post Ride
                </Button>
            </Paper>
        </Container>
    );
}



