import { Group, TextInput } from "@mantine/core";
import RouteMap from "../../map/RouteMap";

interface LocationFieldsProps {
    pickupAddress: string;
    pickupAddressLoading: boolean;
    destinationAddress: string;
    destinationAddressLoading: boolean;
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
    onPickupSelect,
    onDestinationSelect,
    onPickupAddressChange,
    onDestinationAddressChange,
}: LocationFieldsProps) {
    return (
        <>
            <Group grow mb="md">
                <TextInput
                    label="Pickup Address"
                    placeholder={pickupAddressLoading ? "Fetching address..." : "Click on map to set pickup"}
                    value={pickupAddress}
                    onChange={(e) => onPickupAddressChange?.(e.currentTarget.value)}
                    disabled={pickupAddressLoading}
                />
            </Group>

            <RouteMap
                onPickupSelect={onPickupSelect}
                onDestinationSelect={onDestinationSelect}
            />

            <Group grow mb="md" mt="md">
                <TextInput
                    label="Destination Address"
                    placeholder={destinationAddressLoading ? "Fetching address..." : "Click on map to set destination"}
                    value={destinationAddress}
                    onChange={(e) => onDestinationAddressChange?.(e.currentTarget.value)}
                    disabled={destinationAddressLoading}
                />
            </Group>
        </>
    );
}
