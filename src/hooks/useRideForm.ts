import { useState, useCallback } from "react";
import { client } from "../lib/amplifyClient";
import { getAddress } from "../services/addressService";
import { useAuth } from "../hooks/useAuth";

type RideType = "OFFER" | "REQUEST";

interface UseRideFormOptions {
    type: RideType;
    onSuccess?: () => void;
}

interface LocationState {
    latitude: number | string;
    longitude: number | string;
    address: string;
    addressLoading: boolean;
}

interface UseRideFormReturn {
    // Location state
    pickup: LocationState;
    destination: LocationState;

    // Date/time state
    date: string | null;
    setDate: (date: string | null) => void;
    time: string;
    timeError: string | null;
    handleTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

    // Seats
    seats: number | string;
    setSeats: (seats: number | string) => void;

    // Form state
    loading: boolean;
    submitSuccess: boolean;
    submitError: string | null;
    setSubmitSuccess: (value: boolean) => void;
    setSubmitError: (value: string | null) => void;

    // Actions
    handlePickupSelect: (lat: number, lng: number) => void;
    handleDestinationSelect: (lat: number, lng: number) => void;
    handleSubmit: () => Promise<void>;
    resetForm: () => void;

    // Validation
    isFormValid: boolean;
}

export function useRideForm({ type, onSuccess }: UseRideFormOptions): UseRideFormReturn {

    // User Information
    const { user } = useAuth();

    // Pickup state
    const [pickupLatitude, setPickupLatitude] = useState<number | string>("");
    const [pickupLongitude, setPickupLongitude] = useState<number | string>("");
    const [pickupAddress, setPickupAddress] = useState<string>("");
    const [pickupAddressLoading, setPickupAddressLoading] = useState(false);

    // Destination state
    const [destinationLatitude, setDestinationLatitude] = useState<number | string>("");
    const [destinationLongitude, setDestinationLongitude] = useState<number | string>("");
    const [destinationAddress, setDestinationAddress] = useState<string>("");
    const [destinationAddressLoading, setDestinationAddressLoading] = useState(false);

    // Date/time state
    const [date, setDate] = useState<string | null>(null);
    const [time, setTime] = useState<string>("");
    const [timeError, setTimeError] = useState<string | null>(null);

    // Other state
    const [seats, setSeats] = useState<number | string>(3);
    const [loading, setLoading] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.currentTarget.value;
        setTime(newTime);

        // Validate time if date is today
        const today = new Date().toISOString().split("T")[0];
        if (date === today) {
            const now = new Date();
            const [hours, minutes] = newTime.split(':').map(Number);
            if (hours < now.getHours() || (hours === now.getHours() && minutes <= now.getMinutes())) {
                setTimeError("Time cannot be in the past");
            } else {
                setTimeError(null);
            }
        } else {
            setTimeError(null);
        }
    }, [date]);

    const handlePickupSelect = useCallback((lat: number, lng: number) => {
        setPickupLatitude(lat);
        setPickupLongitude(lng);
        setPickupAddressLoading(true);
        getAddress(lat, lng)
            .then(address => setPickupAddress(address))
            .finally(() => setPickupAddressLoading(false));
    }, []);

    const handleDestinationSelect = useCallback((lat: number, lng: number) => {
        setDestinationLatitude(lat);
        setDestinationLongitude(lng);
        setDestinationAddressLoading(true);
        getAddress(lat, lng)
            .then(address => setDestinationAddress(address))
            .finally(() => setDestinationAddressLoading(false));
    }, []);

    const resetForm = useCallback(() => {
        setPickupLatitude("");
        setPickupLongitude("");
        setPickupAddress("");
        setDestinationLatitude("");
        setDestinationLongitude("");
        setDestinationAddress("");
        setDate(null);
        setTime("");
        setTimeError(null);
        setSeats(3);
    }, []);

    const isFormValid = Boolean(
        pickupLatitude &&
        pickupLongitude &&
        destinationLatitude &&
        destinationLongitude &&
        date &&
        time &&
        !timeError &&
        user?.id
    );

    const handleSubmit = useCallback(async () => {
        if (!isFormValid || !user?.id) return;

        setLoading(true);
        setSubmitSuccess(false);
        setSubmitError(null);

        // Combine date and time into UTC ISO string
        const dateTimeStr = `${date}T${time}:00`;
        const localDateTime = new Date(dateTimeStr);
        const utcDateTime = localDateTime.toISOString();

        try {
            await client.models.Ride.create({
                type: type,
                status: "OPEN",
                driverID: user.id,
                pickupLat: Number(pickupLatitude),
                pickupLong: Number(pickupLongitude),
                pickupAddress: pickupAddress || undefined,
                destinationLat: Number(destinationLatitude),
                destinationLong: Number(destinationLongitude),
                destinationAddress: destinationAddress || undefined,
                pickupTime: utcDateTime,
                seatsAvailable: Number(seats),
            });

            setSubmitSuccess(true);
            resetForm();
            onSuccess?.();
        } catch (error) {
            console.error("Error creating ride:", error);
            setSubmitError("Failed to create ride. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [
        isFormValid, date, time, type,
        pickupLatitude, pickupLongitude, pickupAddress,
        destinationLatitude, destinationLongitude, destinationAddress,
        seats, resetForm, onSuccess
    ]);

    return {
        pickup: {
            latitude: pickupLatitude,
            longitude: pickupLongitude,
            address: pickupAddress,
            addressLoading: pickupAddressLoading,
        },
        destination: {
            latitude: destinationLatitude,
            longitude: destinationLongitude,
            address: destinationAddress,
            addressLoading: destinationAddressLoading,
        },
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
        resetForm,
        isFormValid,
    };
}
