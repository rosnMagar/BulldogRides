import { useState, useEffect } from "react";
import { Select, Loader, Text, Stack } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconMapPin } from "@tabler/icons-react";
import RouteMap from "../../map/RouteMap";
import { geocodeAddress, type GeocodingResult } from "../../../services/geocodingService";

interface LocationFieldsProps {
    pickupAddress: string;
    pickupAddressLoading: boolean;
    destinationAddress: string;
    destinationAddressLoading: boolean;
    pickupLat?: number;
    pickupLng?: number;
    destinationLat?: number;
    destinationLng?: number;
    onPickupSelect: (lat: number, lng: number) => void;
    onDestinationSelect: (lat: number, lng: number) => void;
    onPickupAddressChange?: (address: string) => void;
    onDestinationAddressChange?: (address: string) => void;
}

export default function LocationFields({
    pickupAddress,
    pickupAddressLoading,
    destinationAddress,
    destinationAddressLoading,
    pickupLat,
    pickupLng,
    destinationLat,
    destinationLng,
    onPickupSelect,
    onDestinationSelect,
    onPickupAddressChange,
    onDestinationAddressChange,
}: LocationFieldsProps) {
    // Pickup address autocomplete state
    const [pickupInput, setPickupInput] = useState(pickupAddress);
    const [pickupSuggestions, setPickupSuggestions] = useState<GeocodingResult[]>([]);
    const [pickupSearching, setPickupSearching] = useState(false);
    const [debouncedPickup] = useDebouncedValue(pickupInput, 800);

    // Destination address autocomplete state
    const [destinationInput, setDestinationInput] = useState(destinationAddress);
    const [destinationSuggestions, setDestinationSuggestions] = useState<GeocodingResult[]>([]);
    const [destinationSearching, setDestinationSearching] = useState(false);
    const [debouncedDestination] = useDebouncedValue(destinationInput, 800);

    // Sync external address changes (from map clicks)
    useEffect(() => {
        setPickupInput(pickupAddress);
    }, [pickupAddress]);

    useEffect(() => {
        setDestinationInput(destinationAddress);
    }, [destinationAddress]);

    // Debug: Log when suggestions change
    useEffect(() => {
        console.log('[LocationFields] pickupSuggestions updated:', pickupSuggestions.length, pickupSuggestions);
    }, [pickupSuggestions]);

    useEffect(() => {
        console.log('[LocationFields] destinationSuggestions updated:', destinationSuggestions.length, destinationSuggestions);
    }, [destinationSuggestions]);

    // Search pickup address when debounced value changes (min 5 chars)
    useEffect(() => {
        if (debouncedPickup.length >= 5) {
            searchPickupAddress(debouncedPickup);
        } else if (debouncedPickup.length < 5) {
            // Only clear if below minimum
            setPickupSuggestions([]);
        }
        // Don't clear suggestions otherwise - keep them visible
    }, [debouncedPickup]);

    // Search destination address when debounced value changes (min 5 chars)
    useEffect(() => {
        if (debouncedDestination.length >= 5) {
            searchDestinationAddress(debouncedDestination);
        } else if (debouncedDestination.length < 5) {
            // Only clear if below minimum
            setDestinationSuggestions([]);
        }
        // Don't clear suggestions otherwise - keep them visible
    }, [debouncedDestination]);

    const searchPickupAddress = async (address: string) => {
        setPickupSearching(true);
        console.log('[LocationFields] Searching pickup address:', address);
        try {
            const results = await geocodeAddress(address);
            console.log('[LocationFields] Pickup results received:', results.length, results);
            setPickupSuggestions(results);
            console.log('[LocationFields] Pickup suggestions state updated');
        } catch (error) {
            console.error('[LocationFields] Pickup geocoding failed:', error);
        } finally {
            setPickupSearching(false);
        }
    };

    const searchDestinationAddress = async (address: string) => {
        setDestinationSearching(true);
        console.log('[LocationFields] Searching destination address:', address);
        try {
            const results = await geocodeAddress(address);
            console.log('[LocationFields] Destination results received:', results.length, results);
            setDestinationSuggestions(results);
            console.log('[LocationFields] Destination suggestions state updated');
        } catch (error) {
            console.error('[LocationFields] Destination geocoding failed:', error);
        } finally {
            setDestinationSearching(false);
        }
    };

    const handlePickupSelection = (value: string) => {
        const selected = pickupSuggestions.find(s => s.displayName === value);
        if (selected) {
            onPickupSelect(selected.lat, selected.lng);
            onPickupAddressChange?.(selected.displayName);
            setPickupInput(selected.displayName);
        }
    };

    const handleDestinationSelection = (value: string) => {
        const selected = destinationSuggestions.find(s => s.displayName === value);
        if (selected) {
            onDestinationSelect(selected.lat, selected.lng);
            onDestinationAddressChange?.(selected.displayName);
            setDestinationInput(selected.displayName);
        }
    };

    // Debug: Log when rendering
    console.log('[LocationFields] Rendering - Pickup suggestions:', pickupSuggestions.length);
    console.log('[LocationFields] Rendering - Destination suggestions:', destinationSuggestions.length);

    return (
        <>
            <RouteMap
                onPickupSelect={onPickupSelect}
                onDestinationSelect={onDestinationSelect}
                pickupLat={pickupLat}
                pickupLng={pickupLng}
                destinationLat={destinationLat}
                destinationLng={destinationLng}
            />

            <Stack gap="md" mb="md">
                <Select
                    label="Pickup Address"
                    placeholder="Type address (min 5 characters) or click on map"
                    value={pickupInput}
                    onChange={(value) => {
                        if (value) {
                            setPickupInput(value);
                            const selected = pickupSuggestions.find(s => s.displayName === value);
                            if (selected) {
                                handlePickupSelection(value);
                            }
                        }
                    }}
                    onSearchChange={(value) => {
                        setPickupInput(value);
                        onPickupAddressChange?.(value);
                    }}
                    data={pickupSuggestions.map(s => s.displayName)}
                    searchable
                    filter={({ options }) => options}
                    nothingFoundMessage="Type at least 5 characters to search"
                    leftSection={<IconMapPin size={16} />}
                    rightSection={
                        pickupSearching || pickupAddressLoading ?
                            <Loader size="xs" /> : null
                    }
                    maxDropdownHeight={300}
                />

                {pickupLat && pickupLng && (
                    <Text size="xs" c="dimmed">
                        ✓ Location confirmed: {pickupLat.toFixed(6)}, {pickupLng.toFixed(6)}
                    </Text>
                )}
            </Stack>

            <Stack gap="md" mb="md">
                <Select
                    label="Destination Address"
                    placeholder="Type address (min 5 characters) or click on map"
                    value={destinationInput}
                    onChange={(value) => {
                        if (value) {
                            setDestinationInput(value);
                            const selected = destinationSuggestions.find(s => s.displayName === value);
                            if (selected) {
                                handleDestinationSelection(value);
                            }
                        }
                    }}
                    onSearchChange={(value) => {
                        setDestinationInput(value);
                        onDestinationAddressChange?.(value);
                    }}
                    data={destinationSuggestions.map(s => s.displayName)}
                    searchable
                    filter={({ options }) => options}
                    nothingFoundMessage="Type at least 5 characters to search"
                    leftSection={<IconMapPin size={16} />}
                    rightSection={
                        destinationSearching || destinationAddressLoading ?
                            <Loader size="xs" /> : null
                    }
                    maxDropdownHeight={300}
                />

                {destinationLat && destinationLng && (
                    <Text size="xs" c="dimmed">
                        ✓ Location confirmed: {destinationLat.toFixed(6)}, {destinationLng.toFixed(6)}
                    </Text>
                )}
            </Stack>
        </>
    );
}
