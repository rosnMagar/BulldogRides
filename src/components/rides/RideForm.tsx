import { Container, Title, Alert, Button } from "@mantine/core";
import { useRideForm } from "../../hooks/useRideForm";
import LocationFields from "./fields/LocationFields";
import DateTimeFields from "./fields/DateTimeFields";
import SeatsField from "./fields/SeatsField";
import { useAuth } from "../../hooks/useAuth";

type RideType = "OFFER" | "REQUEST";

interface RideFormProps {
    type: RideType;
    title: string;
    submitLabel: string;
    seatsLabel?: string;
}

export default function RideForm({
    type,
    title,
    submitLabel,
    seatsLabel = "Seats"
}: RideFormProps) {
    const { user } = useAuth();

    const {
        pickup,
        destination,
        date,
        setDate,
        time,
        timeError,
        handleTimeChange,
        seats,
        setSeats,
        loading,
        submitSuccess,
        submitError,
        setSubmitSuccess,
        setSubmitError,
        handlePickupSelect,
        handleDestinationSelect,
        handleSubmit,
    } = useRideForm({ type });

    if (!user) {
        return <div style={{ padding: '2rem' }}>Loading user information...</div>;
    }

    return (
        <Container size="md">
            <div style={{ marginBottom: '1rem', fontSize: '0.9rem', opacity: 0.7, textAlign: 'center' }}>
                Logged in as <strong>{user?.firstName} {user?.lastName}</strong>
            </div>

            <Title order={3} mb="lg" ta="center">{title}</Title>

            {submitSuccess && (
                <Alert color="green" mb="md" onClose={() => setSubmitSuccess(false)} withCloseButton>
                    {type === "OFFER" ? "Ride offer posted successfully!" : "Ride request posted successfully!"}
                </Alert>
            )}

            {submitError && (
                <Alert color="red" mb="md" onClose={() => setSubmitError(null)} withCloseButton>
                    {submitError}
                </Alert>
            )}

            <LocationFields
                pickupAddress={pickup.address}
                pickupAddressLoading={pickup.addressLoading}
                destinationAddress={destination.address}
                destinationAddressLoading={destination.addressLoading}
                onPickupSelect={handlePickupSelect}
                onDestinationSelect={handleDestinationSelect}
            />

            <DateTimeFields
                date={date}
                onDateChange={setDate}
                time={time}
                onTimeChange={handleTimeChange}
                timeError={timeError}
            />

            <SeatsField
                value={seats}
                onChange={setSeats}
                label={seatsLabel}
            />

            <Button
                fullWidth
                size="md"
                loading={loading}
                onClick={handleSubmit}
            >
                {submitLabel}
            </Button>
        </Container>
    );
}
